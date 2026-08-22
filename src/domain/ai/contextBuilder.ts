/**
 * AI Coach Context Builder (Phase 9)
 * Pure, deterministic context extractor deriving structured state from application models.
 * Strictly adheres to truth: no invented statistics, measurements, or visual claims.
 */

import { CoachContext, CoachMessage } from './types';
import { Workout } from '../workouts/types';
import { TrainingSession, TrainingSegment } from '../training-state/types';
import { Exercise } from '../exercises/types';

export interface BuildCoachContextParams {
  workout: Workout;
  session?: TrainingSession | null;
  currentSegment?: TrainingSegment | null;
  currentExercise?: Exercise | null;
  remainingTimeSec?: number;
  activeDemonstrationSource?: string;
  availableDemonstrationSources?: string[];
  recentMessages?: CoachMessage[];
}

/**
 * Builds a clean, strongly-typed CoachContext from current domain entities.
 */
export function buildCoachContext(params: BuildCoachContextParams): CoachContext {
  const {
    workout,
    session,
    currentSegment,
    currentExercise,
    remainingTimeSec,
    activeDemonstrationSource = 'REAL_PERSON',
    availableDemonstrationSources = ['REAL_PERSON', 'THREE_D_TRAINER'],
    recentMessages = [],
  } = params;

  // Calculate segment progress metrics from session records & segments
  const allSegments = session?.segments || [];
  const records = session?.records || [];
  const completedSegmentsCount = records.filter((r) => r.status === 'COMPLETED').length;
  const skippedSegmentsCount = records.filter((r) => r.status === 'SKIPPED').length;
  const totalSegmentsCount = allSegments.length;

  return {
    sessionId: session?.sessionId || 'session-initial',
    workoutId: workout.id,
    workoutTitle: workout.title,
    workoutFocus: workout.focus,
    experienceLevel: workout.experienceLevel,
    currentExercise: currentExercise
      ? {
          id: currentExercise.id,
          name: currentExercise.name,
          category: currentExercise.category,
          targetMuscles: currentExercise.primaryMuscles,
          cues: currentExercise.instructions?.formCues || [],
        }
      : null,
    currentSegment: currentSegment
      ? {
          index: currentSegment.segmentIndex,
          type: currentSegment.type,
          targetDurationSec: currentSegment.targetDurationSec,
          targetReps: currentSegment.targetReps,
          exerciseId: currentSegment.exerciseId,
        }
      : null,
    segmentType: currentSegment?.type,
    remainingTimeSec: typeof remainingTimeSec === 'number' ? Math.max(0, Math.round(remainingTimeSec)) : undefined,
    completedSegmentsCount,
    skippedSegmentsCount,
    totalSegmentsCount,
    selectedVariation: null, // Populated when an explicit progression variation is active
    availableDemonstrations: {
      count: availableDemonstrationSources.length,
      sources: availableDemonstrationSources,
    },
    activeDemonstrationSource,
    recentCoachMessages: recentMessages.slice(-5),
  };
}
