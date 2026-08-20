import React from 'react';
import { Exercise } from '../../../domain/exercises/types';
import { Card } from '../../../ui/components/Card';
import { Badge } from '../../../ui/components/Badge';
import { ChevronRight, Dumbbell } from '../../../ui/icons';

interface ExerciseCardProps {
  exercise: Exercise;
  onSelect: (exercise: Exercise) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  PUSH: 'Push',
  PULL: 'Pull',
  LEGS: 'Legs',
  CORE: 'Core',
  FULL_BODY: 'Full Body',
  MOBILITY: 'Mobility',
  WARM_UP: 'Warm Up',
  COOL_DOWN: 'Cool Down',
  CARDIO: 'Cardio',
};

const EQUIPMENT_LABELS: Record<string, string> = {
  NONE: 'No Equipment',
  WALL: 'Wall',
  CHAIR: 'Chair',
  TABLE: 'Table',
  RESISTANCE_BAND: 'Band',
  DUMBBELL: 'Dumbbell',
  PULL_UP_BAR: 'Bar',
  OTHER: 'Other',
};

export const ExerciseCard: React.FC<ExerciseCardProps> = ({ exercise, onSelect }) => {
  return (
    <Card
      id={`exercise-card-${exercise.id}`}
      variant="interactive"
      padding="sm"
      onClick={() => onSelect(exercise)}
      className="group relative flex flex-col gap-2.5 bg-neutral-900/70 hover:bg-neutral-900 transition-colors border-neutral-800"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="outline" className="text-[10px] py-0 px-2 uppercase font-mono text-neutral-300">
            {CATEGORY_LABELS[exercise.category] || exercise.category}
          </Badge>
          <span className="text-[11px] text-neutral-400 font-mono">
            {exercise.experienceLevel === 'BEGINNER' ? 'L1' : exercise.experienceLevel === 'INTERMEDIATE' ? 'L2' : 'L3'}
          </span>
        </div>

        <div className="flex items-center gap-1 text-[11px] text-neutral-400 font-mono">
          <Dumbbell className="w-3 h-3 text-neutral-400" />
          <span>{EQUIPMENT_LABELS[exercise.equipment] || exercise.equipment}</span>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold tracking-tight text-neutral-100 group-hover:text-white transition-colors">
          {exercise.name}
        </h4>
        <p className="text-xs text-neutral-400 line-clamp-2 mt-0.5 leading-relaxed">
          {exercise.description}
        </p>
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-neutral-850/60 mt-0.5">
        <div className="flex items-center gap-1.5 overflow-hidden">
          {exercise.primaryMuscles.slice(0, 2).map((m) => (
            <span
              key={m}
              className="text-[10px] text-neutral-400 bg-neutral-950 px-1.5 py-0.5 rounded border border-neutral-850 capitalize whitespace-nowrap"
            >
              {m.replace('_', ' ')}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-1 text-xs text-neutral-400 group-hover:text-neutral-200 transition-colors">
          <span className="text-[11px]">View cues</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </Card>
  );
};
