/**
 * Training Segment Builder
 * Transforms a domain Workout into a deterministic, linear sequence of executable training segments.
 */

import { Workout } from '../workouts/types';
import { TrainingSegment } from './types';
import { TrainingEngineError } from './errors';

export interface SegmentBuilderOptions {
  includePrepSegment?: boolean;
  prepDurationSec?: number;
}

export const DEFAULT_SEGMENT_BUILDER_OPTIONS: SegmentBuilderOptions = {
  includePrepSegment: true,
  prepDurationSec: 5,
};

export function buildTrainingSegments(
  workout: Workout,
  options: SegmentBuilderOptions = DEFAULT_SEGMENT_BUILDER_OPTIONS
): TrainingSegment[] {
  if (!workout.allExercises || workout.allExercises.length === 0) {
    throw new TrainingEngineError(
      'WORKOUT_EMPTY',
      `Cannot create training segments from empty workout "${workout.id}".`
    );
  }

  const segments: TrainingSegment[] = [];
  let segmentIndex = 0;

  // 1. Preparation Segment (if requested)
  const includePrep = options.includePrepSegment !== false;
  const prepSec = options.prepDurationSec ?? 5;

  if (includePrep && prepSec > 0) {
    segments.push({
      id: `seg-prep-0`,
      segmentIndex: segmentIndex++,
      type: 'PREPARATION',
      section: workout.allExercises[0].section,
      name: 'Get Ready',
      mode: 'timed',
      targetDurationSec: prepSec,
      plannedDurationMs: prepSec * 1000,
      formCueSnippet: 'Set up your space and prepare to begin.',
    });
  }

  // 2. Exercise & Rest Segments
  for (let i = 0; i < workout.allExercises.length; i++) {
    const wex = workout.allExercises[i];

    // Exercise Segment
    const isTimed = wex.mode === 'timed';
    const durationSec = isTimed ? wex.targetDurationSec || 30 : wex.estimatedDurationSec || 30;

    segments.push({
      id: `seg-ex-${wex.id}`,
      segmentIndex: segmentIndex++,
      type: 'EXERCISE',
      section: wex.section,
      name: wex.name,
      category: wex.category,
      mode: wex.mode,
      targetDurationSec: isTimed ? wex.targetDurationSec : undefined,
      targetReps: !isTimed ? wex.targetReps : undefined,
      plannedDurationMs: durationSec * 1000,
      exerciseId: wex.exerciseId,
      slug: wex.slug,
      formCueSnippet: wex.formCueSnippet,
      workoutExerciseId: wex.id,
    });

    // Rest Segment (if exercise has rest after it)
    if (wex.restAfterSec > 0) {
      const isLastExercise = i === workout.allExercises.length - 1;
      const isWarmupToMain = wex.section === 'WARM_UP' && workout.allExercises[i + 1]?.section === 'MAIN';
      const isMainToCooldown = wex.section === 'MAIN' && workout.allExercises[i + 1]?.section === 'COOLDOWN';

      const restReason = isWarmupToMain || isMainToCooldown ? 'SECTION_TRANSITION' : 'INTERVAL_REST';
      const restName = restReason === 'SECTION_TRANSITION' ? 'Transition Rest' : 'Rest';

      segments.push({
        id: `seg-rest-${wex.id}`,
        segmentIndex: segmentIndex++,
        type: 'REST',
        section: wex.section,
        name: restName,
        mode: 'timed',
        targetDurationSec: wex.restAfterSec,
        plannedDurationMs: wex.restAfterSec * 1000,
        restReason,
        formCueSnippet: 'Slow your breathing, maintain posture, and prepare for the next movement.',
        workoutExerciseId: wex.id,
      });
    }
  }

  return segments;
}
