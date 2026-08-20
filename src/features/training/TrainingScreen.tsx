import React from 'react';
import { motion } from 'motion/react';
import { useApp } from '../../app/providers/AppProvider';
import { Card } from '../../ui/components/Card';
import { Button } from '../../ui/components/Button';
import { Badge } from '../../ui/components/Badge';
import { Flame, CheckCircle2, ArrowRight } from '../../ui/icons';
import { screenTransition } from '../../ui/motion/transitions';

export const TrainingScreen: React.FC = () => {
  const { navigateTo } = useApp();

  return (
    <motion.div
      id="training-screen"
      {...screenTransition}
      className="flex flex-col gap-5"
    >
      <section id="training-header" className="space-y-1">
        <div className="flex items-center gap-2">
          <Badge variant="outline" id="training-phase-tag">
            Phase 0 Foundation
          </Badge>
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-neutral-100">
          Training Hub
        </h2>
        <p className="text-sm text-neutral-400">
          Interactive follow-along workout execution environment.
        </p>
      </section>

      {/* Honest Architecture Notice */}
      <Card id="training-architecture-notice" className="border-neutral-750 bg-neutral-900/90">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-neutral-800 flex items-center justify-center text-neutral-200">
            <Flame className="w-5 h-5 text-neutral-200" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-neutral-100 tracking-tight">
              Workout Player Engine
            </h3>
            <p className="text-xs text-neutral-400">Scheduled for Phase 4</p>
          </div>
        </div>

        <p className="text-xs text-neutral-300 leading-relaxed mb-4">
          The Training Player will feature timestamp-based reliable timers, exercise video/trainer demonstrations, rep counters, auto-rest intervals, and session interruption recovery.
        </p>

        <div className="p-3 rounded-lg bg-neutral-950/80 border border-neutral-850 space-y-2 mb-4">
          <p className="text-[11px] font-mono uppercase text-neutral-400 tracking-wider">
            Player Architecture Specs:
          </p>
          <ul className="text-xs text-neutral-300 space-y-1.5 list-disc list-inside">
            <li>State Machine: PREPARING → ACTIVE → REST → COMPLETED</li>
            <li>Timestamp differential timers (immune to background throttling)</li>
            <li>Interactive controls: Pause, Skip, +30s, Previous, Rest</li>
          </ul>
        </div>

        <Button
          id="back-to-home-btn"
          variant="secondary"
          fullWidth
          onClick={() => navigateTo('home')}
        >
          Return to Home Overview
        </Button>
      </Card>

      {/* Pre-Workout Readiness Checklist */}
      <section id="training-readiness-section" className="space-y-2">
        <h3 className="text-xs font-mono uppercase tracking-wider text-neutral-400">
          Pre-Training Checklist
        </h3>
        <Card id="readiness-card" padding="sm" className="bg-neutral-900/40">
          <div className="space-y-2.5">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-xs text-neutral-200">Clear a 2x2 meter flat space</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-xs text-neutral-200">Keep water nearby</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-xs text-neutral-200">Wear comfortable attire or train barefoot</span>
            </div>
          </div>
        </Card>
      </section>
    </motion.div>
  );
};
