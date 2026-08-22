/**
 * Coach Mode Selector (Phase 9)
 * Allows users to adjust AI Coach autonomy:
 * - OBSERVE: No unsolicited cues
 * - EXPLAIN: Q&A only
 * - SUGGEST: Milestones only
 * - COACH: Full contextual guidance
 */

import React from 'react';
import { CoachMode } from '../../domain/ai/types';

interface CoachModeSelectorProps {
  currentMode: CoachMode;
  onModeChange: (mode: CoachMode) => void;
  disabled?: boolean;
}

const MODES: { mode: CoachMode; label: string; desc: string }[] = [
  { mode: 'COACH', label: 'Coach', desc: 'Full cues on all segments' },
  { mode: 'SUGGEST', label: 'Suggest', desc: 'Key milestones only' },
  { mode: 'EXPLAIN', label: 'Explain', desc: 'Responds only when asked' },
  { mode: 'OBSERVE', label: 'Observe', desc: 'Silent mode' },
];

export const CoachModeSelector: React.FC<CoachModeSelectorProps> = ({
  currentMode,
  onModeChange,
  disabled = false,
}) => {
  return (
    <div className="flex items-center gap-1 p-1 bg-neutral-900 border border-neutral-800 rounded-lg">
      {MODES.map(({ mode, label }) => {
        const isSelected = currentMode === mode;
        return (
          <button
            key={mode}
            type="button"
            disabled={disabled}
            onClick={() => onModeChange(mode)}
            title={MODES.find((m) => m.mode === mode)?.desc}
            className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${
              isSelected
                ? 'bg-neutral-100 text-neutral-900 font-semibold shadow-xs'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
};
