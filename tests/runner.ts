/**
 * Test Runner for Workout PWA Verification
 */

import { runFoundationChecks } from './foundation.test';
import { runExerciseDomainTests, runExerciseRepositoryTests } from './exercise-domain.test';
import { runWorkoutDomainTests } from './workout-domain.test';
import { runTrainingEngineTests } from './training-engine.test';
import { runTrainingPlayerTests } from './training-player.test';
import { runLocalPersistenceTests } from './local-persistence.test';

export async function runAllTests(): Promise<{ passed: boolean; report: string[] }> {
  const report: string[] = [];
  let allPassed = true;

  // 1. Foundation checks
  const foundationOk = runFoundationChecks();
  if (foundationOk) {
    report.push('✓ Phase 0 Foundation checks passed');
  } else {
    report.push('✗ Phase 0 Foundation checks failed');
    allPassed = false;
  }

  // 2. Exercise domain tests
  const domainTestResult = runExerciseDomainTests();
  if (domainTestResult.passed) {
    report.push('✓ Phase 1 Exercise Domain checks passed (all 22 exercises valid with complete metadata)');
  } else {
    report.push(`✗ Phase 1 Exercise Domain checks failed:\n${domainTestResult.failures.join('\n')}`);
    allPassed = false;
  }

  // 3. Exercise repository tests
  const repoTestResult = await runExerciseRepositoryTests();
  if (repoTestResult.passed) {
    report.push('✓ Phase 1 Exercise Repository tests passed (getAll, getById, getBySlug, search, filter, variations)');
  } else {
    report.push(`✗ Phase 1 Exercise Repository tests failed:\n${repoTestResult.failures.join('\n')}`);
    allPassed = false;
  }

  // 4. Workout domain & generation tests
  const workoutTestResult = await runWorkoutDomainTests();
  if (workoutTestResult.passed) {
    report.push('✓ Phase 2 Workout Domain & Generation tests passed (determinism, duration bounds, equipment constraints, validator, error handling)');
  } else {
    report.push(`✗ Phase 2 Workout Domain & Generation tests failed:\n${workoutTestResult.failures.join('\n')}`);
    allPassed = false;
  }

  // 5. Training state machine & timing engine tests
  const engineTestResult = await runTrainingEngineTests();
  if (engineTestResult.passed) {
    report.push('✓ Phase 3 Training State Machine & Timing Engine tests passed (state machine, timestamp clock, pause/resume drift prevention, time adjustments, snapshots, errors)');
  } else {
    report.push(`✗ Phase 3 Training State Machine & Timing Engine tests failed:\n${engineTestResult.failures.join('\n')}`);
    allPassed = false;
  }

  // 6. Training player & hook tests
  const playerTestResult = await runTrainingPlayerTests();
  if (playerTestResult.passed) {
    report.push('✓ Phase 4 Training Player & Interaction tests passed (preparation, active timer, reps, controls, previous/skip, abandon flow, completion records)');
  } else {
    report.push(`✗ Phase 4 Training Player & Interaction tests failed:\n${playerTestResult.failures.join('\n')}`);
    allPassed = false;
  }

  // 7. Local persistence & IndexedDB tests
  const persistenceTestResult = await runLocalPersistenceTests();
  if (persistenceTestResult.passed) {
    report.push('✓ Phase 5 Local Persistence & IndexedDB tests passed (schema v1, session snapshots, interruption recovery, stale threshold, completed history, preferences, wipe)');
  } else {
    report.push(`✗ Phase 5 Local Persistence & IndexedDB tests failed:\n${persistenceTestResult.failures.join('\n')}`);
    allPassed = false;
  }

  return {
    passed: allPassed,
    report,
  };
}
