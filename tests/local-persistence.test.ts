/**
 * Local Persistence & IndexedDB Test Suite
 * Phase 5: Comprehensive tests for repositories, autosave snapshots, recovery, and history.
 */

import { IndexedDBManager } from '../src/data/local/db';
import { STORES, DB_VERSION } from '../src/data/local/schema';
import {
  PersistedTrainingSession,
  PersistedCompletedWorkout,
  DEFAULT_USER_TRAINING_PREFERENCES,
} from '../src/data/local/types';
import {
  IndexedDBTrainingSessionRepository,
  DEFAULT_STALE_SESSION_THRESHOLD_MS,
} from '../src/data/repositories/training-session.repository';
import { IndexedDBCompletedWorkoutRepository } from '../src/data/repositories/completed-workout.repository';
import { IndexedDBPreferencesRepository } from '../src/data/repositories/preferences.repository';
import { Workout } from '../src/domain/workouts/types';
import { TrainingEngine } from '../src/domain/training-state/engine';
import { FakeClock } from '../src/domain/training-state/clock';
import { defaultWorkoutRepository } from '../src/data/repositories';

// Helper mock DB for environments without native IndexedDB
class InMemoryMockIndexedDBManager extends IndexedDBManager {
  private inMemoryStores: Record<string, Map<any, any>> = {
    [STORES.TRAINING_SESSIONS]: new Map(),
    [STORES.COMPLETED_WORKOUTS]: new Map(),
    [STORES.USER_PREFERENCES]: new Map(),
  };

  public isSupported(): boolean {
    return true;
  }

  public async get<T>(storeName: any, key: any): Promise<T | null> {
    const store = this.inMemoryStores[storeName];
    if (!store) return null;
    const val = store.get(key);
    return val ? JSON.parse(JSON.stringify(val)) : null;
  }

  public async put<T>(storeName: any, value: any): Promise<void> {
    const store = this.inMemoryStores[storeName];
    if (!store) return;
    let key: any;
    if (storeName === STORES.TRAINING_SESSIONS) key = value.sessionId;
    else if (storeName === STORES.COMPLETED_WORKOUTS) key = value.id;
    else if (storeName === STORES.USER_PREFERENCES) key = value.key;
    store.set(key, JSON.parse(JSON.stringify(value)));
  }

  public async delete(storeName: any, key: any): Promise<void> {
    const store = this.inMemoryStores[storeName];
    if (store) store.delete(key);
  }

  public async getAll<T>(storeName: any, options?: any): Promise<T[]> {
    const store = this.inMemoryStores[storeName];
    if (!store) return [];
    let items = Array.from(store.values()).map((v) => JSON.parse(JSON.stringify(v)));

    if (options?.indexName === 'by_completedAt' || options?.indexName === 'by_updatedAt') {
      const field = options.indexName === 'by_completedAt' ? 'completedAt' : 'updatedAt';
      items.sort((a, b) => {
        const diff = (a[field] || 0) - (b[field] || 0);
        return options.direction === 'prev' ? -diff : diff;
      });
    }

    if (options?.offset) {
      items = items.slice(options.offset);
    }
    if (options?.limit) {
      items = items.slice(0, options.limit);
    }
    return items;
  }

  public async clearStore(storeName: any): Promise<void> {
    const store = this.inMemoryStores[storeName];
    if (store) store.clear();
  }

  public async count(storeName: any): Promise<number> {
    const store = this.inMemoryStores[storeName];
    return store ? store.size : 0;
  }

  public async deleteDatabase(): Promise<void> {
    for (const store of Object.values(this.inMemoryStores)) {
      store.clear();
    }
  }
}

export async function runLocalPersistenceTests(): Promise<{ passed: boolean; failures: string[] }> {
  const failures: string[] = [];

  const assert = (condition: boolean, message: string) => {
    if (!condition) {
      failures.push(`Assertion failed: ${message}`);
    }
  };

  try {
    // 1. Setup isolated database
    const isNativeIDBAvailable = typeof indexedDB !== 'undefined' && indexedDB !== null;
    const testDb = isNativeIDBAvailable
      ? new IndexedDBManager({ dbName: `test_workout_pwa_${Date.now()}_${Math.floor(Math.random() * 10000)}` })
      : new InMemoryMockIndexedDBManager();

    const sessionRepo = new IndexedDBTrainingSessionRepository(testDb, DEFAULT_STALE_SESSION_THRESHOLD_MS);
    const completedRepo = new IndexedDBCompletedWorkoutRepository(testDb);
    const prefsRepo = new IndexedDBPreferencesRepository(testDb);

    // 2. Generate a test workout to use across tests
    const workout: Workout = await defaultWorkoutRepository.generateWorkout({
      durationMin: 15,
      trainingFocus: 'FULL_BODY',
      experienceLevel: 'BEGINNER',
      equipment: ['NONE'],
      includeWarmup: true,
      includeCooldown: true,
    });
    assert(!!workout && workout.allExercises.length > 0, 'Test workout generation failed.');

    // -------------------------------------------------------------
    // Test Set A: Training Session Snapshot Persistence & Validation
    // -------------------------------------------------------------
    const clock = new FakeClock(100000);
    const engine = new TrainingEngine(workout, { clock, builderOptions: { prepDurationSec: 5 } });

    // Initial state NOT_STARTED
    engine.dispatch({ type: 'START' }); // transitions to PREPARING
    clock.advance(3000); // 3 seconds into prep
    engine.dispatch({ type: 'TICK' });

    const snapshot = engine.getSnapshot();
    assert(snapshot.version === 1, 'Snapshot version must be 1.');
    assert(snapshot.state === 'PREPARING', 'Snapshot state must be PREPARING.');

    // Test snapshot validation
    const validCheck = sessionRepo.validateSnapshot(snapshot);
    assert(validCheck.isValid, 'Valid snapshot must pass validation.');

    const invalidCheck1 = sessionRepo.validateSnapshot(null);
    assert(!invalidCheck1.isValid, 'Null snapshot must fail validation.');

    const invalidCheck2 = sessionRepo.validateSnapshot({ ...snapshot, version: 99 });
    assert(!invalidCheck2.isValid, 'Unknown version snapshot must fail validation.');

    const invalidCheck3 = sessionRepo.validateSnapshot({ ...snapshot, sessionId: '' });
    assert(!invalidCheck3.isValid, 'Empty sessionId snapshot must fail validation.');

    // Save valid snapshot
    await sessionRepo.saveSnapshot(workout, snapshot);

    // Retrieve saved session
    const retrieved = await sessionRepo.getSession(snapshot.sessionId);
    assert(!!retrieved, 'Session must be retrievable by sessionId.');
    assert(retrieved?.workoutId === workout.id, 'Retrieved session must contain matching workoutId.');
    assert(retrieved?.state === 'PREPARING', 'Retrieved session state must match saved state.');

    // Check interruption recovery
    const recoveryResult = await sessionRepo.checkInterruptedSession();
    assert(recoveryResult.hasIncompleteSession, 'Interrupted session must be detected.');
    assert(!recoveryResult.isStale, 'Freshly saved session must not be flagged as stale.');
    assert(recoveryResult.session?.sessionId === snapshot.sessionId, 'Recovery session ID must match.');

    // -------------------------------------------------------------
    // Test Set B: Stale Session Policy
    // -------------------------------------------------------------
    // Clear active session first to test isolated stale session
    await sessionRepo.deleteSession(snapshot.sessionId);

    // Create an older session 25 hours in the past
    const staleUpdatedTime = Date.now() - (25 * 60 * 60 * 1000);
    const staleSession: PersistedTrainingSession = {
      sessionId: 'stale_session_123',
      workoutId: workout.id,
      workout,
      snapshot: { ...snapshot, sessionId: 'stale_session_123' },
      state: 'PAUSED',
      createdAt: staleUpdatedTime - 10000,
      updatedAt: staleUpdatedTime,
    };
    await sessionRepo.saveSession(staleSession);

    const staleRecovery = await sessionRepo.checkInterruptedSession(24 * 60 * 60 * 1000);
    assert(staleRecovery.hasIncompleteSession, 'Stale session must still be detected rather than silently deleted.');
    assert(staleRecovery.isStale, 'Session older than 24h must be flagged isStale=true.');

    // Clean up test stale session
    await sessionRepo.deleteSession('stale_session_123');

    // Re-save active snapshot for next test
    await sessionRepo.saveSnapshot(workout, snapshot);

    // -------------------------------------------------------------
    // Test Set C: Snapshot Restoration into TrainingEngine
    // -------------------------------------------------------------
    // Advance engine into ACTIVE exercise state
    clock.advance(3000); // 6s total -> prep expires -> ACTIVE
    engine.dispatch({ type: 'TICK' });
    assert(engine.getState() === 'ACTIVE', 'Engine should be ACTIVE after prep time expires.');

    // Add pause
    engine.dispatch({ type: 'PAUSE' });
    const pausedSnapshot = engine.getSnapshot();
    assert(pausedSnapshot.state === 'PAUSED', 'Snapshot should reflect PAUSED state.');

    // Save updated paused snapshot
    await sessionRepo.saveSnapshot(workout, pausedSnapshot);

    // Restore engine from snapshot
    const restoredEngine = TrainingEngine.fromSnapshot(workout, pausedSnapshot, clock);
    assert(restoredEngine.getState() === 'PAUSED', 'Restored engine state must be PAUSED.');
    assert(
      restoredEngine.getSession().currentSegmentIndex === pausedSnapshot.currentSegmentIndex,
      'Restored engine segment index must match snapshot.'
    );

    // Resume restored engine and verify tick operation
    restoredEngine.dispatch({ type: 'RESUME' });
    assert(restoredEngine.getState() === 'ACTIVE', 'Restored engine can be resumed to ACTIVE.');

    // Delete session from active repo
    await sessionRepo.deleteSession(snapshot.sessionId);
    const deletedSession = await sessionRepo.getSession(snapshot.sessionId);
    assert(deletedSession === null, 'Session must be null after deletion.');

    // -------------------------------------------------------------
    // Test Set D: Completed Workouts History Persistence
    // -------------------------------------------------------------
    const initialCompletedCount = await completedRepo.getCount();
    assert(initialCompletedCount === 0, 'Initial completed workouts count should be 0.');

    // Run engine to completion
    while (restoredEngine.getState() !== 'COMPLETED' && restoredEngine.getState() !== 'ABANDONED') {
      restoredEngine.dispatch({ type: 'COMPLETE_SEGMENT', repsCompleted: 12 });
    }
    assert(restoredEngine.getState() === 'COMPLETED', 'Engine should reach COMPLETED state.');

    // Persist completed workout
    const completedRecord = await completedRepo.saveFromSession(workout, restoredEngine.getSession());
    assert(!!completedRecord && completedRecord.id === restoredEngine.getSession().sessionId, 'Completed record ID match.');
    assert(completedRecord.completedSegmentsCount > 0, 'Completed record should track completed segments.');
    assert(completedRecord.records.length > 0, 'Completed record should include segment logs.');

    const newCount = await completedRepo.getCount();
    assert(newCount === 1, 'Completed workouts count should now be 1.');

    // Query list
    const historyList = await completedRepo.getCompletedWorkouts();
    assert(historyList.length === 1, 'Completed workouts list length should be 1.');
    assert(historyList[0].workoutTitle === workout.title, 'Workout title in history must match.');

    // Delete individual completed workout
    await completedRepo.deleteCompletedWorkout(completedRecord.id);
    const postDeleteCount = await completedRepo.getCount();
    assert(postDeleteCount === 0, 'Count should be 0 after deleting single record.');

    // -------------------------------------------------------------
    // Test Set E: Preferences Repository
    // -------------------------------------------------------------
    const initialPrefs = await prefsRepo.getTrainingPreferences();
    assert(
      initialPrefs.experienceLevel === DEFAULT_USER_TRAINING_PREFERENCES.experienceLevel,
      'Initial preferences must return default experienceLevel.'
    );
    assert(
      initialPrefs.defaultDurationMin === DEFAULT_USER_TRAINING_PREFERENCES.defaultDurationMin,
      'Initial preferences must return default duration.'
    );

    // Update preferences
    await prefsRepo.saveTrainingPreferences({
      experienceLevel: 'ADVANCED',
      defaultDurationMin: 30,
      trainingFocus: 'PUSH',
    });

    const updatedPrefs = await prefsRepo.getTrainingPreferences();
    assert(updatedPrefs.experienceLevel === 'ADVANCED', 'Updated preference experienceLevel must be ADVANCED.');
    assert(updatedPrefs.defaultDurationMin === 30, 'Updated preference duration must be 30.');
    assert(updatedPrefs.trainingFocus === 'PUSH', 'Updated preference focus must be PUSH.');

    // Reset preferences
    await prefsRepo.resetTrainingPreferences();
    const resetPrefs = await prefsRepo.getTrainingPreferences();
    assert(
      resetPrefs.experienceLevel === DEFAULT_USER_TRAINING_PREFERENCES.experienceLevel,
      'Preferences should be reset to default experience level.'
    );

    // Generic key-value preferences
    await prefsRepo.setPreference('test_custom_theme', 'dark_athletic');
    const customVal = await prefsRepo.getPreference('test_custom_theme', 'default_theme');
    assert(customVal === 'dark_athletic', 'Generic preference get/set should match.');

    // -------------------------------------------------------------
    // Test Set F: Complete Local Cleanup
    // -------------------------------------------------------------
    await sessionRepo.saveSnapshot(workout, snapshot);
    await completedRepo.saveCompletedWorkout(completedRecord);
    await testDb.clearStore(STORES.TRAINING_SESSIONS);
    await testDb.clearStore(STORES.COMPLETED_WORKOUTS);

    const clearedSessions = await sessionRepo.getSession(snapshot.sessionId);
    const clearedWorkouts = await completedRepo.getCount();
    assert(clearedSessions === null, 'Sessions must be empty after clear.');
    assert(clearedWorkouts === 0, 'Workouts must be empty after clear.');

    // Clean up test DB
    await testDb.deleteDatabase();
  } catch (err: any) {
    failures.push(`Unexpected error during Local Persistence tests: ${err?.message || err}`);
  }

  return {
    passed: failures.length === 0,
    failures,
  };
}
