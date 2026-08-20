/**
 * Training State Machine & Timestamp-Based Timing Engine
 * Pure domain/application runtime engine for executing a Workout session.
 * Fully decoupled from React, DOM, and UI rendering.
 */

import { Workout } from '../workouts/types';
import {
  TrainingState,
  TrainingSegment,
  TrainingSession,
  TrainingEvent,
  TrainingStateSnapshot,
  SegmentRecord,
  DerivedTimingInfo,
} from './types';
import { Clock, defaultClock } from './clock';
import { TrainingEngineError } from './errors';
import { buildTrainingSegments, SegmentBuilderOptions } from './segment-builder';

export interface TrainingEngineOptions {
  clock?: Clock;
  builderOptions?: SegmentBuilderOptions;
}

export class TrainingEngine {
  private session: TrainingSession;
  private readonly clock: Clock;

  constructor(workout: Workout, options: TrainingEngineOptions = {}) {
    this.clock = options.clock || defaultClock;

    const segments = buildTrainingSegments(workout, options.builderOptions);
    const sessionId = `session-${workout.id}-${this.clock.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

    this.session = {
      sessionId,
      workoutId: workout.id,
      workoutTitle: workout.title,
      state: 'NOT_STARTED',
      segments,
      currentSegmentIndex: 0,
      segmentStartTimestamp: null,
      segmentEndTimestamp: null,
      plannedSegmentDurationMs: 0,
      pausedAtTimestamp: null,
      accumulatedPauseMs: 0,
      sessionStartTimestamp: null,
      sessionEndTimestamp: null,
      totalSessionPausedMs: 0,
      records: [],
    };
  }

  /**
   * Reconstructs an engine instance deterministically from a serializable snapshot.
   */
  public static fromSnapshot(
    workout: Workout,
    snapshot: TrainingStateSnapshot,
    clock: Clock = defaultClock,
    builderOptions?: SegmentBuilderOptions
  ): TrainingEngine {
    if (!snapshot || snapshot.version !== 1 || snapshot.workoutId !== workout.id) {
      throw new TrainingEngineError(
        'INVALID_STATE_SNAPSHOT',
        `Snapshot does not match workout ID "${workout.id}" or snapshot version.`
      );
    }

    const engine = new TrainingEngine(workout, { clock, builderOptions });

    if (snapshot.currentSegmentIndex < 0 || snapshot.currentSegmentIndex >= engine.session.segments.length) {
      if (snapshot.state !== 'COMPLETED' && snapshot.state !== 'ABANDONED') {
        throw new TrainingEngineError(
          'INVALID_STATE_SNAPSHOT',
          `Segment index ${snapshot.currentSegmentIndex} out of bounds.`
        );
      }
    }

    engine.session = {
      sessionId: snapshot.sessionId,
      workoutId: snapshot.workoutId,
      workoutTitle: snapshot.workoutTitle,
      state: snapshot.state,
      previousStateBeforePause: snapshot.previousStateBeforePause,
      segments: engine.session.segments,
      currentSegmentIndex: snapshot.currentSegmentIndex,
      segmentStartTimestamp: snapshot.segmentStartTimestamp,
      segmentEndTimestamp: snapshot.segmentEndTimestamp,
      plannedSegmentDurationMs: snapshot.plannedSegmentDurationMs,
      pausedAtTimestamp: snapshot.pausedAtTimestamp,
      accumulatedPauseMs: snapshot.accumulatedPauseMs,
      sessionStartTimestamp: snapshot.sessionStartTimestamp,
      sessionEndTimestamp: snapshot.sessionEndTimestamp,
      totalSessionPausedMs: snapshot.totalSessionPausedMs,
      records: [...snapshot.records],
    };

    return engine;
  }

  // --------------------------------------------------------------------------
  // Dispatch & State Transition Mechanics
  // --------------------------------------------------------------------------

  public dispatch(event: TrainingEvent): Readonly<TrainingSession> {
    switch (event.type) {
      case 'START':
        this.handleStart();
        break;
      case 'PAUSE':
        this.handlePause();
        break;
      case 'RESUME':
        this.handleResume();
        break;
      case 'TICK':
        this.handleTick();
        break;
      case 'COMPLETE_SEGMENT':
        this.handleCompleteSegment(event.repsCompleted);
        break;
      case 'SKIP':
        this.handleSkip();
        break;
      case 'PREVIOUS':
        this.handlePrevious();
        break;
      case 'ADD_TIME':
        this.handleAddTime(event.seconds);
        break;
      case 'REDUCE_TIME':
        this.handleReduceTime(event.seconds);
        break;
      case 'COMPLETE_SESSION':
        this.handleCompleteSession();
        break;
      case 'ABANDON':
        this.handleAbandon();
        break;
      default:
        throw new TrainingEngineError(
          'INVALID_TRANSITION',
          `Unknown event type: ${(event as any).type}`
        );
    }

    return this.getSession();
  }

  // --------------------------------------------------------------------------
  // Event Handlers
  // --------------------------------------------------------------------------

  private handleStart(): void {
    if (this.session.state !== 'NOT_STARTED') {
      throw new TrainingEngineError(
        'INVALID_TRANSITION',
        `Cannot start session from state "${this.session.state}". Must be "NOT_STARTED".`
      );
    }

    const now = this.clock.now();
    this.session.sessionStartTimestamp = now;
    this.session.currentSegmentIndex = 0;

    this.startSegmentAtIndex(0, now);
  }

  private handlePause(): void {
    if (this.session.state === 'PAUSED') {
      return; // Idempotent
    }

    if (
      this.session.state !== 'ACTIVE' &&
      this.session.state !== 'PREPARING' &&
      this.session.state !== 'REST'
    ) {
      throw new TrainingEngineError(
        'INVALID_TRANSITION',
        `Cannot pause session from state "${this.session.state}".`
      );
    }

    const now = this.clock.now();
    this.session.previousStateBeforePause = this.session.state;
    this.session.pausedAtTimestamp = now;
    this.session.state = 'PAUSED';
  }

  private handleResume(): void {
    if (this.session.state !== 'PAUSED') {
      throw new TrainingEngineError(
        'INVALID_TRANSITION',
        `Cannot resume session from state "${this.session.state}". Must be "PAUSED".`
      );
    }

    const now = this.clock.now();
    const pauseStart = this.session.pausedAtTimestamp ?? now;
    const pauseDuration = Math.max(0, now - pauseStart);

    this.session.accumulatedPauseMs += pauseDuration;
    this.session.totalSessionPausedMs += pauseDuration;

    // Shift segment end timestamp into the future by the exact pause duration
    if (this.session.segmentEndTimestamp !== null) {
      this.session.segmentEndTimestamp += pauseDuration;
    }

    this.session.pausedAtTimestamp = null;
    this.session.state =
      this.session.previousStateBeforePause ||
      this.deriveStateForSegment(this.session.segments[this.session.currentSegmentIndex]);
  }

  private handleTick(): void {
    if (
      this.session.state !== 'ACTIVE' &&
      this.session.state !== 'PREPARING' &&
      this.session.state !== 'REST'
    ) {
      return;
    }

    const currentSegment = this.getCurrentSegment();
    if (!currentSegment || currentSegment.mode !== 'timed' || this.session.segmentEndTimestamp === null) {
      return;
    }

    const now = this.clock.now();
    if (now >= this.session.segmentEndTimestamp) {
      // Segment timer expired deterministically
      this.handleCompleteSegment();
    }
  }

  private handleCompleteSegment(repsCompleted?: number): void {
    if (
      this.session.state !== 'ACTIVE' &&
      this.session.state !== 'PREPARING' &&
      this.session.state !== 'REST' &&
      this.session.state !== 'PAUSED'
    ) {
      throw new TrainingEngineError(
        'INVALID_TRANSITION',
        `Cannot complete segment from state "${this.session.state}".`
      );
    }

    const now = this.clock.now();
    const currentSegment = this.getCurrentSegment();
    if (!currentSegment) {
      throw new TrainingEngineError('INVALID_SEGMENT', 'No active segment to complete.');
    }

    // Record completion
    const start = this.session.segmentStartTimestamp || now;
    const actualDuration = Math.max(0, now - start - this.session.accumulatedPauseMs);

    const record: SegmentRecord = {
      segmentId: currentSegment.id,
      segmentIndex: this.session.currentSegmentIndex,
      status: 'COMPLETED',
      actualDurationMs: actualDuration,
      completedReps:
        repsCompleted !== undefined
          ? repsCompleted
          : currentSegment.mode === 'reps'
          ? currentSegment.targetReps
          : undefined,
      startedAtTimestamp: start,
      endedAtTimestamp: now,
    };

    this.session.records.push(record);
    this.advanceToNextSegment(now);
  }

  private handleSkip(): void {
    if (
      this.session.state !== 'ACTIVE' &&
      this.session.state !== 'PREPARING' &&
      this.session.state !== 'REST' &&
      this.session.state !== 'PAUSED'
    ) {
      throw new TrainingEngineError(
        'INVALID_TRANSITION',
        `Cannot skip segment from state "${this.session.state}".`
      );
    }

    const now = this.clock.now();
    const currentSegment = this.getCurrentSegment();
    if (!currentSegment) {
      throw new TrainingEngineError('INVALID_SEGMENT', 'No active segment to skip.');
    }

    const start = this.session.segmentStartTimestamp || now;
    const actualDuration = Math.max(0, now - start - this.session.accumulatedPauseMs);

    const record: SegmentRecord = {
      segmentId: currentSegment.id,
      segmentIndex: this.session.currentSegmentIndex,
      status: 'SKIPPED',
      actualDurationMs: actualDuration,
      startedAtTimestamp: start,
      endedAtTimestamp: now,
    };

    this.session.records.push(record);
    this.advanceToNextSegment(now);
  }

  private handlePrevious(): void {
    if (
      this.session.state !== 'ACTIVE' &&
      this.session.state !== 'PREPARING' &&
      this.session.state !== 'REST' &&
      this.session.state !== 'PAUSED'
    ) {
      throw new TrainingEngineError(
        'INVALID_TRANSITION',
        `Cannot navigate to previous segment from state "${this.session.state}".`
      );
    }

    if (this.session.currentSegmentIndex <= 0) {
      throw new TrainingEngineError(
        'NO_PREVIOUS_SEGMENT',
        'Already at the first segment; cannot navigate to previous.'
      );
    }

    const prevIndex = this.session.currentSegmentIndex - 1;

    // Prune records of the previous and current segment to maintain pure sequential history
    this.session.records = this.session.records.filter((r) => r.segmentIndex < prevIndex);

    const now = this.clock.now();
    this.session.currentSegmentIndex = prevIndex;
    this.startSegmentAtIndex(prevIndex, now);
  }

  private handleAddTime(seconds?: number): void {
    if (
      this.session.state !== 'ACTIVE' &&
      this.session.state !== 'PREPARING' &&
      this.session.state !== 'REST' &&
      this.session.state !== 'PAUSED'
    ) {
      throw new TrainingEngineError(
        'INVALID_TRANSITION',
        `Cannot add time to segment in state "${this.session.state}".`
      );
    }

    const adjustmentSec = seconds ?? 10;
    if (adjustmentSec <= 0) {
      throw new TrainingEngineError(
        'INVALID_TIME_ADJUSTMENT',
        `Added time must be greater than 0 seconds. Received: ${adjustmentSec}`
      );
    }

    const currentSegment = this.getCurrentSegment();
    if (!currentSegment || currentSegment.mode !== 'timed') {
      return; // No-op for rep-based exercises
    }

    const adjustmentMs = adjustmentSec * 1000;
    this.session.plannedSegmentDurationMs += adjustmentMs;

    if (this.session.segmentEndTimestamp !== null) {
      this.session.segmentEndTimestamp += adjustmentMs;
    }
  }

  private handleReduceTime(seconds?: number): void {
    if (
      this.session.state !== 'ACTIVE' &&
      this.session.state !== 'PREPARING' &&
      this.session.state !== 'REST' &&
      this.session.state !== 'PAUSED'
    ) {
      throw new TrainingEngineError(
        'INVALID_TRANSITION',
        `Cannot reduce time in state "${this.session.state}".`
      );
    }

    const reductionSec = seconds ?? 10;
    if (reductionSec <= 0) {
      throw new TrainingEngineError(
        'INVALID_TIME_ADJUSTMENT',
        `Reduction time must be greater than 0 seconds. Received: ${reductionSec}`
      );
    }

    const currentSegment = this.getCurrentSegment();
    if (!currentSegment || currentSegment.mode !== 'timed' || this.session.segmentEndTimestamp === null) {
      return; // No-op for rep-based exercises
    }

    const now = this.clock.now();
    const reductionMs = reductionSec * 1000;
    const currentRemaining = this.getRemainingTimeMs();

    // Boundary rule: clamp to 1000ms (1 second) minimum remaining time, preventing negative or expired overshoot
    if (currentRemaining <= reductionMs + 1000) {
      const minRemainingMs = 1000;
      if (this.session.state === 'PAUSED') {
        const pauseTime = this.session.pausedAtTimestamp ?? now;
        this.session.segmentEndTimestamp = pauseTime + minRemainingMs;
      } else {
        this.session.segmentEndTimestamp = now + minRemainingMs;
      }
    } else {
      this.session.segmentEndTimestamp -= reductionMs;
    }
  }

  private handleCompleteSession(): void {
    if (this.session.state === 'COMPLETED' || this.session.state === 'ABANDONED') {
      throw new TrainingEngineError(
        'SESSION_ALREADY_COMPLETE',
        `Session is already ${this.session.state.toLowerCase()}.`
      );
    }

    const now = this.clock.now();
    this.session.state = 'COMPLETED';
    this.session.sessionEndTimestamp = now;
  }

  private handleAbandon(): void {
    if (this.session.state === 'COMPLETED' || this.session.state === 'ABANDONED') {
      return;
    }

    const now = this.clock.now();
    this.session.state = 'ABANDONED';
    this.session.sessionEndTimestamp = now;
  }

  // --------------------------------------------------------------------------
  // Internal Helpers
  // --------------------------------------------------------------------------

  private startSegmentAtIndex(index: number, now: number): void {
    const segment = this.session.segments[index];
    if (!segment) {
      this.session.state = 'COMPLETED';
      this.session.sessionEndTimestamp = now;
      return;
    }

    this.session.currentSegmentIndex = index;
    this.session.state = this.deriveStateForSegment(segment);
    this.session.segmentStartTimestamp = now;
    this.session.plannedSegmentDurationMs = segment.plannedDurationMs;
    this.session.pausedAtTimestamp = null;
    this.session.accumulatedPauseMs = 0;

    if (segment.mode === 'timed') {
      this.session.segmentEndTimestamp = now + segment.plannedDurationMs;
    } else {
      this.session.segmentEndTimestamp = null;
    }
  }

  private advanceToNextSegment(now: number): void {
    const nextIndex = this.session.currentSegmentIndex + 1;

    if (nextIndex >= this.session.segments.length) {
      this.session.state = 'COMPLETED';
      this.session.sessionEndTimestamp = now;
      this.session.segmentStartTimestamp = null;
      this.session.segmentEndTimestamp = null;
    } else {
      this.startSegmentAtIndex(nextIndex, now);
    }
  }

  private deriveStateForSegment(segment: TrainingSegment): 'PREPARING' | 'ACTIVE' | 'REST' {
    if (segment.type === 'PREPARATION') return 'PREPARING';
    if (segment.type === 'REST') return 'REST';
    return 'ACTIVE';
  }

  // --------------------------------------------------------------------------
  // Public Query & Timing APIs
  // --------------------------------------------------------------------------

  public getState(): TrainingState {
    // Proactively check if segment expired during passive query
    this.handleTick();
    return this.session.state;
  }

  public getSession(): Readonly<TrainingSession> {
    this.handleTick();
    return Object.freeze({ ...this.session });
  }

  public getCurrentSegment(): TrainingSegment | null {
    if (
      this.session.currentSegmentIndex < 0 ||
      this.session.currentSegmentIndex >= this.session.segments.length ||
      this.session.state === 'NOT_STARTED' ||
      this.session.state === 'COMPLETED' ||
      this.session.state === 'ABANDONED'
    ) {
      return null;
    }
    return this.session.segments[this.session.currentSegmentIndex] || null;
  }

  public getNextSegment(): TrainingSegment | null {
    const nextIdx = this.session.currentSegmentIndex + 1;
    if (nextIdx >= this.session.segments.length) {
      return null;
    }
    return this.session.segments[nextIdx] || null;
  }

  public isComplete(): boolean {
    return this.getState() === 'COMPLETED';
  }

  public isPaused(): boolean {
    return this.session.state === 'PAUSED';
  }

  public isActive(): boolean {
    const state = this.getState();
    return state === 'ACTIVE' || state === 'PREPARING' || state === 'REST';
  }

  public getRemainingTimeMs(): number {
    const currentSegment = this.getCurrentSegment();
    if (
      !currentSegment ||
      currentSegment.mode !== 'timed' ||
      this.session.segmentEndTimestamp === null
    ) {
      return 0;
    }

    if (this.session.state === 'PAUSED') {
      const pauseTime = this.session.pausedAtTimestamp ?? this.clock.now();
      return Math.max(0, this.session.segmentEndTimestamp - pauseTime);
    }

    const now = this.clock.now();
    return Math.max(0, this.session.segmentEndTimestamp - now);
  }

  public getRemainingTimeSec(): number {
    return Math.ceil(this.getRemainingTimeMs() / 1000);
  }

  public getElapsedSegmentMs(): number {
    if (this.session.segmentStartTimestamp === null) {
      return 0;
    }

    const now = this.clock.now();
    if (this.session.state === 'PAUSED') {
      const pauseTime = this.session.pausedAtTimestamp ?? now;
      return Math.max(0, pauseTime - this.session.segmentStartTimestamp - this.session.accumulatedPauseMs);
    }

    return Math.max(0, now - this.session.segmentStartTimestamp - this.session.accumulatedPauseMs);
  }

  public getElapsedSegmentSec(): number {
    return Math.floor(this.getElapsedSegmentMs() / 1000);
  }

  public getTotalSessionElapsedMs(): number {
    if (this.session.sessionStartTimestamp === null) {
      return 0;
    }
    const end = this.session.sessionEndTimestamp ?? this.clock.now();
    return Math.max(0, end - this.session.sessionStartTimestamp);
  }

  public getTotalSessionActiveMs(): number {
    if (this.session.sessionStartTimestamp === null) {
      return 0;
    }
    const total = this.getTotalSessionElapsedMs();
    let currentPauseActive = 0;
    if (this.session.state === 'PAUSED' && this.session.pausedAtTimestamp) {
      currentPauseActive = this.clock.now() - this.session.pausedAtTimestamp;
    }
    return Math.max(0, total - this.session.totalSessionPausedMs - currentPauseActive);
  }

  public getDerivedTiming(): DerivedTimingInfo {
    this.handleTick();

    const remainingMs = this.getRemainingTimeMs();
    const remainingSec = this.getRemainingTimeSec();
    const elapsedSegmentMs = this.getElapsedSegmentMs();
    const elapsedSegmentSec = this.getElapsedSegmentSec();
    const totalSessionElapsedMs = this.getTotalSessionElapsedMs();
    const totalSessionElapsedSec = Math.floor(totalSessionElapsedMs / 1000);
    const totalSessionActiveMs = this.getTotalSessionActiveMs();

    const currentSegment = this.getCurrentSegment();
    const plannedMs = this.session.plannedSegmentDurationMs || 1;
    const progressPercentage = currentSegment?.mode === 'timed'
      ? Math.min(1, Math.max(0, elapsedSegmentMs / plannedMs))
      : 0;

    return {
      remainingMs,
      remainingSec,
      elapsedSegmentMs,
      elapsedSegmentSec,
      totalSessionElapsedMs,
      totalSessionElapsedSec,
      totalSessionActiveMs,
      formattedRemaining: this.formatMMSS(remainingSec),
      formattedElapsed: this.formatMMSS(elapsedSegmentSec),
      progressPercentage,
      isExpired: remainingMs === 0 && currentSegment?.mode === 'timed',
    };
  }

  public getSnapshot(): TrainingStateSnapshot {
    return {
      version: 1,
      sessionId: this.session.sessionId,
      workoutId: this.session.workoutId,
      workoutTitle: this.session.workoutTitle,
      state: this.session.state,
      previousStateBeforePause: this.session.previousStateBeforePause,
      currentSegmentIndex: this.session.currentSegmentIndex,
      segmentStartTimestamp: this.session.segmentStartTimestamp,
      segmentEndTimestamp: this.session.segmentEndTimestamp,
      plannedSegmentDurationMs: this.session.plannedSegmentDurationMs,
      pausedAtTimestamp: this.session.pausedAtTimestamp,
      accumulatedPauseMs: this.session.accumulatedPauseMs,
      sessionStartTimestamp: this.session.sessionStartTimestamp,
      sessionEndTimestamp: this.session.sessionEndTimestamp,
      totalSessionPausedMs: this.session.totalSessionPausedMs,
      records: [...this.session.records],
      snapshotTimestamp: this.clock.now(),
    };
  }

  private formatMMSS(totalSeconds: number): string {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    const mm = mins.toString().padStart(2, '0');
    const ss = secs.toString().padStart(2, '0');
    return `${mm}:${ss}`;
  }
}
