import React from 'react';
import { Button } from '../../../ui/components/Button';
import { AlertTriangle, X } from '../../../ui/icons';

export interface AbandonConfirmModalProps {
  isOpen: boolean;
  onCancel: () => void;
  onConfirmAbandon: () => void;
}

export const AbandonConfirmModal: React.FC<AbandonConfirmModalProps> = ({
  isOpen,
  onCancel,
  onConfirmAbandon,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="abandon-workout-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="abandon-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-sm"
    >
      <div
        id="abandon-workout-modal-content"
        className="w-full max-w-sm rounded-2xl bg-neutral-900 border border-neutral-800 p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 id="abandon-modal-title" className="text-base font-bold text-neutral-100">
              Leave Workout?
            </h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Your active progress will be marked as abandoned. You can start fresh or choose a different routine anytime.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <Button
            id="btn-confirm-abandon"
            variant="secondary"
            size="md"
            fullWidth
            onClick={onConfirmAbandon}
            className="text-red-400 border-red-900/40 bg-red-950/20 hover:bg-red-950/40 min-h-[44px]"
          >
            Yes, Quit Workout
          </Button>

          <Button
            id="btn-cancel-abandon"
            variant="primary"
            size="md"
            fullWidth
            onClick={onCancel}
            className="min-h-[44px]"
          >
            Keep Training
          </Button>
        </div>
      </div>
    </div>
  );
};
