import React, { useState, useEffect, useMemo } from 'react';
import { Workout } from '../../../domain/workouts/types';
import { ExerciseRepository, defaultExerciseRepository } from '../../../domain/exercises/repository';
import { useTrainingEngine } from '../hooks/useTrainingEngine';
import { Clock, defaultClock } from '../../../domain/training-state/clock';
import { TrainingProgress } from './TrainingProgress';
import { TrainingTimer } from './TrainingTimer';
import { TrainingControls } from './TrainingControls';
import { ExerciseDemonstration } from './ExerciseDemonstration';
import { ExerciseGuidance } from './ExerciseGuidance';
import { PreparationView } from './PreparationView';
import { RestView } from './RestView';
import { WorkoutComplete } from './WorkoutComplete';
import { AbandonConfirmModal } from './AbandonConfirmModal';
import { X, AlertCircle } from '../../../ui/icons';
import { TrainingStateSnapshot } from '../../../domain/training-state/types';

export interface TrainingPlayerProps {
  workout: Workout;
  initialSnapshot?: TrainingStateSnapshot;
  exerciseRepo?: ExerciseRepository;
  clock?: Clock;
  autoStart?: boolean;
  onExit: () => void;
  onSessionComplete?: () => void;
}

export const TrainingPlayer: React.FC<TrainingPlayerProps> = ({
  workout,
  initialSnapshot,
  exerciseRepo = defaultExerciseRepository,
  clock = defaultClock,
  autoStart = true,
  onExit,
  onSessionComplete,
}) => {
  const [showAbandonModal, setShowAbandonModal] = useState(false);
  const [allExercisesMap, setAllExercisesMap] = useState<Map<string, any>>(new Map());

  // Authoritative Training Engine Hook with Snapshot Restoration support
  const {
    session,
    state,
    currentSegment,
    nextSegment,
    timing,
    isPaused,
    isActive,
    isComplete,
    isAbandoned,
    canGoPrevious,
    start,
    pause,
    resume,
    togglePause,
    skip,
    previous,
    completeSegment,
    addTime,
    reduceTime,
    abandon,
    error,
    clearError,
  } = useTrainingEngine(workout, {
    autoStart: initialSnapshot ? false : autoStart,
    initialSnapshot,
    clock,
    onComplete: () => {
      if (onSessionComplete) onSessionComplete();
    },
  });

  // Load all exercise data for current workout
  useEffect(() => {
    let isMounted = true;
    const loadExercises = async () => {
      const ids = new Set<string>();
      workout.warmupExercises.forEach((e) => ids.add(e.exerciseId));
      workout.mainExercises.forEach((e) => ids.add(e.exerciseId));
      workout.cooldownExercises.forEach((e) => ids.add(e.exerciseId));

      const map = new Map();
      for (const id of ids) {
        const ex = await exerciseRepo.getById(id);
        if (ex) map.set(id, ex);
      }
      if (isMounted) setAllExercisesMap(map);
    };
    loadExercises();
    return () => {
      isMounted = false;
    };
  }, [workout, exerciseRepo]);

  // Current and next exercise metadata
  const currentExerciseDetails = currentSegment?.exerciseId
    ? allExercisesMap.get(currentSegment.exerciseId) || null
    : null;

  const nextExerciseDetails = nextSegment?.exerciseId
    ? allExercisesMap.get(nextSegment.exerciseId) || null
    : null;

  // Handle Quit Request
  const handleExitRequest = () => {
    if (isComplete || isAbandoned || state === 'NOT_STARTED') {
      onExit();
    } else {
      setShowAbandonModal(true);
    }
  };

  const handleConfirmAbandon = () => {
    setShowAbandonModal(false);
    abandon();
    onExit();
  };

  // If completed, render full complete view
  if (isComplete) {
    return (
      <div id="training-player-container" className="w-full max-w-lg mx-auto p-4 sm:p-6 min-h-screen flex flex-col justify-center">
        <WorkoutComplete
          session={session}
          onReturnToHub={onExit}
          onRestartWorkout={() => {
            start();
          }}
        />
      </div>
    );
  }

  return (
    <div
      id="training-player-screen"
      className="w-full max-w-lg mx-auto min-h-screen flex flex-col justify-between p-4 sm:p-5 bg-neutral-950 text-neutral-100"
    >
      {/* 1. Player Top Header */}
      <header id="player-top-header" className="space-y-3 shrink-0">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h2 className="text-sm font-bold text-neutral-100 truncate max-w-[240px]">
              {workout.title}
            </h2>
            <span className="text-[11px] text-neutral-400 font-mono">
              {workout.requestedDurationMin}m • {workout.focus}
            </span>
          </div>

          <button
            type="button"
            id="player-exit-btn"
            aria-label="Exit active workout"
            onClick={handleExitRequest}
            className="flex items-center justify-center w-9 h-9 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Global Progress */}
        <TrainingProgress
          session={session}
          currentSegment={currentSegment}
        />
      </header>

      {/* 2. Error Banner (if transition failed) */}
      {error && (
        <div className="my-2 p-2.5 rounded-lg bg-red-950/60 border border-red-800 flex items-center justify-between text-xs text-red-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={clearError}
            className="font-mono underline text-neutral-300 ml-2"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 3. Core Stage Area (Routed dynamically by engine segment state) */}
      <main id="player-stage-main" className="flex-1 flex flex-col justify-center py-3 space-y-4">
        {state === 'PREPARING' && currentSegment && (
          <PreparationView
            currentSegment={currentSegment}
            nextSegment={nextSegment}
            timing={timing}
            state={state}
            nextExerciseDetails={nextExerciseDetails}
          />
        )}

        {state === 'REST' && currentSegment && (
          <RestView
            currentSegment={currentSegment}
            nextSegment={nextSegment}
            timing={timing}
            state={state}
            nextExerciseDetails={nextExerciseDetails}
          />
        )}

        {(state === 'ACTIVE' || state === 'PAUSED') && currentSegment && (
          <div className="space-y-3.5 animate-in fade-in duration-150">
            {/* Visual Movement Stage / Demonstration Frame */}
            <ExerciseDemonstration
              segment={currentSegment}
              exerciseDetails={currentExerciseDetails}
            />

            {/* Central Precision Timing / Reps Display */}
            <TrainingTimer
              segment={currentSegment}
              timing={timing}
              state={state}
            />

            {/* Exercise Guidance / Form Cues */}
            <ExerciseGuidance
              segment={currentSegment}
              exerciseDetails={currentExerciseDetails}
            />
          </div>
        )}
      </main>

      {/* 4. Ergonomic Bottom Controls */}
      <footer id="player-bottom-footer" className="shrink-0 pt-2">
        <TrainingControls
          segment={currentSegment}
          state={state}
          canGoPrevious={canGoPrevious}
          onTogglePause={togglePause}
          onSkip={skip}
          onPrevious={previous}
          onCompleteSegment={completeSegment}
          onAddTime={addTime}
          onReduceTime={reduceTime}
        />
      </footer>

      {/* 5. Safe Abandon Confirmation Dialog */}
      <AbandonConfirmModal
        isOpen={showAbandonModal}
        onCancel={() => setShowAbandonModal(false)}
        onConfirmAbandon={handleConfirmAbandon}
      />
    </div>
  );
};
