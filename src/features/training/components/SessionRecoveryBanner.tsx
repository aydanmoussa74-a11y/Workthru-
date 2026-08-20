import React, { useState } from 'react';
import { Card } from '../../../ui/components/Card';
import { Button } from '../../../ui/components/Button';
import { Badge } from '../../../ui/components/Badge';
import { RotateCcw, Trash2, Play, AlertTriangle, Clock } from '../../../ui/icons';
import { PersistedTrainingSession } from '../../../data/local/types';

export interface SessionRecoveryBannerProps {
  session: PersistedTrainingSession;
  isStale: boolean;
  ageMs: number;
  onResume: (session: PersistedTrainingSession) => void;
  onDiscard: (sessionId: string) => void;
}

export const SessionRecoveryBanner: React.FC<SessionRecoveryBannerProps> = ({
  session,
  isStale,
  ageMs,
  onResume,
  onDiscard,
}) => {
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  const formatAge = (ms: number): string => {
    const mins = Math.floor(ms / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const totalSegments = session.workout.allExercises.length || 0;
  const currentSegNum = session.snapshot.currentSegmentIndex + 1;

  return (
    <Card
      id="session-recovery-banner"
      padding="sm"
      className={`border ${
        isStale
          ? 'bg-amber-950/40 border-amber-800/80 text-amber-100'
          : 'bg-emerald-950/40 border-emerald-800/80 text-emerald-100'
      } space-y-3 animate-in fade-in duration-200`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          {isStale ? (
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          ) : (
            <RotateCcw className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold tracking-tight">
                {isStale ? 'Stale Incomplete Session' : 'Interrupted Session Detected'}
              </span>
              <Badge variant={isStale ? 'outline' : 'accent'} className="text-[10px] py-0 px-1.5">
                {formatAge(ageMs)}
              </Badge>
            </div>
            <p className="text-xs text-neutral-300 font-medium mt-0.5">
              {session.workout.title}
            </p>
          </div>
        </div>

        <span className="text-[11px] font-mono text-neutral-400">
          Segment {currentSegNum} / {totalSegments}
        </span>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <Button
          id="btn-resume-session"
          variant="primary"
          size="sm"
          onClick={() => onResume(session)}
          className="flex-1 text-xs font-semibold"
        >
          <Play className="w-3.5 h-3.5 fill-current mr-1" />
          Resume Workout
        </Button>

        {showDiscardConfirm ? (
          <div className="flex items-center gap-1.5">
            <Button
              id="btn-confirm-discard-session"
              variant="outline"
              size="sm"
              onClick={() => onDiscard(session.sessionId)}
              className="text-xs text-red-400 border-red-800 bg-red-950/60 hover:bg-red-900/80"
            >
              Confirm Discard
            </Button>
            <button
              type="button"
              onClick={() => setShowDiscardConfirm(false)}
              className="text-xs text-neutral-400 hover:text-neutral-200 px-2 py-1"
            >
              Cancel
            </button>
          </div>
        ) : (
          <Button
            id="btn-discard-session"
            variant="ghost"
            size="sm"
            onClick={() => setShowDiscardConfirm(true)}
            className="text-xs text-neutral-400 hover:text-red-300"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1" />
            Discard
          </Button>
        )}
      </div>
    </Card>
  );
};
