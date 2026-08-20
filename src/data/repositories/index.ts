/**
 * Data Repositories Interface
 * Decouples presentation and domain logic from raw data storage.
 */

import { Exercise } from '../../domain/exercises/types';
import { Workout } from '../../domain/workouts/types';
import { WorkoutSession } from '../../domain/training-state/types';

export interface ExerciseRepository {
  getAll(): Promise<Exercise[]>;
  getById(id: string): Promise<Exercise | null>;
  getByMuscleGroup(group: string): Promise<Exercise[]>;
}

export interface WorkoutRepository {
  getAll(): Promise<Workout[]>;
  getById(id: string): Promise<Workout | null>;
  getDefaultDailyWorkout(): Promise<Workout>;
}

export interface SessionRepository {
  getActiveSession(): Promise<WorkoutSession | null>;
  saveSession(session: WorkoutSession): Promise<void>;
  getRecentSessions(limit?: number): Promise<WorkoutSession[]>;
}
