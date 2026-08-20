/**
 * Exercise Domain Types
 * Source of truth for exercise definitions and variations.
 */

export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'legs'
  | 'shoulders'
  | 'arms'
  | 'core'
  | 'full_body';

export type MovementPattern =
  | 'push'
  | 'pull'
  | 'squat'
  | 'hinge'
  | 'lunge'
  | 'carry'
  | 'plank'
  | 'mobility';

export type EquipmentRequirement =
  | 'none'
  | 'mat'
  | 'chair_or_bench'
  | 'wall'
  | 'resistance_band'
  | 'dumbbells';

export interface ExerciseVariation {
  id: string;
  name: string;
  difficultyLevel: 1 | 2 | 3 | 4 | 5;
  techniqueCues: string[];
}

export interface Exercise {
  id: string;
  name: string;
  primaryMuscle: MuscleGroup;
  secondaryMuscles: MuscleGroup[];
  movementPattern: MovementPattern;
  equipment: EquipmentRequirement;
  difficulty: 1 | 2 | 3 | 4 | 5;
  description: string;
  variations?: ExerciseVariation[];
  defaultDurationSec?: number;
  defaultReps?: number;
}
