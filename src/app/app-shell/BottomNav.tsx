import React from 'react';
import { useApp } from '../providers/AppProvider';
import { APP_ROUTES } from '../routes';
import { Home, Flame, TrendingUp, BookOpen } from '../../ui/icons';
import { classNames } from '../../lib/utils';
import { AppDestination } from '../../types';

const iconMap = {
  Home,
  Flame,
  TrendingUp,
  BookOpen,
};

export const BottomNav: React.FC = () => {
  const { currentDestination, navigateTo } = useApp();

  return (
    <nav
      id="bottom-navigation"
      aria-label="Main application navigation"
      className="fixed bottom-0 left-0 right-0 z-30 border-t border-neutral-850 bg-neutral-950/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)]"
    >
      <div className="mx-auto flex max-w-lg items-center justify-around px-2 py-1">
        {APP_ROUTES.map((route) => {
          const Icon = iconMap[route.iconName];
          const isActive = currentDestination === route.id;

          return (
            <button
              key={route.id}
              id={`nav-tab-${route.id}`}
              aria-label={route.label}
              aria-current={isActive ? 'page' : undefined}
              onClick={() => navigateTo(route.id as AppDestination)}
              className={classNames(
                'flex flex-1 flex-col items-center justify-center py-2 px-1 rounded-xl transition-all cursor-pointer min-h-[50px] select-none',
                isActive
                  ? 'text-neutral-100 font-semibold'
                  : 'text-neutral-400 hover:text-neutral-200'
              )}
            >
              <div
                className={classNames(
                  'flex items-center justify-center w-8 h-8 rounded-lg transition-colors',
                  isActive ? 'bg-neutral-850 text-neutral-100' : 'text-neutral-400'
                )}
              >
                <Icon className="w-4 h-4" strokeWidth={isActive ? 2.4 : 1.8} />
              </div>
              <span className="text-[11px] tracking-tight mt-1 whitespace-nowrap">
                {route.shortLabel}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
