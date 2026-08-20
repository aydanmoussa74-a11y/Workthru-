/**
 * Completed Workout Repository
 * Phase 5: Local Persistence for completed workout history.
 */

import { IndexedDBManager, defaultDB } from '../local/db';
import { STORES } from '../local/schema';
import { PersistedCompletedWorkout } from '../local/types';
import { TrainingSession } from '../../domain/training-state/types';
import { Workout } from '../../domain/workouts/types';

export interface CompletedWorkoutRepository {
  saveCompletedWorkout(record: PersistedCompletedWorkout): Promise<void>;
  saveFromSession(workout: Workout, session: TrainingSession): Promise<PersistedCompletedWorkout>;
  getCompletedWorkout(id: string): Promise<PersistedCompletedWorkout | null>;
  getCompletedWorkouts(options?: {
    limit?: number;
    offset?: number;
  }): Promise<PersistedCompletedWorkout[]>;
  deleteCompletedWorkout(id: string): Promise<void>;
  clearCompletedWorkouts(): Promise<void>;
  getCount(): Promise<number>;
}

export class IndexedDBCompletedWorkoutRepository implements CompletedWorkoutRepository {
  private db: IndexedDBManager;

  constructor(db: IndexedDBManager = defaultDB) {
    this.db = db;
  }

  /**
   * Saves a completed workout record into the database.
   */
  public async saveCompletedWorkout(record: PersistedCompletedWorkout): Promise<void> {
    if (!record || !record.id || !record.sessionId) {
      throw new Error('Invalid completed workout record: ID and SessionId are required.');
    }
    await this.db.put(STORES.COMPLETED_WORKOUTS, record);
  }

  /**
   * Converts a finished TrainingSession & Workout into a PersistedCompletedWorkout and persists it.
   */
  public async saveFromSession(
    workout: Workout,
    session: TrainingSession
  ): Promise<PersistedCompletedWorkout> {
    const startedAt = session.sessionStartTimestamp || Date.now();
    const completedAt = session.sessionEndTimestamp || Date.now();
    const actualDurationMs = Math.max(0, completedAt - startedAt);
    const plannedDurationMs = workout.estimatedDurationSec * 1000;

    const completedSegmentsCount = session.records.filter((r) => r.status === 'COMPLETED').length;
    const skippedSegmentsCount = session.records.filter((r) => r.status === 'SKIPPED').length;

    const record: PersistedCompletedWorkout = {
      id: session.sessionId,
      sessionId: session.sessionId,
      workoutId: workout.id,
      workoutTitle: workout.title,
      workoutFocus: workout.focus,
      startedAt,
      completedAt,
      plannedDurationMs,
      actualDurationMs,
      totalActiveMs: Math.max(0, actualDurationMs - session.totalSessionPausedMs),
      totalPausedMs: session.totalSessionPausedMs,
      completedSegmentsCount,
      skippedSegmentsCount,
      totalSegmentsCount: session.segments.length,
      records: [...session.records],
      createdAt: Date.now(),
    };

    await this.saveCompletedWorkout(record);
    return record;
  }

  /**
   * Retrieves a single completed workout by ID.
   */
  public async getCompletedWorkout(id: string): Promise<PersistedCompletedWorkout | null> {
    return this.db.get<PersistedCompletedWorkout>(STORES.COMPLETED_WORKOUTS, id);
  }

  /**
   * Retrieves all completed workouts ordered by completion date (newest first).
   */
  public async getCompletedWorkouts(options?: {
    limit?: number;
    offset?: number;
  }): Promise<PersistedCompletedWorkout[]> {
    return this.db.getAll<PersistedCompletedWorkout>(STORES.COMPLETED_WORKOUTS, {
      indexName: 'by_completedAt',
      direction: 'prev', // Newest first
      limit: options?.limit,
      offset: options?.offset,
    });
  }

  /**
   * Deletes a single completed workout record by ID.
   */
  public async deleteCompletedWorkout(id: string): Promise<void> {
    await this.db.delete(STORES.COMPLETED_WORKOUTS, id);
  }

  /**
   * Clears all completed workout records.
   */
  public async clearCompletedWorkouts(): Promise<void> {
    await this.db.clearStore(STORES.COMPLETED_WORKOUTS);
  }

  /**
   * Returns the total count of completed workout records.
   */
  public async getCount(): Promise<number> {
    return this.db.count(STORES.COMPLETED_WORKOUTS);
  }
}

/**
 * Singleton instance of CompletedWorkoutRepository.
 */
export const defaultCompletedWorkoutRepository = new IndexedDBCompletedWorkoutRepository();
