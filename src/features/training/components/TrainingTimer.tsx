import React from 'react';
import { TrainingSegment, DerivedTimingInfo, TrainingState } from '../../../domain/training-state/types';
import { Badge } from '../../../ui/components/Badge';

export interface TrainingTimerProps {
  segment: TrainingSegment | null;
  timing: DerivedTimingInfo;
  state: TrainingState;
}

export const TrainingTimer: React.FC<TrainingTimerProps> = ({
  segment,
  timing,
  state,
}) => {
  if (!segment) return null;

  const isTimed = segment.mode === 'timed';
  const isPaused = state === 'PAUSED';

  // Theme color mapping based on segment type
  const colorMap = {
    PREPARATION: {
      text: 'text-amber-400',
      border: 'border-amber-500/30',
      bg: 'bg-amber-500',
      badgeVariant: 'warning' as const,
      label: 'Preparation Countdown',
    },
    EXERCISE: {
      text: 'text-emerald-400',
      border: 'border-emerald-500/30',
      bg: 'bg-emerald-500',
      badgeVariant: 'default' as const,
      label: 'Target Work Interval',
    },
    REST: {
      text: 'text-blue-400',
      border: 'border-blue-500/30',
      bg: 'bg-blue-500',
      badgeVariant: 'secondary' as const,
      label: 'Recovery Interval',
    },
  };

  const currentTheme = colorMap[segment.type] || colorMap.EXERCISE;

  return (
    <div
      id="training-timer-display"
      className="flex flex-col items-center justify-center py-4 px-3 rounded-2xl bg-neutral-900/60 border border-neutral-800 text-center relative overflow-hidden"
    >
      {/* Segment Type / State Badge */}
      <div className="flex items-center gap-2 mb-2">
        <Badge variant={currentTheme.badgeVariant} className="text-[11px] font-mono uppercase tracking-wider">
          {segment.type === 'PREPARATION'
            ? 'Get Ready'
            : segment.type === 'REST'
            ? 'Rest & Recover'
            : 'Active Exercise'}
        </Badge>
        {isPaused && (
          <span className="px-2 py-0.5 text-[10px] font-mono font-bold tracking-wider rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
            PAUSED
          </span>
        )}
      </div>

      {/* Main Counter Display */}
      {isTimed ? (
        <div className="flex flex-col items-center justify-center my-1">
          <div
            id="timer-clock-digits"
            aria-live="off"
            className={`font-mono text-5xl sm:text-6xl font-black tracking-tight ${
              isPaused ? 'text-neutral-400' : currentTheme.text
            } transition-colors select-none`}
          >
            {timing.formattedRemaining}
          </div>
          <span className="text-[11px] text-neutral-400 font-mono mt-1">
            {currentTheme.label} • {timing.elapsedSegmentSec}s completed
          </span>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center my-1">
          <div
            id="reps-target-digits"
            className="font-mono text-5xl sm:text-6xl font-black tracking-tight text-emerald-400 select-none"
          >
            {segment.targetReps ?? '—'}
            <span className="text-xl sm:text-2xl font-bold ml-1 text-emerald-500/80 uppercase">
              Reps
            </span>
          </div>
          <span className="text-[11px] text-neutral-400 font-mono mt-1">
            Repetition-based • Tap Complete when done
          </span>
        </div>
      )}

      {/* Progress Bar (for timed segments) */}
      {isTimed && (
        <div
          id="timer-progress-track"
          className="w-full h-1.5 bg-neutral-800 rounded-full mt-3 overflow-hidden"
          role="progressbar"
          aria-valuenow={Math.round(timing.progressPercentage * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            id="timer-progress-fill"
            className={`h-full transition-all duration-100 ease-linear rounded-full ${currentTheme.bg}`}
            style={{ width: `${Math.min(100, Math.max(0, timing.progressPercentage * 100))}%` }}
          />
        </div>
      )}
    </div>
  );
};
