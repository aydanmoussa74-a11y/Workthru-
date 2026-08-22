/**
 * Progression Repository
 * Phase 6: Orchestrates exercise evaluation, movement ladder discovery, and user progression preference storage.
 */

import { ExerciseRepository, defaultExerciseRepository } from '../exercises/repository';
import { CompletedWorkoutRepository, defaultCompletedWorkoutRepository } from '../../data/repositories/completed-workout.repository';
import { PreferencesRepository, defaultPreferencesRepository } from '../../data/repositories/preferences.repository';
import {
  MovementLadder,
  ProgressionEvaluation,
  UserProgressionDecision,
  UserProgressionPreferences,
} from './types';
import { ProgressionRules, DEFAULT_PROGRESSION_RULES } from './rules';
import { evaluateProgression } from './evaluator';
import { extractExposuresForExercise } from './history-adapter';
import { buildFullLadder, discoverAllMovementLadders } from './ladder-builder';
import { ProgressionError } from './errors';

export const PROGRESSION_PREFERENCES_KEY = 'user_progression_preferences';

export interface ProgressionRepository {
  evaluateExercise(exerciseId: string, rules?: ProgressionRules): Promise<ProgressionEvaluation>;
  getAllMovementLadders(rules?: ProgressionRules): Promise<MovementLadder[]>;
  getMovementLadder(exerciseId: string, rules?: ProgressionRules): Promise<MovementLadder | null>;
  getProgressionPreferences(): Promise<UserProgressionPreferences>;
  setPreferredVariation(
    familyOrBaseId: string,
    variationExerciseId: string,
    decision?: 'ACCEPTED' | 'DECLINED'
  ): Promise<void>;
  resetPreferredVariations(): Promise<void>;
}

export class DefaultProgressionRepository implements ProgressionRepository {
  constructor(
    private readonly exerciseRepo: ExerciseRepository = defaultExerciseRepository,
    private readonly completedRepo: CompletedWorkoutRepository = defaultCompletedWorkoutRepository,
    private readonly prefsRepo: PreferencesRepository = defaultPreferencesRepository,
    private readonly defaultRules: ProgressionRules = DEFAULT_PROGRESSION_RULES
  ) {}

  /**
   * Retrieves user progression preferences (preferred variations & audit decisions).
   */
  public async getProgressionPreferences(): Promise<UserProgressionPreferences> {
    return this.prefsRepo.getPreference<UserProgressionPreferences>(
      PROGRESSION_PREFERENCES_KEY,
      {
        preferredVariations: {},
        decisions: [],
      }
    );
  }

  /**
   * Sets a preferred variation for an exercise family upon explicit user decision.
   */
  public async setPreferredVariation(
    familyOrBaseId: string,
    variationExerciseId: string,
    decision: 'ACCEPTED' | 'DECLINED' = 'ACCEPTED'
  ): Promise<void> {
    const current = await this.getProgressionPreferences();
    const updated: UserProgressionPreferences = {
      preferredVariations: {
        ...current.preferredVariations,
        [familyOrBaseId]: variationExerciseId,
      },
      decisions: [
        {
          exerciseId: familyOrBaseId,
          targetVariationId: variationExerciseId,
          decision,
          decidedAt: Date.now(),
        },
        ...current.decisions.slice(0, 49), // Keep last 50 decisions
      ],
    };

    await this.prefsRepo.setPreference(PROGRESSION_PREFERENCES_KEY, updated);
  }

  /**
   * Resets all user-selected progression preferences.
   */
  public async resetPreferredVariations(): Promise<void> {
    await this.prefsRepo.setPreference<UserProgressionPreferences>(
      PROGRESSION_PREFERENCES_KEY,
      {
        preferredVariations: {},
        decisions: [],
      }
    );
  }

  /**
   * Evaluates a single exercise against user completed workout history.
   */
  public async evaluateExercise(
    exerciseId: string,
    rules: ProgressionRules = this.defaultRules
  ): Promise<ProgressionEvaluation> {
    const exercise = await this.exerciseRepo.getById(exerciseId);
    if (!exercise) {
      throw new ProgressionError('INVALID_EXERCISE', `Exercise with ID "${exerciseId}" not found.`);
    }

    const { progression, regression } = await this.exerciseRepo.getRelatedVariations(exerciseId);
    const workouts = await this.completedRepo.getCompletedWorkouts();
    const exposures = extractExposuresForExercise(workouts, exercise.id, exercise.slug);

    return evaluateProgression(exercise, exposures, { progression, regression }, rules);
  }

  /**
   * Discovers and evaluates all movement ladders in the system.
   */
  public async getAllMovementLadders(
    rules: ProgressionRules = this.defaultRules
  ): Promise<MovementLadder[]> {
    const [workouts, prefs] = await Promise.all([
      this.completedRepo.getCompletedWorkouts(),
      this.getProgressionPreferences(),
    ]);

    return discoverAllMovementLadders(
      this.exerciseRepo,
      workouts,
      prefs.preferredVariations,
      rules
    );
  }

  /**
   * Retrieves the specific movement ladder for an exercise.
   */
  public async getMovementLadder(
    exerciseId: string,
    rules: ProgressionRules = this.defaultRules
  ): Promise<MovementLadder | null> {
    const exercise = await this.exerciseRepo.getById(exerciseId);
    if (!exercise) return null;

    const fullLadder = await buildFullLadder(exercise, this.exerciseRepo);
    if (fullLadder.length === 0) return null;

    const baseId = fullLadder[0].id;
    const [workouts, prefs] = await Promise.all([
      this.completedRepo.getCompletedWorkouts(),
      this.getProgressionPreferences(),
    ]);

    const ladders = await discoverAllMovementLadders(
      this.exerciseRepo,
      workouts,
      prefs.preferredVariations,
      rules
    );

    return ladders.find((l) => l.familyId === baseId) || null;
  }
}

export const defaultProgressionRepository = new DefaultProgressionRepository();
