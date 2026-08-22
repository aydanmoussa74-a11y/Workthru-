/**
 * Test Runner for Workout PWA Verification
 */

import { runFoundationChecks } from './foundation.test';
import { runExerciseDomainTests, runExerciseRepositoryTests } from './exercise-domain.test';
import { runWorkoutDomainTests } from './workout-domain.test';
import { runTrainingEngineTests } from './training-engine.test';
import { runTrainingPlayerTests } from './training-player.test';
import { runLocalPersistenceTests } from './local-persistence.test';
import { runProgressionTests } from './progression.test';
import { runDemonstrationTests } from './demonstrations.test';
import { runYouTubeDomainTests } from '../src/domain/media/youtube/__tests__/youtube.test';

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

  // 8. Phase 6 Progression engine tests
  const progressionTestResult = await runProgressionTests();
  if (progressionTestResult.passed) {
    report.push('✓ Phase 6 Progression Engine tests passed (rules v1, deterministic evaluator, evidence calculation, conservative regression, ladder discovery, preferences)');
  } else {
    report.push(`✗ Phase 6 Progression Engine tests failed:\n${progressionTestResult.report.filter(r => r.startsWith('✗')).join('\n')}`);
    allPassed = false;
  }

  // 9. Phase 7 Demonstration & Trainer System tests
  const demoTestResult = await runDemonstrationTests();
  if (demoTestResult.passed) {
    report.push('✓ Phase 7 Demonstration & Trainer System tests passed (multi-source Real Person + 3D, deterministic resolution, non-destructive switching, offline filtering, TrainingEngine state isolation)');
  } else {
    report.push(`✗ Phase 7 Demonstration & Trainer System tests failed:\n${demoTestResult.report.filter(r => r.startsWith('✗')).join('\n')}`);
    allPassed = false;
  }

  // 10. Phase 8 YouTube & Media System tests
  const youtubeTestResult = await runYouTubeDomainTests();
  if (youtubeTestResult.failed === 0) {
    report.push(`✓ Phase 8 YouTube & Media System tests passed (${youtubeTestResult.passed} checks: query builder, TTL LRU cache, normalizer, error fallback, demonstration integration)`);
  } else {
    report.push(`✗ Phase 8 YouTube & Media System tests failed:\n${youtubeTestResult.errors.join('\n')}`);
    allPassed = false;
  }

  return {
    passed: allPassed,
    report,
  };
}
