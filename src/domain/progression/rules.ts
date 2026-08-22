/**
 * Centralized Progression Rules & Thresholds
 * Phase 6: Deterministic configuration governing progression and regression recommendations.
 */

export interface ProgressionRules {
  /**
   * Version of the active rule set.
   * Ensures backward-compatibility and deterministic historical auditing.
   */
  readonly ruleVersion: number;

  /**
   * Minimum number of completed exercise exposures required before recommending progression.
   * Safety constraint: Prevents advancement after a single lucky or isolated session.
   * Default: 3
   */
  readonly minimumCompletedExposures: number;

  /**
   * Minimum ratio of completed-to-planned exposures required in the lookback window.
   * Must be between 0.0 and 1.0 (e.g. 0.8 = 80%).
   * Default: 0.80
   */
  readonly minimumCompletionRatio: number;

  /**
   * Minimum number of consecutive successful completions required immediately preceding evaluation.
   * Ensures recent stability and movement proficiency.
   * Default: 2
   */
  readonly minimumConsecutiveCompletions: number;

  /**
   * Maximum number of recent exposures to inspect when evaluating progression readiness.
   * Bounded window ensures evaluation reflects current capability rather than stale historical data.
   * Default: 5
   */
  readonly lookbackWindow: number;

  /**
   * Number of consecutive skipped or severely incomplete sessions required to trigger a regression recommendation.
   * Conservative safety constraint: An isolated missed workout, bad day, or time crunch NEVER triggers regression.
   * Default: 3
   */
  readonly consecutiveSkippedThresholdForRegression: number;

  /**
   * Minimum total exposures required before a regression recommendation can be considered.
   * Default: 3
   */
  readonly minimumExposuresForRegression: number;
}

/**
 * Standard conservative progression rules (Rule Version 1).
 *
 * Rationale:
 * - 3 minimum exposures: Requires consistent practice over multiple training days.
 * - 80% completion ratio: Ensures solid mechanical mastery before adding complexity.
 * - 2 consecutive successes: Confirms current capability is stable.
 * - 5 exposure lookback: Focuses on recent form while ignoring ancient history.
 * - 3 consecutive skips for regression: Highly conservative; respects that life events or temporary fatigue occur.
 */
export const DEFAULT_PROGRESSION_RULES: ProgressionRules = {
  ruleVersion: 1,
  minimumCompletedExposures: 3,
  minimumCompletionRatio: 0.8,
  minimumConsecutiveCompletions: 2,
  lookbackWindow: 5,
  consecutiveSkippedThresholdForRegression: 3,
  minimumExposuresForRegression: 3,
};
