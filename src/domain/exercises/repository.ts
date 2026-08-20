/**
 * Exercise Repository
 * Abstract repository contract and local static implementation for Exercise domain.
 * Designed to be seamlessly replaced with IndexedDB in Phase 5 without changing the interface.
 */

import { Exercise, ExerciseCategory, ExerciseFilterCriteria } from './types';
import { INITIAL_EXERCISES } from './data/initialExercises';

export interface ExerciseRepository {
  getAll(): Promise<Exercise[]>;
  getById(id: string): Promise<Exercise | null>;
  getBySlug(slug: string): Promise<Exercise | null>;
  getByCategory(category: ExerciseCategory): Promise<Exercise[]>;
  search(query: string): Promise<Exercise[]>;
  filter(criteria: ExerciseFilterCriteria): Promise<Exercise[]>;
  getRelatedVariations(exerciseId: string): Promise<{
    regression: Exercise | null;
    progression: Exercise | null;
  }>;
}

export class LocalStaticExerciseRepository implements ExerciseRepository {
  private exercises: Exercise[];

  constructor(initialData: Exercise[] = INITIAL_EXERCISES) {
    this.exercises = [...initialData];
  }

  async getAll(): Promise<Exercise[]> {
    return [...this.exercises];
  }

  async getById(id: string): Promise<Exercise | null> {
    const match = this.exercises.find((ex) => ex.id === id);
    return match ? { ...match } : null;
  }

  async getBySlug(slug: string): Promise<Exercise | null> {
    const match = this.exercises.find((ex) => ex.slug === slug);
    return match ? { ...match } : null;
  }

  async getByCategory(category: ExerciseCategory): Promise<Exercise[]> {
    return this.exercises.filter((ex) => ex.category === category);
  }

  async search(query: string): Promise<Exercise[]> {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
      return [...this.exercises];
    }

    return this.exercises.filter((ex) => {
      const matchName = ex.name.toLowerCase().includes(trimmed);
      const matchDesc = ex.description.toLowerCase().includes(trimmed);
      const matchCategory = ex.category.toLowerCase().includes(trimmed);
      const matchPattern = ex.movementPattern.toLowerCase().replace(/_/g, ' ').includes(trimmed);
      const matchMuscles = [...ex.primaryMuscles, ...ex.secondaryMuscles].some((m) =>
        m.toLowerCase().includes(trimmed)
      );

      return matchName || matchDesc || matchCategory || matchPattern || matchMuscles;
    });
  }

  async filter(criteria: ExerciseFilterCriteria): Promise<Exercise[]> {
    let results = [...this.exercises];

    // 1. Text Search Filter
    if (criteria.searchQuery && criteria.searchQuery.trim()) {
      const q = criteria.searchQuery.trim().toLowerCase();
      results = results.filter((ex) => {
        const matchName = ex.name.toLowerCase().includes(q);
        const matchDesc = ex.description.toLowerCase().includes(q);
        const matchPattern = ex.movementPattern.toLowerCase().replace(/_/g, ' ').includes(q);
        const matchMuscles = [...ex.primaryMuscles, ...ex.secondaryMuscles].some((m) =>
          m.toLowerCase().includes(q)
        );
        return matchName || matchDesc || matchPattern || matchMuscles;
      });
    }

    // 2. Category Filter
    if (criteria.category && criteria.category !== 'ALL') {
      results = results.filter((ex) => ex.category === criteria.category);
    }

    // 3. Equipment Filter
    if (criteria.equipment && criteria.equipment !== 'ALL') {
      results = results.filter((ex) => ex.equipment === criteria.equipment);
    }

    // 4. Experience Level Filter
    if (criteria.experienceLevel && criteria.experienceLevel !== 'ALL') {
      results = results.filter((ex) => ex.experienceLevel === criteria.experienceLevel);
    }

    // 5. Movement Pattern Filter
    if (criteria.movementPattern && criteria.movementPattern !== 'ALL') {
      results = results.filter((ex) => ex.movementPattern === criteria.movementPattern);
    }

    // 6. Muscle Filter
    if (criteria.muscle && criteria.muscle !== 'ALL') {
      results = results.filter(
        (ex) =>
          ex.primaryMuscles.includes(criteria.muscle as any) ||
          ex.secondaryMuscles.includes(criteria.muscle as any)
      );
    }

    return results;
  }

  async getRelatedVariations(exerciseId: string): Promise<{
    regression: Exercise | null;
    progression: Exercise | null;
  }> {
    const current = await this.getById(exerciseId);
    if (!current) {
      return { regression: null, progression: null };
    }

    const regression = current.regressionId ? await this.getById(current.regressionId) : null;
    const progression = current.progressionId ? await this.getById(current.progressionId) : null;

    return { regression, progression };
  }
}

// Default singleton instance for application usage
export const defaultExerciseRepository = new LocalStaticExerciseRepository();
