/**
 * Phase 3 Training State Machine & Timing Engine Unit Tests
 * Uses FakeClock to test full lifecycle, timestamp math, pause/resume drift prevention,
 * snapshot restoration, and boundary conditions deterministically.
 */

import { FakeClock } from '../src/domain/training-state/clock';
import { TrainingEngine } from '../src/domain/training-state/engine';
import { buildTrainingSegments } from '../src/domain/training-state/segment-builder';
import { TrainingEngineError } from '../src/domain/training-state/errors';
import { defaultWorkoutGenerator } from '../src/domain/workouts/generator';
import { defaultExerciseRepository } from '../src/data/repositories';
import { Workout } from '../src/domain/workouts/types';

export async function runTrainingEngineTests(): Promise<{ passed: boolean; failures: string[] }> {
  const failures: string[] = [];

  const assert = (condition: boolean, message: string) => {
    if (!condition) {
      failures.push(`Assertion failed: ${message}`);
    }
  };

  try {
    const workout = await defaultWorkoutGenerator.generate({
      durationMin: 15,
      experienceLevel: 'BEGINNER',
      equipment: ['NONE'],
      trainingFocus: 'FULL_BODY',
      includeWarmup: true,
      includeCooldown: true,
      seed: 42,
    });

    // ------------------------------------------------------------------------
    // 1. Clock Abstraction Tests
    // ------------------------------------------------------------------------
    {
      const clock = new FakeClock(1000000);
      assert(clock.now() === 1000000, 'FakeClock should initialize to specified timestamp');
      clock.advance(5000);
      assert(clock.now() === 1005000, 'FakeClock should advance by ms');
      clock.advanceSec(10);
      assert(clock.now() === 1015000, 'FakeClock should advance by seconds');
      clock.set(2000000);
      assert(clock.now() === 2000000, 'FakeClock should set absolute timestamp');
    }

    // ------------------------------------------------------------------------
    // 2. Segment Builder Tests
    // ------------------------------------------------------------------------
    {
      const segments = buildTrainingSegments(workout, { includePrepSegment: true, prepDurationSec: 5 });
      assert(segments.length > 0, 'Segments must not be empty');
      assert(segments[0].type === 'PREPARATION', 'First segment should be PREPARATION when requested');
      assert(segments[0].plannedDurationMs === 5000, 'Prep segment duration must match 5000ms');

      // Verify all segments have strictly sequential indices
      for (let i = 0; i < segments.length; i++) {
        assert(segments[i].segmentIndex === i, `Segment at index ${i} must have segmentIndex ${i}`);
      }

      // Test builder without prep segment
      const noPrepSegments = buildTrainingSegments(workout, { includePrepSegment: false });
      assert(noPrepSegments[0].type === 'EXERCISE', 'First segment should be EXERCISE when prep is omitted');
    }

    // ------------------------------------------------------------------------
    // 3. State Machine Full Lifecycle & State Transitions
    // ------------------------------------------------------------------------
    {
      const clock = new FakeClock(1000000);
      const engine = new TrainingEngine(workout, {
        clock,
        builderOptions: { includePrepSegment: true, prepDurationSec: 5 },
      });

      assert(engine.getState() === 'NOT_STARTED', 'Initial state must be NOT_STARTED');
      assert(engine.getRemainingTimeMs() === 0, 'Remaining time before start should be 0');

      // Start Session
      engine.dispatch({ type: 'START' });
      assert(engine.getState() === 'PREPARING', 'Starting with prep segment should transition to PREPARING');
      assert(engine.getCurrentSegment()?.type === 'PREPARATION', 'Current segment should be PREPARATION');
      assert(engine.getRemainingTimeSec() === 5, 'Prep segment remaining time should be 5 seconds');

      // Complete Prep Segment -> transitions to first exercise
      engine.dispatch({ type: 'COMPLETE_SEGMENT' });
      assert(engine.getState() === 'ACTIVE', 'Completing prep should transition to ACTIVE exercise');
      assert(engine.getCurrentSegment()?.type === 'EXERCISE', 'Current segment should be EXERCISE');

      // Pause & Resume
      engine.dispatch({ type: 'PAUSE' });
      assert(engine.getState() === 'PAUSED', 'State must be PAUSED after dispatching PAUSE');
      assert(engine.isPaused(), 'isPaused() must return true');

      engine.dispatch({ type: 'RESUME' });
      assert(engine.getState() === 'ACTIVE', 'State must return to ACTIVE after resume');

      // Skip current exercise -> moves to rest or next exercise
      const skippedIdx = engine.getSession().currentSegmentIndex;
      engine.dispatch({ type: 'SKIP' });
      assert(engine.getSession().currentSegmentIndex === skippedIdx + 1, 'Skip should advance segment index');
      const lastRecord = engine.getSession().records[engine.getSession().records.length - 1];
      assert(lastRecord.status === 'SKIPPED', 'Record status must be SKIPPED');

      // Test PREVIOUS navigation
      engine.dispatch({ type: 'PREVIOUS' });
      assert(engine.getSession().currentSegmentIndex === skippedIdx, 'Previous should navigate back');

      // Abandon Session
      engine.dispatch({ type: 'ABANDON' });
      assert(engine.getState() === 'ABANDONED', 'Session should be ABANDONED');
    }

    // ------------------------------------------------------------------------
    // 4. Timestamp Timing & Drift-Free Pause Math
    // ------------------------------------------------------------------------
    {
      const clock = new FakeClock(1000000);
      const engine = new TrainingEngine(workout, {
        clock,
        builderOptions: { includePrepSegment: false }, // Start straight on timed exercise
      });

      engine.dispatch({ type: 'START' });
      const currentSegment = engine.getCurrentSegment()!;
      const plannedSec = currentSegment.mode === 'timed' ? currentSegment.targetDurationSec! : 30;

      assert(engine.getRemainingTimeSec() === plannedSec, `Initial remaining should be ${plannedSec}s`);

      // Advance clock by 10s while active
      clock.advanceSec(10);
      assert(
        engine.getRemainingTimeSec() === plannedSec - 10,
        `Remaining after 10s should be ${plannedSec - 10}s`
      );

      // Pause at 10s elapsed
      engine.dispatch({ type: 'PAUSE' });
      const remainingWhenPaused = engine.getRemainingTimeSec();

      // Advance 25 seconds during pause (simulating background tab freeze)
      clock.advanceSec(25);
      assert(
        engine.getRemainingTimeSec() === remainingWhenPaused,
        'Remaining time must freeze and not drift while paused'
      );

      // Resume
      engine.dispatch({ type: 'RESUME' });
      assert(
        engine.getRemainingTimeSec() === remainingWhenPaused,
        'Remaining time immediately upon resume must equal frozen remaining time'
      );

      // Advance remaining time - 1 second
      clock.advanceSec(remainingWhenPaused - 1);
      assert(engine.getRemainingTimeSec() === 1, 'Should have 1s remaining');

      // Advance 1s and tick -> segment completes
      clock.advanceSec(1);
      engine.dispatch({ type: 'TICK' });
      assert(
        engine.getSession().currentSegmentIndex === 1,
        'Segment should automatically complete and transition on clock expiration'
      );
    }

    // ------------------------------------------------------------------------
    // 5. Time Adjustment (ADD_TIME and REDUCE_TIME)
    // ------------------------------------------------------------------------
    {
      const clock = new FakeClock(1000000);
      const engine = new TrainingEngine(workout, {
        clock,
        builderOptions: { includePrepSegment: false },
      });

      engine.dispatch({ type: 'START' });
      const initialRemaining = engine.getRemainingTimeSec();

      // Add 10 seconds
      engine.dispatch({ type: 'ADD_TIME', seconds: 10 });
      assert(
        engine.getRemainingTimeSec() === initialRemaining + 10,
        `Remaining time should increase by 10s. Expected ${initialRemaining + 10}, got ${engine.getRemainingTimeSec()}`
      );

      // Reduce 10 seconds
      engine.dispatch({ type: 'REDUCE_TIME', seconds: 10 });
      assert(
        engine.getRemainingTimeSec() === initialRemaining,
        `Remaining time should return to ${initialRemaining}`
      );

      // Boundary clamp test: Reducing more time than available clamps to 1s
      engine.dispatch({ type: 'REDUCE_TIME', seconds: 9999 });
      assert(
        engine.getRemainingTimeSec() === 1,
        'Excessive time reduction must safely clamp to 1 second remaining'
      );
    }

    // ------------------------------------------------------------------------
    // 6. Snapshot Serialization and Deterministic Restoration
    // ------------------------------------------------------------------------
    {
      const clock = new FakeClock(1000000);
      const engine1 = new TrainingEngine(workout, {
        clock,
        builderOptions: { includePrepSegment: true, prepDurationSec: 5 },
      });

      engine1.dispatch({ type: 'START' });
      clock.advanceSec(5);
      engine1.dispatch({ type: 'TICK' }); // Completes prep, enters exercise 0
      clock.advanceSec(10);
      engine1.dispatch({ type: 'PAUSE' });

      const snapshot = engine1.getSnapshot();
      assert(snapshot.version === 1, 'Snapshot version must be 1');
      assert(snapshot.state === 'PAUSED', 'Snapshot state must be PAUSED');
      assert(snapshot.records.length === 1, 'Snapshot must contain 1 completed prep record');

      // Reconstruct engine2 from snapshot with identical clock
      const engine2 = TrainingEngine.fromSnapshot(workout, snapshot, clock, {
        includePrepSegment: true,
        prepDurationSec: 5,
      });

      assert(engine2.getState() === 'PAUSED', 'Restored engine must be in PAUSED state');
      assert(
        engine2.getSession().currentSegmentIndex === snapshot.currentSegmentIndex,
        'Restored engine segment index must match snapshot'
      );
      assert(
        engine2.getRemainingTimeMs() === engine1.getRemainingTimeMs(),
        'Restored engine remaining time must exactly match original engine'
      );

      // Resume restored engine and complete
      engine2.dispatch({ type: 'RESUME' });
      assert(engine2.getState() === 'ACTIVE', 'Restored engine must resume to ACTIVE');
    }

    // ------------------------------------------------------------------------
    // 7. Error Handling & Guardrails
    // ------------------------------------------------------------------------
    {
      const clock = new FakeClock(1000000);
      const engine = new TrainingEngine(workout, { clock });

      let pauseErrorThrown = false;
      try {
        engine.dispatch({ type: 'PAUSE' });
      } catch (err) {
        if (err instanceof TrainingEngineError && err.code === 'INVALID_TRANSITION') {
          pauseErrorThrown = true;
        }
      }
      assert(pauseErrorThrown, 'Pausing a NOT_STARTED session must throw INVALID_TRANSITION');

      engine.dispatch({ type: 'START' });

      let prevErrorThrown = false;
      try {
        engine.dispatch({ type: 'PREVIOUS' });
      } catch (err) {
        if (err instanceof TrainingEngineError && err.code === 'NO_PREVIOUS_SEGMENT') {
          prevErrorThrown = true;
        }
      }
      assert(prevErrorThrown, 'Navigating previous from first segment must throw NO_PREVIOUS_SEGMENT');
    }

    // ------------------------------------------------------------------------
    // 8. Full Session Completion Run
    // ------------------------------------------------------------------------
    {
      const clock = new FakeClock(1000000);
      const engine = new TrainingEngine(workout, {
        clock,
        builderOptions: { includePrepSegment: true, prepDurationSec: 5 },
      });

      engine.dispatch({ type: 'START' });
      const totalSegments = engine.getSession().segments.length;

      for (let i = 0; i < totalSegments; i++) {
        assert(!engine.isComplete(), `Engine should not be complete at segment ${i}`);
        engine.dispatch({ type: 'COMPLETE_SEGMENT' });
      }

      assert(engine.isComplete(), 'Engine must be COMPLETED after finishing all segments');
      assert(engine.getState() === 'COMPLETED', 'Final state must be COMPLETED');
      assert(
        engine.getSession().records.length === totalSegments,
        `All ${totalSegments} segments must be recorded in session history`
      );
    }
  } catch (err: any) {
    failures.push(`Unexpected exception in training engine tests: ${err.message || String(err)}`);
  }

  return {
    passed: failures.length === 0,
    failures,
  };
}
