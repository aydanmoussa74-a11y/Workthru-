/**
 * AI Coach Module Foundation
 * Phase 0: Architectural interface definition.
 * Controlled application tools boundary for future Phase 9 AI Coaching integration.
 */

export interface AICoachTools {
  getCurrentWorkout: () => void;
  getExercise: (exerciseId: string) => void;
  getProgress: () => void;
  getRecentSessions: () => void;
  explainExercise: (exerciseId: string) => void;
}
