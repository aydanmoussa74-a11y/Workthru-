/**
 * Progression History Adapter
 * Phase 6: Adapts completed workout records from CompletedWorkoutRepository into ExerciseExposure models.
 * Decouples storage schema from pure progression domain evaluation.
 */

import { PersistedCompletedWorkout } from '../../data/local/types';
import { ExerciseExposure } from './types';

/**
 * Extracts all exposure records for a specific exercise from completed workout history.
 *
 * @param workouts Completed workouts array from CompletedWorkoutRepository
 * @param targetExerciseId Canonical Exercise ID (e.g. 'push-wall-pushup')
 * @param targetSlug Optional Exercise slug for flexible fallback matching
 * @returns Array of normalized ExerciseExposure instances
 */
export function extractExposuresForExercise(
  workouts: PersistedCompletedWorkout[] = [],
  targetExerciseId: string,
  targetSlug?: string
): ExerciseExposure[] {
  if (!workouts || workouts.length === 0 || !targetExerciseId) {
    return [];
  }

  const exposures: ExerciseExposure[] = [];

  for (const workout of workouts) {
    if (!workout.records || workout.records.length === 0) continue;

    for (const record of workout.records) {
      // Check if this segment record corresponds to the target exercise
      const segmentId = record.segmentId || '';
      const isIdMatch =
        segmentId === `seg-ex-${targetExerciseId}` ||
        segmentId.includes(`-${targetExerciseId}`) ||
        (targetSlug && segmentId.includes(`-${targetSlug}`));

      if (isIdMatch) {
        const isStatusCompleted = record.status === 'COMPLETED';

        // An exposure is successful if it completed without being skipped and achieved duration/rep criteria
        const hasPositiveDuration = (record.actualDurationMs || 0) > 0;
        const wasSuccessful = isStatusCompleted && hasPositiveDuration;

        exposures.push({
          workoutId: workout.workoutId || workout.id,
          workoutTitle: workout.workoutTitle || 'Training Session',
          timestamp: record.endedAtTimestamp || record.startedAtTimestamp || workout.completedAt || workout.startedAt,
          status: record.status,
          targetReps: record.completedReps !== undefined ? record.completedReps : undefined,
          completedReps: record.completedReps,
          actualDurationMs: record.actualDurationMs,
          wasSuccessful,
        });
      }
    }
  }

  // Return sorted newest first
  return exposures.sort((a, b) => b.timestamp - a.timestamp);
}
