/**
 * Data Repositories Interface
 * Decouples presentation and domain logic from raw data storage.
 */

import { Exercise } from '../../domain/exercises/types';
import { Workout } from '../../domain/workouts/types';
import { WorkoutSession } from '../../domain/training-state/types';

export type { ExerciseRepository } from '../../domain/exercises/repository';
export { defaultExerciseRepository, LocalStaticExerciseRepository } from '../../domain/exercises/repository';

export type { WorkoutRepository } from '../../domain/workouts/repository';
export { defaultWorkoutRepository, LocalStaticWorkoutRepository } from '../../domain/workouts/repository';

export interface SessionRepository {
  getActiveSession(): Promise<WorkoutSession | null>;
  saveSession(session: WorkoutSession): Promise<void>;
  getRecentSessions(limit?: number): Promise<WorkoutSession[]>;
}
