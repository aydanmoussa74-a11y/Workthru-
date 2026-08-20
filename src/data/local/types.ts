/**
 * Local Data Storage Types & Contracts
 * Phase 5: Local Persistence Domain Models
 */

import { Workout, TrainingFocus } from '../../domain/workouts/types';
import {
  ExperienceLevel,
  EquipmentRequirement,
} from '../../domain/exercises/types';
import {
  TrainingState,
  TrainingStateSnapshot,
  SegmentRecord,
} from '../../domain/training-state/types';

/**
 * Persisted in-flight training session for interruption recovery.
 */
export interface PersistedTrainingSession {
  sessionId: string;
  workoutId: string;
  workout: Workout;
  snapshot: TrainingStateSnapshot;
  state: TrainingState;
  createdAt: number;
  updatedAt: number;
}

/**
 * Persisted record of a completed workout routine.
 */
export interface PersistedCompletedWorkout {
  id: string; // Typically matches sessionId
  sessionId: string;
  workoutId: string;
  workoutTitle: string;
  workoutFocus: TrainingFocus;
  startedAt: number;
  completedAt: number;
  plannedDurationMs: number;
  actualDurationMs: number;
  totalActiveMs: number;
  totalPausedMs: number;
  completedSegmentsCount: number;
  skippedSegmentsCount: number;
  totalSegmentsCount: number;
  records: SegmentRecord[];
  createdAt: number;
}

/**
 * User training preferences model stored locally.
 */
export interface UserTrainingPreferences {
  experienceLevel: ExperienceLevel;
  equipment: EquipmentRequirement[];
  defaultDurationMin: number;
  trainingFocus: TrainingFocus;
  includeWarmup: boolean;
  includeCooldown: boolean;
  soundCuesEnabled?: boolean;
}

/**
 * Default fallback training preferences when none have been set.
 */
export const DEFAULT_USER_TRAINING_PREFERENCES: UserTrainingPreferences = {
  experienceLevel: 'BEGINNER',
  equipment: ['NONE'],
  defaultDurationMin: 15,
  trainingFocus: 'FULL_BODY',
  includeWarmup: true,
  includeCooldown: true,
  soundCuesEnabled: true,
};

/**
 * Generic key-value preference entry for raw store access.
 */
export interface PersistedPreferenceEntry<T = any> {
  key: string;
  value: T;
  updatedAt: number;
}

/**
 * Result of checking for an interrupted session.
 */
export interface SessionRecoveryCheckResult {
  hasIncompleteSession: boolean;
  session: PersistedTrainingSession | null;
  isStale: boolean;
  ageMs: number;
  validationError?: string;
}
