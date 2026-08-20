import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { Card } from '../../ui/components/Card';
import { Button } from '../../ui/components/Button';
import { Badge } from '../../ui/components/Badge';
import {
  Workout,
  WorkoutRequest,
  TrainingFocus,
} from '../../domain/workouts/types';
import {
  defaultWorkoutRepository,
  defaultExerciseRepository,
  defaultTrainingSessionRepository,
  defaultPreferencesRepository,
} from '../../data/repositories';
import { WorkoutBuilderForm } from './components/WorkoutBuilderForm';
import { WorkoutPresetCard } from './components/WorkoutPresetCard';
import { WorkoutPreview } from './components/WorkoutPreview';
import { TrainingPlayer } from './components/TrainingPlayer';
import { SessionRecoveryBanner } from './components/SessionRecoveryBanner';
import { PersistedTrainingSession } from '../../data/local/types';
import { screenTransition } from '../../ui/motion/transitions';
import { TrainingStateSnapshot } from '../../domain/training-state/types';

const PRESET_WORKOUTS = [
  {
    id: 'preset-starter',
    title: 'Starter Calisthenics',
    subtitle: 'Core bodyweight movements to build solid joint stability.',
    request: {
      durationMin: 12,
      trainingFocus: 'FULL_BODY' as TrainingFocus,
      experienceLevel: 'BEGINNER' as const,
      equipment: ['NONE' as const],
      includeWarmup: true,
      includeCooldown: true,
    },
  },
  {
    id: 'preset-core-focus',
    title: 'Core Stability & Hollow Body',
    subtitle: 'Focused midline tension and isometric endurance.',
    request: {
      durationMin: 10,
      trainingFocus: 'CORE' as TrainingFocus,
      experienceLevel: 'BEGINNER' as const,
      equipment: ['NONE' as const],
      includeWarmup: true,
      includeCooldown: false,
    },
  },
  {
    id: 'preset-push-power',
    title: 'Upper Body Push & Mobility',
    subtitle: 'Chest, shoulder, and tricep volume with wrist preparation.',
    request: {
      durationMin: 15,
      trainingFocus: 'PUSH' as TrainingFocus,
      experienceLevel: 'INTERMEDIATE' as const,
      equipment: ['NONE' as const],
      includeWarmup: true,
      includeCooldown: true,
    },
  },
];

export const TrainingScreen: React.FC = () => {
  // Generation & Active Workout States
  const [generatedWorkout, setGeneratedWorkout] = useState<Workout | null>(null);
  const [activeWorkoutForPlayer, setActiveWorkoutForPlayer] = useState<Workout | null>(null);
  const [activeInitialSnapshot, setActiveInitialSnapshot] = useState<TrainingStateSnapshot | undefined>(undefined);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Recovery State
  const [interruptedSession, setInterruptedSession] = useState<{
    session: PersistedTrainingSession | null;
    isStale: boolean;
    ageMs: number;
  }>({ session: null, isStale: false, ageMs: 0 });

  // Load recovery status
  const checkRecovery = useCallback(async () => {
    try {
      const result = await defaultTrainingSessionRepository.checkInterruptedSession();
      if (result.hasIncompleteSession && result.session) {
        setInterruptedSession({
          session: result.session,
          isStale: result.isStale,
          ageMs: result.ageMs,
        });

        // Check if there was a pending resume request from another screen
        const pendingResumeId = sessionStorage.getItem('resume_session_id');
        if (pendingResumeId && pendingResumeId === result.session.sessionId) {
          sessionStorage.removeItem('resume_session_id');
          handleResumeSession(result.session);
        }
      } else {
        setInterruptedSession({ session: null, isStale: false, ageMs: 0 });
      }
    } catch (err) {
      console.warn('Failed to check recovery in TrainingScreen:', err);
    }
  }, []);

  useEffect(() => {
    checkRecovery();
  }, [checkRecovery]);

  const handleGenerateCustom = async (request: WorkoutRequest) => {
    setIsGenerating(true);
    setErrorMsg(null);
    try {
      // Persist preferences
      await defaultPreferencesRepository.saveTrainingPreferences({
        experienceLevel: request.experienceLevel,
        equipment: request.equipment,
        defaultDurationMin: request.durationMin,
        trainingFocus: request.trainingFocus,
        includeWarmup: request.includeWarmup,
        includeCooldown: request.includeCooldown,
      });

      const workout = await defaultWorkoutRepository.generateWorkout(request);
      setGeneratedWorkout(workout);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to generate workout.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectPreset = async (request: WorkoutRequest) => {
    setIsGenerating(true);
    setErrorMsg(null);
    try {
      const workout = await defaultWorkoutRepository.generateWorkout(request);
      setGeneratedWorkout(workout);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load preset workout.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReconfigure = () => {
    setGeneratedWorkout(null);
    setErrorMsg(null);
  };

  const handleStartWorkout = (workout: Workout) => {
    setActiveWorkoutForPlayer(workout);
    setActiveInitialSnapshot(undefined);
  };

  const handleResumeSession = (persisted: PersistedTrainingSession) => {
    setActiveWorkoutForPlayer(persisted.workout);
    setActiveInitialSnapshot(persisted.snapshot);
  };

  const handleDiscardSession = async (sessionId: string) => {
    await defaultTrainingSessionRepository.deleteSession(sessionId);
    await checkRecovery();
  };

  const handleExitPlayer = () => {
    setActiveWorkoutForPlayer(null);
    setActiveInitialSnapshot(undefined);
    checkRecovery();
  };

  // If Training Player is active, render player directly
  if (activeWorkoutForPlayer) {
    return (
      <TrainingPlayer
        workout={activeWorkoutForPlayer}
        initialSnapshot={activeInitialSnapshot}
        exerciseRepo={defaultExerciseRepository}
        onExit={handleExitPlayer}
        onSessionComplete={handleExitPlayer}
      />
    );
  }

  return (
    <motion.div
      id="training-screen"
      {...screenTransition}
      className="flex flex-col gap-5"
    >
      {/* Screen Header */}
      <section id="training-header" className="space-y-1">
        <div className="flex items-center gap-2">
          <Badge variant="outline" id="training-phase-tag">
            Phase 5 • Local Persistence
          </Badge>
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-neutral-100">
          Training Hub
        </h2>
        <p className="text-sm text-neutral-400">
          Follow-along calisthenics sessions with real-time timestamp countdowns, guidance, and persistent local autosave.
        </p>
      </section>

      {/* Interrupted Session Recovery Banner */}
      {interruptedSession.session && (
        <SessionRecoveryBanner
          session={interruptedSession.session}
          isStale={interruptedSession.isStale}
          ageMs={interruptedSession.ageMs}
          onResume={handleResumeSession}
          onDiscard={handleDiscardSession}
        />
      )}

      {errorMsg && (
        <Card id="training-error-card" padding="sm" className="bg-red-950/40 border-red-800 text-red-200 text-xs">
          <p className="font-semibold">Generation Error</p>
          <p className="text-red-300 mt-0.5">{errorMsg}</p>
        </Card>
      )}

      {/* Main View: Either Generated Workout Preview OR Builder/Presets */}
      {generatedWorkout ? (
        <WorkoutPreview
          workout={generatedWorkout}
          exerciseRepo={defaultExerciseRepository}
          onReconfigure={handleReconfigure}
          onStartWorkout={handleStartWorkout}
        />
      ) : (
        <div className="space-y-4">
          <section id="builder-section">
            <WorkoutBuilderForm
              onGenerate={handleGenerateCustom}
              isGenerating={isGenerating}
            />
          </section>

          <section id="presets-section" className="space-y-2">
            <h3 className="text-xs font-mono uppercase tracking-wider text-neutral-400">
              Curated Preset Routines
            </h3>
            <div className="grid grid-cols-1 gap-2">
              {PRESET_WORKOUTS.map((preset) => (
                <WorkoutPresetCard
                  key={preset.id}
                  id={preset.id}
                  title={preset.title}
                  subtitle={preset.subtitle}
                  request={preset.request}
                  onSelect={handleSelectPreset}
                />
              ))}
            </div>
          </section>
        </div>
      )}
    </motion.div>
  );
};
