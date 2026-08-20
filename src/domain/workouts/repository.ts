/**
 * Workout Repository Interface & Local Static Implementation
 * Data access abstraction for workouts and workout generation.
 */

import { Workout, WorkoutRequest } from './types';
import { WorkoutGenerator, defaultWorkoutGenerator } from './generator';

export interface WorkoutRepository {
  getWorkoutById(id: string): Promise<Workout | null>;
  generateWorkout(request: WorkoutRequest): Promise<Workout>;
  getCuratedWorkouts(): Promise<Workout[]>;
}

export class LocalStaticWorkoutRepository implements WorkoutRepository {
  private generatedCache = new Map<string, Workout>();

  constructor(private readonly generator: WorkoutGenerator = defaultWorkoutGenerator) {}

  public async getWorkoutById(id: string): Promise<Workout | null> {
    if (this.generatedCache.has(id)) {
      return this.generatedCache.get(id) || null;
    }

    // Check curated workouts
    const curated = await this.getCuratedWorkouts();
    const found = curated.find((w) => w.id === id);
    if (found) return found;

    return null;
  }

  public async generateWorkout(request: WorkoutRequest): Promise<Workout> {
    const workout = await this.generator.generate(request);
    this.generatedCache.set(workout.id, workout);
    return workout;
  }

  public async getCuratedWorkouts(): Promise<Workout[]> {
    // Generate foundational preset templates
    const presets: WorkoutRequest[] = [
      {
        durationMin: 15,
        experienceLevel: 'BEGINNER',
        equipment: ['NONE'],
        trainingFocus: 'FULL_BODY',
        includeWarmup: true,
        includeCooldown: true,
      },
      {
        durationMin: 10,
        experienceLevel: 'BEGINNER',
        equipment: ['NONE'],
        trainingFocus: 'CORE',
        includeWarmup: true,
        includeCooldown: false,
      },
      {
        durationMin: 12,
        experienceLevel: 'BEGINNER',
        equipment: ['NONE'],
        trainingFocus: 'PUSH',
        includeWarmup: true,
        includeCooldown: true,
      },
      {
        durationMin: 8,
        experienceLevel: 'BEGINNER',
        equipment: ['NONE'],
        trainingFocus: 'MOBILITY',
        includeWarmup: false,
        includeCooldown: false,
      },
    ];

    const results: Workout[] = [];
    for (const req of presets) {
      const workout = await this.generator.generate(req);
      this.generatedCache.set(workout.id, workout);
      results.push(workout);
    }

    return results;
  }
}

export const defaultWorkoutRepository = new LocalStaticWorkoutRepository();
