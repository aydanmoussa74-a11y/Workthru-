/**
 * Workout Domain Types
 * Canonical domain definitions for workouts, workout requests, segments, prescriptions, and validation.
 */

import { EquipmentRequirement, ExperienceLevel, ExerciseCategory } from '../exercises/types';

export type TrainingFocus =
  | 'FULL_BODY'
  | 'UPPER_BODY'
  | 'LOWER_BODY'
  | 'CORE'
  | 'MOBILITY'
  | 'CARDIO'
  | 'PUSH'
  | 'LEGS';

export type WorkoutSectionType = 'WARM_UP' | 'MAIN' | 'COOLDOWN';

export type ExecutionMode = 'timed' | 'reps';

export type RestReason = 'INTERVAL_REST' | 'SET_REST' | 'SECTION_TRANSITION';

export interface WorkoutExercise {
  id: string; // Unique instance ID in the workout
  exerciseId: string; // Reference to canonical Exercise ID in ExerciseRepository
  name: string;
  slug: string;
  category: ExerciseCategory;
  order: number;
  section: WorkoutSectionType;
  mode: ExecutionMode;
  targetDurationSec?: number; // Present when mode === 'timed'
  targetReps?: number; // Present when mode === 'reps'
  estimatedDurationSec: number; // Planned duration including execution estimate
  restAfterSec: number;
  formCueSnippet?: string;
}

export interface RestSegment {
  id: string;
  order: number;
  durationSec: number;
  reason: RestReason;
  afterExerciseId?: string;
}

export interface WorkoutConstraints {
  durationMin: number;
  experienceLevel: ExperienceLevel;
  availableEquipment: EquipmentRequirement[];
  focus: TrainingFocus;
  includeWarmup: boolean;
  includeCooldown: boolean;
  exerciseLimit?: number;
}

export interface WorkoutRequest {
  durationMin: number;
  experienceLevel?: ExperienceLevel;
  equipment?: EquipmentRequirement[];
  trainingFocus?: TrainingFocus;
  targetCategories?: ExerciseCategory[];
  includeWarmup?: boolean;
  includeCooldown?: boolean;
  preferredIntensity?: 'LOW' | 'MODERATE' | 'HIGH';
  exerciseLimit?: number;
  seed?: string | number;
}

export interface Workout {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  focus: TrainingFocus;
  experienceLevel: ExperienceLevel;
  equipment: EquipmentRequirement[];
  requestedDurationMin: number;
  estimatedDurationSec: number;
  warmupExercises: WorkoutExercise[];
  mainExercises: WorkoutExercise[];
  cooldownExercises: WorkoutExercise[];
  allExercises: WorkoutExercise[];
  restSegments: RestSegment[];
  totalWorkSec: number;
  totalRestSec: number;
  createdAt: string;
}

export interface WorkoutValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}
