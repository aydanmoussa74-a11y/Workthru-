/**
 * Progression Domain Errors
 * Phase 6: Strongly typed errors for progression evaluation and ladder navigation.
 */

export type ProgressionErrorCode =
  | 'INVALID_EXERCISE'
  | 'INVALID_RULE_CONFIG'
  | 'EVALUATION_FAILED'
  | 'LADDER_BUILD_ERROR'
  | 'CYCLE_DETECTED'
  | 'PERSISTENCE_ERROR';

export class ProgressionError extends Error {
  public readonly code: ProgressionErrorCode;
  public readonly details?: Record<string, any>;

  constructor(code: ProgressionErrorCode, message: string, details?: Record<string, any>) {
    super(`[ProgressionError] ${code}: ${message}`);
    this.name = 'ProgressionError';
    this.code = code;
    this.details = details;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ProgressionError);
    }
  }
}
