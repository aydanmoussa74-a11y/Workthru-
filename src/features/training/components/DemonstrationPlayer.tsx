import React, { useState } from 'react';
import { DemonstrationAsset, DemonstrationAvailabilityState } from '../../../domain/demonstrations/types';
import { DemonstrationVisualizer } from './DemonstrationVisualizer';
import {
  Play,
  Pause,
  RotateCcw,
  AlertCircle,
  ShieldCheck,
  BookOpen,
  Eye,
} from '../../../ui/icons';

export interface DemonstrationPlayerProps {
  asset: DemonstrationAsset | null;
  availabilityState: DemonstrationAvailabilityState;
  exerciseName: string;
  isPlaying?: boolean;
  onTogglePlay?: () => void;
  onReplay?: () => void;
  onRetry?: () => void;
  statusMessage?: string;
  className?: string;
}

/**
 * DemonstrationPlayer
 * Reusable demonstration presentation component for the Workout PWA.
 * Renders high-fidelity athletic real-person and 3D biomechanical demonstrations.
 *
 * Guaranteed Invariants:
 * 1. Independent of workout timer (changing demonstration controls does not alter training engine).
 * 2. Honest fallback states for unavailable, offline, or errored assets.
 * 3. Fully accessible with >=44px touch targets and screen-reader semantics.
 */
export const DemonstrationPlayer: React.FC<DemonstrationPlayerProps> = ({
  asset,
  availabilityState,
  exerciseName,
  isPlaying = true,
  onTogglePlay,
  onReplay,
  onRetry,
  statusMessage,
  className = '',
}) => {
  const [selectedAngle, setSelectedAngle] = useState<string>('SIDE');

  // Handle angle cycling if metadata provides multiple angles
  const availableAngles = asset?.metadata?.angles || ['SIDE'];

  const cycleAngle = () => {
    if (availableAngles.length <= 1) return;
    const currentIdx = availableAngles.indexOf(selectedAngle as any);
    const nextIdx = (currentIdx + 1) % availableAngles.length;
    setSelectedAngle(availableAngles[nextIdx]);
  };

  return (
    <div
      id="demonstration-player"
      className={`relative w-full aspect-video min-h-[190px] sm:min-h-[230px] rounded-2xl bg-neutral-950 border border-neutral-800 flex flex-col justify-between overflow-hidden select-none ${className}`}
    >
      {/* 1. LOADING STATE */}
      {availabilityState === 'LOADING' && (
        <div
          id="demo-loading-state"
          className="w-full h-full flex flex-col items-center justify-center space-y-3 p-4 bg-neutral-950"
        >
          <div className="w-10 h-10 border-2 border-emerald-500/20 border-t-emerald-400 rounded-full animate-spin" />
          <p className="text-xs text-neutral-400 font-mono">Loading movement demonstration...</p>
        </div>
      )}

      {/* 2. ERROR STATE */}
      {availabilityState === 'ERROR' && (
        <div
          id="demo-error-state"
          className="w-full h-full flex flex-col items-center justify-center text-center p-4 space-y-2.5 bg-neutral-950/90"
        >
          <div className="w-10 h-10 rounded-full bg-red-950/70 border border-red-800 flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-red-400" />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-bold text-neutral-200">Demonstration Media Error</p>
            <p className="text-[11px] text-neutral-400 max-w-xs leading-relaxed">
              {statusMessage || 'Unable to load demonstration. Written movement cues remain fully available.'}
            </p>
          </div>
          {onRetry && (
            <button
              type="button"
              id="demo-retry-btn"
              onClick={onRetry}
              className="mt-1 px-3 py-1.5 min-h-[44px] rounded-lg bg-neutral-900 border border-neutral-700 text-xs font-semibold text-neutral-200 hover:bg-neutral-800 transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry Demonstration</span>
            </button>
          )}
        </div>
      )}

      {/* 3. UNAVAILABLE / FALLBACK STATE */}
      {availabilityState === 'UNAVAILABLE' && (
        <div
          id="demo-unavailable-state"
          className="w-full h-full flex flex-col items-center justify-center text-center p-4 space-y-2.5 bg-neutral-950"
        >
          <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-neutral-400" />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-bold text-neutral-200">Demonstration Unavailable</p>
            <p className="text-[11px] text-neutral-400 max-w-xs leading-relaxed">
              {statusMessage ||
                'No recorded demonstration exists for this exercise yet. Follow the written technique guidance and form cues below.'}
            </p>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Written guidance active</span>
          </div>
        </div>
      )}

      {/* 4. AVAILABLE PLAYBACK STATE */}
      {availabilityState === 'AVAILABLE' && asset && (
        <>
          {/* Visual Kinematic Canvas Stage */}
          <div className="relative flex-1 w-full h-full flex flex-col">
            <DemonstrationVisualizer
              asset={asset}
              isPlaying={isPlaying}
              activeAngle={selectedAngle}
              className="flex-1"
            />

            {/* In-Frame Floating Overlay Controls (Accessible with >=44px tap targets) */}
            <div className="absolute bottom-1.5 right-2 flex items-center gap-1.5 z-30">
              {/* Angle Switcher Button (if multi-angle available) */}
              {availableAngles.length > 1 && (
                <button
                  type="button"
                  id="demo-cycle-angle-btn"
                  aria-label={`Cycle view angle. Current: ${selectedAngle}`}
                  onClick={cycleAngle}
                  className="min-w-[44px] min-h-[44px] px-2.5 rounded-lg bg-neutral-950/80 hover:bg-neutral-900 border border-neutral-800 text-[11px] font-mono text-neutral-300 hover:text-neutral-100 flex items-center justify-center gap-1 transition-colors shadow-sm"
                >
                  <Eye className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{selectedAngle}</span>
                </button>
              )}

              {/* Restart Demonstration Animation */}
              {onReplay && (
                <button
                  type="button"
                  id="demo-replay-btn"
                  aria-label="Restart demonstration loop"
                  onClick={onReplay}
                  className="w-11 h-11 rounded-lg bg-neutral-950/80 hover:bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-neutral-100 flex items-center justify-center transition-colors shadow-sm"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}

              {/* Demonstration Play/Pause Toggle */}
              {onTogglePlay && (
                <button
                  type="button"
                  id="demo-toggle-play-btn"
                  aria-label={isPlaying ? 'Pause demonstration animation' : 'Play demonstration animation'}
                  onClick={onTogglePlay}
                  className="w-11 h-11 rounded-lg bg-neutral-950/80 hover:bg-neutral-900 border border-neutral-800 text-neutral-200 hover:text-emerald-400 flex items-center justify-center transition-colors shadow-sm"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
