/**
 * Training State Domain Types
 * Canonical state machine, timing, segment, event, and snapshot definitions.
 */

import { WorkoutExercise, WorkoutSectionType, RestReason, ExecutionMode } from '../workouts/types';
import { ExerciseCategory } from '../exercises/types';

/**
 * Explicit Training Session States.
 * Represents the current lifecycle state of the training session.
 */
export type TrainingState =
  | 'NOT_STARTED'
  | 'PREPARING'
  | 'ACTIVE'
  | 'PAUSED'
  | 'REST'
  | 'COMPLETED'
  | 'ABANDONED';

/**
 * Type of a linear execution segment.
 */
export type TrainingSegmentType = 'PREPARATION' | 'EXERCISE' | 'REST';

/**
 * Linear executable segment in a training session.
 */
export interface TrainingSegment {
  id: string;
  segmentIndex: number;
  type: TrainingSegmentType;
  section: WorkoutSectionType;
  name: string;
  category?: ExerciseCategory;
  mode: ExecutionMode;
  targetDurationSec?: number;
  targetReps?: number;
  plannedDurationMs: number;
  exerciseId?: string;
  slug?: string;
  formCueSnippet?: string;
  restReason?: RestReason;
  workoutExerciseId?: string;
}

/**
 * Record of a completed or skipped segment.
 */
export interface SegmentRecord {
  segmentId: string;
  segmentIndex: number;
  status: 'COMPLETED' | 'SKIPPED';
  actualDurationMs: number;
  completedReps?: number;
  startedAtTimestamp: number;
  endedAtTimestamp: number;
}

/**
 * Full state representation of an in-flight or completed Training Session.
 */
export interface TrainingSession {
  sessionId: string;
  workoutId: string;
  workoutTitle: string;
  state: TrainingState;
  previousStateBeforePause?: 'PREPARING' | 'ACTIVE' | 'REST';
  segments: TrainingSegment[];
  currentSegmentIndex: number;

  // Segment-level timestamp-based timing (all in ms)
  segmentStartTimestamp: number | null;
  segmentEndTimestamp: number | null; // For timed segments: segmentStartTimestamp + plannedDurationMs (+ adjustments + pause shifts)
  plannedSegmentDurationMs: number;
  pausedAtTimestamp: number | null;
  accumulatedPauseMs: number;

  // Session-level tracking
  sessionStartTimestamp: number | null;
  sessionEndTimestamp: number | null;
  totalSessionPausedMs: number;

  // History & Records
  records: SegmentRecord[];
}

/**
 * Serializable state snapshot for session persistence and restoration (Phase 5 ready).
 */
export interface TrainingStateSnapshot {
  version: number;
  sessionId: string;
  workoutId: string;
  workoutTitle: string;
  state: TrainingState;
  previousStateBeforePause?: 'PREPARING' | 'ACTIVE' | 'REST';
  currentSegmentIndex: number;
  segmentStartTimestamp: number | null;
  segmentEndTimestamp: number | null;
  plannedSegmentDurationMs: number;
  pausedAtTimestamp: number | null;
  accumulatedPauseMs: number;
  sessionStartTimestamp: number | null;
  sessionEndTimestamp: number | null;
  totalSessionPausedMs: number;
  records: SegmentRecord[];
  snapshotTimestamp: number;
}

/**
 * Strongly typed events dispatched to the Training State Machine.
 */
export type TrainingEvent =
  | { type: 'START' }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'TICK' }
  | { type: 'COMPLETE_SEGMENT'; repsCompleted?: number }
  | { type: 'SKIP' }
  | { type: 'PREVIOUS' }
  | { type: 'ADD_TIME'; seconds?: number }
  | { type: 'REDUCE_TIME'; seconds?: number }
  | { type: 'COMPLETE_SESSION' }
  | { type: 'ABANDON' };

/**
 * Derived timing information exposed for UI consumption.
 */
export interface DerivedTimingInfo {
  remainingMs: number;
  remainingSec: number;
  elapsedSegmentMs: number;
  elapsedSegmentSec: number;
  totalSessionElapsedMs: number;
  totalSessionElapsedSec: number;
  totalSessionActiveMs: number;
  formattedRemaining: string; // MM:SS
  formattedElapsed: string; // MM:SS
  progressPercentage: number; // 0.0 to 1.0
  isExpired: boolean;
}

// ----------------------------------------------------------------------------
// Backward-compatibility aliases for existing repository abstractions
// ----------------------------------------------------------------------------
export type TrainingSessionStatus = TrainingState;
export type PerformanceRecord = SegmentRecord;
export type WorkoutSession = TrainingSession;
