import { useState, useEffect, useRef, useCallback } from 'react';
import { Workout } from '../../../domain/workouts/types';
import { TrainingEngine, TrainingEngineOptions } from '../../../domain/training-state/engine';
import {
  TrainingSession,
  TrainingState,
  TrainingSegment,
  TrainingEvent,
  DerivedTimingInfo,
} from '../../../domain/training-state/types';
import { Clock, defaultClock } from '../../../domain/training-state/clock';

export interface UseTrainingEngineOptions {
  autoStart?: boolean;
  clock?: Clock;
  engineOptions?: TrainingEngineOptions;
  onComplete?: (session: TrainingSession) => void;
  onAbandon?: (session: TrainingSession) => void;
}

export interface UseTrainingEngineReturn {
  engine: TrainingEngine;
  session: TrainingSession;
  state: TrainingState;
  currentSegment: TrainingSegment | null;
  nextSegment: TrainingSegment | null;
  timing: DerivedTimingInfo;
  isPaused: boolean;
  isActive: boolean;
  isComplete: boolean;
  isAbandoned: boolean;
  canGoPrevious: boolean;
  dispatch: (event: TrainingEvent) => void;
  start: () => void;
  pause: () => void;
  resume: () => void;
  togglePause: () => void;
  skip: () => void;
  previous: () => void;
  completeSegment: (repsCompleted?: number) => void;
  addTime: (seconds?: number) => void;
  reduceTime: (seconds?: number) => void;
  abandon: () => void;
  error: string | null;
  clearError: () => void;
}

export function useTrainingEngine(
  workout: Workout,
  options: UseTrainingEngineOptions = {}
): UseTrainingEngineReturn {
  const clock = options.clock || defaultClock;

  // Stable engine reference initialized once per workout ID
  const engineRef = useRef<TrainingEngine | null>(null);
  if (!engineRef.current || engineRef.current.getSession().workoutId !== workout.id) {
    engineRef.current = new TrainingEngine(workout, {
      clock,
      ...options.engineOptions,
    });
  }

  const engine = engineRef.current;

  // React state synchronized with engine state
  const [session, setSession] = useState<TrainingSession>(() => engine.getSession());
  const [timing, setTiming] = useState<DerivedTimingInfo>(() => engine.getDerivedTiming());
  const [error, setError] = useState<string | null>(null);

  // Sync React state from authoritative engine
  const syncState = useCallback(() => {
    if (!engineRef.current) return;
    const currentEngine = engineRef.current;
    const nextSession = currentEngine.getSession();
    const nextTiming = currentEngine.getDerivedTiming();

    setSession(nextSession);
    setTiming(nextTiming);
  }, []);

  // Safe dispatch wrapped with error handling
  const dispatch = useCallback(
    (event: TrainingEvent) => {
      if (!engineRef.current) return;
      try {
        setError(null);
        engineRef.current.dispatch(event);
        syncState();

        const updatedState = engineRef.current.getState();
        if (updatedState === 'COMPLETED' && options.onComplete) {
          options.onComplete(engineRef.current.getSession());
        } else if (updatedState === 'ABANDONED' && options.onAbandon) {
          options.onAbandon(engineRef.current.getSession());
        }
      } catch (err: any) {
        console.error('TrainingEngine dispatch error:', err);
        setError(err?.message || 'State transition error occurred.');
      }
    },
    [syncState, options]
  );

  // Periodic tick subscription: drives UI updates from authoritative timestamp math
  useEffect(() => {
    const activeStates: TrainingState[] = ['ACTIVE', 'PREPARING', 'REST'];

    // High-resolution 100ms interval for fluid MM:SS rendering and instant expiration transition
    const intervalId = window.setInterval(() => {
      if (!engineRef.current) return;
      const currentState = engineRef.current.getState();

      if (activeStates.includes(currentState)) {
        // Engine handles expiration internally on tick
        try {
          engineRef.current.dispatch({ type: 'TICK' });
        } catch (e) {
          // Ignored
        }
        syncState();
      }
    }, 100);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [syncState]);

  // Optional auto-start
  useEffect(() => {
    if (options.autoStart && engine.getState() === 'NOT_STARTED') {
      dispatch({ type: 'START' });
    }
  }, [options.autoStart, dispatch, engine]);

  const start = useCallback(() => dispatch({ type: 'START' }), [dispatch]);
  const pause = useCallback(() => dispatch({ type: 'PAUSE' }), [dispatch]);
  const resume = useCallback(() => dispatch({ type: 'RESUME' }), [dispatch]);
  const togglePause = useCallback(() => {
    if (engine.isPaused()) {
      dispatch({ type: 'RESUME' });
    } else {
      dispatch({ type: 'PAUSE' });
    }
  }, [dispatch, engine]);

  const skip = useCallback(() => dispatch({ type: 'SKIP' }), [dispatch]);
  const previous = useCallback(() => dispatch({ type: 'PREVIOUS' }), [dispatch]);
  const completeSegment = useCallback(
    (repsCompleted?: number) => dispatch({ type: 'COMPLETE_SEGMENT', repsCompleted }),
    [dispatch]
  );
  const addTime = useCallback(
    (seconds = 10) => dispatch({ type: 'ADD_TIME', seconds }),
    [dispatch]
  );
  const reduceTime = useCallback(
    (seconds = 10) => dispatch({ type: 'REDUCE_TIME', seconds }),
    [dispatch]
  );
  const abandon = useCallback(() => dispatch({ type: 'ABANDON' }), [dispatch]);
  const clearError = useCallback(() => setError(null), []);

  const state = session.state;
  const currentSegment = engine.getCurrentSegment();
  const nextSegment = engine.getNextSegment();
  const isPaused = state === 'PAUSED';
  const isActive = state === 'ACTIVE' || state === 'PREPARING' || state === 'REST';
  const isComplete = state === 'COMPLETED';
  const isAbandoned = state === 'ABANDONED';
  const canGoPrevious =
    session.currentSegmentIndex > 0 &&
    state !== 'NOT_STARTED' &&
    state !== 'COMPLETED' &&
    state !== 'ABANDONED';

  return {
    engine,
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
    dispatch,
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
  };
}
