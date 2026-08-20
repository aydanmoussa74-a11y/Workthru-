import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { useApp } from '../../app/providers/AppProvider';
import { Card } from '../../ui/components/Card';
import { Button } from '../../ui/components/Button';
import { Badge } from '../../ui/components/Badge';
import {
  Play,
  Clock,
  Dumbbell,
  ShieldCheck,
  Sparkles,
  RotateCcw,
  CheckCircle2,
} from '../../ui/icons';
import { screenTransition } from '../../ui/motion/transitions';
import {
  defaultTrainingSessionRepository,
  defaultCompletedWorkoutRepository,
} from '../../data/repositories';
import { PersistedTrainingSession } from '../../data/local/types';
import { SessionRecoveryBanner } from '../training/components/SessionRecoveryBanner';

export const HomeScreen: React.FC = () => {
  const { navigateTo } = useApp();
  const [interruptedSession, setInterruptedSession] = useState<{
    session: PersistedTrainingSession | null;
    isStale: boolean;
    ageMs: number;
  }>({ session: null, isStale: false, ageMs: 0 });
  const [completedCount, setCompletedCount] = useState<number>(0);

  const checkStatus = useCallback(async () => {
    try {
      const [recovery, count] = await Promise.all([
        defaultTrainingSessionRepository.checkInterruptedSession(),
        defaultCompletedWorkoutRepository.getCount(),
      ]);
      if (recovery.hasIncompleteSession && recovery.session) {
        setInterruptedSession({
          session: recovery.session,
          isStale: recovery.isStale,
          ageMs: recovery.ageMs,
        });
      } else {
        setInterruptedSession({ session: null, isStale: false, ageMs: 0 });
      }
      setCompletedCount(count);
    } catch (err) {
      console.warn('Failed to load status in HomeScreen:', err);
    }
  }, []);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  const handleResumeSession = (session: PersistedTrainingSession) => {
    sessionStorage.setItem('resume_session_id', session.sessionId);
    navigateTo('train');
  };

  const handleDiscardSession = async (sessionId: string) => {
    await defaultTrainingSessionRepository.deleteSession(sessionId);
    await checkStatus();
  };

  return (
    <motion.div
      id="home-screen"
      {...screenTransition}
      className="flex flex-col gap-5"
    >
      {/* Welcome & Daily Status */}
      <section id="home-greeting" className="space-y-1">
        <p className="text-xs font-mono uppercase tracking-widest text-neutral-400">
          Home Training Companion
        </p>
        <h2 className="text-2xl font-bold tracking-tight text-neutral-100">
          Ready to Train
        </h2>
        <p className="text-sm text-neutral-400">
          Open → Follow → Train → Progress.
        </p>
      </section>

      {/* Interrupted Session Recovery if detected */}
      {interruptedSession.session && (
        <SessionRecoveryBanner
          session={interruptedSession.session}
          isStale={interruptedSession.isStale}
          ageMs={interruptedSession.ageMs}
          onResume={handleResumeSession}
          onDiscard={handleDiscardSession}
        />
      )}

      {/* Featured Workout Card */}
      <section id="todays-workout-section">
        <Card id="todays-workout-card" className="relative overflow-hidden border-neutral-750 bg-neutral-900">
          <div className="flex items-start justify-between gap-3 mb-3">
            <Badge variant="accent" id="workout-tag">
              Today's Session
            </Badge>
            <div className="flex items-center gap-1.5 text-xs text-neutral-400">
              <Clock className="w-3.5 h-3.5" />
              <span>18 min</span>
            </div>
          </div>

          <div className="mb-4">
            <h3 className="text-lg font-bold text-neutral-100 tracking-tight">
              Bodyweight Foundation
            </h3>
            <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
              Full-body movement proficiency, joint mobility, and foundational bodyweight strength.
            </p>
          </div>

          {/* Training Parameters */}
          <div className="grid grid-cols-2 gap-2.5 mb-5 p-3 rounded-lg bg-neutral-950/70 border border-neutral-850">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-neutral-900 flex items-center justify-center text-neutral-300">
                <Dumbbell className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="text-[10px] text-neutral-400 uppercase font-mono">Equipment</p>
                <p className="text-xs font-medium text-neutral-200">No Equipment</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-neutral-900 flex items-center justify-center text-neutral-300">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="text-[10px] text-neutral-400 uppercase font-mono">Level</p>
                <p className="text-xs font-medium text-neutral-200">Adaptive / All Levels</p>
              </div>
            </div>
          </div>

          <Button
            id="start-training-btn"
            variant="primary"
            size="lg"
            fullWidth
            onClick={() => navigateTo('train')}
          >
            <Play className="w-4 h-4 fill-current mr-1" />
            Start Training
          </Button>
        </Card>
      </section>

      {/* Session State / Activity Summary */}
      <section id="session-state-section" className="space-y-2">
        <h3 className="text-xs font-mono uppercase tracking-wider text-neutral-400">
          Session Status
        </h3>
        <Card id="active-session-summary" padding="sm" className="bg-neutral-900/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-2 h-2 rounded-full ${
                  interruptedSession.session
                    ? 'bg-amber-400 ring-4 ring-amber-400/20'
                    : 'bg-emerald-500 ring-4 ring-emerald-500/10'
                }`}
              />
              <div>
                <p className="text-xs font-medium text-neutral-200">
                  {interruptedSession.session
                    ? 'In-Flight Session Interrupted'
                    : 'System Ready'}
                </p>
                <p className="text-[11px] text-neutral-400">
                  {interruptedSession.session
                    ? `${interruptedSession.session.workout.title} (in progress)`
                    : `${completedCount} completed sessions in local storage`}
                </p>
              </div>
            </div>
            <span className="text-[11px] font-mono text-neutral-400">Local-First</span>
          </div>
        </Card>
      </section>

      {/* Core Principles Architecture Card */}
      <section id="core-principles-section" className="space-y-2">
        <h3 className="text-xs font-mono uppercase tracking-wider text-neutral-400">
          Training Principles
        </h3>
        <div className="grid grid-cols-1 gap-2">
          <Card padding="sm" className="bg-neutral-900/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-neutral-400" />
                <div>
                  <p className="text-xs font-semibold text-neutral-200">Follow, Don't Figure It Out</p>
                  <p className="text-[11px] text-neutral-400">Structured guidance without decision fatigue.</p>
                </div>
              </div>
            </div>
          </Card>
          <Card padding="sm" className="bg-neutral-900/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-neutral-400" />
                <div>
                  <p className="text-xs font-semibold text-neutral-200">Capability Over Appearance</p>
                  <p className="text-[11px] text-neutral-400">Focus on consistency and movement quality.</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>
    </motion.div>
  );
};
