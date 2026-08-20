/**
 * Deterministic Workout Generator
 * Generates structured, balanced, and explainable workout plans based on explicit user constraints.
 * Operates purely on ExerciseRepository without AI or remote dependencies.
 */

import { Exercise, EquipmentRequirement, ExperienceLevel, ExerciseCategory } from '../exercises/types';
import { ExerciseRepository, defaultExerciseRepository } from '../exercises/repository';
import {
  Workout,
  WorkoutRequest,
  WorkoutExercise,
  RestSegment,
  TrainingFocus,
  WorkoutConstraints,
} from './types';
import { WorkoutGenerationError } from './errors';
import { WorkoutValidator } from './validator';

export interface GeneratorConfig {
  defaultWarmupSec: number;
  defaultCooldownSec: number;
  minExerciseDurationSec: number;
  defaultWorkDurationSec: {
    BEGINNER: number;
    INTERMEDIATE: number;
    ADVANCED: number;
  };
  defaultRestDurationSec: {
    BEGINNER: number;
    INTERMEDIATE: number;
    ADVANCED: number;
  };
  defaultReps: {
    BEGINNER: number;
    INTERMEDIATE: number;
    ADVANCED: number;
  };
}

const DEFAULT_CONFIG: GeneratorConfig = {
  defaultWarmupSec: 120, // 2 minutes
  defaultCooldownSec: 90, // 1.5 minutes
  minExerciseDurationSec: 20,
  defaultWorkDurationSec: {
    BEGINNER: 30,
    INTERMEDIATE: 40,
    ADVANCED: 45,
  },
  defaultRestDurationSec: {
    BEGINNER: 25,
    INTERMEDIATE: 20,
    ADVANCED: 15,
  },
  defaultReps: {
    BEGINNER: 10,
    INTERMEDIATE: 12,
    ADVANCED: 15,
  },
};

export class WorkoutGenerator {
  private readonly validator: WorkoutValidator;

  constructor(
    private readonly exerciseRepo: ExerciseRepository = defaultExerciseRepository,
    private readonly config: GeneratorConfig = DEFAULT_CONFIG
  ) {
    this.validator = new WorkoutValidator(exerciseRepo);
  }

  /**
   * Deterministically generates a structured workout matching constraints.
   */
  public async generate(request: WorkoutRequest): Promise<Workout> {
    // 1. Validate Request Inputs
    if (!request.durationMin || request.durationMin < 4 || request.durationMin > 120) {
      throw new WorkoutGenerationError(
        'INVALID_DURATION',
        `Workout duration must be between 4 and 120 minutes. Requested: ${request.durationMin} minutes.`
      );
    }

    const experienceLevel: ExperienceLevel = request.experienceLevel || 'BEGINNER';
    const equipment: EquipmentRequirement[] = request.equipment && request.equipment.length > 0
      ? request.equipment
      : ['NONE'];
    const focus: TrainingFocus = request.trainingFocus || 'FULL_BODY';
    const includeWarmup = request.includeWarmup !== undefined ? request.includeWarmup : request.durationMin >= 8;
    const includeCooldown = request.includeCooldown !== undefined ? request.includeCooldown : request.durationMin >= 12;

    const constraints: WorkoutConstraints = {
      durationMin: request.durationMin,
      experienceLevel,
      availableEquipment: equipment,
      focus,
      includeWarmup,
      includeCooldown,
      exerciseLimit: request.exerciseLimit,
    };

    // 2. Fetch and Filter Eligible Exercises
    const allExercises = await this.exerciseRepo.getAll();
    const eligibleExercises = this.filterEligibleExercises(allExercises, constraints);

    if (eligibleExercises.length === 0) {
      throw new WorkoutGenerationError(
        'INSUFFICIENT_EXERCISES',
        `No eligible exercises found for focus "${focus}" with equipment [${equipment.join(', ')}].`
      );
    }

    // 3. Compute Time Budgets
    const totalTargetSec = constraints.durationMin * 60;
    let warmupBudgetSec = 0;
    let cooldownBudgetSec = 0;

    if (constraints.includeWarmup && totalTargetSec >= 480) {
      // 10-15% of total, capped at 180s
      warmupBudgetSec = Math.min(180, Math.max(90, Math.floor(totalTargetSec * 0.12)));
    }

    if (constraints.includeCooldown && totalTargetSec >= 720) {
      // 8-12% of total, capped at 120s
      cooldownBudgetSec = Math.min(120, Math.max(60, Math.floor(totalTargetSec * 0.08)));
    }

    const mainBudgetSec = totalTargetSec - warmupBudgetSec - cooldownBudgetSec;

    // 4. Construct Warm-up Section
    const warmupExercises: WorkoutExercise[] = [];
    if (warmupBudgetSec > 0) {
      this.buildWarmupSection(warmupExercises, eligibleExercises, warmupBudgetSec, constraints);
    }

    // 5. Construct Cooldown Section
    const cooldownExercises: WorkoutExercise[] = [];
    if (cooldownBudgetSec > 0) {
      this.buildCooldownSection(cooldownExercises, eligibleExercises, cooldownBudgetSec, constraints);
    }

    // 6. Construct Main Section
    const mainExercises: WorkoutExercise[] = [];
    this.buildMainSection(mainExercises, eligibleExercises, mainBudgetSec, constraints);

    if (mainExercises.length === 0) {
      throw new WorkoutGenerationError(
        'INSUFFICIENT_EXERCISES',
        `Could not construct main workout exercises for focus "${focus}".`
      );
    }

    // 7. Assemble Unified Exercise Sequence and Renumber Orders
    const unifiedExercises: WorkoutExercise[] = [];
    const restSegments: RestSegment[] = [];
    let currentOrder = 1;
    let totalWorkSec = 0;
    let totalRestSec = 0;

    const sections = [
      { type: 'WARM_UP' as const, items: warmupExercises },
      { type: 'MAIN' as const, items: mainExercises },
      { type: 'COOLDOWN' as const, items: cooldownExercises },
    ];

    for (let sIdx = 0; sIdx < sections.length; sIdx++) {
      const section = sections[sIdx];
      for (let i = 0; i < section.items.length; i++) {
        const item = section.items[i];
        const isVeryLastExercise = sIdx === sections.length - 1 && i === section.items.length - 1;

        // No rest on the very last exercise of the whole workout
        const restAfter = isVeryLastExercise ? 0 : item.restAfterSec;

        const assembledItem: WorkoutExercise = {
          ...item,
          order: currentOrder++,
          restAfterSec: restAfter,
        };

        unifiedExercises.push(assembledItem);
        totalWorkSec += assembledItem.estimatedDurationSec;
        totalRestSec += restAfter;

        if (restAfter > 0) {
          const isSectionEnd = i === section.items.length - 1;
          restSegments.push({
            id: `rest-${assembledItem.id}`,
            order: currentOrder++,
            durationSec: restAfter,
            reason: isSectionEnd ? 'SECTION_TRANSITION' : 'INTERVAL_REST',
            afterExerciseId: assembledItem.id,
          });
        }
      }
    }

    const estimatedDurationSec = totalWorkSec + totalRestSec;

    // 8. Generate Metadata
    const workoutId = `wk-${focus.toLowerCase()}-${Date.now().toString(36)}-${Math.abs(this.hashString(JSON.stringify(request))).toString(36)}`;
    const { title, subtitle, description } = this.generateTitles(focus, constraints.durationMin, experienceLevel);

    const workout: Workout = {
      id: workoutId,
      title,
      subtitle,
      description,
      focus,
      experienceLevel,
      equipment,
      requestedDurationMin: constraints.durationMin,
      estimatedDurationSec,
      warmupExercises: unifiedExercises.filter((e) => e.section === 'WARM_UP'),
      mainExercises: unifiedExercises.filter((e) => e.section === 'MAIN'),
      cooldownExercises: unifiedExercises.filter((e) => e.section === 'COOLDOWN'),
      allExercises: unifiedExercises,
      restSegments,
      totalWorkSec,
      totalRestSec,
      createdAt: new Date().toISOString(),
    };

    // 9. Validate Output Workout
    const validation = await this.validator.validate(workout);
    if (!validation.isValid) {
      throw new WorkoutGenerationError(
        'WORKOUT_VALIDATION_FAILED',
        `Generated workout failed validation: ${validation.errors.join('; ')}`,
        { errors: validation.errors }
      );
    }

    return workout;
  }

  // --------------------------------------------------------------------------
  // Internal Deterministic Builder Methods
  // --------------------------------------------------------------------------

  private filterEligibleExercises(all: Exercise[], constraints: WorkoutConstraints): Exercise[] {
    const allowedEquipment = new Set(constraints.availableEquipment);

    return all.filter((ex) => {
      // Equipment Check: must be NONE or present in allowedEquipment
      if (ex.equipment !== 'NONE' && !allowedEquipment.has(ex.equipment)) {
        return false;
      }
      return true;
    });
  }

  private buildWarmupSection(
    out: WorkoutExercise[],
    pool: Exercise[],
    budgetSec: number,
    constraints: WorkoutConstraints
  ): void {
    const warmupCandidates = pool.filter(
      (e) => e.category === 'MOBILITY' || e.category === 'WARM_UP' || (e.category === 'FULL_BODY' && e.movementPattern === 'LOCOMOTION')
    );

    if (warmupCandidates.length === 0) return;

    // Sort deterministically
    warmupCandidates.sort((a, b) => a.name.localeCompare(b.name));

    let accumulatedSec = 0;
    const workDuration = 30;
    const restDuration = 10;
    const itemCost = workDuration + restDuration;

    for (let i = 0; i < warmupCandidates.length; i++) {
      if (accumulatedSec + itemCost > budgetSec) break;
      const ex = warmupCandidates[i];

      out.push({
        id: `warmup-${i + 1}-${ex.slug}`,
        exerciseId: ex.id,
        name: ex.name,
        slug: ex.slug,
        category: ex.category,
        order: 0, // Assigned sequentially later
        section: 'WARM_UP',
        mode: 'timed',
        targetDurationSec: workDuration,
        estimatedDurationSec: workDuration,
        restAfterSec: restDuration,
        formCueSnippet: ex.instructions.formCues[0] || 'Focus on smooth movement.',
      });

      accumulatedSec += itemCost;
      if (out.length >= 3) break; // Maximum 3 warmups
    }
  }

  private buildCooldownSection(
    out: WorkoutExercise[],
    pool: Exercise[],
    budgetSec: number,
    _constraints: WorkoutConstraints
  ): void {
    const cooldownCandidates = pool.filter(
      (e) => e.category === 'MOBILITY' || e.category === 'COOL_DOWN'
    );

    if (cooldownCandidates.length === 0) return;

    // Sort deterministically in reverse for variety from warmup
    cooldownCandidates.sort((a, b) => b.name.localeCompare(a.name));

    let accumulatedSec = 0;
    const workDuration = 30;
    const restDuration = 10;
    const itemCost = workDuration + restDuration;

    for (let i = 0; i < cooldownCandidates.length; i++) {
      if (accumulatedSec + itemCost > budgetSec) break;
      const ex = cooldownCandidates[i];

      out.push({
        id: `cooldown-${i + 1}-${ex.slug}`,
        exerciseId: ex.id,
        name: ex.name,
        slug: ex.slug,
        category: ex.category,
        order: 0,
        section: 'COOLDOWN',
        mode: 'timed',
        targetDurationSec: workDuration,
        estimatedDurationSec: workDuration,
        restAfterSec: restDuration,
        formCueSnippet: ex.instructions.formCues[0] || 'Slow, deep breathing.',
      });

      accumulatedSec += itemCost;
      if (out.length >= 2) break; // Maximum 2 cooldowns
    }
  }

  private buildMainSection(
    out: WorkoutExercise[],
    pool: Exercise[],
    budgetSec: number,
    constraints: WorkoutConstraints
  ): void {
    const mainCandidates = this.selectMainCandidates(pool, constraints.focus, constraints.experienceLevel);

    if (mainCandidates.length === 0) return;

    const workDuration = this.config.defaultWorkDurationSec[constraints.experienceLevel];
    const restDuration = this.config.defaultRestDurationSec[constraints.experienceLevel];
    const reps = this.config.defaultReps[constraints.experienceLevel];

    const exerciseUnitCost = workDuration + restDuration;
    const maxExercises = Math.max(1, Math.floor(budgetSec / exerciseUnitCost));

    let accumulatedSec = 0;
    let exerciseIndex = 0;
    let round = 1;

    while (accumulatedSec + exerciseUnitCost <= budgetSec && out.length < (constraints.exerciseLimit || 16)) {
      const canonicalEx = mainCandidates[exerciseIndex % mainCandidates.length];
      const isTimed = this.isNaturallyTimedExercise(canonicalEx);

      const estimatedTime = isTimed ? workDuration : reps * 3; // ~3 sec per rep
      const itemCost = estimatedTime + restDuration;

      if (accumulatedSec + itemCost > budgetSec) {
        break;
      }

      out.push({
        id: `main-r${round}-${exerciseIndex + 1}-${canonicalEx.slug}`,
        exerciseId: canonicalEx.id,
        name: canonicalEx.name,
        slug: canonicalEx.slug,
        category: canonicalEx.category,
        order: 0,
        section: 'MAIN',
        mode: isTimed ? 'timed' : 'reps',
        targetDurationSec: isTimed ? workDuration : undefined,
        targetReps: !isTimed ? reps : undefined,
        estimatedDurationSec: estimatedTime,
        restAfterSec: restDuration,
        formCueSnippet: canonicalEx.instructions.formCues[0] || 'Maintain posture and deliberate pacing.',
      });

      accumulatedSec += itemCost;
      exerciseIndex++;
      if (exerciseIndex % mainCandidates.length === 0) {
        round++;
      }
    }
  }

  private selectMainCandidates(pool: Exercise[], focus: TrainingFocus, level: ExperienceLevel): Exercise[] {
    let focusMatches: Exercise[] = [];

    switch (focus) {
      case 'PUSH':
      case 'UPPER_BODY':
        focusMatches = pool.filter((e) => e.category === 'PUSH');
        break;
      case 'LEGS':
      case 'LOWER_BODY':
        focusMatches = pool.filter((e) => e.category === 'LEGS');
        break;
      case 'CORE':
        focusMatches = pool.filter((e) => e.category === 'CORE');
        break;
      case 'MOBILITY':
        focusMatches = pool.filter((e) => e.category === 'MOBILITY');
        break;
      case 'CARDIO':
        focusMatches = pool.filter((e) => e.category === 'CARDIO' || e.category === 'FULL_BODY');
        break;
      case 'FULL_BODY':
      default: {
        // Balanced full body composition
        const pushes = pool.filter((e) => e.category === 'PUSH');
        const legs = pool.filter((e) => e.category === 'LEGS');
        const core = pool.filter((e) => e.category === 'CORE');
        const full = pool.filter((e) => e.category === 'FULL_BODY');

        // Pick matching variation for level
        focusMatches = [
          ...this.filterForLevel(pushes, level).slice(0, 2),
          ...this.filterForLevel(legs, level).slice(0, 2),
          ...this.filterForLevel(core, level).slice(0, 2),
          ...this.filterForLevel(full, level).slice(0, 1),
        ];
        break;
      }
    }

    if (focus !== 'FULL_BODY') {
      focusMatches = this.filterForLevel(focusMatches, level);
    }

    // Deterministic sort by slug
    return focusMatches.sort((a, b) => a.slug.localeCompare(b.slug));
  }

  private filterForLevel(exercises: Exercise[], level: ExperienceLevel): Exercise[] {
    if (exercises.length === 0) return [];

    if (level === 'BEGINNER') {
      const beginners = exercises.filter((e) => e.experienceLevel === 'BEGINNER');
      return beginners.length > 0 ? beginners : exercises;
    }

    if (level === 'INTERMEDIATE') {
      const intermediates = exercises.filter((e) => e.experienceLevel === 'INTERMEDIATE' || e.experienceLevel === 'BEGINNER');
      return intermediates.length > 0 ? intermediates : exercises;
    }

    return exercises;
  }

  private isNaturallyTimedExercise(ex: Exercise): boolean {
    const timedPatterns = ['ANTI_EXTENSION', 'ANTI_ROTATION', 'LOCOMOTION', 'MOBILITY'];
    return (
      timedPatterns.includes(ex.movementPattern) ||
      ex.category === 'MOBILITY' ||
      ex.slug.includes('plank') ||
      ex.slug.includes('march') ||
      ex.slug.includes('jack')
    );
  }

  private generateTitles(focus: TrainingFocus, durationMin: number, level: ExperienceLevel): {
    title: string;
    subtitle: string;
    description: string;
  } {
    const levelName = level === 'BEGINNER' ? 'Foundation' : level === 'INTERMEDIATE' ? 'Progression' : 'Performance';
    const focusNames: Record<TrainingFocus, string> = {
      FULL_BODY: 'Full-Body Training',
      UPPER_BODY: 'Upper Body Press',
      PUSH: 'Push & Press Focus',
      LOWER_BODY: 'Lower Body Strength',
      LEGS: 'Leg & Glute Conditioning',
      CORE: 'Core & Pillar Stability',
      MOBILITY: 'Joint Mobility & Flow',
      CARDIO: 'Aerobic Rhythm & Cardio',
    };

    const title = `${durationMin} Min ${focusNames[focus] || 'Training'}`;
    const subtitle = `${levelName} • Calisthenics Routine`;
    const description = `A structured ${durationMin}-minute session targeting ${focus.toLowerCase().replace(/_/g, ' ')} movement patterns with guided work-to-rest intervals.`;

    return { title, subtitle, description };
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return hash;
  }
}

export const defaultWorkoutGenerator = new WorkoutGenerator();
