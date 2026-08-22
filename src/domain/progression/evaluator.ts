/**
 * Pure Deterministic Progression Evaluator
 * Phase 6: Evaluates exercise performance history against conservative progression rules.
 * Pure, side-effect free, and fully independent of UI state, database APIs, or external services.
 */

import { Exercise } from '../exercises/types';
import {
  ExerciseExposure,
  ProgressionEvaluation,
  ProgressionEvidence,
  ProgressionRecommendationType,
  ReadinessConfidence,
} from './types';
import { ProgressionRules, DEFAULT_PROGRESSION_RULES } from './rules';
import { ProgressionError } from './errors';

export interface ProgressionLadderContext {
  progression: Exercise | null;
  regression: Exercise | null;
}

/**
 * Deterministically evaluates an exercise against its exposure history and progression rules.
 *
 * @param exercise The current exercise variation being evaluated.
 * @param exposures Chronological or unsorted history of exposures for this exercise.
 * @param ladder Context containing the adjacent progression (harder) and regression (easier) variations.
 * @param rules The progression rules to evaluate against (defaults to DEFAULT_PROGRESSION_RULES).
 * @param evaluatedAt Timestamp of the evaluation (defaults to current time).
 * @returns Structured, explainable ProgressionEvaluation.
 */
export function evaluateProgression(
  exercise: Exercise,
  exposures: ExerciseExposure[] = [],
  ladder: ProgressionLadderContext = { progression: null, regression: null },
  rules: ProgressionRules = DEFAULT_PROGRESSION_RULES,
  evaluatedAt: number = Date.now()
): ProgressionEvaluation {
  if (!exercise || !exercise.id) {
    throw new ProgressionError('INVALID_EXERCISE', 'Cannot evaluate progression for a null or invalid exercise.');
  }

  // 1. Sort exposures chronologically descending (newest first)
  const sortedExposures = [...exposures].sort((a, b) => b.timestamp - a.timestamp);

  // 2. Slice to the bounded lookback window
  const lookbackWindow = Math.max(1, rules.lookbackWindow || 5);
  const recentExposures = sortedExposures.slice(0, lookbackWindow);

  // 3. Compute Evidence Metrics
  const totalExposures = recentExposures.length;
  const completedExposures = recentExposures.filter((e) => e.wasSuccessful && e.status === 'COMPLETED').length;
  const skippedExposures = totalExposures - completedExposures;
  const completionRatio = totalExposures > 0 ? completedExposures / totalExposures : 0;

  // Compute consecutive successful completions from most recent backward
  let consecutiveCompleted = 0;
  for (const exp of recentExposures) {
    if (exp.wasSuccessful && exp.status === 'COMPLETED') {
      consecutiveCompleted++;
    } else {
      break;
    }
  }

  // Compute consecutive skipped or unsuccessful attempts from most recent backward
  let consecutiveSkippedOrIncomplete = 0;
  for (const exp of recentExposures) {
    if (!exp.wasSuccessful || exp.status === 'SKIPPED') {
      consecutiveSkippedOrIncomplete++;
    } else {
      break;
    }
  }

  const evidence: ProgressionEvidence = {
    totalExposures,
    completedExposures,
    skippedExposures,
    completionRatio,
    consecutiveCompleted,
    consecutiveSkippedOrIncomplete,
    recentExposures,
    lookbackCount: lookbackWindow,
  };

  // 4. Evaluate Rules Deterministically

  // Condition A: Severe consecutive skips/failures triggering conservative regression
  const isRegressionTriggered =
    totalExposures >= (rules.minimumExposuresForRegression || 3) &&
    consecutiveSkippedOrIncomplete >= (rules.consecutiveSkippedThresholdForRegression || 3);

  if (isRegressionTriggered && ladder.regression) {
    return {
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      exerciseSlug: exercise.slug,
      currentVariationId: exercise.id,
      recommendation: 'REGRESS',
      confidence: 'MODERATE',
      targetExerciseId: ladder.regression.id,
      targetExerciseName: ladder.regression.name,
      targetExerciseSlug: ladder.regression.slug,
      explanation: `Recent sessions indicate difficulty or repeated skips with this variation. You can choose to practice ${ladder.regression.name} to rebuild solid movement rhythm and confidence.`,
      evidence,
      evaluatedAt,
      ruleVersion: rules.ruleVersion,
    };
  }

  // Condition B: Insufficient Data check
  if (completedExposures < rules.minimumCompletedExposures) {
    const remainingNeeded = Math.max(1, rules.minimumCompletedExposures - completedExposures);
    return {
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      exerciseSlug: exercise.slug,
      currentVariationId: exercise.id,
      recommendation: 'INSUFFICIENT_DATA',
      confidence: 'INSUFFICIENT',
      targetExerciseId: null,
      targetExerciseName: null,
      targetExerciseSlug: null,
      explanation: `Complete ${remainingNeeded} more session${remainingNeeded === 1 ? '' : 's'} with this variation to establish a reliable consistency baseline before evaluating progression readiness.`,
      evidence,
      evaluatedAt,
      ruleVersion: rules.ruleVersion,
    };
  }

  // Condition C: Progression Qualification Check
  const meetsExposureThreshold = completedExposures >= rules.minimumCompletedExposures;
  const meetsRatioThreshold = completionRatio >= rules.minimumCompletionRatio;
  const meetsConsecutiveThreshold = consecutiveCompleted >= rules.minimumConsecutiveCompletions;

  const qualifiesForProgression = meetsExposureThreshold && meetsRatioThreshold && meetsConsecutiveThreshold;

  if (qualifiesForProgression) {
    if (ladder.progression) {
      return {
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        exerciseSlug: exercise.slug,
        currentVariationId: exercise.id,
        recommendation: 'PROGRESS',
        confidence: 'HIGH',
        targetExerciseId: ladder.progression.id,
        targetExerciseName: ladder.progression.name,
        targetExerciseSlug: ladder.progression.slug,
        explanation: `Your recent completed sessions show consistent mastery of ${exercise.name}. You can choose to try the next progression: ${ladder.progression.name}.`,
        evidence,
        evaluatedAt,
        ruleVersion: rules.ruleVersion,
      };
    } else {
      // At the top of the movement progression ladder
      return {
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        exerciseSlug: exercise.slug,
        currentVariationId: exercise.id,
        recommendation: 'NO_PROGRESSION_AVAILABLE',
        confidence: 'HIGH',
        targetExerciseId: null,
        targetExerciseName: null,
        targetExerciseSlug: null,
        explanation: `You have demonstrated consistent completion of ${exercise.name}, the highest variation in this movement progression.`,
        evidence,
        evaluatedAt,
        ruleVersion: rules.ruleVersion,
      };
    }
  }

  // Condition D: Default Maintenance
  return {
    exerciseId: exercise.id,
    exerciseName: exercise.name,
    exerciseSlug: exercise.slug,
    currentVariationId: exercise.id,
    recommendation: 'MAINTAIN',
    confidence: 'MODERATE',
    targetExerciseId: null,
    targetExerciseName: null,
    targetExerciseSlug: null,
    explanation: `Continue practicing ${exercise.name} to reinforce solid form, mechanical control, and movement endurance.`,
    evidence,
    evaluatedAt,
    ruleVersion: rules.ruleVersion,
  };
}
