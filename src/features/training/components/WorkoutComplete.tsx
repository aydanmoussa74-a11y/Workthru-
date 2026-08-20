import React from 'react';
import { TrainingSession } from '../../../domain/training-state/types';
import { Card } from '../../../ui/components/Card';
import { Button } from '../../../ui/components/Button';
import { Badge } from '../../../ui/components/Badge';
import {
  CheckCircle2,
  Clock,
  Dumbbell,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
} from '../../../ui/icons';

export interface WorkoutCompleteProps {
  session: TrainingSession;
  onReturnToHub: () => void;
  onRestartWorkout?: () => void;
}

export const WorkoutComplete: React.FC<WorkoutCompleteProps> = ({
  session,
  onReturnToHub,
  onRestartWorkout,
}) => {
  const completedRecords = session.records.filter((r) => r.status === 'COMPLETED');
  const skippedRecords = session.records.filter((r) => r.status === 'SKIPPED');

  // Compute total actual work duration in MM:SS
  const totalActiveMs = completedRecords.reduce((acc, r) => acc + r.actualDurationMs, 0);
  const totalActiveSec = Math.round(totalActiveMs / 1000);
  const activeMins = Math.floor(totalActiveSec / 60);
  const activeSecs = totalActiveSec % 60;
  const formattedActiveTime = `${activeMins}m ${activeSecs}s`;

  // Total session wall-clock elapsed time
  const totalElapsedMs = session.sessionStartTimestamp && session.sessionEndTimestamp
    ? Math.max(0, session.sessionEndTimestamp - session.sessionStartTimestamp)
    : totalActiveMs;
  const elapsedMins = Math.floor(Math.round(totalElapsedMs / 1000) / 60);
  const elapsedSecs = Math.round(totalElapsedMs / 1000) % 60;
  const formattedElapsedTime = `${elapsedMins}m ${elapsedSecs}s`;

  return (
    <div id="workout-complete-screen" className="space-y-5 py-2">
      {/* 1. Completion Header Banner */}
      <div className="flex flex-col items-center text-center space-y-2 py-4">
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-1 shadow-inner">
          <CheckCircle2 className="w-9 h-9" />
        </div>
        <Badge variant="default" className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-xs font-mono">
          Session Finished
        </Badge>
        <h2 className="text-2xl font-bold tracking-tight text-neutral-100">
          Workout Complete
        </h2>
        <p className="text-xs text-neutral-400 max-w-xs leading-relaxed">
          Great consistency. You followed the structured plan from start to finish.
        </p>
      </div>

      {/* 2. Honest Session Metrics (No fake calories/scores) */}
      <div className="grid grid-cols-2 gap-2.5">
        <Card padding="sm" className="bg-neutral-900/60 border-neutral-800 space-y-1">
          <div className="flex items-center gap-1.5 text-neutral-400 text-xs">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Active Time</span>
          </div>
          <p className="text-xl font-bold font-mono text-neutral-100">
            {formattedActiveTime}
          </p>
          <p className="text-[10px] text-neutral-400 font-mono">
            Wall clock: {formattedElapsedTime}
          </p>
        </Card>

        <Card padding="sm" className="bg-neutral-900/60 border-neutral-800 space-y-1">
          <div className="flex items-center gap-1.5 text-neutral-400 text-xs">
            <Dumbbell className="w-3.5 h-3.5 text-emerald-400" />
            <span>Segments Done</span>
          </div>
          <p className="text-xl font-bold font-mono text-neutral-100">
            {completedRecords.length}{' '}
            <span className="text-xs font-normal text-neutral-400">
              / {session.segments.length}
            </span>
          </p>
          <p className="text-[10px] text-neutral-400 font-mono">
            {skippedRecords.length > 0 ? `${skippedRecords.length} skipped` : '100% adherence'}
          </p>
        </Card>
      </div>

      {/* 3. Workout Info & Segment Log */}
      <Card padding="sm" className="bg-neutral-900/40 border-neutral-850 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-neutral-200">Routine Breakdown</span>
          <span className="text-[11px] font-mono text-neutral-400">{session.workoutTitle}</span>
        </div>

        <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
          {session.segments.map((seg, idx) => {
            const record = session.records.find((r) => r.segmentIndex === idx);
            const isCompleted = record?.status === 'COMPLETED';
            const isSkipped = record?.status === 'SKIPPED';

            return (
              <div
                key={seg.id}
                className="flex items-center justify-between p-2 rounded-lg bg-neutral-950/60 border border-neutral-850/80 text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-neutral-500 w-4 text-right text-[11px]">
                    {idx + 1}
                  </span>
                  <div className="space-y-0.5">
                    <p className="text-neutral-200 font-medium">{seg.name}</p>
                    <span className="text-[10px] font-mono text-neutral-400">
                      {seg.type === 'REST' ? 'Recovery' : seg.type === 'PREPARATION' ? 'Setup' : seg.section}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isCompleted ? (
                    <span className="text-[10px] font-mono font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 px-1.5 py-0.5 rounded">
                      Completed
                    </span>
                  ) : isSkipped ? (
                    <span className="text-[10px] font-mono text-neutral-400 bg-neutral-900 border border-neutral-800 px-1.5 py-0.5 rounded">
                      Skipped
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-neutral-500">
                      Not reached
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* 4. Action Buttons */}
      <div className="space-y-2 pt-2">
        <Button
          id="btn-return-training-hub"
          variant="primary"
          size="lg"
          fullWidth
          onClick={onReturnToHub}
          className="min-h-[48px] font-bold"
        >
          <ArrowRight className="w-4 h-4 mr-2" />
          Return to Training Hub
        </Button>

        {onRestartWorkout && (
          <Button
            id="btn-restart-workout"
            variant="ghost"
            size="md"
            fullWidth
            onClick={onRestartWorkout}
            className="text-neutral-400 hover:text-neutral-200"
          >
            <RotateCcw className="w-4 h-4 mr-1.5" />
            Restart This Workout
          </Button>
        )}
      </div>
    </div>
  );
};
