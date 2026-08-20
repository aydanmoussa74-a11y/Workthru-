/**
 * Workout Domain & Generator Tests
 * Tests for deterministic workout generation, constraints enforcement, validator checks, and error handling.
 */

import { WorkoutGenerator } from '../src/domain/workouts/generator';
import { WorkoutValidator } from '../src/domain/workouts/validator';
import { defaultExerciseRepository } from '../src/domain/exercises/repository';
import { defaultWorkoutRepository } from '../src/domain/workouts/repository';
import { WorkoutRequest, Workout } from '../src/domain/workouts/types';
import { WorkoutGenerationError } from '../src/domain/workouts/errors';

export async function runWorkoutDomainTests(): Promise<{ passed: boolean; failures: string[] }> {
  const failures: string[] = [];
  const generator = new WorkoutGenerator(defaultExerciseRepository);
  const validator = new WorkoutValidator(defaultExerciseRepository);

  try {
    // 1. Determinism Test
    const requestA: WorkoutRequest = {
      durationMin: 15,
      trainingFocus: 'FULL_BODY',
      experienceLevel: 'BEGINNER',
      equipment: ['NONE'],
      includeWarmup: true,
      includeCooldown: true,
    };

    const workout1 = await generator.generate(requestA);
    const workout2 = await generator.generate(requestA);

    if (workout1.allExercises.length !== workout2.allExercises.length) {
      failures.push('Determinism failed: Exercise counts differ between identical requests.');
    }

    for (let i = 0; i < workout1.allExercises.length; i++) {
      if (workout1.allExercises[i].exerciseId !== workout2.allExercises[i].exerciseId) {
        failures.push(`Determinism failed: Exercise at index ${i} differs between identical requests.`);
      }
      if (workout1.allExercises[i].estimatedDurationSec !== workout2.allExercises[i].estimatedDurationSec) {
        failures.push(`Determinism failed: Exercise duration at index ${i} differs.`);
      }
    }

    // 2. Duration Constraint Test (never exceeds requested duration)
    const testDurations = [5, 8, 10, 15, 20, 30];
    for (const dur of testDurations) {
      const wk = await generator.generate({
        durationMin: dur,
        trainingFocus: 'FULL_BODY',
        experienceLevel: 'BEGINNER',
        equipment: ['NONE'],
      });

      const maxAllowed = dur * 60;
      if (wk.estimatedDurationSec > maxAllowed) {
        failures.push(`Duration constraint failed: ${dur}m workout took ${wk.estimatedDurationSec}s (max ${maxAllowed}s).`);
      }
    }

    // 3. Equipment Constraint Test (NONE equipment should never include WALL or CHAIR)
    const noEqWorkout = await generator.generate({
      durationMin: 15,
      trainingFocus: 'FULL_BODY',
      experienceLevel: 'BEGINNER',
      equipment: ['NONE'],
    });

    for (const wex of noEqWorkout.allExercises) {
      const canonical = await defaultExerciseRepository.getById(wex.exerciseId);
      if (canonical && canonical.equipment !== 'NONE') {
        failures.push(`Equipment constraint failed: Exercise "${canonical.name}" requires "${canonical.equipment}" but request had NONE.`);
      }
    }

    // 4. Focus Targeting Tests
    // Core Focus
    const coreWorkout = await generator.generate({
      durationMin: 10,
      trainingFocus: 'CORE',
      experienceLevel: 'BEGINNER',
      equipment: ['NONE'],
    });
    const nonCoreMain = coreWorkout.mainExercises.filter((e) => e.category !== 'CORE');
    if (nonCoreMain.length > 0) {
      failures.push(`Focus targeting failed: Core workout main section contained non-core exercise: ${nonCoreMain[0].name}`);
    }

    // Push Focus
    const pushWorkout = await generator.generate({
      durationMin: 12,
      trainingFocus: 'PUSH',
      experienceLevel: 'BEGINNER',
      equipment: ['NONE'],
    });
    const nonPushMain = pushWorkout.mainExercises.filter((e) => e.category !== 'PUSH');
    if (nonPushMain.length > 0) {
      failures.push(`Focus targeting failed: Push workout main section contained non-push exercise: ${nonPushMain[0].name}`);
    }

    // Mobility Focus
    const mobilityWorkout = await generator.generate({
      durationMin: 8,
      trainingFocus: 'MOBILITY',
      experienceLevel: 'BEGINNER',
      equipment: ['NONE'],
    });
    const nonMobilityMain = mobilityWorkout.mainExercises.filter((e) => e.category !== 'MOBILITY');
    if (nonMobilityMain.length > 0) {
      failures.push(`Focus targeting failed: Mobility workout main section contained non-mobility exercise: ${nonMobilityMain[0].name}`);
    }

    // 5. Validator Tests
    const validResult = await validator.validate(noEqWorkout);
    if (!validResult.isValid) {
      failures.push(`Validator failed on valid generated workout: ${validResult.errors.join('; ')}`);
    }

    // Corrupted workout test
    const corruptedWorkout: Workout = {
      ...noEqWorkout,
      estimatedDurationSec: noEqWorkout.requestedDurationMin * 60 + 500, // Exceeds limit
      allExercises: [
        {
          ...noEqWorkout.allExercises[0],
          exerciseId: 'non-existent-ex-999',
        },
      ],
    };
    const invalidResult = await validator.validate(corruptedWorkout);
    if (invalidResult.isValid) {
      failures.push('Validator failed to flag corrupted workout with non-existent exercise ID and excessive duration.');
    }

    // 6. Error Handling Tests
    try {
      await generator.generate({
        durationMin: 1, // Invalid duration (< 4 min)
      });
      failures.push('Generator should have thrown on invalid duration < 4 minutes.');
    } catch (e: any) {
      if (!(e instanceof WorkoutGenerationError) || e.code !== 'INVALID_DURATION') {
        failures.push(`Expected WorkoutGenerationError with code INVALID_DURATION, got: ${e}`);
      }
    }

    // 7. Curated Presets Test
    const curated = await defaultWorkoutRepository.getCuratedWorkouts();
    if (curated.length < 4) {
      failures.push(`Expected at least 4 curated workouts, got ${curated.length}`);
    }

    for (const w of curated) {
      const v = await validator.validate(w);
      if (!v.isValid) {
        failures.push(`Curated workout "${w.title}" failed validation: ${v.errors.join('; ')}`);
      }
    }
  } catch (err: any) {
    failures.push(`Unexpected workout domain test error: ${err?.message || err}`);
  }

  return {
    passed: failures.length === 0,
    failures,
  };
}
