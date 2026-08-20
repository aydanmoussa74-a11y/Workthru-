import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Card } from '../../ui/components/Card';
import { Badge } from '../../ui/components/Badge';
import { EmptyState } from '../../ui/components/EmptyState';
import { BookOpen, Dumbbell } from '../../ui/icons';
import { screenTransition } from '../../ui/motion/transitions';
import { classNames } from '../../lib/utils';

const CATEGORIES = [
  'All',
  'Push',
  'Pull',
  'Squat',
  'Hinge',
  'Core',
  'Mobility',
];

export const LibraryScreen: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  return (
    <motion.div
      id="library-screen"
      {...screenTransition}
      className="flex flex-col gap-5"
    >
      <section id="library-header" className="space-y-1">
        <p className="text-xs font-mono uppercase tracking-widest text-neutral-400">
          Movement Catalog
        </p>
        <h2 className="text-2xl font-bold tracking-tight text-neutral-100">
          Exercise Library
        </h2>
        <p className="text-sm text-neutral-400">
          Calisthenics, movement patterns, and visual technique cues.
        </p>
      </section>

      {/* Category Pills Bar */}
      <section id="library-categories" className="overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex items-center gap-1.5 min-w-max">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              id={`cat-pill-${cat.toLowerCase()}`}
              onClick={() => setSelectedCategory(cat)}
              className={classNames(
                'px-3.5 py-1.5 text-xs font-medium rounded-full transition-all cursor-pointer select-none whitespace-nowrap min-h-[36px]',
                selectedCategory === cat
                  ? 'bg-neutral-100 text-neutral-950 font-semibold'
                  : 'bg-neutral-900 text-neutral-400 border border-neutral-800 hover:text-neutral-200'
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Honest Catalog Empty State */}
      <EmptyState
        id="empty-library-state"
        icon={<BookOpen className="w-6 h-6 text-neutral-400" />}
        title="Exercise Catalog Initializing"
        description="The structured exercise repository with movement animations, video demonstrations, and regression ladders will be added in Phase 1: Exercise Domain + Exercise Library."
      />

      {/* Library Schema Foundation */}
      <section id="library-schema-foundation" className="space-y-2">
        <h3 className="text-xs font-mono uppercase tracking-wider text-neutral-400">
          Movement Framework
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <Card padding="sm" className="bg-neutral-900/40">
            <p className="text-xs font-semibold text-neutral-200">Demonstrate First</p>
            <p className="text-[11px] text-neutral-400 mt-0.5">
              Clear visual loop with concise technique cues.
            </p>
          </Card>
          <Card padding="sm" className="bg-neutral-900/40">
            <p className="text-xs font-semibold text-neutral-200">Scalable Ladders</p>
            <p className="text-[11px] text-neutral-400 mt-0.5">
              5-tier progressive difficulty per pattern.
            </p>
          </Card>
        </div>
      </section>
    </motion.div>
  );
};
