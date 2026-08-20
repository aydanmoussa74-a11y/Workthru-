/**
 * Training Engine Errors
 * Structured, typed exceptions for state machine transitions, timing operations, and navigation.
 */

export type TrainingEngineErrorCode =
  | 'INVALID_TRANSITION'
  | 'INVALID_SEGMENT'
  | 'SESSION_ALREADY_COMPLETE'
  | 'SESSION_NOT_STARTED'
  | 'SESSION_ABANDONED'
  | 'INVALID_TIME_ADJUSTMENT'
  | 'NO_PREVIOUS_SEGMENT'
  | 'NO_NEXT_SEGMENT'
  | 'INVALID_STATE_SNAPSHOT'
  | 'WORKOUT_EMPTY';

export class TrainingEngineError extends Error {
  public readonly code: TrainingEngineErrorCode;
  public readonly details?: Record<string, unknown>;

  constructor(code: TrainingEngineErrorCode, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = 'TrainingEngineError';
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, TrainingEngineError.prototype);
  }
}
