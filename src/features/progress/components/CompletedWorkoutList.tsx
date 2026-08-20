import React, { useState } from 'react';
import { Card } from '../../../ui/components/Card';
import { Button } from '../../../ui/components/Button';
import { Badge } from '../../../ui/components/Badge';
import {
  Clock,
  CheckCircle2,
  Trash2,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Flame,
  Layers,
} from '../../../ui/icons';
import { PersistedCompletedWorkout } from '../../../data/local/types';

export interface CompletedWorkoutListProps {
  workouts: PersistedCompletedWorkout[];
  onDeleteWorkout: (id: string) => Promise<void>;
  onClearHistory: () => Promise<void>;
}

export const CompletedWorkoutList: React.FC<CompletedWorkoutListProps> = ({
  workouts,
  onDeleteWorkout,
  onClearHistory,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false);

  const formatDate = (timestamp: number): string => {
    const d = new Date(timestamp);
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (ms: number): string => {
    const totalSec = Math.floor(ms / 1000);
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs.toString().padStart(2, '0')}s`;
  };

  return (
    <div id="completed-workouts-container" className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-mono uppercase tracking-wider text-neutral-400">
          Completed Sessions ({workouts.length})
        </h3>
        {workouts.length > 0 && !showClearAllConfirm && (
          <button
            type="button"
            id="btn-trigger-clear-history"
            onClick={() => setShowClearAllConfirm(true)}
            className="text-[11px] font-mono text-neutral-400 hover:text-red-400 transition-colors"
          >
            Clear History
          </button>
        )}
      </div>

      {showClearAllConfirm && (
        <Card padding="sm" className="bg-red-950/40 border-red-800 space-y-2 text-xs">
          <div className="flex items-center gap-2 text-red-200 font-semibold">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>Clear all {workouts.length} completed workout records?</span>
          </div>
          <p className="text-[11px] text-red-300">
            This will permanently remove your stored local workout history.
          </p>
          <div className="flex items-center gap-2 pt-1">
            <Button
              variant="danger"
              size="sm"
              onClick={async () => {
                await onClearHistory();
                setShowClearAllConfirm(false);
              }}
              className="text-xs"
            >
              Yes, Clear History
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowClearAllConfirm(false)}
              className="text-xs"
            >
              Cancel
            </Button>
          </div>
        </Card>
      )}

      <div className="space-y-2.5">
        {workouts.map((w) => {
          const isExpanded = expandedId === w.id;
          const isDeleting = deletingId === w.id;

          return (
            <Card
              key={w.id}
              id={`completed-workout-${w.id}`}
              padding="sm"
              className="bg-neutral-900/70 border-neutral-800 space-y-3 hover:border-neutral-750 transition-colors"
            >
              {/* Top Row: Title, Focus, & Date */}
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-neutral-100 tracking-tight">
                      {w.workoutTitle}
                    </h4>
                    <Badge variant="outline" className="text-[10px] py-0 px-1.5">
                      {w.workoutFocus}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-neutral-400 font-mono">
                    {formatDate(w.completedAt)}
                  </p>
                </div>

                <button
                  type="button"
                  aria-label="Toggle segment details"
                  onClick={() => setExpandedId(isExpanded ? null : w.id)}
                  className="p-1 rounded-md text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
                >
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>

              {/* Stats Summary Row */}
              <div className="grid grid-cols-3 gap-2 p-2 rounded-lg bg-neutral-950/60 border border-neutral-850 font-mono text-[11px]">
                <div>
                  <span className="text-neutral-500 block text-[10px] uppercase">Active Time</span>
                  <span className="text-neutral-200 font-semibold">{formatDuration(w.totalActiveMs)}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block text-[10px] uppercase">Completed</span>
                  <span className="text-emerald-400 font-semibold">
                    {w.completedSegmentsCount} / {w.totalSegmentsCount}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-500 block text-[10px] uppercase">Skipped</span>
                  <span className={w.skippedSegmentsCount > 0 ? 'text-amber-400 font-semibold' : 'text-neutral-400'}>
                    {w.skippedSegmentsCount}
                  </span>
                </div>
              </div>

              {/* Expanded Segment Records Breakdown */}
              {isExpanded && (
                <div className="pt-2 border-t border-neutral-800 space-y-2 animate-in fade-in duration-150">
                  <span className="text-[10px] font-mono uppercase text-neutral-400 block">
                    Execution Log ({w.records.length} records)
                  </span>
                  <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                    {w.records.map((r, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-xs py-1 px-2 rounded bg-neutral-950/40 border border-neutral-900"
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle2
                            className={`w-3.5 h-3.5 ${
                              r.status === 'COMPLETED' ? 'text-emerald-400' : 'text-amber-400'
                            }`}
                          />
                          <span className="text-neutral-300 font-mono text-[11px]">
                            Segment #{r.segmentIndex + 1}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 font-mono text-[11px] text-neutral-400">
                          {r.completedReps !== undefined && <span>{r.completedReps} reps</span>}
                          <span>{formatDuration(r.actualDurationMs)}</span>
                          <Badge
                            variant={r.status === 'COMPLETED' ? 'accent' : 'outline'}
                            className="text-[9px] py-0 px-1"
                          >
                            {r.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Delete Single Workout Row */}
                  <div className="pt-2 flex items-center justify-end">
                    {isDeleting ? (
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-red-300">Delete this record?</span>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => onDeleteWorkout(w.id)}
                          className="text-xs"
                        >
                          Confirm
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setDeletingId(null)}
                          className="text-xs"
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeletingId(w.id)}
                        className="text-xs text-neutral-400 hover:text-red-400"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" />
                        Delete Record
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};
