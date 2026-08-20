import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useApp } from '../../app/providers/AppProvider';
import { Card } from '../../ui/components/Card';
import { Button } from '../../ui/components/Button';
import { EmptyState } from '../../ui/components/EmptyState';
import { TrendingUp, Layers, Play, CheckCircle2, ShieldCheck, Activity } from '../../ui/icons';
import { screenTransition } from '../../ui/motion/transitions';
import { runAllTests } from '../../../tests/runner';

export const ProgressScreen: React.FC = () => {
  const { navigateTo } = useApp();
  const [testResults, setTestResults] = useState<{ passed: boolean; report: string[] } | null>(null);
  const [isRunningTests, setIsRunningTests] = useState(false);

  const handleRunDiagnostics = async () => {
    setIsRunningTests(true);
    try {
      const results = await runAllTests();
      setTestResults(results);
    } finally {
      setIsRunningTests(false);
    }
  };

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

      {/* Diagnostics & Verification Panel */}
      <section id="system-diagnostics-section" className="space-y-2">
        <h3 className="text-xs font-mono uppercase tracking-wider text-neutral-400">
          System Verification & Integrity
        </h3>
        <Card padding="sm" className="bg-neutral-900/60 border-neutral-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <div>
                <p className="text-xs font-semibold text-neutral-200">Phase 0–4 Automated Tests</p>
                <p className="text-[10px] text-neutral-400 font-mono">Exercises, Generator, State Engine & Player</p>
              </div>
            </div>
            <Button
              id="btn-run-all-tests"
              variant="secondary"
              size="sm"
              onClick={handleRunDiagnostics}
              disabled={isRunningTests}
              className="text-xs font-mono"
            >
              {isRunningTests ? 'Testing...' : 'Run Tests'}
            </Button>
          </div>

          {testResults && (
            <div className="pt-2 border-t border-neutral-800 space-y-1.5 font-mono text-xs">
              <div className={`p-2 rounded font-bold text-xs flex items-center gap-2 ${testResults.passed ? 'bg-emerald-950/50 text-emerald-300 border border-emerald-800/60' : 'bg-red-950/50 text-red-300 border border-red-800/60'}`}>
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{testResults.passed ? 'All Phase 0-4 Tests Passing' : 'Test Failures Detected'}</span>
              </div>
              <div className="space-y-1 pl-1 text-[11px] text-neutral-300">
                {testResults.report.map((line, idx) => (
                  <p key={idx} className={line.startsWith('✓') ? 'text-emerald-400' : 'text-red-400'}>
                    {line}
                  </p>
                ))}
              </div>
            </div>
          )}
        </Card>
      </section>

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

