/**
 * Unit Tests for Phase 4: Training Player & Hook Behavior
 */

import { defaultWorkoutRepository } from '../src/domain/workouts/repository';
import { TrainingEngine } from '../src/domain/training-state/engine';
import { FakeClock } from '../src/domain/training-state/clock';
import { Workout } from '../src/domain/workouts/types';

export async function runTrainingPlayerTests(): Promise<{ passed: boolean; failures: string[] }> {
  const failures: string[] = [];

  const assert = (condition: boolean, message: string) => {
    if (!condition) {
      failures.push(message);
    }
  };

  try {
    // 1. Generate test workout
    const sampleWorkout: Workout = await defaultWorkoutRepository.generateWorkout({
      durationMin: 10,
      trainingFocus: 'FULL_BODY',
      experienceLevel: 'BEGINNER',
      equipment: ['NONE'],
      includeWarmup: true,
      includeCooldown: true,
    });

    const fakeClock = new FakeClock(1000000);
    const engine = new TrainingEngine(sampleWorkout, {
      clock: fakeClock,
    });

    // Initial state check
    assert(engine.getState() === 'NOT_STARTED', 'Initial player engine state must be NOT_STARTED');
    assert(engine.getCurrentSegment() === null, 'Current segment should be null before start');

    // 2. Start Workout -> PREPARING
    engine.dispatch({ type: 'START' });
    assert(engine.getState() === 'PREPARING', 'Starting workout transitions to PREPARING');
    const prepSeg = engine.getCurrentSegment();
    assert(prepSeg !== null && prepSeg.type === 'PREPARATION', 'First segment must be of type PREPARATION');

    // 3. Derived timing during preparation
    const prepTiming = engine.getDerivedTiming();
    assert(prepTiming.remainingSec > 0, 'Remaining prep time must be > 0');
    assert(prepTiming.formattedRemaining.includes(':'), 'Formatted prep time should be formatted MM:SS');

    // Advance clock 2 seconds
    fakeClock.advance(2000);
    const prepTiming2 = engine.getDerivedTiming();
    assert(prepTiming2.remainingSec === prepTiming.remainingSec - 2, 'Remaining prep time must decrease by 2s');

    // 4. Skip preparation to jump immediately to first exercise
    engine.dispatch({ type: 'SKIP' });
    assert(engine.getState() === 'ACTIVE', 'Skipping prep must advance to first ACTIVE exercise');
    const firstExSeg = engine.getCurrentSegment();
    assert(firstExSeg !== null && firstExSeg.type === 'EXERCISE', 'Current segment must now be EXERCISE');
    assert(firstExSeg?.section === 'WARM_UP', 'First exercise should be in WARM_UP phase');

    // 5. Test Pause / Resume
    engine.dispatch({ type: 'PAUSE' });
    assert(engine.getState() === 'PAUSED', 'Dispatching PAUSE must set state to PAUSED');
    assert(engine.isPaused() === true, 'isPaused helper must return true');

    fakeClock.advance(5000); // Advance while paused (no time should be deducted from segment)
    engine.dispatch({ type: 'RESUME' });
    assert(engine.getState() === 'ACTIVE', 'Dispatching RESUME must restore ACTIVE state');
    assert(engine.isPaused() === false, 'isPaused helper must return false');

    // 6. Test Time Adjustments (+10s / -10s) on timed exercise
    if (firstExSeg?.mode === 'timed') {
      const initialRemaining = engine.getDerivedTiming().remainingSec;
      engine.dispatch({ type: 'ADD_TIME', seconds: 10 });
      assert(
        engine.getDerivedTiming().remainingSec >= initialRemaining + 9,
        'ADD_TIME (+10s) must increase remaining time'
      );

      engine.dispatch({ type: 'REDUCE_TIME', seconds: 10 });
      assert(
        engine.getDerivedTiming().remainingSec <= initialRemaining + 1,
        'REDUCE_TIME (-10s) must decrease remaining time'
      );
    }

    // 7. Complete Exercise -> Advance to Rest or Next Exercise
    engine.dispatch({ type: 'COMPLETE_SEGMENT' });
    const currentSegAfterComp = engine.getCurrentSegment();
    assert(
      currentSegAfterComp !== null && (engine.getState() === 'REST' || engine.getState() === 'ACTIVE'),
      'Completing segment should advance to REST or next ACTIVE segment'
    );

    // 8. Test Previous control
    const indexBeforePrev = engine.getSession().currentSegmentIndex;
    assert(indexBeforePrev > 0, 'Current segment index should be > 0 before PREVIOUS');
    engine.dispatch({ type: 'PREVIOUS' });
    assert(
      engine.getSession().currentSegmentIndex === indexBeforePrev - 1,
      'PREVIOUS must navigate back exactly 1 segment'
    );

    // 9. Fast-forward workout through completion
    let guard = 0;
    while (!engine.isComplete() && guard < 100) {
      guard++;
      engine.dispatch({ type: 'COMPLETE_SEGMENT' });
    }
    assert(engine.getState() === 'COMPLETED', 'Session must reach COMPLETED state');
    assert(engine.isComplete() === true, 'isComplete must return true');

    // 10. Verify Completed Session Records
    const session = engine.getSession();
    assert(session.records.length > 0, 'Session must record performance records for segments');
    const hasCompleted = session.records.some((r) => r.status === 'COMPLETED');
    assert(hasCompleted, 'Records must register completed status for executed segments');

    // 11. Test Abandon flow on fresh engine
    const abandonClock = new FakeClock(2000000);
    const abandonEngine = new TrainingEngine(sampleWorkout, { clock: abandonClock });
    abandonEngine.dispatch({ type: 'START' });
    abandonEngine.dispatch({ type: 'ABANDON' });
    assert(abandonEngine.getState() === 'ABANDONED', 'Dispatching ABANDON must put engine in ABANDONED state');

  } catch (err: any) {
    failures.push(`Unexpected exception in Training Player tests: ${err?.message || String(err)}`);
  }

  return {
    passed: failures.length === 0,
    failures,
  };
}
