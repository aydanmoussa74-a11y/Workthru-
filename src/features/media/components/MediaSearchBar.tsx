import React from 'react';
import { Search, X } from '../../../ui/icons';

export interface MediaSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  placeholder?: string;
  className?: string;
}

export const MediaSearchBar: React.FC<MediaSearchBarProps> = ({
  value,
  onChange,
  onClear,
  placeholder = 'Search exercise form, routines, or follow-along workouts...',
  className = '',
}) => {
  return (
    <div id="media-search-bar" className={`relative flex items-center w-full ${className}`}>
      <div className="absolute left-3.5 flex items-center pointer-events-none text-neutral-500">
        <Search className="w-4 h-4" />
      </div>

      <input
        id="media-search-input"
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label="Search workout media"
        className="w-full min-h-[48px] pl-10 pr-10 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-colors"
      />

      {value && (
        <button
          type="button"
          id="media-search-clear-btn"
          aria-label="Clear search input"
          onClick={onClear}
          className="absolute right-2.5 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
