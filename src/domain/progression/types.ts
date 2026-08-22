/**
 * Progression Domain Types
 * Phase 6: Deterministic, conservative, explainable exercise progression domain models.
 */

import { Exercise } from '../exercises/types';

/**
 * Explicit recommendation outcomes produced by the Progression Evaluator.
 */
export type ProgressionRecommendationType =
  | 'MAINTAIN'
  | 'PROGRESS'
  | 'REGRESS'
  | 'INSUFFICIENT_DATA'
  | 'NO_PROGRESSION_AVAILABLE';

/**
 * Confidence / readiness classification of an evaluation.
 */
export type ReadinessConfidence = 'HIGH' | 'MODERATE' | 'LOW' | 'INSUFFICIENT';

/**
 * Normalized exposure record of an exercise extracted from completed workout history.
 */
export interface ExerciseExposure {
  workoutId: string;
  workoutTitle: string;
  timestamp: number;
  status: 'COMPLETED' | 'SKIPPED';
  targetReps?: number;
  completedReps?: number;
  plannedDurationMs?: number;
  actualDurationMs?: number;
  wasSuccessful: boolean;
}

/**
 * Aggregate evidence calculated across recent exercise exposures.
 */
export interface ProgressionEvidence {
  totalExposures: number;
  completedExposures: number;
  skippedExposures: number;
  completionRatio: number; // 0.0 to 1.0
  consecutiveCompleted: number;
  consecutiveSkippedOrIncomplete: number;
  recentExposures: ExerciseExposure[];
  lookbackCount: number;
}

/**
 * Structured, deterministic evaluation result for an individual exercise.
 */
export interface ProgressionEvaluation {
  exerciseId: string;
  exerciseName: string;
  exerciseSlug: string;
  currentVariationId: string;
  recommendation: ProgressionRecommendationType;
  confidence: ReadinessConfidence;
  targetExerciseId: string | null;
  targetExerciseName: string | null;
  targetExerciseSlug: string | null;
  explanation: string;
  evidence: ProgressionEvidence;
  evaluatedAt: number;
  ruleVersion: number;
}

/**
 * Movement ladder representing an ordered chain of variations from foundational to advanced.
 */
export interface MovementLadder {
  familyId: string;
  familyName: string;
  exercises: Exercise[];
  activeExercise: Exercise;
  activeExerciseIndex: number;
  totalLevels: number;
  evaluation: ProgressionEvaluation;
}

/**
 * User decision record when accepting or declining a progression recommendation.
 */
export interface UserProgressionDecision {
  exerciseId: string;
  targetVariationId: string;
  decision: 'ACCEPTED' | 'DECLINED';
  decidedAt: number;
}

/**
 * User-configured progression preferences stored locally.
 */
export interface UserProgressionPreferences {
  preferredVariations: Record<string, string>; // baseExerciseId or familyId -> preferredExerciseId
  decisions: UserProgressionDecision[];
}
