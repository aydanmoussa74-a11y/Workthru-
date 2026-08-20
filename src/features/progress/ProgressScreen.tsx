import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { useApp } from '../../app/providers/AppProvider';
import { Card } from '../../ui/components/Card';
import { Button } from '../../ui/components/Button';
import { Badge } from '../../ui/components/Badge';
import { EmptyState } from '../../ui/components/EmptyState';
import {
  TrendingUp,
  Play,
  CheckCircle2,
  ShieldCheck,
  RotateCcw,
} from '../../ui/icons';
import { screenTransition } from '../../ui/motion/transitions';
import { runAllTests } from '../../../tests/runner';
import {
  defaultCompletedWorkoutRepository,
  defaultTrainingSessionRepository,
  defaultPreferencesRepository,
  clearAllLocalApplicationData,
} from '../../data/repositories';
import { PersistedCompletedWorkout, PersistedTrainingSession } from '../../data/local/types';
import { CompletedWorkoutList } from './components/CompletedWorkoutList';
import { DataManagementSection } from './components/DataManagementSection';
import { SessionRecoveryBanner } from '../training/components/SessionRecoveryBanner';

export const ProgressScreen: React.FC = () => {
  const { navigateTo } = useApp();
  const [completedWorkouts, setCompletedWorkouts] = useState<PersistedCompletedWorkout[]>([]);
  const [interruptedSession, setInterruptedSession] = useState<{
    session: PersistedTrainingSession | null;
    isStale: boolean;
    ageMs: number;
  }>({ session: null, isStale: false, ageMs: 0 });
  const [isLoading, setIsLoading] = useState(true);

  // Diagnostics state
  const [testResults, setTestResults] = useState<{ passed: boolean; report: string[] } | null>(null);
  const [isRunningTests, setIsRunningTests] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [workouts, recovery] = await Promise.all([
        defaultCompletedWorkoutRepository.getCompletedWorkouts(),
        defaultTrainingSessionRepository.checkInterruptedSession(),
      ]);
      setCompletedWorkouts(workouts);
      if (recovery.hasIncompleteSession && recovery.session) {
        setInterruptedSession({
          session: recovery.session,
          isStale: recovery.isStale,
          ageMs: recovery.ageMs,
        });
      } else {
        setInterruptedSession({ session: null, isStale: false, ageMs: 0 });
      }
    } catch (err) {
      console.error('Failed to load progress data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDeleteWorkout = async (id: string) => {
    await defaultCompletedWorkoutRepository.deleteCompletedWorkout(id);
    await loadData();
  };

  const handleClearHistory = async () => {
    await defaultCompletedWorkoutRepository.clearCompletedWorkouts();
    await loadData();
  };

  const handleClearAllData = async () => {
    await clearAllLocalApplicationData();
    await loadData();
  };

  const handleResetPreferences = async () => {
    await defaultPreferencesRepository.resetTrainingPreferences();
    await loadData();
  };

  const handleResumeInterrupted = (session: PersistedTrainingSession) => {
    // Navigate to train with the session to resume
    sessionStorage.setItem('resume_session_id', session.sessionId);
    navigateTo('train');
  };

  const handleDiscardInterrupted = async (sessionId: string) => {
    await defaultTrainingSessionRepository.deleteSession(sessionId);
    await loadData();
  };

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
        <div className="flex items-center gap-2">
          <Badge variant="outline" id="progress-phase-tag">
            Phase 5 • Local Persistence
          </Badge>
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-neutral-100">
          Your Progress
        </h2>
        <p className="text-sm text-neutral-400">
          Tracking consistency, completed workouts, and local history safely on this device.
        </p>
      </section>

      {/* Interrupted Session Recovery if detected */}
      {interruptedSession.session && (
        <SessionRecoveryBanner
          session={interruptedSession.session}
          isStale={interruptedSession.isStale}
          ageMs={interruptedSession.ageMs}
          onResume={handleResumeInterrupted}
          onDiscard={handleDiscardInterrupted}
        />
      )}

      {/* Main Content: Workouts List or Honest Empty State */}
      {completedWorkouts.length > 0 ? (
        <CompletedWorkoutList
          workouts={completedWorkouts}
          onDeleteWorkout={handleDeleteWorkout}
          onClearHistory={handleClearHistory}
        />
      ) : !isLoading ? (
        <EmptyState
          id="empty-progress-state"
          icon={<TrendingUp className="w-6 h-6 text-neutral-400" />}
          title="No completed workouts yet"
          description="Your workout history and completed session details will be recorded here locally in IndexedDB as you finish training sessions."
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
      ) : null}

      {/* Data Management & Local Privacy Section */}
      <DataManagementSection
        completedCount={completedWorkouts.length}
        hasIncompleteSession={!!interruptedSession.session}
        onClearAllData={handleClearAllData}
        onResetPreferences={handleResetPreferences}
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
                <p className="text-xs font-semibold text-neutral-200">Phase 0–5 Automated Tests</p>
                <p className="text-[10px] text-neutral-400 font-mono">
                  IndexedDB, Repositories, Autosave, Recovery & State Engine
                </p>
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
              <div
                className={`p-2 rounded font-bold text-xs flex items-center gap-2 ${
                  testResults.passed
                    ? 'bg-emerald-950/50 text-emerald-300 border border-emerald-800/60'
                    : 'bg-red-950/50 text-red-300 border border-red-800/60'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>
                  {testResults.passed
                    ? 'All Phase 0-5 Verification Tests Passing'
                    : 'Test Failures Detected'}
                </span>
              </div>
              <div className="space-y-1 pl-1 text-[11px] text-neutral-300 max-h-60 overflow-y-auto">
                {testResults.report.map((line, idx) => (
                  <p
                    key={idx}
                    className={line.startsWith('✓') ? 'text-emerald-400' : 'text-red-400'}
                  >
                    {line}
                  </p>
                ))}
              </div>
            </div>
          )}
        </Card>
      </section>
    </motion.div>
  );
};
