import React from 'react';
import { TrainingSession, TrainingSegment } from '../../../domain/training-state/types';
import { Badge } from '../../../ui/components/Badge';

export interface TrainingProgressProps {
  session: TrainingSession;
  currentSegment: TrainingSegment | null;
}

export const TrainingProgress: React.FC<TrainingProgressProps> = ({
  session,
  currentSegment,
}) => {
  const totalSegments = session.segments.length;
  const currentIndex = session.currentSegmentIndex;
  const progressRatio = totalSegments > 0 ? (currentIndex + 1) / totalSegments : 0;
  const progressPercent = Math.min(100, Math.max(0, Math.round(progressRatio * 100)));

  // Section styling
  const sectionLabel =
    currentSegment?.section === 'WARM_UP'
      ? 'Warm-Up Phase'
      : currentSegment?.section === 'COOLDOWN'
      ? 'Cooldown Phase'
      : 'Main Work Circuit';

  const sectionColor =
    currentSegment?.section === 'WARM_UP'
      ? 'bg-amber-400/80 text-amber-300'
      : currentSegment?.section === 'COOLDOWN'
      ? 'bg-blue-400/80 text-blue-300'
      : 'bg-emerald-400/80 text-emerald-300';

  return (
    <div id="training-progress-header" className="space-y-1.5">
      {/* Top Meta: Section Tag + Segment Counter */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${sectionColor}`} />
          <span className="font-semibold text-neutral-200">{sectionLabel}</span>
        </div>
        <div className="font-mono text-neutral-400 text-[11px]">
          Segment <span className="text-neutral-100 font-bold">{currentIndex + 1}</span> of{' '}
          <span>{totalSegments}</span>
        </div>
      </div>

      {/* Global Workout Progress Bar */}
      <div
        id="workout-overall-progress"
        className="w-full h-1 bg-neutral-850 rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={progressPercent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Overall workout progress"
      >
        <div
          className="h-full bg-neutral-200 transition-all duration-300 ease-out rounded-full"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
};
