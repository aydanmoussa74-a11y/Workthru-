import React from 'react';
import { motion } from 'motion/react';
import { useApp } from '../../app/providers/AppProvider';
import { Card } from '../../ui/components/Card';
import { Button } from '../../ui/components/Button';
import { EmptyState } from '../../ui/components/EmptyState';
import { TrendingUp, Layers, Play } from '../../ui/icons';
import { screenTransition } from '../../ui/motion/transitions';

export const ProgressScreen: React.FC = () => {
  const { navigateTo } = useApp();

  return (
    <motion.div
      id="progress-screen"
      {...screenTransition}
      className="flex flex-col gap-5"
    >
      <section id="progress-header" className="space-y-1">
        <p className="text-xs font-mono uppercase tracking-widest text-neutral-400">
          Progression & History
        </p>
        <h2 className="text-2xl font-bold tracking-tight text-neutral-100">
          Your Progress
        </h2>
        <p className="text-sm text-neutral-400">
          Tracking consistency, movement quality, and progression over time.
        </p>
      </section>

      {/* Honest Empty State */}
      <EmptyState
        id="empty-progress-state"
        icon={<TrendingUp className="w-6 h-6 text-neutral-400" />}
        title="No workouts recorded yet"
        description="Your training history and progression insights will appear here after you complete your first workout session."
        action={
          <Button
            id="start-first-workout-btn"
            variant="primary"
            size="md"
            onClick={() => navigateTo('train')}
          >
            <Play className="w-4 h-4 fill-current mr-1.5" />
            Start First Workout
          </Button>
        }
      />

      {/* Progression Pillars Info */}
      <section id="progression-pillars" className="space-y-2">
        <h3 className="text-xs font-mono uppercase tracking-wider text-neutral-400">
          Progression Architecture
        </h3>
        <div className="grid grid-cols-1 gap-2.5">
          <Card padding="sm" className="bg-neutral-900/40">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-md bg-neutral-800 flex items-center justify-center text-neutral-300 mt-0.5">
                <Layers className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-neutral-200">Consistency First</p>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  Building regular movement habits without punishment or unsustainable challenges.
                </p>
              </div>
            </div>
          </Card>

          <Card padding="sm" className="bg-neutral-900/40">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-md bg-neutral-800 flex items-center justify-center text-neutral-300 mt-0.5">
                <Layers className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-neutral-200">Movement Mastery</p>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  Step-by-step variation advancements (e.g. Incline Push-Up → Standard Push-Up → Archer Push-Up).
                </p>
              </div>
            </div>
          </Card>
        </div>
      </section>
    </motion.div>
  );
};
