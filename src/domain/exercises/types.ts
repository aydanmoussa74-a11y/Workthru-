/**
 * Exercise Domain Types
 * Canonical domain definitions for exercises, classifications, equipment, and technique instructions.
 */

export type ExerciseCategory =
  | 'PUSH'
  | 'PULL'
  | 'LEGS'
  | 'CORE'
  | 'FULL_BODY'
  | 'MOBILITY'
  | 'WARM_UP'
  | 'COOL_DOWN'
  | 'CARDIO';

export type MovementPattern =
  | 'HORIZONTAL_PUSH'
  | 'VERTICAL_PUSH'
  | 'HORIZONTAL_PULL'
  | 'VERTICAL_PULL'
  | 'SQUAT'
  | 'LUNGE'
  | 'HIP_HINGE'
  | 'BRIDGE'
  | 'ANTI_EXTENSION'
  | 'ANTI_ROTATION'
  | 'ROTATION'
  | 'LOCOMOTION'
  | 'MOBILITY';

export type EquipmentRequirement =
  | 'NONE'
  | 'WALL'
  | 'CHAIR'
  | 'TABLE'
  | 'RESISTANCE_BAND'
  | 'DUMBBELL'
  | 'PULL_UP_BAR'
  | 'OTHER';

export type ExperienceLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'quadriceps'
  | 'hamstrings'
  | 'glutes'
  | 'calves'
  | 'feet'
  | 'core'
  | 'obliques'
  | 'hip_flexors'
  | 'neck'
  | 'full_body';

export interface ExerciseInstructions {
  setup: string[];
  execution: string[];
  breathing: string;
  formCues: string[];
  commonMistakes: string[];
  safetyNotes: string;
}

export interface ExerciseMediaReference {
  videoUrl?: string | null;
  animationUrl?: string | null;
  thumbnailUrl?: string | null;
}

export interface Exercise {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: ExerciseCategory;
  movementPattern: MovementPattern;
  primaryMuscles: MuscleGroup[];
  secondaryMuscles: MuscleGroup[];
  equipment: EquipmentRequirement;
  experienceLevel: ExperienceLevel;
  instructions: ExerciseInstructions;
  regressionId?: string | null;
  progressionId?: string | null;
  media?: ExerciseMediaReference | null;
}

export interface ExerciseFilterCriteria {
  searchQuery?: string;
  category?: ExerciseCategory | 'ALL';
  equipment?: EquipmentRequirement | 'ALL';
  experienceLevel?: ExperienceLevel | 'ALL';
  movementPattern?: MovementPattern | 'ALL';
  muscle?: MuscleGroup | 'ALL';
}
