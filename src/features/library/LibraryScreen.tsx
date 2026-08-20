import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  Exercise,
  ExerciseCategory,
  EquipmentRequirement,
  ExperienceLevel,
} from '../../domain/exercises/types';
import { defaultExerciseRepository } from '../../domain/exercises/repository';
import { ExerciseCard } from './components/ExerciseCard';
import { ExerciseFilterSheet } from './components/ExerciseFilterSheet';
import { ExerciseDetailModal } from './components/ExerciseDetailModal';
import { EmptyState } from '../../ui/components/EmptyState';
import { Button } from '../../ui/components/Button';
import { Badge } from '../../ui/components/Badge';
import { Search, SlidersHorizontal, X, BookOpen } from '../../ui/icons';
import { screenTransition } from '../../ui/motion/transitions';
import { classNames } from '../../lib/utils';

const CATEGORY_ITEMS: Array<{ id: ExerciseCategory | 'ALL'; label: string }> = [
  { id: 'ALL', label: 'All' },
  { id: 'PUSH', label: 'Push' },
  { id: 'LEGS', label: 'Legs' },
  { id: 'CORE', label: 'Core' },
  { id: 'FULL_BODY', label: 'Full Body' },
  { id: 'MOBILITY', label: 'Mobility' },
];

export const LibraryScreen: React.FC = () => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<ExerciseCategory | 'ALL'>('ALL');
  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentRequirement | 'ALL'>('ALL');
  const [selectedLevel, setSelectedLevel] = useState<ExperienceLevel | 'ALL'>('ALL');

  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState<boolean>(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

  // Load and filter exercises
  useEffect(() => {
    const loadExercises = async () => {
      const results = await defaultExerciseRepository.filter({
        searchQuery,
        category: selectedCategory,
        equipment: selectedEquipment,
        experienceLevel: selectedLevel,
      });
      setExercises(results);
    };

    loadExercises();
  }, [searchQuery, selectedCategory, selectedEquipment, selectedLevel]);

  // Active secondary filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedEquipment !== 'ALL') count++;
    if (selectedLevel !== 'ALL') count++;
    return count;
  }, [selectedEquipment, selectedLevel]);

  const handleResetFilters = () => {
    setSelectedCategory('ALL');
    setSelectedEquipment('ALL');
    setSelectedLevel('ALL');
    setSearchQuery('');
  };

  return (
    <motion.div
      id="library-screen"
      {...screenTransition}
      className="flex flex-col gap-4 pb-6"
    >
      {/* Header */}
      <section id="library-header" className="space-y-1">
        <div className="flex items-center justify-between">
          <p className="text-xs font-mono uppercase tracking-widest text-neutral-400">
            Movement Catalog
          </p>
          <span className="text-xs font-mono text-neutral-400">
            {exercises.length} Movements
          </span>
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-neutral-100">
          Exercise Library
        </h2>
        <p className="text-xs text-neutral-400">
          Calisthenics variations, movement patterns, and form cues.
        </p>
      </section>

      {/* Search Bar & Filter Button */}
      <section id="library-search-controls" className="flex items-center gap-2">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            id="exercise-search-input"
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search exercises, muscles, cues..."
            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-9 pr-8 py-2.5 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-neutral-600 transition-colors"
          />
          {searchQuery && (
            <button
              id="clear-search-btn"
              aria-label="Clear search"
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-neutral-200 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Sheet Trigger */}
        <button
          id="open-filters-sheet-btn"
          aria-label="Open filter options"
          onClick={() => setIsFilterSheetOpen(true)}
          className={classNames(
            'relative flex items-center justify-center h-10 w-10 min-h-[40px] min-w-[40px] rounded-xl border transition-colors cursor-pointer',
            activeFiltersCount > 0
              ? 'bg-neutral-100 text-neutral-950 border-neutral-100 font-semibold'
              : 'bg-neutral-900 text-neutral-300 border-neutral-800 hover:bg-neutral-800 hover:text-white'
          )}
        >
          <SlidersHorizontal className="w-4 h-4" />
          {activeFiltersCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-neutral-950 text-[10px] font-bold flex items-center justify-center">
              {activeFiltersCount}
            </span>
          )}
        </button>
      </section>

      {/* Category Pills Bar */}
      <section id="library-categories" className="overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-none">
        <div className="flex items-center gap-1.5 min-w-max">
          {CATEGORY_ITEMS.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                id={`cat-pill-${cat.id.toLowerCase()}`}
                onClick={() => setSelectedCategory(cat.id)}
                className={classNames(
                  'px-3.5 py-1.5 text-xs font-medium rounded-full transition-all cursor-pointer select-none whitespace-nowrap min-h-[36px]',
                  isSelected
                    ? 'bg-neutral-100 text-neutral-950 font-semibold shadow-xs'
                    : 'bg-neutral-900 text-neutral-400 border border-neutral-800 hover:text-neutral-200'
                )}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* Active Filter Chips (if any active) */}
      {(selectedEquipment !== 'ALL' || selectedLevel !== 'ALL') && (
        <section id="active-filter-chips" className="flex flex-wrap items-center gap-1.5 pt-0.5">
          <span className="text-[11px] font-mono text-neutral-400">Active Filters:</span>
          {selectedEquipment !== 'ALL' && (
            <Badge variant="neutral" className="gap-1 text-[11px] py-0.5">
              <span>Equipment: {selectedEquipment}</span>
              <button
                onClick={() => setSelectedEquipment('ALL')}
                className="hover:text-white cursor-pointer ml-0.5"
                aria-label="Remove equipment filter"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          {selectedLevel !== 'ALL' && (
            <Badge variant="neutral" className="gap-1 text-[11px] py-0.5">
              <span>Level: {selectedLevel}</span>
              <button
                onClick={() => setSelectedLevel('ALL')}
                className="hover:text-white cursor-pointer ml-0.5"
                aria-label="Remove level filter"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          <button
            onClick={handleResetFilters}
            className="text-[11px] text-neutral-400 hover:text-neutral-200 underline cursor-pointer ml-1"
          >
            Clear all
          </button>
        </section>
      )}

      {/* Exercise Grid / List */}
      <section id="exercise-list-section" className="space-y-2.5 pt-1">
        {exercises.length > 0 ? (
          <div className="grid grid-cols-1 gap-2.5">
            {exercises.map((exercise) => (
              <ExerciseCard
                key={exercise.id}
                exercise={exercise}
                onSelect={(ex) => setSelectedExercise(ex)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            id="empty-search-results"
            icon={<BookOpen className="w-6 h-6 text-neutral-400" />}
            title="No exercises match your criteria"
            description="Try adjusting your keywords, selecting a different movement category, or clearing filters."
            action={
              <Button
                id="empty-reset-filters-btn"
                variant="secondary"
                size="sm"
                onClick={handleResetFilters}
              >
                Reset All Filters
              </Button>
            }
          />
        )}
      </section>

      {/* Filter Bottom Sheet */}
      <ExerciseFilterSheet
        isOpen={isFilterSheetOpen}
        onClose={() => setIsFilterSheetOpen(false)}
        selectedCategory={selectedCategory}
        selectedEquipment={selectedEquipment}
        selectedLevel={selectedLevel}
        onSelectCategory={setSelectedCategory}
        onSelectEquipment={setSelectedEquipment}
        onSelectLevel={setSelectedLevel}
        onReset={handleResetFilters}
        totalFilteredCount={exercises.length}
      />

      {/* Exercise Detail Modal / Sheet */}
      <ExerciseDetailModal
        exercise={selectedExercise}
        onClose={() => setSelectedExercise(null)}
        onSelectExercise={(ex) => setSelectedExercise(ex)}
      />
    </motion.div>
  );
};
