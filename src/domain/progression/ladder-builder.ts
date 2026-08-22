/**
 * Movement Ladder Builder
 * Phase 6: Assembles ordered exercise progression chains from ExerciseRepository variation graphs.
 */

import { Exercise } from '../exercises/types';
import { ExerciseRepository } from '../exercises/repository';
import { MovementLadder } from './types';
import { ProgressionError } from './errors';
import { ProgressionRules, DEFAULT_PROGRESSION_RULES } from './rules';
import { evaluateProgression } from './evaluator';
import { extractExposuresForExercise } from './history-adapter';
import { PersistedCompletedWorkout } from '../../data/local/types';

/**
 * Builds a linear, ordered array of exercises representing the full progression ladder containing the given exercise.
 *
 * @param exercise The anchor exercise.
 * @param repo Exercise repository instance.
 * @returns Array of exercises ordered from foundational (first) to advanced (last).
 */
export async function buildFullLadder(
  exercise: Exercise,
  repo: ExerciseRepository
): Promise<Exercise[]> {
  if (!exercise) return [];

  const visited = new Set<string>();

  // 1. Trace backwards to find the base/foundation exercise (no regression)
  let current: Exercise = exercise;
  visited.add(current.id);

  while (current.regressionId) {
    if (visited.has(current.regressionId)) {
      console.warn(`[MovementLadder] Cycle detected in regression link for "${current.id}". Breaking.`);
      break;
    }
    const regression = await repo.getById(current.regressionId);
    if (!regression) break;
    visited.add(regression.id);
    current = regression;
  }

  // 2. Now trace forwards from the base to collect the entire ladder
  const ladder: Exercise[] = [current];
  const forwardVisited = new Set<string>([current.id]);

  while (current.progressionId) {
    if (forwardVisited.has(current.progressionId)) {
      console.warn(`[MovementLadder] Cycle detected in progression link for "${current.id}". Breaking.`);
      break;
    }
    const nextProgression = await repo.getById(current.progressionId);
    if (!nextProgression) break;
    forwardVisited.add(nextProgression.id);
    ladder.push(nextProgression);
    current = nextProgression;
  }

  return ladder;
}

/**
 * Discovers and builds all distinct movement ladders in the exercise repository.
 *
 * @param repo Exercise repository instance.
 * @param workouts Completed workout history for evaluating each ladder's active variation.
 * @param preferredVariations Map of baseExerciseId -> preferredExerciseId
 * @param rules Progression evaluation rules.
 * @returns Array of MovementLadder objects.
 */
export async function discoverAllMovementLadders(
  repo: ExerciseRepository,
  workouts: PersistedCompletedWorkout[] = [],
  preferredVariations: Record<string, string> = {},
  rules: ProgressionRules = DEFAULT_PROGRESSION_RULES
): Promise<MovementLadder[]> {
  const allExercises = await repo.getAll();
  const ladderMap = new Map<string, Exercise[]>();
  const processedExerciseIds = new Set<string>();

  // Group exercises into linear chains
  for (const ex of allExercises) {
    if (processedExerciseIds.has(ex.id)) continue;

    const fullLadder = await buildFullLadder(ex, repo);
    for (const item of fullLadder) {
      processedExerciseIds.add(item.id);
    }

    // Use base exercise id as family key
    const baseId = fullLadder[0].id;
    if (!ladderMap.has(baseId)) {
      ladderMap.set(baseId, fullLadder);
    }
  }

  const ladders: MovementLadder[] = [];

  for (const [baseId, chain] of ladderMap.entries()) {
    const baseEx = chain[0];

    // Determine the active exercise for this ladder:
    // 1. If user set a preferred variation in this chain, use that.
    // 2. Otherwise default to the first (beginner) or current variation.
    const preferredId = preferredVariations[baseId];
    let activeExercise = chain[0];
    let activeIndex = 0;

    if (preferredId) {
      const preferredIdx = chain.findIndex((e) => e.id === preferredId);
      if (preferredIdx >= 0) {
        activeExercise = chain[preferredIdx];
        activeIndex = preferredIdx;
      }
    }

    // Build adjacent progression & regression for the active exercise
    const progression = activeIndex < chain.length - 1 ? chain[activeIndex + 1] : null;
    const regression = activeIndex > 0 ? chain[activeIndex - 1] : null;

    // Evaluate active exercise against history
    const exposures = extractExposuresForExercise(workouts, activeExercise.id, activeExercise.slug);
    const evaluation = evaluateProgression(
      activeExercise,
      exposures,
      { progression, regression },
      rules
    );

    const familyName = deriveFamilyName(baseEx, chain);

    ladders.push({
      familyId: baseId,
      familyName,
      exercises: chain,
      activeExercise,
      activeExerciseIndex: activeIndex,
      totalLevels: chain.length,
      evaluation,
    });
  }

  // Sort ladders by category / name
  return ladders.sort((a, b) => a.familyName.localeCompare(b.familyName));
}

function deriveFamilyName(baseExercise: Exercise, chain: Exercise[]): string {
  const name = baseExercise.name.toLowerCase();

  if (name.includes('push') || baseExercise.category === 'PUSH') {
    return 'Push-Up Progression';
  }
  if (name.includes('squat') || name.includes('lunge') || baseExercise.category === 'LEGS') {
    return 'Squat & Lower Body Progression';
  }
  if (name.includes('plank') || name.includes('hollow') || baseExercise.category === 'CORE') {
    return 'Core Stability & Plank Progression';
  }
  if (name.includes('row') || name.includes('pull') || baseExercise.category === 'PULL') {
    return 'Pull & Row Progression';
  }
  if (name.includes('bridge') || name.includes('morning')) {
    return 'Posterior Chain & Hinge Progression';
  }

  return `${baseExercise.name} Progression (${chain.length} levels)`;
}
