import React from 'react';
import { TrainingSegment } from '../../../domain/training-state/types';
import { Exercise } from '../../../domain/exercises/types';
import { Activity, Dumbbell, Sparkles, Layers, ShieldCheck } from '../../../ui/icons';

export interface ExerciseDemonstrationProps {
  segment: TrainingSegment;
  exerciseDetails?: Exercise | null;
}

/**
 * ExerciseDemonstration
 * Architectural placeholder for Phase 7 (3D Trainer / Animated Demonstrations).
 * Currently displays domain-grounded visual movement metadata, anatomical target cues,
 * and category iconography in a focused frame designed for seamless Phase 7 swap.
 */
export const ExerciseDemonstration: React.FC<ExerciseDemonstrationProps> = ({
  segment,
  exerciseDetails,
}) => {
  const isPreparation = segment.type === 'PREPARATION';
  const isRest = segment.type === 'REST';

  return (
    <div
      id="exercise-demonstration-stage"
      className="w-full aspect-video min-h-[180px] sm:min-h-[220px] rounded-2xl bg-neutral-900/80 border border-neutral-800 flex flex-col justify-between p-4 relative overflow-hidden select-none"
    >
      {/* Background Graphic Pattern */}
      <div className="absolute inset-0 bg-radial from-neutral-800/30 to-transparent pointer-events-none" />
      <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-neutral-800/20 rounded-full blur-2xl pointer-events-none" />

      {/* Top Bar: Movement Category & Equipment */}
      <div className="flex items-center justify-between z-10">
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-neutral-950/70 border border-neutral-800/80 text-[10px] font-mono text-neutral-300">
          <Activity className="w-3 h-3 text-emerald-400" />
          <span>{segment.category || (isRest ? 'RECOVERY' : isPreparation ? 'SETUP' : 'BODYWEIGHT')}</span>
        </div>

        {exerciseDetails && (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-neutral-950/70 border border-neutral-800/80 text-[10px] font-mono text-neutral-400">
            <Layers className="w-3 h-3 text-neutral-400" />
            <span>{exerciseDetails.level}</span>
          </div>
        )}
      </div>

      {/* Center Stage: Visual Focal Movement Representation */}
      <div className="flex flex-col items-center justify-center text-center my-auto z-10 space-y-2">
        <div className="w-14 h-14 rounded-2xl bg-neutral-950/80 border border-neutral-800 flex items-center justify-center shadow-inner">
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
            {segment.formCueSnippet || exerciseDetails?.movementPattern || 'Perform with controlled tempo and stable posture.'}
          </p>
        </div>
      </div>

      {/* Bottom Sub-meta: Target Muscle Groups */}
      <div className="flex items-center justify-between text-[10px] text-neutral-400 font-mono z-10 pt-1 border-t border-neutral-850/60">
        <span>
          {exerciseDetails?.primaryMuscles && exerciseDetails.primaryMuscles.length > 0
            ? `Target: ${exerciseDetails.primaryMuscles.join(', ')}`
            : isRest
            ? 'Breathing & active mobility recovery'
            : isPreparation
            ? 'Prepare posture & foot placement'
            : 'Compound calisthenic movement'}
        </span>
        <span className="text-neutral-500">Trainer Stage v1</span>
      </div>
    </div>
  );
};
