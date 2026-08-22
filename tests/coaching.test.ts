/**
 * Phase 9 AI Coach System Test Suite
 * Comprehensive automated verification for:
 * - Safety guardrails (pain, diagnosis, extreme challenge, body shaming)
 * - Pure context derivation without hallucination
 * - Local deterministic coach & autonomy modes (OBSERVE, EXPLAIN, SUGGEST, COACH)
 * - Remote coach provider abstraction & timeout/offline fallback
 * - Message source transparency
 * - Voice boundary
 * - TrainingEngine isolation & user agency
 */

import {
  evaluateCoachingSafety,
  buildCoachContext,
  LocalCoachService,
  RemoteCoachService,
  RemoteAIProvider,
  BrowserVoiceService,
} from '../src/domain/ai';
import { Workout } from '../src/domain/workouts/types';
import { TrainingSession, TrainingSegment } from '../src/domain/training-state/types';
import { Exercise } from '../src/domain/exercises/types';

export async function runCoachingTests(): Promise<{ passed: boolean; report: string[]; failures: string[] }> {
  const report: string[] = [];
  const failures: string[] = [];

  const assert = (condition: boolean, description: string) => {
    if (condition) {
      report.push(`✓ ${description}`);
    } else {
      report.push(`✗ ${description}`);
      failures.push(description);
    }
  };

  // Mock domain entities for testing
  const mockExercise: Exercise = {
    id: 'pushup-standard',
    slug: 'pushup',
    name: 'Push-up',
    description: 'Standard foundational upper body horizontal push',
    category: 'PUSH',
    movementPattern: 'HORIZONTAL_PUSH',
    primaryMuscles: ['chest', 'triceps', 'shoulders'],
    secondaryMuscles: ['core'],
    equipment: 'NONE',
    experienceLevel: 'BEGINNER',
    instructions: {
      setup: ['Hands placed slightly wider than shoulder width', 'Plank posture on toes'],
      execution: ['Lower chest toward floor under control', 'Push back up strongly'],
      breathing: 'Inhale lowering, exhale pushing up',
      formCues: ['Keep your core tight', 'Elbows at 45 degrees', 'Full range of motion'],
      commonMistakes: ['Sagging hips', 'Flaring elbows'],
      safetyNotes: 'Keep wrists aligned under shoulders',
    },
  };

  const mockWorkout: Workout = {
    id: 'workout-test-1',
    title: 'Full Body Foundational',
    subtitle: 'Bodyweight Fundamentals',
    description: 'Targeted bodyweight training',
    focus: 'FULL_BODY',
    experienceLevel: 'BEGINNER',
    equipment: ['NONE'],
    requestedDurationMin: 15,
    estimatedDurationSec: 900,
    warmupExercises: [],
    mainExercises: [
      {
        id: 'we-1',
        exerciseId: 'pushup-standard',
        name: 'Push-up',
        slug: 'pushup',
        category: 'PUSH',
        order: 1,
        section: 'MAIN',
        mode: 'timed',
        targetDurationSec: 40,
        targetReps: 10,
        estimatedDurationSec: 40,
        restAfterSec: 30,
      },
    ],
    cooldownExercises: [],
    allExercises: [
      {
        id: 'we-1',
        exerciseId: 'pushup-standard',
        name: 'Push-up',
        slug: 'pushup',
        category: 'PUSH',
        order: 1,
        section: 'MAIN',
        mode: 'timed',
        targetDurationSec: 40,
        targetReps: 10,
        estimatedDurationSec: 40,
        restAfterSec: 30,
      },
    ],
    restSegments: [],
    totalWorkSec: 40,
    totalRestSec: 30,
    createdAt: '2026-01-01T00:00:00Z',
  };

  const mockSegments: TrainingSegment[] = [
    {
      id: 'seg-1',
      segmentIndex: 0,
      type: 'EXERCISE',
      section: 'MAIN',
      name: 'Push-up',
      category: 'PUSH',
      mode: 'timed',
      exerciseId: 'pushup-standard',
      targetDurationSec: 40,
      targetReps: 10,
      plannedDurationMs: 40000,
    },
    {
      id: 'seg-2',
      segmentIndex: 1,
      type: 'REST',
      section: 'MAIN',
      name: 'Rest',
      mode: 'timed',
      targetDurationSec: 30,
      plannedDurationMs: 30000,
    },
  ];

  const mockSession: TrainingSession = {
    sessionId: 'session-test-1',
    workoutId: 'workout-test-1',
    workoutTitle: 'Full Body Foundational',
    state: 'ACTIVE',
    currentSegmentIndex: 0,
    segments: mockSegments,
    segmentStartTimestamp: 1000,
    segmentEndTimestamp: 41000,
    plannedSegmentDurationMs: 40000,
    pausedAtTimestamp: null,
    accumulatedPauseMs: 0,
    sessionStartTimestamp: 1000,
    sessionEndTimestamp: null,
    totalSessionPausedMs: 0,
    records: [],
  };

  // -------------------------------------------------------------
  // 1. Safety Guardrails Tests
  // -------------------------------------------------------------
  try {
    const safeQuery = evaluateCoachingSafety('How do I keep my elbows aligned during a push-up?');
    assert(safeQuery.isSafe && safeQuery.flaggedCategory === 'NONE', 'Safety: Standard technique question passes as safe');

    const painQuery = evaluateCoachingSafety('I feel a sharp pain in my shoulder when lowering');
    assert(!painQuery.isSafe && painQuery.flaggedCategory === 'PAIN_OR_INJURY', 'Safety: Sharp pain is immediately flagged');
    assert(painQuery.safetyAdvice?.includes('stop') || false, 'Safety: Pain triggers stop and rest advice');

    const diagnosisQuery = evaluateCoachingSafety('Can you diagnose if my rotator cuff is torn?');
    assert(!diagnosisQuery.isSafe && diagnosisQuery.flaggedCategory === 'MEDICAL_DIAGNOSIS', 'Safety: Medical diagnosis request is flagged');

    const extremeQuery = evaluateCoachingSafety('I want to train until I vomit with no water');
    assert(!extremeQuery.isSafe && extremeQuery.flaggedCategory === 'EXTREME_CHALLENGE', 'Safety: Extreme punishment/dehydration is flagged');

    const bodyShameQuery = evaluateCoachingSafety('Am I too fat and ugly for this exercise?');
    assert(!bodyShameQuery.isSafe && bodyShameQuery.flaggedCategory === 'BODY_IMAGE', 'Safety: Body-shaming query is flagged with capability focus');
  } catch (err: any) {
    assert(false, `Safety Guardrails test failed with error: ${err.message}`);
  }

  // -------------------------------------------------------------
  // 2. Pure Context Builder Tests (Zero Hallucination)
  // -------------------------------------------------------------
  try {
    const context = buildCoachContext({
      workout: mockWorkout,
      session: mockSession,
      currentSegment: mockSegments[0],
      currentExercise: mockExercise,
      remainingTimeSec: 25,
      activeDemonstrationSource: 'THREE_D_TRAINER',
    });

    assert(context.workoutId === 'workout-test-1', 'ContextBuilder: accurately maps workout ID');
    assert(context.currentExercise?.name === 'Push-up', 'ContextBuilder: captures current exercise name');
    assert(context.currentExercise?.cues?.length === 3, 'ContextBuilder: preserves exercise cues');
    assert(context.remainingTimeSec === 25, 'ContextBuilder: captures derived remaining time');
    assert(context.activeDemonstrationSource === 'THREE_D_TRAINER', 'ContextBuilder: reflects active demonstration format');
    assert(context.completedSegmentsCount === 0, 'ContextBuilder: computes completed segments truthfully from session');
  } catch (err: any) {
    assert(false, `Context Builder test failed with error: ${err.message}`);
  }

  // -------------------------------------------------------------
  // 3. LocalCoachService & Autonomy Modes Tests
  // -------------------------------------------------------------
  try {
    const localCoach = new LocalCoachService('COACH', true);
    const context = buildCoachContext({
      workout: mockWorkout,
      session: mockSession,
      currentSegment: mockSegments[0],
      currentExercise: mockExercise,
      remainingTimeSec: 40,
    });

    // Test EVENT: EXERCISE_STARTED
    const exerciseResponse = await localCoach.handleEvent('EXERCISE_STARTED', context);
    assert(exerciseResponse !== null, 'LocalCoach: responds to EXERCISE_STARTED event');
    assert(exerciseResponse?.message.source === 'LOCAL_DETERMINISTIC', 'LocalCoach: marks message as LOCAL_DETERMINISTIC');
    assert(exerciseResponse?.message.content.includes(mockExercise.instructions.formCues[0]), 'LocalCoach: incorporates actual exercise cues');

    // Test EVENT: REST_STARTED
    const restResponse = await localCoach.handleEvent('REST_STARTED', { ...context, segmentType: 'REST' });
    assert(restResponse?.message.content.includes('breath') || restResponse?.message.content.includes('rest'), 'LocalCoach: provides breathing cue during rest');

    // Test User Q&A
    const easierQA = await localCoach.askQuestion('How can I make this easier?', context);
    assert(easierQA.message.content.toLowerCase().includes('regress') || easierQA.message.content.toLowerCase().includes('leverage'), 'LocalCoach: provides regression advice for easier prompt');

    const breathingQA = await localCoach.askQuestion('What is the breathing pattern?', context);
    assert(breathingQA.message.content.toLowerCase().includes('inhale') && breathingQA.message.content.toLowerCase().includes('exhale'), 'LocalCoach: explains inhalation and exhalation rhythm');

    // Autonomy Mode: OBSERVE (silent mode)
    localCoach.setMode('OBSERVE');
    const observeResponse = await localCoach.handleEvent('EXERCISE_STARTED', context);
    assert(observeResponse === null, 'LocalCoach: returns null in OBSERVE mode on unsolicited event');

    // Autonomy Mode: EXPLAIN (only responds to questions)
    localCoach.setMode('EXPLAIN');
    const explainEventResponse = await localCoach.handleEvent('EXERCISE_STARTED', context);
    assert(explainEventResponse === null, 'LocalCoach: returns null in EXPLAIN mode for unsolicited events');
    const explainQuestionResponse = await localCoach.askQuestion('Target muscles', context);
    assert(explainQuestionResponse !== null, 'LocalCoach: answers direct questions in EXPLAIN mode');

    // Disabled toggle
    localCoach.setEnabled(false);
    assert(localCoach.isEnabled() === false, 'LocalCoach: respects enabled state');
    const disabledResponse = await localCoach.handleEvent('WORKOUT_STARTED', context);
    assert(disabledResponse === null, 'LocalCoach: returns null when disabled');
  } catch (err: any) {
    assert(false, `LocalCoachService test failed with error: ${err.message}`);
  }

  // -------------------------------------------------------------
  // 4. RemoteCoachService & Graceful Fallback Tests
  // -------------------------------------------------------------
  try {
    // Mock successful provider
    const mockSuccessProvider: RemoteAIProvider = {
      generateCoachResponse: async () => {
        return `Maintain stable scapulae and push the floor away smoothly.`;
      },
    };

    const remoteCoach = new RemoteCoachService(mockSuccessProvider, new LocalCoachService('COACH', true));
    const context = buildCoachContext({
      workout: mockWorkout,
      session: mockSession,
      currentSegment: mockSegments[0],
      currentExercise: mockExercise,
    });

    const successResponse = await remoteCoach.handleEvent('EXERCISE_STARTED', context);
    assert(successResponse?.message.source === 'REMOTE_AI', 'RemoteCoach: marks successful remote call as REMOTE_AI');
    assert(successResponse?.message.content.includes('scapulae'), 'RemoteCoach: returns AI generated content');

    // Mock failing provider (network error / timeout)
    const mockFailingProvider: RemoteAIProvider = {
      generateCoachResponse: async () => {
        throw new Error('Network timeout');
      },
    };

    const failingRemoteCoach = new RemoteCoachService(mockFailingProvider, new LocalCoachService('COACH', true));
    const fallbackResponse = await failingRemoteCoach.handleEvent('EXERCISE_STARTED', context);
    assert(fallbackResponse !== null, 'RemoteCoach: falls back to LocalCoach on remote failure');
    assert(fallbackResponse?.message.source === 'LOCAL_DETERMINISTIC', 'RemoteCoach: fallback is correctly tagged as LOCAL_DETERMINISTIC');
  } catch (err: any) {
    assert(false, `RemoteCoachService test failed with error: ${err.message}`);
  }

  // -------------------------------------------------------------
  // 5. Voice Boundary Tests
  // -------------------------------------------------------------
  try {
    const voiceService = new BrowserVoiceService(false);
    assert(voiceService.isEnabled() === false, 'VoiceService: initial state is disabled');
    voiceService.setEnabled(true);
    assert(voiceService.isEnabled() === true, 'VoiceService: can enable voice');
    voiceService.stop(); // Safe execution without throwing
    assert(true, 'VoiceService: stop() executes safely without throwing');
  } catch (err: any) {
    assert(false, `VoiceService test failed with error: ${err.message}`);
  }

  // -------------------------------------------------------------
  // 6. TrainingEngine Isolation & Invariants
  // -------------------------------------------------------------
  try {
    // Verify session data was never mutated by coach operations
    assert(mockSession.state === 'ACTIVE', 'TrainingEngine Isolation: Session state remains unchanged by coach');
    assert(mockSession.currentSegmentIndex === 0, 'TrainingEngine Isolation: Segment index remains unaltered');
    assert(mockSession.segments.length === 2, 'TrainingEngine Isolation: Total segments count remains unaltered');
  } catch (err: any) {
    assert(false, `TrainingEngine Isolation test failed with error: ${err.message}`);
  }

  return {
    passed: failures.length === 0,
    report,
    failures,
  };
}
