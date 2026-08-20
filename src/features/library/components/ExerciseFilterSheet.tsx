import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { EquipmentRequirement, ExperienceLevel, ExerciseCategory } from '../../../domain/exercises/types';
import { Button } from '../../../ui/components/Button';
import { IconButton } from '../../../ui/components/IconButton';
import { X, Check } from '../../../ui/icons';
import { classNames } from '../../../lib/utils';

interface ExerciseFilterSheetProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCategory: ExerciseCategory | 'ALL';
  selectedEquipment: EquipmentRequirement | 'ALL';
  selectedLevel: ExperienceLevel | 'ALL';
  onSelectCategory: (category: ExerciseCategory | 'ALL') => void;
  onSelectEquipment: (equipment: EquipmentRequirement | 'ALL') => void;
  onSelectLevel: (level: ExperienceLevel | 'ALL') => void;
  onReset: () => void;
  totalFilteredCount: number;
}

const EQUIPMENT_OPTIONS: Array<{ value: EquipmentRequirement | 'ALL'; label: string }> = [
  { value: 'ALL', label: 'All Equipment' },
  { value: 'NONE', label: 'No Equipment (Bodyweight)' },
  { value: 'WALL', label: 'Wall Support' },
  { value: 'CHAIR', label: 'Chair / Bench' },
  { value: 'RESISTANCE_BAND', label: 'Resistance Band' },
  { value: 'DUMBBELL', label: 'Dumbbell' },
];

const LEVEL_OPTIONS: Array<{ value: ExperienceLevel | 'ALL'; label: string }> = [
  { value: 'ALL', label: 'All Levels' },
  { value: 'BEGINNER', label: 'Beginner (Level 1)' },
  { value: 'INTERMEDIATE', label: 'Intermediate (Level 2)' },
  { value: 'ADVANCED', label: 'Advanced (Level 3)' },
];

export const ExerciseFilterSheet: React.FC<ExerciseFilterSheetProps> = ({
  isOpen,
  onClose,
  selectedEquipment,
  selectedLevel,
  onSelectEquipment,
  onSelectLevel,
  onReset,
  totalFilteredCount,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-neutral-950/80 backdrop-blur-xs"
        />

        {/* Modal / Bottom Sheet */}
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 280 }}
          className="relative w-full max-w-lg rounded-t-2xl sm:rounded-2xl bg-neutral-900 border border-neutral-800 p-5 shadow-2xl z-10 max-h-[85vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
            <div>
              <h3 className="text-base font-semibold text-neutral-100">Filter Exercises</h3>
              <p className="text-xs text-neutral-400">Refine by equipment and difficulty</p>
            </div>
            <IconButton
              id="close-filter-sheet-btn"
              aria-label="Close filters"
              size="sm"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </IconButton>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto py-4 space-y-5">
            {/* Equipment Group */}
            <div className="space-y-2">
              <label className="text-xs font-mono uppercase tracking-wider text-neutral-400">
                Equipment Needed
              </label>
              <div className="grid grid-cols-1 gap-1.5">
                {EQUIPMENT_OPTIONS.map((opt) => {
                  const isSelected = selectedEquipment === opt.value;
                  return (
                    <button
                      key={opt.value}
                      id={`filter-equip-${opt.value.toLowerCase()}`}
                      onClick={() => onSelectEquipment(opt.value)}
                      className={classNames(
                        'flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-xs font-medium transition-all text-left cursor-pointer min-h-[44px]',
                        isSelected
                          ? 'bg-neutral-100 text-neutral-950 border-neutral-100 font-semibold'
                          : 'bg-neutral-950/60 text-neutral-300 border-neutral-800 hover:bg-neutral-800'
                      )}
                    >
                      <span>{opt.label}</span>
                      {isSelected && <Check className="w-4 h-4 text-neutral-950" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Experience Level Group */}
            <div className="space-y-2">
              <label className="text-xs font-mono uppercase tracking-wider text-neutral-400">
                Experience Level
              </label>
              <div className="grid grid-cols-1 gap-1.5">
                {LEVEL_OPTIONS.map((opt) => {
                  const isSelected = selectedLevel === opt.value;
                  return (
                    <button
                      key={opt.value}
                      id={`filter-level-${opt.value.toLowerCase()}`}
                      onClick={() => onSelectLevel(opt.value)}
                      className={classNames(
                        'flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-xs font-medium transition-all text-left cursor-pointer min-h-[44px]',
                        isSelected
                          ? 'bg-neutral-100 text-neutral-950 border-neutral-100 font-semibold'
                          : 'bg-neutral-950/60 text-neutral-300 border-neutral-800 hover:bg-neutral-800'
                      )}
                    >
                      <span>{opt.label}</span>
                      {isSelected && <Check className="w-4 h-4 text-neutral-950" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer Controls */}
          <div className="pt-3 border-t border-neutral-800 flex items-center gap-2.5">
            <Button
              id="reset-filters-btn"
              variant="outline"
              size="md"
              onClick={onReset}
              className="flex-1"
            >
              Reset All
            </Button>
            <Button
              id="apply-filters-btn"
              variant="primary"
              size="md"
              onClick={onClose}
              className="flex-1"
            >
              Show {totalFilteredCount} {totalFilteredCount === 1 ? 'Exercise' : 'Exercises'}
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
