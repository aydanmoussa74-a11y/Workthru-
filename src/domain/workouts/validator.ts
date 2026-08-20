/**
 * Workout Validator
 * Invariant verification for generated workouts.
 */

import { Workout, WorkoutValidationResult } from './types';
import { ExerciseRepository } from '../exercises/repository';

export class WorkoutValidator {
  constructor(private readonly exerciseRepo: ExerciseRepository) {}

  public async validate(workout: Workout): Promise<WorkoutValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. Basic Structural Integrity
    if (!workout.id || typeof workout.id !== 'string') {
      errors.push('Workout must have a valid non-empty string ID.');
    }
    if (!workout.title || typeof workout.title !== 'string') {
      errors.push('Workout must have a valid title.');
    }
    if (!workout.requestedDurationMin || workout.requestedDurationMin <= 0) {
      errors.push('Workout requestedDurationMin must be greater than 0.');
    }
    if (!workout.estimatedDurationSec || workout.estimatedDurationSec <= 0) {
      errors.push('Workout estimatedDurationSec must be greater than 0.');
    }

    // 2. Duration Bound Checks
    const maxAllowedDurationSec = workout.requestedDurationMin * 60;
    if (workout.estimatedDurationSec > maxAllowedDurationSec) {
      errors.push(
        `Estimated duration (${workout.estimatedDurationSec}s) exceeds requested duration (${maxAllowedDurationSec}s).`
      );
    }

    // 3. Exercise Invariants & Repository Existence
    if (!workout.allExercises || workout.allExercises.length === 0) {
      errors.push('Workout must contain at least one exercise.');
    }

    const seenExerciseIdsInMain = new Set<string>();
    let previousOrder = 0;

    for (const wex of workout.allExercises) {
      // Check sequential ordering
      if (wex.order <= previousOrder) {
        errors.push(`Exercise order is not strictly sequential: exercise ${wex.id} order is ${wex.order}, previous was ${previousOrder}.`);
      }
      previousOrder = wex.order;

      // Verify existence in canonical ExerciseRepository
      const canonicalEx = await this.exerciseRepo.getById(wex.exerciseId);
      if (!canonicalEx) {
        errors.push(`Referenced exercise ID "${wex.exerciseId}" does not exist in the ExerciseRepository.`);
        continue;
      }

      // Check equipment requirement against allowed equipment
      const allowedEquipment = new Set(workout.equipment);
      if (!allowedEquipment.has(canonicalEx.equipment) && canonicalEx.equipment !== 'NONE') {
        errors.push(
          `Exercise "${canonicalEx.name}" requires equipment "${canonicalEx.equipment}", which is not in the allowed list: [${workout.equipment.join(', ')}].`
        );
      }

      // Check mode and prescription
      if (wex.mode === 'timed') {
        if (!wex.targetDurationSec || wex.targetDurationSec <= 0) {
          errors.push(`Timed exercise "${wex.name}" must have targetDurationSec > 0.`);
        }
      } else if (wex.mode === 'reps') {
        if (!wex.targetReps || wex.targetReps <= 0) {
          errors.push(`Rep-based exercise "${wex.name}" must have targetReps > 0.`);
        }
      } else {
        errors.push(`Exercise "${wex.name}" has invalid execution mode "${wex.mode}".`);
      }

      if (wex.restAfterSec < 0) {
        errors.push(`Exercise "${wex.name}" has negative rest duration (${wex.restAfterSec}s).`);
      }

      if (wex.section === 'MAIN') {
        if (seenExerciseIdsInMain.has(wex.exerciseId)) {
          warnings.push(`Duplicate main exercise "${wex.name}" in workout.`);
        }
        seenExerciseIdsInMain.add(wex.exerciseId);
      }
    }

    // 4. Section Composition Checks
    if (workout.mainExercises.length === 0) {
      errors.push('Workout must contain at least one MAIN exercise.');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }
}
