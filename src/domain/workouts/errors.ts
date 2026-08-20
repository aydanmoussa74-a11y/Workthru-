/**
 * Workout Domain Errors
 * Structured, type-safe errors for workout generation and validation.
 */

export type GenerationErrorCode =
  | 'INSUFFICIENT_EXERCISES'
  | 'INVALID_DURATION'
  | 'UNSUPPORTED_FOCUS'
  | 'EQUIPMENT_CONSTRAINT_CONFLICT'
  | 'INVALID_EXERCISE_DATA'
  | 'WORKOUT_VALIDATION_FAILED';

export class WorkoutGenerationError extends Error {
  public readonly code: GenerationErrorCode;
  public readonly details?: Record<string, unknown>;

  constructor(code: GenerationErrorCode, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = 'WorkoutGenerationError';
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, WorkoutGenerationError.prototype);
  }
}
