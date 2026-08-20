/**
 * Test Runner for Workout PWA Verification
 */

import { runFoundationChecks } from './foundation.test';
import { runExerciseDomainTests, runExerciseRepositoryTests } from './exercise-domain.test';
import { runWorkoutDomainTests } from './workout-domain.test';

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

  return {
    passed: allPassed,
    report,
  };
}
