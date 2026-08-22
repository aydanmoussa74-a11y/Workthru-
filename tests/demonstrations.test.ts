/**
 * Phase 7 Demonstration & Trainer System Automated Test Suite
 * Validates domain model, multiple demonstration sources, availability states,
 * non-destructive switching, offline filtering, and TrainingEngine isolation.
 */

import {
  DemonstrationAsset,
  DemonstrationResolution,
  LocalStaticDemonstrationRepository,
  resolveDemonstrations,
  switchDemonstration,
  formatDemonstrationSourceLabel,
} from '../src/domain/demonstrations';
import { TrainingEngine } from '../src/domain/training-state/engine';
import { Workout, WorkoutExercise } from '../src/domain/workouts/types';
import { FakeClock } from '../src/domain/training-state/clock';

// Mock sample assets for isolated unit testing
const mockRealPersonPushup: DemonstrationAsset = {
  id: 'mock-push-real',
  exerciseId: 'test-pushup',
  sourceType: 'REAL_PERSON',
  title: 'Real Person Push-Up',
  durationSec: 4,
  loop: true,
  availableOffline: true,
  attribution: 'Test Coach',
};

const mock3DTrainerPushup: DemonstrationAsset = {
  id: 'mock-push-3d',
  exerciseId: 'test-pushup',
  sourceType: 'THREE_D_TRAINER',
  title: '3D Kinematic Push-Up',
  durationSec: 4,
  loop: true,
  availableOffline: true,
  attribution: '3D Engine',
};

const mockOnlineOnlySquat: DemonstrationAsset = {
  id: 'mock-squat-online',
  exerciseId: 'test-squat',
  sourceType: 'REAL_PERSON',
  title: 'High-Res Streamed Squat',
  durationSec: 5,
  loop: true,
  availableOffline: false, // Requires network
  attribution: 'Online Stream',
};

const mockWarmupEx: WorkoutExercise = {
  id: 'warm-1',
  exerciseId: 'test-pushup',
  name: 'Warmup Push',
  slug: 'warmup-push',
  category: 'PUSH',
  order: 0,
  section: 'WARM_UP',
  mode: 'timed',
  targetDurationSec: 30,
  estimatedDurationSec: 30,
  restAfterSec: 15,
};

const mockMainEx: WorkoutExercise = {
  id: 'main-1',
  exerciseId: 'test-pushup',
  name: 'Main Push-Up',
  slug: 'main-pushup',
  category: 'PUSH',
  order: 1,
  section: 'MAIN',
  mode: 'reps',
  targetReps: 10,
  estimatedDurationSec: 40,
  restAfterSec: 30,
};

const mockSampleWorkout: Workout = {
  id: 'test-demo-workout',
  title: 'Test Demonstration Workout',
  subtitle: 'Full isolation test',
  description: 'Validating engine state isolation',
  focus: 'PUSH',
  experienceLevel: 'BEGINNER',
  equipment: ['NONE'],
  requestedDurationMin: 10,
  estimatedDurationSec: 600,
  warmupExercises: [mockWarmupEx],
  mainExercises: [mockMainEx],
  cooldownExercises: [],
  allExercises: [mockWarmupEx, mockMainEx],
  restSegments: [],
  totalWorkSec: 70,
  totalRestSec: 45,
  createdAt: new Date().toISOString(),
};

export async function runDemonstrationTests(): Promise<{ passed: boolean; report: string[] }> {
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
    // Test 1: Repository Asset Retrieval
    // -------------------------------------------------------------------------
    const testRepo = new LocalStaticDemonstrationRepository([
      mockRealPersonPushup,
      mock3DTrainerPushup,
      mockOnlineOnlySquat,
    ]);

    const multipleDemos = await testRepo.getByExerciseId('test-pushup');
    assert(multipleDemos.length === 2, 'Repository retrieves multiple demonstrations (Real Person + 3D) for test-pushup');
    assert(multipleDemos[0].sourceType === 'REAL_PERSON', 'First asset is REAL_PERSON');
    assert(multipleDemos[1].sourceType === 'THREE_D_TRAINER', 'Second asset is THREE_D_TRAINER');

    const singleDemo = await testRepo.getByExerciseId('test-squat');
    assert(singleDemo.length === 1, 'Repository retrieves single demonstration for test-squat');

    const noDemo = await testRepo.getByExerciseId('non-existent-exercise');
    assert(noDemo.length === 0, 'Repository returns empty array for exercise with no demonstrations');

    // -------------------------------------------------------------------------
    // Test 2: Resolution States (AVAILABLE, UNAVAILABLE, Offline Handling)
    // -------------------------------------------------------------------------
    const resolvedPushup = await resolveDemonstrations('test-pushup', testRepo);
    assert(resolvedPushup.state === 'AVAILABLE', 'Resolves state AVAILABLE for exercise with demonstrations');
    assert(resolvedPushup.selectedIndex === 0, 'Default selected index is 0');
    assert(resolvedPushup.selectedAsset?.id === 'mock-push-real', 'Selected asset is mock-push-real');
    assert(
      resolvedPushup.availableSourceTypes.includes('REAL_PERSON') &&
        resolvedPushup.availableSourceTypes.includes('THREE_D_TRAINER'),
      'Lists both available source types'
    );

    // Non-existent exercise resolution
    const resolvedMissing = await resolveDemonstrations('non-existent-exercise', testRepo);
    assert(resolvedMissing.state === 'UNAVAILABLE', 'Resolves state UNAVAILABLE for non-existent demonstration');
    assert(resolvedMissing.selectedAsset === null, 'Selected asset is null for UNAVAILABLE state');
    assert(
      resolvedMissing.statusMessage?.includes('written technique guidance') || false,
      'Status message instructs user to follow written technique guidance'
    );

    // Offline constraint filtering
    const resolvedOnlineSquat = await resolveDemonstrations('test-squat', testRepo, { isOnline: true });
    assert(resolvedOnlineSquat.state === 'AVAILABLE', 'Online-dependent asset is AVAILABLE when isOnline is true');

    const resolvedOfflineSquat = await resolveDemonstrations('test-squat', testRepo, { isOnline: false });
    assert(resolvedOfflineSquat.state === 'UNAVAILABLE', 'Online-dependent asset resolves to UNAVAILABLE when offline');
    assert(
      resolvedOfflineSquat.statusMessage?.includes('internet connection') || false,
      'Offline message explains connection requirement honestly'
    );

    // Preferred source type resolution
    const preferred3D = await resolveDemonstrations('test-pushup', testRepo, {
      preferredSourceType: 'THREE_D_TRAINER',
    });
    assert(preferred3D.selectedIndex === 1, 'Respects preferredSourceType and selects THREE_D_TRAINER');
    assert(preferred3D.selectedAsset?.sourceType === 'THREE_D_TRAINER', 'Selected asset matches preferred source');

    // -------------------------------------------------------------------------
    // Test 3: Non-Destructive Switching & Boundary Wrapping
    // -------------------------------------------------------------------------
    let currentRes = resolvedPushup; // selectedIndex: 0
    assert(currentRes.selectedIndex === 0, 'Initial index is 0');

    // Switch next -> index 1
    currentRes = switchDemonstration(currentRes, 'next');
    assert(currentRes.selectedIndex === 1, 'Switched to next demonstration (index 1)');
    assert(currentRes.selectedAsset?.id === 'mock-push-3d', 'Active asset is now 3D Trainer');

    // Switch next again -> wraps to index 0
    currentRes = switchDemonstration(currentRes, 'next');
    assert(currentRes.selectedIndex === 0, 'Wrapping next cycles back to index 0');
    assert(currentRes.selectedAsset?.id === 'mock-push-real', 'Active asset wrapped to Real Person');

    // Switch prev -> wraps to index 1
    currentRes = switchDemonstration(currentRes, 'prev');
    assert(currentRes.selectedIndex === 1, 'Switching prev wraps to index 1');

    // Direct index jump
    currentRes = switchDemonstration(currentRes, 0);
    assert(currentRes.selectedIndex === 0, 'Direct index switch to 0 succeeds');

    // -------------------------------------------------------------------------
    // Test 4: Training Engine State Isolation (Invariant Verification)
    // -------------------------------------------------------------------------
    const fakeClock = new FakeClock(1000000);
    const engine = new TrainingEngine(mockSampleWorkout, {
      clock: fakeClock,
      builderOptions: { includePrepSegment: true, prepDurationSec: 5 },
    });

    engine.dispatch({ type: 'START' });
    const initialSession = engine.getSession();
    assert(initialSession.state === 'PREPARING', 'TrainingEngine starts in PREPARING state');
    const initialRemaining = engine.getRemainingTimeSec();

    // Simulate switching demonstrations multiple times
    let demoState = await resolveDemonstrations('test-pushup', testRepo);
    demoState = switchDemonstration(demoState, 'next');
    demoState = switchDemonstration(demoState, 'prev');
    demoState = switchDemonstration(demoState, 1);

    // Verify engine state remains completely unperturbed
    const postSwitchSession = engine.getSession();
    assert(postSwitchSession.state === initialSession.state, 'Engine state is completely unmodified after demonstration switching');
    assert(postSwitchSession.currentSegmentIndex === initialSession.currentSegmentIndex, 'Current segment index is unmodified');
    assert(engine.getRemainingTimeSec() === initialRemaining, 'Timer has not drifted or reset');
    assert(engine.isPaused() === false, 'Engine pause state is unmodified');

    // Advance engine to ACTIVE and verify isolation again
    engine.dispatch({ type: 'COMPLETE_SEGMENT' }); // Finish prep
    assert(engine.getState() === 'ACTIVE', 'Engine transitioned to ACTIVE');
    const activeRemaining = engine.getRemainingTimeSec();

    demoState = switchDemonstration(demoState, 'next');
    assert(engine.getState() === 'ACTIVE', 'Engine remains ACTIVE after demonstration switch');
    assert(engine.getRemainingTimeSec() === activeRemaining, 'Active segment timer unaffected by demonstration change');

    // -------------------------------------------------------------------------
    // Test 5: Source Type Formatting & Labels
    // -------------------------------------------------------------------------
    assert(formatDemonstrationSourceLabel('REAL_PERSON') === 'Real Person', 'Formats REAL_PERSON as "Real Person"');
    assert(formatDemonstrationSourceLabel('THREE_D_TRAINER') === '3D Trainer', 'Formats THREE_D_TRAINER as "3D Trainer"');
    assert(formatDemonstrationSourceLabel('FUTURE_AI_GENERATED') === 'AI Generated', 'Formats FUTURE_AI_GENERATED as "AI Generated"');
    assert(formatDemonstrationSourceLabel('FUTURE_EXTERNAL_VIDEO') === 'External Video', 'Formats FUTURE_EXTERNAL_VIDEO as "External Video"');

  } catch (err: any) {
    report.push(`✗ UNEXPECTED EXCEPTION: ${err?.message || String(err)}`);
    allPassed = false;
  }

  return { passed: allPassed, report };
}
