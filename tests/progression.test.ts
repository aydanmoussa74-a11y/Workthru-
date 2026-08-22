/**
 * Phase 6 Progression Engine Automated Test Suite
 * Tests deterministic evaluation, rules, evidence calculation, ladder discovery, and voluntary preference workflows.
 */

import {
  evaluateProgression,
  DEFAULT_PROGRESSION_RULES,
  extractExposuresForExercise,
  buildFullLadder,
  discoverAllMovementLadders,
  DefaultProgressionRepository,
  ExerciseExposure,
} from '../src/domain/progression';
import { Exercise } from '../src/domain/exercises/types';
import { LocalStaticExerciseRepository } from '../src/domain/exercises/repository';
import { PersistedCompletedWorkout } from '../src/data/local/types';
import { InMemoryPreferencesRepository } from '../src/data/repositories/preferences.repository';
import { WorkoutGenerator } from '../src/domain/workouts/generator';

// Mock exercises for testing ladders
const mockWallPushup: Exercise = {
  id: 'push-wall',
  slug: 'wall-push-up',
  name: 'Wall Push-Up',
  description: 'Foundational wall push up',
  category: 'PUSH',
  movementPattern: 'HORIZONTAL_PUSH',
  primaryMuscles: ['chest'],
  secondaryMuscles: ['triceps'],
  equipment: 'WALL',
  experienceLevel: 'BEGINNER',
  instructions: {
    setup: ['Stand at wall'],
    execution: ['Push away'],
    breathing: 'Inhale down',
    formCues: ['Straight line'],
    commonMistakes: ['Sagging hips'],
    safetyNotes: 'Keep feet secure',
  },
  regressionId: null,
  progressionId: 'push-incline',
  media: null,
};

const mockInclinePushup: Exercise = {
  id: 'push-incline',
  slug: 'incline-push-up',
  name: 'Incline Push-Up',
  description: 'Elevated surface push up',
  category: 'PUSH',
  movementPattern: 'HORIZONTAL_PUSH',
  primaryMuscles: ['chest'],
  secondaryMuscles: ['triceps'],
  equipment: 'CHAIR',
  experienceLevel: 'BEGINNER',
  instructions: {
    setup: ['Hands on bench'],
    execution: ['Lower chest'],
    breathing: 'Inhale down',
    formCues: ['Neutral spine'],
    commonMistakes: ['Flaring elbows'],
    safetyNotes: 'Secure bench',
  },
  regressionId: 'push-wall',
  progressionId: 'push-standard',
  media: null,
};

const mockStandardPushup: Exercise = {
  id: 'push-standard',
  slug: 'standard-push-up',
  name: 'Standard Push-Up',
  description: 'Floor bodyweight push up',
  category: 'PUSH',
  movementPattern: 'HORIZONTAL_PUSH',
  primaryMuscles: ['chest'],
  secondaryMuscles: ['triceps'],
  equipment: 'NONE',
  experienceLevel: 'INTERMEDIATE',
  instructions: {
    setup: ['Hands on floor'],
    execution: ['Full push up'],
    breathing: 'Inhale down',
    formCues: ['Rigid plank'],
    commonMistakes: ['Dropping head'],
    safetyNotes: 'Keep wrists aligned',
  },
  regressionId: 'push-incline',
  progressionId: null, // Top of this mock ladder
  media: null,
};

export async function runProgressionTests(): Promise<{ passed: boolean; report: string[] }> {
  const report: string[] = [];
  let allPassed = true;

  function assert(condition: boolean, message: string) {
    if (condition) {
      report.push(`✓ ${message}`);
    } else {
      report.push(`✗ FAIL: ${message}`);
      allPassed = false;
    }
  }

  try {
    // -------------------------------------------------------------------------
    // Test 1: Rule Versioning and Default Thresholds
    // -------------------------------------------------------------------------
    assert(DEFAULT_PROGRESSION_RULES.ruleVersion === 1, 'Progression rules are versioned as Version 1');
    assert(DEFAULT_PROGRESSION_RULES.minimumCompletedExposures === 3, 'Default minimum completed exposures is 3');
    assert(DEFAULT_PROGRESSION_RULES.minimumCompletionRatio === 0.8, 'Default minimum completion ratio is 80%');
    assert(DEFAULT_PROGRESSION_RULES.minimumConsecutiveCompletions === 2, 'Default minimum consecutive completions is 2');
    assert(DEFAULT_PROGRESSION_RULES.consecutiveSkippedThresholdForRegression === 3, 'Conservative regression threshold is 3 consecutive skips');

    // -------------------------------------------------------------------------
    // Test 2: Insufficient Data Evaluation
    // -------------------------------------------------------------------------
    const emptyEvaluation = evaluateProgression(mockInclinePushup, [], {
      progression: mockStandardPushup,
      regression: mockWallPushup,
    });
    assert(emptyEvaluation.recommendation === 'INSUFFICIENT_DATA', 'Zero exposures produces INSUFFICIENT_DATA recommendation');
    assert(emptyEvaluation.confidence === 'INSUFFICIENT', 'Zero exposures produces INSUFFICIENT confidence');
    assert(emptyEvaluation.targetExerciseId === null, 'Target exercise ID is null when data is insufficient');

    const twoExposures: ExerciseExposure[] = [
      {
        workoutId: 'w1',
        workoutTitle: 'Session 1',
        timestamp: 1000,
        status: 'COMPLETED',
        wasSuccessful: true,
      },
      {
        workoutId: 'w2',
        workoutTitle: 'Session 2',
        timestamp: 2000,
        status: 'COMPLETED',
        wasSuccessful: true,
      },
    ];
    const partialEvaluation = evaluateProgression(mockInclinePushup, twoExposures, {
      progression: mockStandardPushup,
      regression: mockWallPushup,
    });
    assert(partialEvaluation.recommendation === 'INSUFFICIENT_DATA', '2 exposures (< 3 minimum) yields INSUFFICIENT_DATA');
    assert(partialEvaluation.explanation.includes('1 more session'), 'Explanation accurately states remaining required sessions');

    // -------------------------------------------------------------------------
    // Test 3: Qualified Progression Recommendation
    // -------------------------------------------------------------------------
    const threeSuccessfulExposures: ExerciseExposure[] = [
      {
        workoutId: 'w1',
        workoutTitle: 'Session 1',
        timestamp: 1000,
        status: 'COMPLETED',
        wasSuccessful: true,
      },
      {
        workoutId: 'w2',
        workoutTitle: 'Session 2',
        timestamp: 2000,
        status: 'COMPLETED',
        wasSuccessful: true,
      },
      {
        workoutId: 'w3',
        workoutTitle: 'Session 3',
        timestamp: 3000,
        status: 'COMPLETED',
        wasSuccessful: true,
      },
    ];
    const progressEval = evaluateProgression(mockInclinePushup, threeSuccessfulExposures, {
      progression: mockStandardPushup,
      regression: mockWallPushup,
    });
    assert(progressEval.recommendation === 'PROGRESS', '3 successful exposures produces PROGRESS recommendation');
    assert(progressEval.confidence === 'HIGH', 'Progression readiness has HIGH confidence');
    assert(progressEval.targetExerciseId === 'push-standard', 'Target progression is push-standard');
    assert(progressEval.targetExerciseName === 'Standard Push-Up', 'Target progression name is Standard Push-Up');
    assert(progressEval.evidence.completionRatio === 1.0, 'Completion ratio is 100%');

    // -------------------------------------------------------------------------
    // Test 4: Top of Ladder Mastery (No Progression Available)
    // -------------------------------------------------------------------------
    const topEval = evaluateProgression(mockStandardPushup, threeSuccessfulExposures, {
      progression: null, // At highest variation
      regression: mockInclinePushup,
    });
    assert(topEval.recommendation === 'NO_PROGRESSION_AVAILABLE', 'Highest variation with 3 completions yields NO_PROGRESSION_AVAILABLE');
    assert(topEval.confidence === 'HIGH', 'Top of ladder recommendation has HIGH confidence');
    assert(topEval.targetExerciseId === null, 'Target exercise is null at top of ladder');

    // -------------------------------------------------------------------------
    // Test 5: Conservative Maintenance (Below 80% or Broken Streak)
    // -------------------------------------------------------------------------
    const mixedExposures: ExerciseExposure[] = [
      { workoutId: 'w1', workoutTitle: 'S1', timestamp: 1000, status: 'COMPLETED', wasSuccessful: true },
      { workoutId: 'w2', workoutTitle: 'S2', timestamp: 2000, status: 'COMPLETED', wasSuccessful: true },
      { workoutId: 'w3', workoutTitle: 'S3', timestamp: 3000, status: 'SKIPPED', wasSuccessful: false },
      { workoutId: 'w4', workoutTitle: 'S4', timestamp: 4000, status: 'COMPLETED', wasSuccessful: true },
      { workoutId: 'w5', workoutTitle: 'S5', timestamp: 5000, status: 'SKIPPED', wasSuccessful: false }, // Most recent is skipped
    ];
    const maintainEval = evaluateProgression(mockInclinePushup, mixedExposures, {
      progression: mockStandardPushup,
      regression: mockWallPushup,
    });
    assert(maintainEval.recommendation === 'MAINTAIN', 'Mixed completion below threshold produces MAINTAIN');
    assert(maintainEval.targetExerciseId === null, 'Target exercise is null for MAINTAIN');

    // -------------------------------------------------------------------------
    // Test 6: Conservative Regression (3 Consecutive Skips / Failures)
    // -------------------------------------------------------------------------
    const isolatedSkipExposures: ExerciseExposure[] = [
      { workoutId: 'w1', workoutTitle: 'S1', timestamp: 1000, status: 'COMPLETED', wasSuccessful: true },
      { workoutId: 'w2', workoutTitle: 'S2', timestamp: 2000, status: 'COMPLETED', wasSuccessful: true },
      { workoutId: 'w3', workoutTitle: 'S3', timestamp: 3000, status: 'SKIPPED', wasSuccessful: false }, // Single bad day
    ];
    const singleSkipEval = evaluateProgression(mockInclinePushup, isolatedSkipExposures, {
      progression: mockStandardPushup,
      regression: mockWallPushup,
    });
    assert(singleSkipEval.recommendation !== 'REGRESS', 'Single isolated skip does NOT trigger regression (protects against bad days)');

    const threeConsecutiveSkips: ExerciseExposure[] = [
      { workoutId: 'w1', workoutTitle: 'S1', timestamp: 3000, status: 'SKIPPED', wasSuccessful: false },
      { workoutId: 'w2', workoutTitle: 'S2', timestamp: 2000, status: 'SKIPPED', wasSuccessful: false },
      { workoutId: 'w3', workoutTitle: 'S3', timestamp: 1000, status: 'SKIPPED', wasSuccessful: false },
    ];
    const regressEval = evaluateProgression(mockInclinePushup, threeConsecutiveSkips, {
      progression: mockStandardPushup,
      regression: mockWallPushup,
    });
    assert(regressEval.recommendation === 'REGRESS', '3 consecutive skips triggers conservative REGRESS recommendation');
    assert(regressEval.targetExerciseId === 'push-wall', 'Target regression is push-wall');

    // Regression on foundational exercise with no easier variation
    const baseRegressEval = evaluateProgression(mockWallPushup, threeConsecutiveSkips, {
      progression: mockInclinePushup,
      regression: null,
    });
    assert(baseRegressEval.recommendation === 'INSUFFICIENT_DATA' || baseRegressEval.recommendation === 'MAINTAIN', 'Base variation without regression safely handles consecutive skips');

    // -------------------------------------------------------------------------
    // Test 7: History Adapter Extraction
    // -------------------------------------------------------------------------
    const mockWorkouts: PersistedCompletedWorkout[] = [
      {
        id: 'sess-1',
        sessionId: 'sess-1',
        workoutId: 'wk-1',
        workoutTitle: 'Push Training',
        workoutFocus: 'PUSH',
        startedAt: 1000,
        completedAt: 1600000,
        plannedDurationMs: 600000,
        actualDurationMs: 600000,
        totalActiveMs: 500000,
        totalPausedMs: 100000,
        completedSegmentsCount: 3,
        skippedSegmentsCount: 0,
        totalSegmentsCount: 3,
        records: [
          {
            segmentId: 'seg-ex-push-incline',
            segmentIndex: 1,
            status: 'COMPLETED',
            actualDurationMs: 30000,
            startedAtTimestamp: 1000,
            endedAtTimestamp: 31000,
          },
        ],
        createdAt: 1000,
      },
      {
        id: 'sess-2',
        sessionId: 'sess-2',
        workoutId: 'wk-2',
        workoutTitle: 'Push Training 2',
        workoutFocus: 'PUSH',
        startedAt: 2000000,
        completedAt: 2600000,
        plannedDurationMs: 600000,
        actualDurationMs: 600000,
        totalActiveMs: 500000,
        totalPausedMs: 100000,
        completedSegmentsCount: 3,
        skippedSegmentsCount: 1,
        totalSegmentsCount: 4,
        records: [
          {
            segmentId: 'seg-ex-push-incline',
            segmentIndex: 1,
            status: 'SKIPPED',
            actualDurationMs: 0,
            startedAtTimestamp: 2000000,
            endedAtTimestamp: 2000000,
          },
        ],
        createdAt: 2000000,
      },
    ];

    const extracted = extractExposuresForExercise(mockWorkouts, 'push-incline');
    assert(extracted.length === 2, 'History adapter extracted 2 exposures for push-incline');
    assert(extracted[0].status === 'SKIPPED', 'First extracted (newest) exposure was SKIPPED');
    assert(extracted[0].wasSuccessful === false, 'Skipped exposure marked wasSuccessful: false');
    assert(extracted[1].status === 'COMPLETED', 'Second extracted exposure was COMPLETED');
    assert(extracted[1].wasSuccessful === true, 'Completed exposure marked wasSuccessful: true');

    // -------------------------------------------------------------------------
    // Test 8: Full Movement Ladder Discovery
    // -------------------------------------------------------------------------
    const testRepo = new LocalStaticExerciseRepository([
      mockWallPushup,
      mockInclinePushup,
      mockStandardPushup,
    ]);

    const discoveredChain = await buildFullLadder(mockInclinePushup, testRepo);
    assert(discoveredChain.length === 3, 'Ladder builder traced all 3 levels from middle node');
    assert(discoveredChain[0].id === 'push-wall', 'Ladder step 1 is base (Wall Push-Up)');
    assert(discoveredChain[1].id === 'push-incline', 'Ladder step 2 is middle (Incline Push-Up)');
    assert(discoveredChain[2].id === 'push-standard', 'Ladder step 3 is top (Standard Push-Up)');

    // -------------------------------------------------------------------------
    // Test 9: Progression Repository & User Decisions
    // -------------------------------------------------------------------------
    const memoryPrefs = new InMemoryPreferencesRepository();
    const mockCompletedRepo = {
      saveCompletedWorkout: async () => {},
      saveFromSession: async () => ({} as any),
      getCompletedWorkout: async () => null,
      getCompletedWorkouts: async () => mockWorkouts,
      deleteCompletedWorkout: async () => {},
      clearCompletedWorkouts: async () => {},
      getCount: async () => 2,
    };

    const progressionRepo = new DefaultProgressionRepository(
      testRepo,
      mockCompletedRepo,
      memoryPrefs
    );

    const initialPrefs = await progressionRepo.getProgressionPreferences();
    assert(Object.keys(initialPrefs.preferredVariations).length === 0, 'Initial preferred variations is empty');

    await progressionRepo.setPreferredVariation('push-wall', 'push-standard', 'ACCEPTED');
    const updatedPrefs = await progressionRepo.getProgressionPreferences();
    assert(updatedPrefs.preferredVariations['push-wall'] === 'push-standard', 'Saved explicit preferred variation choice');
    assert(updatedPrefs.decisions.length === 1, 'Logged user decision in audit history');
    assert(updatedPrefs.decisions[0].decision === 'ACCEPTED', 'Decision record is ACCEPTED');

    await progressionRepo.resetPreferredVariations();
    const resetPrefs = await progressionRepo.getProgressionPreferences();
    assert(Object.keys(resetPrefs.preferredVariations).length === 0, 'Reset cleared preferred variations');

    // -------------------------------------------------------------------------
    // Test 10: Workout Generator Integration with Preferred Variations
    // -------------------------------------------------------------------------
    const generator = new WorkoutGenerator(testRepo);
    const standardWorkout = await generator.generate({
      durationMin: 10,
      trainingFocus: 'PUSH',
      experienceLevel: 'BEGINNER',
    });
    // Default beginner selects beginner exercises
    assert(standardWorkout.mainExercises.length > 0, 'Generated main exercises successfully');

    // With explicit preferred variation override
    const customizedWorkout = await generator.generate({
      durationMin: 10,
      trainingFocus: 'PUSH',
      experienceLevel: 'BEGINNER',
      preferredVariations: {
        'push-wall': 'push-standard',
      },
    });
    assert(customizedWorkout.mainExercises.length > 0, 'Generated customized workout with preferred variation override');

  } catch (err: any) {
    report.push(`✗ UNEXPECTED EXCEPTION: ${err?.message || String(err)}`);
    allPassed = false;
  }

  return { passed: allPassed, report };
}
