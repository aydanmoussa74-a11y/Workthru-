import React from 'react';
import { TrainingSegment } from '../../../domain/training-state/types';
import { Exercise } from '../../../domain/exercises/types';
import { DemonstrationPanel } from './DemonstrationPanel';
import { Activity, Dumbbell, Sparkles, Layers } from '../../../ui/icons';

export interface ExerciseDemonstrationProps {
  segment: TrainingSegment;
  exerciseDetails?: Exercise | null;
  isWorkoutPaused?: boolean;
}

/**
 * ExerciseDemonstration
 * Phase 7 Demonstration Engine Component.
 * Integrates DemonstrationPanel with multi-source carousel, fallback handling,
 * and vector kinematics for active and transition training states.
 */
export const ExerciseDemonstration: React.FC<ExerciseDemonstrationProps> = ({
  segment,
  exerciseDetails,
  isWorkoutPaused = false,
}) => {
  const isPreparation = segment.type === 'PREPARATION';
  const isRest = segment.type === 'REST';
  const exerciseId = segment.exerciseId || exerciseDetails?.id || '';

  if (exerciseId) {
    return (
      <div id="exercise-demonstration-wrapper" className="w-full">
        <DemonstrationPanel
          exerciseId={exerciseId}
          exerciseName={segment.name}
          segmentType={segment.type}
          isWorkoutPaused={isWorkoutPaused}
        />
      </div>
    );
  }

  // Fallback for non-exercise generic intervals (e.g. general recovery)
  return (
    <div
      id="exercise-demonstration-stage"
      className="w-full aspect-video min-h-[180px] sm:min-h-[220px] rounded-2xl bg-neutral-950 border border-neutral-800 flex flex-col justify-between p-4 relative overflow-hidden select-none"
    >
      <div className="absolute inset-0 bg-radial from-neutral-900/40 to-transparent pointer-events-none" />

      {/* Top Bar */}
      <div className="flex items-center justify-between z-10">
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-neutral-900/90 border border-neutral-800 text-[10px] font-mono text-neutral-300">
          <Activity className="w-3 h-3 text-emerald-400" />
          <span>{segment.category || (isRest ? 'RECOVERY' : isPreparation ? 'SETUP' : 'BODYWEIGHT')}</span>
        </div>

        {exerciseDetails && (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-neutral-900/90 border border-neutral-800 text-[10px] font-mono text-neutral-400">
            <Layers className="w-3 h-3 text-neutral-400" />
            <span>{exerciseDetails.experienceLevel}</span>
          </div>
        )}
      </div>

      {/* Center Stage */}
      <div className="flex flex-col items-center justify-center text-center my-auto z-10 space-y-2">
        <div className="w-14 h-14 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center shadow-inner">
          {isRest ? (
            <Activity className="w-7 h-7 text-blue-400" />
          ) : isPreparation ? (
            <Sparkles className="w-7 h-7 text-amber-400" />
          ) : (
            <Dumbbell className="w-7 h-7 text-emerald-400" />
          )}
        </div>

        <div className="space-y-0.5">
          <h3 className="text-base sm:text-lg font-bold text-neutral-100 tracking-tight">
            {segment.name}
          </h3>
          <p className="text-xs text-neutral-400 max-w-xs line-clamp-2">
            {segment.formCueSnippet || exerciseDetails?.movementPattern || 'Focus on controlled breathing and posture.'}
          </p>
        </div>
      </div>

      {/* Bottom Sub-meta */}
      <div className="flex items-center justify-between text-[10px] text-neutral-400 font-mono z-10 pt-1 border-t border-neutral-850">
        <span>{isRest ? 'Recovery interval' : 'Preparation interval'}</span>
        <span className="text-neutral-500">Demonstration System v1</span>
      </div>
    </div>
  );
};

