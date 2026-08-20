/**
 * Training Session Repository
 * Phase 5: Local Persistence for in-flight sessions and interruption recovery.
 */

import { IndexedDBManager, defaultDB } from '../local/db';
import { STORES } from '../local/schema';
import {
  PersistedTrainingSession,
  SessionRecoveryCheckResult,
} from '../local/types';
import { TrainingStateSnapshot, TrainingState } from '../../domain/training-state/types';
import { Workout } from '../../domain/workouts/types';

/**
 * 24 hours in milliseconds for the stale session threshold.
 * An incomplete session older than 24 hours is flagged as stale, but not silently erased.
 */
export const DEFAULT_STALE_SESSION_THRESHOLD_MS = 24 * 60 * 60 * 1000;

export interface TrainingSessionRepository {
  saveSession(session: PersistedTrainingSession): Promise<void>;
  saveSnapshot(workout: Workout, snapshot: TrainingStateSnapshot): Promise<void>;
  getSession(sessionId: string): Promise<PersistedTrainingSession | null>;
  getLatestIncompleteSession(): Promise<PersistedTrainingSession | null>;
  checkInterruptedSession(staleThresholdMs?: number): Promise<SessionRecoveryCheckResult>;
  deleteSession(sessionId: string): Promise<void>;
  clearAllSessions(): Promise<void>;
  validateSnapshot(snapshot: any): { isValid: boolean; error?: string };
}

export class IndexedDBTrainingSessionRepository implements TrainingSessionRepository {
  private db: IndexedDBManager;
  private staleThresholdMs: number;

  constructor(
    db: IndexedDBManager = defaultDB,
    staleThresholdMs: number = DEFAULT_STALE_SESSION_THRESHOLD_MS
  ) {
    this.db = db;
    this.staleThresholdMs = staleThresholdMs;
  }

  /**
   * Validates a snapshot for structural integrity before saving or restoring.
   */
  public validateSnapshot(snapshot: any): { isValid: boolean; error?: string } {
    if (!snapshot || typeof snapshot !== 'object') {
      return { isValid: false, error: 'Snapshot is missing or not an object.' };
    }
    if (snapshot.version !== 1) {
      return { isValid: false, error: `Unsupported snapshot version: ${snapshot.version}. Expected version 1.` };
    }
    if (!snapshot.sessionId || typeof snapshot.sessionId !== 'string') {
      return { isValid: false, error: 'Snapshot missing valid sessionId string.' };
    }
    if (!snapshot.workoutId || typeof snapshot.workoutId !== 'string') {
      return { isValid: false, error: 'Snapshot missing valid workoutId string.' };
    }
    if (typeof snapshot.currentSegmentIndex !== 'number' || snapshot.currentSegmentIndex < 0) {
      return { isValid: false, error: 'Snapshot has invalid currentSegmentIndex.' };
    }
    if (!snapshot.state || typeof snapshot.state !== 'string') {
      return { isValid: false, error: 'Snapshot has missing or invalid state.' };
    }
    if (!Array.isArray(snapshot.records)) {
      return { isValid: false, error: 'Snapshot records must be an array.' };
    }
    return { isValid: true };
  }

  /**
   * Persists a full session record into IndexedDB.
   */
  public async saveSession(session: PersistedTrainingSession): Promise<void> {
    const validation = this.validateSnapshot(session.snapshot);
    if (!validation.isValid) {
      throw new Error(`Cannot persist invalid session: ${validation.error}`);
    }

    if (!session.workout || !session.workout.id) {
      throw new Error('Cannot persist session: associated Workout object is missing or invalid.');
    }

    await this.db.put(STORES.TRAINING_SESSIONS, {
      ...session,
      updatedAt: session.updatedAt || Date.now(),
    });
  }

  /**
   * Helper to construct and save a PersistedTrainingSession from a Workout and Snapshot.
   */
  public async saveSnapshot(workout: Workout, snapshot: TrainingStateSnapshot): Promise<void> {
    const validation = this.validateSnapshot(snapshot);
    if (!validation.isValid) {
      throw new Error(`Cannot save invalid snapshot: ${validation.error}`);
    }

    const existing = await this.getSession(snapshot.sessionId);
    const now = Date.now();

    const record: PersistedTrainingSession = {
      sessionId: snapshot.sessionId,
      workoutId: workout.id,
      workout,
      snapshot,
      state: snapshot.state,
      createdAt: existing ? existing.createdAt : now,
      updatedAt: now,
    };

    await this.saveSession(record);
  }

  /**
   * Retrieves a persisted session by its unique sessionId.
   */
  public async getSession(sessionId: string): Promise<PersistedTrainingSession | null> {
    return this.db.get<PersistedTrainingSession>(STORES.TRAINING_SESSIONS, sessionId);
  }

  /**
   * Retrieves the most recently updated incomplete session (PREPARING, ACTIVE, PAUSED, REST).
   */
  public async getLatestIncompleteSession(): Promise<PersistedTrainingSession | null> {
    const all = await this.db.getAll<PersistedTrainingSession>(STORES.TRAINING_SESSIONS, {
      indexName: 'by_updatedAt',
      direction: 'prev',
    });

    const incompleteStates: TrainingState[] = ['PREPARING', 'ACTIVE', 'PAUSED', 'REST'];

    for (const session of all) {
      if (incompleteStates.includes(session.state)) {
        const validation = this.validateSnapshot(session.snapshot);
        if (validation.isValid) {
          return session;
        }
      }
    }

    return null;
  }

  /**
   * Checks for an interrupted session, verifying snapshot validity and stale thresholds.
   */
  public async checkInterruptedSession(
    staleThresholdMs: number = this.staleThresholdMs
  ): Promise<SessionRecoveryCheckResult> {
    try {
      const session = await this.getLatestIncompleteSession();
      if (!session) {
        return {
          hasIncompleteSession: false,
          session: null,
          isStale: false,
          ageMs: 0,
        };
      }

      const validation = this.validateSnapshot(session.snapshot);
      if (!validation.isValid) {
        return {
          hasIncompleteSession: false,
          session: null,
          isStale: false,
          ageMs: 0,
          validationError: validation.error,
        };
      }

      const now = Date.now();
      const ageMs = Math.max(0, now - session.updatedAt);
      const isStale = ageMs > staleThresholdMs;

      return {
        hasIncompleteSession: true,
        session,
        isStale,
        ageMs,
      };
    } catch (err: any) {
      console.warn('Failed to check for interrupted session in IndexedDB:', err);
      return {
        hasIncompleteSession: false,
        session: null,
        isStale: false,
        ageMs: 0,
        validationError: err?.message || 'Storage access error',
      };
    }
  }

  /**
   * Deletes a session from persistence.
   */
  public async deleteSession(sessionId: string): Promise<void> {
    await this.db.delete(STORES.TRAINING_SESSIONS, sessionId);
  }

  /**
   * Clears all persisted sessions.
   */
  public async clearAllSessions(): Promise<void> {
    await this.db.clearStore(STORES.TRAINING_SESSIONS);
  }
}

/**
 * Singleton instance of TrainingSessionRepository.
 */
export const defaultTrainingSessionRepository = new IndexedDBTrainingSessionRepository();
