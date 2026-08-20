import React, { useState } from 'react';
import { Card } from '../../../ui/components/Card';
import { Button } from '../../../ui/components/Button';
import { HardDrive, Trash2, RotateCcw, AlertTriangle, ShieldCheck, Check } from '../../../ui/icons';

export interface DataManagementSectionProps {
  completedCount: number;
  hasIncompleteSession: boolean;
  onClearAllData: () => Promise<void>;
  onResetPreferences: () => Promise<void>;
}

export const DataManagementSection: React.FC<DataManagementSectionProps> = ({
  completedCount,
  hasIncompleteSession,
  onClearAllData,
  onResetPreferences,
}) => {
  const [showWipeConfirm, setShowWipeConfirm] = useState(false);
  const [isWiping, setIsWiping] = useState(false);
  const [wipeSuccess, setWipeSuccess] = useState(false);

  const handleWipe = async () => {
    setIsWiping(true);
    try {
      await onClearAllData();
      setShowWipeConfirm(false);
      setWipeSuccess(true);
      setTimeout(() => setWipeSuccess(false), 3000);
    } finally {
      setIsWiping(false);
    }
  };

  return (
    <section id="data-management-section" className="space-y-2">
      <h3 className="text-xs font-mono uppercase tracking-wider text-neutral-400">
        Data Storage & Privacy
      </h3>

      <Card padding="sm" className="bg-neutral-900/60 border-neutral-800 space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-neutral-800/80 border border-neutral-700 flex items-center justify-center text-neutral-300 shrink-0">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-neutral-200">
              100% Local-First Storage
            </h4>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              All workout snapshots, completed history, and training preferences are stored strictly inside this device's browser database (IndexedDB). No cloud accounts, external databases, or behavioral tracking are used.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 p-2 rounded-md bg-neutral-950/60 border border-neutral-850 font-mono text-[11px]">
          <div>
            <span className="text-neutral-500 block text-[10px] uppercase">Storage Engine</span>
            <span className="text-neutral-200">IndexedDB (v1)</span>
          </div>
          <div>
            <span className="text-neutral-500 block text-[10px] uppercase">Stored Records</span>
            <span className="text-neutral-200">
              {completedCount} history {hasIncompleteSession ? '(+1 active)' : ''}
            </span>
          </div>
        </div>

        {wipeSuccess && (
          <div className="p-2 rounded bg-emerald-950/50 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-1.5">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>All local application data has been wiped successfully.</span>
          </div>
        )}

        {showWipeConfirm ? (
          <Card padding="sm" className="bg-red-950/50 border-red-800 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-red-200 font-semibold">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>Are you sure you want to erase all data?</span>
            </div>
            <p className="text-[11px] text-red-300">
              This will permanently delete all workout history, active sessions, and custom preferences. This action cannot be undone.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <Button
                id="btn-confirm-wipe-all"
                variant="danger"
                size="sm"
                onClick={handleWipe}
                disabled={isWiping}
                className="text-xs"
              >
                {isWiping ? 'Erasing...' : 'Yes, Erase Everything'}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowWipeConfirm(false)}
                disabled={isWiping}
                className="text-xs"
              >
                Cancel
              </Button>
            </div>
          </Card>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-neutral-800">
            <button
              type="button"
              id="btn-reset-preferences"
              onClick={onResetPreferences}
              className="text-[11px] font-mono text-neutral-400 hover:text-neutral-200 flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              Reset Preferences
            </button>

            <Button
              id="btn-trigger-wipe-all"
              variant="ghost"
              size="sm"
              onClick={() => setShowWipeConfirm(true)}
              className="text-xs text-red-400 hover:text-red-300 hover:bg-red-950/40"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" />
              Erase All Local Data
            </Button>
          </div>
        )}
      </Card>
    </section>
  );
};
