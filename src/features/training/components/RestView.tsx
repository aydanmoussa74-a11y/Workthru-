import React from 'react';
import { TrainingSegment, DerivedTimingInfo, TrainingState } from '../../../domain/training-state/types';
import { Exercise } from '../../../domain/exercises/types';
import { ExerciseDemonstration } from './ExerciseDemonstration';
import { TrainingTimer } from './TrainingTimer';
import { Wind, ArrowRight, Dumbbell } from '../../../ui/icons';
import { Badge } from '../../../ui/components/Badge';

export interface RestViewProps {
  currentSegment: TrainingSegment;
  nextSegment: TrainingSegment | null;
  timing: DerivedTimingInfo;
  state: TrainingState;
  nextExerciseDetails?: Exercise | null;
}

export const RestView: React.FC<RestViewProps> = ({
  currentSegment,
  nextSegment,
  timing,
  state,
  nextExerciseDetails,
}) => {
  // During rest, display upcoming exercise demonstration preview if next segment exists
  const restVisualSegment = nextSegment || currentSegment;

  return (
    <div id="rest-view-stage" className="space-y-4">
      {/* 1. Recovery Demonstration / Upcoming Movement Stage Frame */}
      <ExerciseDemonstration
        segment={restVisualSegment}
        exerciseDetails={nextExerciseDetails}
        isWorkoutPaused={state === 'PAUSED'}
      />

      {/* 2. Recovery Timer Display */}
      <TrainingTimer
        segment={currentSegment}
        timing={timing}
        state={state}
      />

      {/* 3. Upcoming Movement Callout */}
      {nextSegment ? (
        <div
          id="upcoming-movement-preview"
          className="p-3.5 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-2"
        >
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono uppercase tracking-wider text-blue-400 font-semibold flex items-center gap-1.5">
              <ArrowRight className="w-3.5 h-3.5" />
              Up Next
            </span>
            <Badge variant="outline" className="text-[10px] font-mono">
              {nextSegment.mode === 'timed'
                ? `${nextSegment.targetDurationSec}s Target`
                : `${nextSegment.targetReps} Target Reps`}
            </Badge>
          </div>

          <div className="space-y-0.5">
            <p className="text-sm font-bold text-neutral-100">{nextSegment.name}</p>
            <p className="text-xs text-neutral-400 leading-relaxed">
              {nextSegment.formCueSnippet ||
                nextExerciseDetails?.movementPattern ||
                'Rest your muscles, shake out tension, and breathe rhythmically.'}
            </p>
          </div>

          {nextExerciseDetails?.primaryMuscles && (
            <div className="text-[10px] text-neutral-400 font-mono pt-1 border-t border-neutral-850">
              Target Muscles: {nextExerciseDetails.primaryMuscles.join(', ')}
            </div>
          )}
        </div>
      ) : (
        <div className="p-3 rounded-xl bg-neutral-900/40 border border-neutral-850 text-center text-xs text-neutral-400">
          Final recovery interval before session completion.
        </div>
      )}
    </div>
  );
};
