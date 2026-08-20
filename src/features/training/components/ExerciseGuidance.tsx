import React, { useState } from 'react';
import { Exercise } from '../../../domain/exercises/types';
import { TrainingSegment } from '../../../domain/training-state/types';
import { Wind, AlertCircle, CheckCircle2, ChevronRight, HelpCircle } from '../../../ui/icons';

export interface ExerciseGuidanceProps {
  segment: TrainingSegment;
  exerciseDetails?: Exercise | null;
}

export const ExerciseGuidance: React.FC<ExerciseGuidanceProps> = ({
  segment,
  exerciseDetails,
}) => {
  const [showExtended, setShowExtended] = useState(false);

  if (segment.type === 'REST' || segment.type === 'PREPARATION') {
    return (
      <div id="guidance-transition-tips" className="p-3 rounded-xl bg-neutral-900/40 border border-neutral-850 text-xs">
        <div className="flex items-start gap-2.5">
          <Wind className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-neutral-200">
              {segment.type === 'REST' ? 'Recovery & Breathing' : 'Setup & Alignment'}
            </p>
            <p className="text-neutral-400 text-[11px] mt-0.5 leading-relaxed">
              {segment.formCueSnippet || 'Inhale deeply through your nose and exhale smoothly to reset your heart rate.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Key form cue
  const primaryCue = exerciseDetails?.cues && exerciseDetails.cues.length > 0
    ? exerciseDetails.cues[0]
    : segment.formCueSnippet || 'Maintain a solid neutral spine and controlled tempo throughout.';

  // Breathing guidance
  const breathingCue = exerciseDetails?.breathing || 'Exhale on exertion, inhale on the eccentric return phase.';

  // Common mistake warning
  const commonMistake = exerciseDetails?.commonMistakes && exerciseDetails.commonMistakes.length > 0
    ? exerciseDetails.commonMistakes[0]
    : null;

  // Setup cue
  const setupCue = exerciseDetails?.setupCues && exerciseDetails.setupCues.length > 0
    ? exerciseDetails.setupCues[0]
    : null;

  return (
    <div id="exercise-guidance-card" className="p-3.5 rounded-xl bg-neutral-900/50 border border-neutral-850 space-y-2.5">
      {/* 1. Primary Form Cue */}
      <div className="flex items-start gap-2.5">
        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="text-xs font-semibold text-neutral-200">Key Form Cue</p>
          <p className="text-[11px] text-neutral-300 leading-relaxed">{primaryCue}</p>
        </div>
      </div>

      {/* 2. Breathing Rhythm */}
      <div className="flex items-start gap-2.5 pt-1.5 border-t border-neutral-850/70">
        <Wind className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="text-xs font-semibold text-neutral-200">Breathing Pattern</p>
          <p className="text-[11px] text-neutral-400 leading-relaxed">{breathingCue}</p>
        </div>
      </div>

      {/* 3. Optional Common Mistake / Setup Toggle */}
      {(commonMistake || setupCue) && (
        <div className="pt-1">
          <button
            type="button"
            id="toggle-extended-cues-btn"
            onClick={() => setShowExtended(!showExtended)}
            className="text-[11px] text-neutral-400 hover:text-neutral-200 font-medium flex items-center gap-1 min-h-[32px] select-none"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>{showExtended ? 'Hide detailed cues' : 'Show common mistakes & setup'}</span>
          </button>

          {showExtended && (
            <div className="mt-2 space-y-2 pt-2 border-t border-neutral-850/60 text-[11px]">
              {setupCue && (
                <div className="space-y-0.5">
                  <span className="font-semibold text-neutral-300">Setup Alignment:</span>
                  <p className="text-neutral-400">{setupCue}</p>
                </div>
              )}
              {commonMistake && (
                <div className="flex items-start gap-2 text-amber-300/90 bg-amber-950/20 p-2 rounded border border-amber-900/30">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-amber-200">Watch Out: </span>
                    <span className="text-amber-300/90">{commonMistake}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
