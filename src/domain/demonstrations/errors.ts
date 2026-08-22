/**
 * Demonstration Domain Errors
 * Structured, human-readable error classes for the Demonstration System.
 */

export class DemonstrationError extends Error {
  public readonly code: string;
  public readonly exerciseId?: string;

  constructor(message: string, code = 'DEMONSTRATION_ERROR', exerciseId?: string) {
    super(message);
    this.name = 'DemonstrationError';
    this.code = code;
    this.exerciseId = exerciseId;
  }
}

export class DemonstrationNotFoundError extends DemonstrationError {
  constructor(exerciseId: string) {
    super(
      `No demonstration assets found for exercise '${exerciseId}'. Visual technique guidance remains available.`,
      'DEMONSTRATION_NOT_FOUND',
      exerciseId
    );
    this.name = 'DemonstrationNotFoundError';
  }
}

export class DemonstrationOfflineUnavailableError extends DemonstrationError {
  constructor(exerciseId: string, assetTitle: string) {
    super(
      `The demonstration '${assetTitle}' requires a network connection and is currently unavailable offline. Written instructions and technique cues remain active.`,
      'DEMONSTRATION_OFFLINE_UNAVAILABLE',
      exerciseId
    );
    this.name = 'DemonstrationOfflineUnavailableError';
  }
}

export class DemonstrationLoadError extends DemonstrationError {
  public readonly originalError?: unknown;

  constructor(exerciseId: string, assetId: string, originalError?: unknown) {
    super(
      `Failed to load demonstration asset '${assetId}'. Please follow the written technique cues while training continues.`,
      'DEMONSTRATION_LOAD_FAILED',
      exerciseId
    );
    this.name = 'DemonstrationLoadError';
    this.originalError = originalError;
  }
}
