import React from 'react';
import { YouTubeMediaCategory } from '../../../domain/media/youtube/types';
import { Dumbbell, Flame, Activity, Sparkles, Music } from '../../../ui/icons';

export interface MediaCategoryTabsProps {
  activeCategory: YouTubeMediaCategory;
  onSelectCategory: (category: YouTubeMediaCategory) => void;
  className?: string;
}

interface CategoryConfig {
  id: YouTubeMediaCategory;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
}

const CATEGORIES: CategoryConfig[] = [
  { id: 'EXERCISE', label: 'Exercise Form', shortLabel: 'Exercises', icon: Dumbbell },
  { id: 'WORKOUT', label: 'Full Workouts', shortLabel: 'Workouts', icon: Flame },
  { id: 'MOBILITY', label: 'Mobility & Prep', shortLabel: 'Mobility', icon: Activity },
  { id: 'MOTIVATION', label: 'Mindset & Drive', shortLabel: 'Motivation', icon: Sparkles },
  { id: 'MUSIC', label: 'Training Beats', shortLabel: 'Music', icon: Music },
];

export const MediaCategoryTabs: React.FC<MediaCategoryTabsProps> = ({
  activeCategory,
  onSelectCategory,
  className = '',
}) => {
  return (
    <div
      id="media-category-tabs"
      role="tablist"
      aria-label="Workout media categories"
      className={`flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 ${className}`}
    >
      {CATEGORIES.map((cat) => {
        const Icon = cat.icon;
        const isActive = activeCategory === cat.id;

        return (
          <button
            key={cat.id}
            id={`category-tab-${cat.id.toLowerCase()}`}
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelectCategory(cat.id)}
            className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap flex items-center gap-2 transition-all cursor-pointer select-none border shrink-0 ${
              isActive
                ? 'bg-neutral-100 text-neutral-950 border-neutral-100 shadow-sm'
                : 'bg-neutral-900/90 hover:bg-neutral-850 text-neutral-400 hover:text-neutral-200 border-neutral-800'
            }`}
          >
            <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-neutral-950' : 'text-neutral-400'}`} />
            <span>{cat.shortLabel}</span>
          </button>
        );
      })}
    </div>
  );
};
