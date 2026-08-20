import React from 'react';
import { TrainingSegment, TrainingState } from '../../../domain/training-state/types';
import { Button } from '../../../ui/components/Button';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Plus,
  Minus,
  CheckCircle2,
} from '../../../ui/icons';

export interface TrainingControlsProps {
  segment: TrainingSegment | null;
  state: TrainingState;
  canGoPrevious: boolean;
  onTogglePause: () => void;
  onSkip: () => void;
  onPrevious: () => void;
  onCompleteSegment: () => void;
  onAddTime: (seconds?: number) => void;
  onReduceTime: (seconds?: number) => void;
}

export const TrainingControls: React.FC<TrainingControlsProps> = ({
  segment,
  state,
  canGoPrevious,
  onTogglePause,
  onSkip,
  onPrevious,
  onCompleteSegment,
  onAddTime,
  onReduceTime,
}) => {
  const isPaused = state === 'PAUSED';
  const isTimed = segment?.mode === 'timed';
  const isRepBased = segment?.mode === 'reps';

  return (
    <div id="training-controls-panel" className="space-y-3 pt-1">
      {/* Primary Action Buttons (Rep completion vs Play/Pause) */}
      <div className="flex items-center gap-2">
        {/* Previous Segment Button */}
        <button
          type="button"
          id="player-control-prev"
          aria-label="Previous exercise segment"
          disabled={!canGoPrevious}
          onClick={onPrevious}
          className={`flex items-center justify-center w-12 h-14 rounded-xl border border-neutral-800 transition-colors shrink-0 ${
            canGoPrevious
              ? 'bg-neutral-900 text-neutral-200 hover:bg-neutral-800 active:bg-neutral-700'
              : 'bg-neutral-950 text-neutral-600 opacity-40 cursor-not-allowed'
          }`}
        >
          <SkipBack className="w-5 h-5" />
        </button>

        {/* Rep-Based Complete Button or Timed Play/Pause Main Control */}
        {isRepBased ? (
          <Button
            id="player-control-complete-reps"
            variant="primary"
            size="lg"
            className="flex-1 min-h-[56px] text-base font-bold bg-emerald-500 hover:bg-emerald-400 text-neutral-950 shadow-md"
            onClick={onCompleteSegment}
          >
            <CheckCircle2 className="w-5 h-5 mr-2" />
            Complete Reps
          </Button>
        ) : (
          <Button
            id="player-control-play-pause"
            variant={isPaused ? 'primary' : 'secondary'}
            size="lg"
            className="flex-1 min-h-[56px] text-base font-bold shadow-md flex items-center justify-center gap-2"
            onClick={onTogglePause}
            aria-label={isPaused ? 'Resume workout' : 'Pause workout'}
          >
            {isPaused ? (
              <>
                <Play className="w-5 h-5 fill-current" />
                Resume
              </>
            ) : (
              <>
                <Pause className="w-5 h-5 fill-current" />
                Pause
              </>
            )}
          </Button>
        )}

        {/* Skip Segment Button */}
        <button
          type="button"
          id="player-control-skip"
          aria-label="Skip to next segment"
          onClick={onSkip}
          className="flex items-center justify-center w-12 h-14 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-200 hover:bg-neutral-800 active:bg-neutral-700 transition-colors shrink-0"
        >
          <SkipForward className="w-5 h-5" />
        </button>
      </div>

      {/* Secondary Time Adjustment Controls (for timed exercises or rest intervals) */}
      {isTimed && (
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            id="player-control-reduce-time"
            aria-label="Reduce 10 seconds"
            onClick={() => onReduceTime(10)}
            className="flex items-center justify-center gap-1.5 min-h-[44px] py-2 px-3 rounded-xl bg-neutral-900/80 border border-neutral-800 text-xs font-mono font-medium text-neutral-300 hover:bg-neutral-850 active:bg-neutral-800 transition-colors"
          >
            <Minus className="w-3.5 h-3.5" />
            <span>-10s Time</span>
          </button>
          <button
            type="button"
            id="player-control-add-time"
            aria-label="Add 10 seconds"
            onClick={() => onAddTime(10)}
            className="flex items-center justify-center gap-1.5 min-h-[44px] py-2 px-3 rounded-xl bg-neutral-900/80 border border-neutral-800 text-xs font-mono font-medium text-neutral-300 hover:bg-neutral-850 active:bg-neutral-800 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+10s Time</span>
          </button>
        </div>
      )}
    </div>
  );
};
