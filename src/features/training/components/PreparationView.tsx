import React from 'react';
import { TrainingSegment, DerivedTimingInfo, TrainingState } from '../../../domain/training-state/types';
import { Exercise } from '../../../domain/exercises/types';
import { ExerciseDemonstration } from './ExerciseDemonstration';
import { TrainingTimer } from './TrainingTimer';
import { Sparkles, ArrowRight } from '../../../ui/icons';
import { Badge } from '../../../ui/components/Badge';

export interface PreparationViewProps {
  currentSegment: TrainingSegment;
  nextSegment: TrainingSegment | null;
  timing: DerivedTimingInfo;
  state: TrainingState;
  nextExerciseDetails?: Exercise | null;
}

export const PreparationView: React.FC<PreparationViewProps> = ({
  currentSegment,
  nextSegment,
  timing,
  state,
  nextExerciseDetails,
}) => {
  return (
    <div id="preparation-view-stage" className="space-y-4">
      {/* 1. Dedicated Prep Demonstration/Visual Frame */}
      <ExerciseDemonstration
        segment={currentSegment}
        exerciseDetails={null}
      />

      {/* 2. Preparation Timer Display */}
      <TrainingTimer
        segment={currentSegment}
        timing={timing}
        state={state}
      />

      {/* 3. Upcoming First Exercise Card */}
      {nextSegment && (
        <div
          id="upcoming-first-exercise-preview"
          className="p-3.5 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-1.5"
        >
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono uppercase tracking-wider text-amber-400 font-semibold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Starting With
            </span>
            <Badge variant="outline" className="text-[10px] font-mono">
              {nextSegment.mode === 'timed' ? `${nextSegment.targetDurationSec}s` : `${nextSegment.targetReps} Reps`}
            </Badge>
          </div>
          <p className="text-sm font-bold text-neutral-100">{nextSegment.name}</p>
          <p className="text-xs text-neutral-400 leading-relaxed">
            {nextSegment.formCueSnippet || nextExerciseDetails?.description || 'Prepare your posture, check your floor space, and start on the countdown.'}
          </p>
        </div>
      )}
    </div>
  );
};
