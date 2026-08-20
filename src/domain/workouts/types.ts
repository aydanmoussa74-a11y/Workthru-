/**
 * Workout Domain Types
 * Source of truth for workout definitions, routines, and exercises.
 */

import { EquipmentRequirement } from '../exercises/types';

export type WorkoutType = 'strength' | 'hiit' | 'mobility' | 'endurance' | 'warmup' | 'recovery';

export type ExecutionMode = 'timed' | 'reps';

export interface WorkoutExercise {
  exerciseId: string;
  name: string;
  mode: ExecutionMode;
  targetDurationSec?: number;
  targetReps?: number;
  restDurationSec: number;
  cue?: string;
}

export interface Workout {
  id: string;
  title: string;
  subtitle: string;
  type: WorkoutType;
  estimatedDurationMin: number;
  equipment: EquipmentRequirement;
  exercises: WorkoutExercise[];
  intensity: 'low' | 'moderate' | 'high';
}
