/**
 * Phase 1 Exercise Domain & Repository Tests
 */

import { INITIAL_EXERCISES } from '../src/domain/exercises/data/initialExercises';
import { LocalStaticExerciseRepository } from '../src/domain/exercises/repository';
import { ExerciseCategory, EquipmentRequirement, MovementPattern, ExperienceLevel } from '../src/domain/exercises/types';

export function runExerciseDomainTests(): { passed: boolean; failures: string[] } {
  const failures: string[] = [];

  const validCategories: ExerciseCategory[] = [
    'PUSH',
    'PULL',
    'LEGS',
    'CORE',
    'FULL_BODY',
    'MOBILITY',
    'WARM_UP',
    'COOL_DOWN',
    'CARDIO',
  ];

  const validPatterns: MovementPattern[] = [
    'HORIZONTAL_PUSH',
    'VERTICAL_PUSH',
    'HORIZONTAL_PULL',
    'VERTICAL_PULL',
    'SQUAT',
    'LUNGE',
    'HIP_HINGE',
    'BRIDGE',
    'ANTI_EXTENSION',
    'ANTI_ROTATION',
    'ROTATION',
    'LOCOMOTION',
    'MOBILITY',
  ];

  const validEquipment: EquipmentRequirement[] = [
    'NONE',
    'WALL',
    'CHAIR',
    'TABLE',
    'RESISTANCE_BAND',
    'DUMBBELL',
    'PULL_UP_BAR',
    'OTHER',
  ];

  const validLevels: ExperienceLevel[] = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];

  // Test 1: Minimum exercise dataset count
  if (INITIAL_EXERCISES.length < 20) {
    failures.push(`Expected at least 20 exercises, found ${INITIAL_EXERCISES.length}`);
  }

  // Test 2: Verify all exercises have valid required metadata
  const exerciseIdMap = new Map<string, boolean>();
  for (const ex of INITIAL_EXERCISES) {
    if (!ex.id || !ex.slug || !ex.name || !ex.description) {
      failures.push(`Exercise ${ex.id || 'unknown'} missing basic identifying fields`);
    }

    if (exerciseIdMap.has(ex.id)) {
      failures.push(`Duplicate exercise ID: ${ex.id}`);
    }
    exerciseIdMap.set(ex.id, true);

    if (!validCategories.includes(ex.category)) {
      failures.push(`Invalid category for ${ex.id}: ${ex.category}`);
    }

    if (!validPatterns.includes(ex.movementPattern)) {
      failures.push(`Invalid movement pattern for ${ex.id}: ${ex.movementPattern}`);
    }

    if (!validEquipment.includes(ex.equipment)) {
      failures.push(`Invalid equipment for ${ex.id}: ${ex.equipment}`);
    }

    if (!validLevels.includes(ex.experienceLevel)) {
      failures.push(`Invalid experience level for ${ex.id}: ${ex.experienceLevel}`);
    }

    if (!ex.primaryMuscles || ex.primaryMuscles.length === 0) {
      failures.push(`Exercise ${ex.id} has no primary muscles declared`);
    }

    // Verify instructions
    const inst = ex.instructions;
    if (!inst || !inst.setup?.length || !inst.execution?.length || !inst.breathing || !inst.formCues?.length || !inst.safetyNotes) {
      failures.push(`Exercise ${ex.id} has incomplete instructions structure`);
    }
  }

  // Test 3: Verify variation relationship integrity (progression/regression references)
  for (const ex of INITIAL_EXERCISES) {
    if (ex.regressionId && !exerciseIdMap.has(ex.regressionId)) {
      failures.push(`Exercise ${ex.id} references non-existent regression ID: ${ex.regressionId}`);
    }
    if (ex.progressionId && !exerciseIdMap.has(ex.progressionId)) {
      failures.push(`Exercise ${ex.id} references non-existent progression ID: ${ex.progressionId}`);
    }
  }

  return {
    passed: failures.length === 0,
    failures,
  };
}

export async function runExerciseRepositoryTests(): Promise<{ passed: boolean; failures: string[] }> {
  const failures: string[] = [];
  const repo = new LocalStaticExerciseRepository();

  // Test getAll
  const all = await repo.getAll();
  if (all.length !== INITIAL_EXERCISES.length) {
    failures.push(`repo.getAll() returned ${all.length}, expected ${INITIAL_EXERCISES.length}`);
  }

  // Test getById
  const pushUp = await repo.getById('push-standard-pushup');
  if (!pushUp || pushUp.slug !== 'standard-push-up') {
    failures.push(`repo.getById('push-standard-pushup') failed`);
  }

  // Test getBySlug
  const squat = await repo.getBySlug('bodyweight-squat');
  if (!squat || squat.id !== 'legs-bodyweight-squat') {
    failures.push(`repo.getBySlug('bodyweight-squat') failed`);
  }

  // Test search
  const pushResults = await repo.search('push');
  if (pushResults.length === 0) {
    failures.push(`repo.search('push') returned 0 results`);
  }

  const chestResults = await repo.search('chest');
  if (chestResults.length === 0) {
    failures.push(`repo.search('chest') returned 0 results`);
  }

  // Test filtering
  const beginnerPush = await repo.filter({ category: 'PUSH', experienceLevel: 'BEGINNER' });
  if (beginnerPush.length === 0) {
    failures.push(`repo.filter({ category: 'PUSH', experienceLevel: 'BEGINNER' }) returned 0 results`);
  }

  // Test variation ladder traversal
  const wallPushVariations = await repo.getRelatedVariations('push-incline-pushup');
  if (!wallPushVariations.regression || wallPushVariations.regression.id !== 'push-wall-pushup') {
    failures.push(`Incline pushup regression should be wall pushup`);
  }
  if (!wallPushVariations.progression || wallPushVariations.progression.id !== 'push-knee-pushup') {
    failures.push(`Incline pushup progression should be knee pushup`);
  }

  return {
    passed: failures.length === 0,
    failures,
  };
}
