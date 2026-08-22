import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  DemonstrationAsset,
  DemonstrationResolution,
  DemonstrationSourceType,
} from '../../../domain/demonstrations/types';
import {
  DemonstrationRepository,
  defaultDemonstrationRepository,
} from '../../../domain/demonstrations/repository';
import {
  resolveDemonstrations,
  switchDemonstration,
  formatDemonstrationSourceLabel,
} from '../../../domain/demonstrations/resolver';
import { DemonstrationPlayer } from './DemonstrationPlayer';
import { Badge } from '../../../ui/components/Badge';
import {
  ChevronLeft,
  ChevronRight,
  User,
  Box,
  Sparkles,
  Video,
  Info,
} from 'lucide-react';

export interface DemonstrationPanelProps {
  exerciseId: string;
  exerciseName: string;
  segmentType?: string;
  demonstrationRepo?: DemonstrationRepository;
  isOnline?: boolean;
  preferredSourceType?: DemonstrationSourceType;
  isWorkoutPaused?: boolean;
  className?: string;
}

/**
 * Maps demonstration source types to corresponding visual iconography.
 */
function getSourceIcon(sourceType?: DemonstrationSourceType) {
  switch (sourceType) {
    case 'REAL_PERSON':
      return <User className="w-3.5 h-3.5 text-emerald-400" />;
    case 'THREE_D_TRAINER':
      return <Box className="w-3.5 h-3.5 text-blue-400" />;
    case 'YOUTUBE_VIDEO':
      return <Video className="w-3.5 h-3.5 text-red-400" />;
    case 'FUTURE_AI_GENERATED':
      return <Sparkles className="w-3.5 h-3.5 text-amber-400" />;
    case 'FUTURE_EXTERNAL_VIDEO':
      return <Video className="w-3.5 h-3.5 text-purple-400" />;
    default:
      return <User className="w-3.5 h-3.5 text-neutral-400" />;
  }
}

/**
 * DemonstrationPanel
 * The primary container orchestrating demonstration resolution, source switching carousel,
 * touch gestures, and accessibility controls.
 *
 * Core Guarantee:
 * Switching demonstrations NEVER touches or modifies the authoritative TrainingEngine snapshot,
 * timer, or workout progression.
 */
export const DemonstrationPanel: React.FC<DemonstrationPanelProps> = ({
  exerciseId,
  exerciseName,
  segmentType = 'EXERCISE',
  demonstrationRepo = defaultDemonstrationRepository,
  isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true,
  preferredSourceType,
  isWorkoutPaused = false,
  className = '',
}) => {
  const [resolution, setResolution] = useState<DemonstrationResolution>({
    exerciseId,
    state: 'LOADING',
    assets: [],
    selectedAsset: null,
    selectedIndex: -1,
    availableSourceTypes: [],
  });

  const [isPlayingDemo, setIsPlayingDemo] = useState(true);

  // Touch gesture coordinates for swipe navigation
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Resolve demonstrations whenever exerciseId changes
  const loadDemonstrations = useCallback(async () => {
    setResolution((prev) => ({ ...prev, state: 'LOADING', exerciseId }));
    const result = await resolveDemonstrations(exerciseId, demonstrationRepo, {
      isOnline,
      preferredSourceType,
    });
    setResolution(result);
  }, [exerciseId, demonstrationRepo, isOnline, preferredSourceType]);

  useEffect(() => {
    loadDemonstrations();
  }, [loadDemonstrations]);

  // Handle switching
  const handleSwitch = (directionOrIndex: 'next' | 'prev' | number) => {
    setResolution((prev) => switchDemonstration(prev, directionOrIndex));
  };

  // Touch Handlers for horizontal swipe carousel
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
    touchEndX.current = null;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const diffX = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 45; // Threshold in px

    if (diffX > minSwipeDistance) {
      // Swiped Left -> Next demo
      handleSwitch('next');
    } else if (diffX < -minSwipeDistance) {
      // Swiped Right -> Previous demo
      handleSwitch('prev');
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  const hasMultipleDemos = resolution.assets.length > 1;
  const currentAsset = resolution.selectedAsset;

  return (
    <div
      id="demonstration-panel-container"
      className={`w-full space-y-2 ${className}`}
      onTouchStart={hasMultipleDemos ? handleTouchStart : undefined}
      onTouchMove={hasMultipleDemos ? handleTouchMove : undefined}
      onTouchEnd={hasMultipleDemos ? handleTouchEnd : undefined}
    >
      {/* 1. Header Bar: Movement Title & Source Switcher Badge */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono uppercase tracking-wider text-neutral-400">
            {segmentType === 'PREPARATION'
              ? 'Movement Setup'
              : segmentType === 'REST'
              ? 'Up Next Demo'
              : 'Movement Guide'}
          </span>
        </div>

        {/* Source Badge with Source Type Icon */}
        {resolution.state === 'AVAILABLE' && currentAsset && (
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-[11px] font-medium text-neutral-200 shadow-sm">
              {getSourceIcon(currentAsset.sourceType)}
              <span>{formatDemonstrationSourceLabel(currentAsset.sourceType)}</span>
            </span>
          </div>
        )}
      </div>

      {/* 2. Reusable Demonstration Player Frame */}
      <div className="relative group">
        <DemonstrationPlayer
          asset={currentAsset}
          availabilityState={resolution.state}
          exerciseName={exerciseName}
          isPlaying={isPlayingDemo && !isWorkoutPaused}
          onTogglePlay={() => setIsPlayingDemo((p) => !p)}
          onReplay={() => {
            setIsPlayingDemo(false);
            setTimeout(() => setIsPlayingDemo(true), 50);
          }}
          onRetry={loadDemonstrations}
          statusMessage={resolution.statusMessage}
        />

        {/* 3. Carousel Navigation Buttons (Accessible, >=44px touch targets) */}
        {hasMultipleDemos && (
          <>
            {/* Previous Demonstration Button */}
            <button
              type="button"
              id="demo-prev-btn"
              aria-label="Previous demonstration view"
              onClick={() => handleSwitch('prev')}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-neutral-950/80 hover:bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-neutral-100 flex items-center justify-center transition-colors shadow-lg z-20"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Next Demonstration Button */}
            <button
              type="button"
              id="demo-next-btn"
              aria-label="Next demonstration view"
              onClick={() => handleSwitch('next')}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-neutral-950/80 hover:bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-neutral-100 flex items-center justify-center transition-colors shadow-lg z-20"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {/* 4. Carousel Pagination Indicator & Accessible Quick Selector */}
      {hasMultipleDemos && (
        <div
          id="demo-carousel-indicators"
          className="flex items-center justify-between px-2 pt-0.5 text-xs text-neutral-400"
        >
          {/* Dot Indicators */}
          <div className="flex items-center gap-1.5" role="tablist" aria-label="Demonstration sources">
            {resolution.assets.map((asset, idx) => {
              const isSelected = idx === resolution.selectedIndex;
              return (
                <button
                  key={`${asset.id}-${idx}`}
                  type="button"
                  role="tab"
                  id={`demo-dot-${idx}`}
                  aria-selected={isSelected}
                  aria-label={`Select ${asset.title}`}
                  onClick={() => handleSwitch(idx)}
                  className={`w-2.5 h-2.5 rounded-full transition-all min-h-[32px] min-w-[20px] flex items-center justify-center`}
                >
                  <span
                    className={`block rounded-full transition-all ${
                      isSelected
                        ? 'w-5 h-2 bg-emerald-400 shadow-sm'
                        : 'w-2 h-2 bg-neutral-700 hover:bg-neutral-500'
                    }`}
                  />
                </button>
              );
            })}
          </div>

          <div className="text-[11px] font-mono text-neutral-400">
            {resolution.selectedIndex + 1} of {resolution.assets.length} Views
          </div>
        </div>
      )}

      {/* 5. Safe Usage Disclaimer */}
      <div className="px-1 flex items-center gap-1.5 text-[10px] text-neutral-500 font-mono">
        <Info className="w-3 h-3 text-neutral-400 shrink-0" />
        <span>Use the demonstration as a visual guide and follow the technique cues.</span>
      </div>
    </div>
  );
};
