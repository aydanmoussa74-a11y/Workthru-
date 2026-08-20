import React from 'react';
import { useApp } from '../providers/AppProvider';
import { Badge } from '../../ui/components/Badge';

export const Header: React.FC = () => {
  const { isOnline } = useApp();

  return (
    <header
      id="app-header"
      className="sticky top-0 z-30 w-full border-b border-neutral-850 bg-neutral-950/90 backdrop-blur-md px-4 py-3 sm:px-6"
    >
      <div className="mx-auto flex max-w-lg items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-100 text-neutral-950 font-bold text-xs tracking-wider">
            W
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-tight text-neutral-100 leading-none">
              WORKOUT
            </h1>
            <p className="text-[10px] text-neutral-400 font-mono tracking-wider mt-0.5">
              LOCAL-FIRST
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isOnline && (
            <Badge variant="neutral" id="offline-indicator">
              Offline Ready
            </Badge>
          )}
          <Badge variant="outline" id="phase-badge" className="text-[10px] py-0 px-2 text-neutral-400">
            Phase 0
          </Badge>
        </div>
      </div>
    </header>
  );
};
