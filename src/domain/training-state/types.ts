/**
 * Training State Domain Types
 * Core session state transitions and execution tracking.
 */

export type TrainingSessionStatus =
  | 'NOT_STARTED'
  | 'PREPARING'
  | 'ACTIVE'
  | 'PAUSED'
  | 'REST'
  | 'SKIPPED'
  | 'COMPLETED'
  | 'ABANDONED';

export interface PerformanceRecord {
  exerciseId: string;
  completedDurationSec: number;
  completedReps?: number;
  skipped: boolean;
  timestamp: number;
}

export interface WorkoutSession {
  sessionId: string;
  workoutId: string;
  status: TrainingSessionStatus;
  startedAtTimestamp?: number;
  completedAtTimestamp?: number;
  currentExerciseIndex: number;
  performanceRecords: PerformanceRecord[];
}
