/**
 * Progression Domain Types
 * Defines progression rules, mastery tracking, and volume adaptations.
 */

export interface ExerciseMastery {
  exerciseId: string;
  level: number;
  totalCompletions: number;
  lastPracticedTimestamp?: number;
}

export interface ProgressionState {
  userId: string;
  totalWorkoutsCompleted: number;
  activeStreakDays: number;
  lastWorkoutTimestamp?: number;
  masteryList: ExerciseMastery[];
}
