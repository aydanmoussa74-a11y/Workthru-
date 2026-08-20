/**
 * Data Repositories Interface & Exports
 * Decouples presentation and domain logic from raw data storage.
 * Phase 5: Complete local repository architecture.
 */

export type { ExerciseRepository } from '../../domain/exercises/repository';
export { defaultExerciseRepository, LocalStaticExerciseRepository } from '../../domain/exercises/repository';

export type { WorkoutRepository } from '../../domain/workouts/repository';
export { defaultWorkoutRepository, LocalStaticWorkoutRepository } from '../../domain/workouts/repository';

export type { TrainingSessionRepository } from './training-session.repository';
export {
  IndexedDBTrainingSessionRepository,
  defaultTrainingSessionRepository,
  DEFAULT_STALE_SESSION_THRESHOLD_MS,
} from './training-session.repository';

export type { CompletedWorkoutRepository } from './completed-workout.repository';
export {
  IndexedDBCompletedWorkoutRepository,
  defaultCompletedWorkoutRepository,
} from './completed-workout.repository';

export type { PreferencesRepository } from './preferences.repository';
export {
  IndexedDBPreferencesRepository,
  defaultPreferencesRepository,
  TRAINING_PREFS_KEY,
} from './preferences.repository';

import { defaultDB } from '../local/db';
import { STORES } from '../local/schema';

/**
 * Global local data cleaner for total application reset with confirmation.
 */
export async function clearAllLocalApplicationData(): Promise<void> {
  await defaultDB.clearStore(STORES.TRAINING_SESSIONS);
  await defaultDB.clearStore(STORES.COMPLETED_WORKOUTS);
  await defaultDB.clearStore(STORES.USER_PREFERENCES);
}
