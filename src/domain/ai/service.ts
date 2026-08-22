/**
 * AI Coach Service Layer (Phase 9)
 * Provider-independent coach abstraction supporting deterministic local coaching and optional remote AI.
 * TrainingEngine remains the single authoritative source of truth.
 */

import {
  CoachContext,
  CoachEvent,
  CoachMode,
  CoachResponse,
  CoachService,
  CoachCapability,
  CoachMessage,
} from './types';
import { evaluateCoachingSafety } from './safety';
import { WORKOUT_AI_COACH_SYSTEM_INSTRUCTION } from './systemInstruction';

/**
 * Deterministic Local Coaching Implementation.
 * Provides 100% offline, zero-latency coaching cues and technique answers.
 */
export class LocalCoachService implements CoachService {
  private mode: CoachMode = 'COACH';
  private enabled: boolean = true;

  constructor(initialMode: CoachMode = 'COACH', initialEnabled: boolean = true) {
    this.mode = initialMode;
    this.enabled = initialEnabled;
  }

  public getMode(): CoachMode {
    return this.mode;
  }

  public setMode(mode: CoachMode): void {
    this.mode = mode;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  public getCapabilities(): CoachCapability {
    return {
      canExplain: true,
      canSuggest: true,
      canVoice: true,
      isRemoteOnline: false,
      activeMode: this.mode,
    };
  }

  /**
   * Generates deterministic local cues based on exercise physiology and workout state.
   */
  public async handleEvent(
    event: CoachEvent,
    context: CoachContext,
    extraPrompt?: string
  ): Promise<CoachResponse | null> {
    if (!this.enabled) return null;

    // Autonomy Gate: Check whether current mode permits unsolicited event cues
    if (this.mode === 'OBSERVE') return null;
    if (this.mode === 'EXPLAIN' && event !== 'USER_ASKED') return null;
    if (this.mode === 'SUGGEST') {
      const allowedEvents: CoachEvent[] = ['WORKOUT_STARTED', 'EXERCISE_STARTED', 'WORKOUT_COMPLETED', 'USER_ASKED'];
      if (!allowedEvents.includes(event)) return null;
    }

    const exName = context.currentExercise?.name || 'exercise';
    const cues = context.currentExercise?.cues || [];
    const primaryCue = cues.length > 0 ? cues[0] : 'Maintain smooth, controlled tempo and full range of motion.';

    let content = '';
    const suggestions: string[] = [];

    switch (event) {
      case 'WORKOUT_STARTED': {
        content = `Ready for ${context.workoutTitle || 'your workout'}. Focus on movement quality and clean form over speed.`;
        suggestions.push('Form breakdown', 'Breathing pattern');
        break;
      }
      case 'EXERCISE_STARTED': {
        const demoSource = context.activeDemonstrationSource;
        const demoNote = demoSource === 'THREE_D_TRAINER'
          ? 'Check joint alignment in the 3D model.'
          : demoSource === 'YOUTUBE_VIDEO'
          ? 'Follow the demonstration video tempo.'
          : 'Mirror the demonstration rhythm.';

        content = `${primaryCue} ${demoNote}`;
        suggestions.push('How to make it easier', 'Target muscles');
        break;
      }
      case 'REST_STARTED': {
        const remainingSec = context.remainingTimeSec ?? 30;
        content = `Take deep nasal breaths during this ${remainingSec}s rest. Shake out the tension and prepare for the next movement.`;
        suggestions.push('Preview next movement', 'Breathing tip');
        break;
      }
      case 'EXERCISE_COMPLETED': {
        content = `Solid effort on ${exName}. Quality repetitions build lasting foundation.`;
        break;
      }
      case 'EXERCISE_SKIPPED': {
        content = `Segment skipped. Listening to your body and fatigue levels is part of smart training.`;
        break;
      }
      case 'WORKOUT_COMPLETED': {
        const count = context.completedSegmentsCount;
        content = `Workout finished! You completed ${count} segments with dedication. Remember to hydrate and cool down.`;
        suggestions.push('Mobility cooldown', 'Log how it felt');
        break;
      }
      case 'DEMONSTRATION_CHANGED': {
        const source = context.activeDemonstrationSource || 'demonstration';
        const label = source === 'THREE_D_TRAINER' ? '3D Biomechanical wireframe' : source === 'YOUTUBE_VIDEO' ? 'YouTube video demonstration' : 'Athlete vector';
        content = `Viewing ${label}. Observe the active joint range and tension paths.`;
        break;
      }
      case 'USER_ASKED': {
        return this.askQuestion(extraPrompt || 'How do I perform this exercise?', context);
      }
      default:
        return null;
    }

    const message: CoachMessage = {
      id: `local-msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      role: 'coach',
      content,
      timestamp: Date.now(),
      source: 'LOCAL_DETERMINISTIC',
      eventTrigger: event,
      suggestions: suggestions.length > 0 ? suggestions : undefined,
    };

    return {
      message,
      safetyStatus: { isSafe: true, flaggedCategory: 'NONE' },
      suggestedActions: suggestions,
    };
  }

  /**
   * Deterministic Q&A responder for common form, modification, and breathing questions.
   */
  public async askQuestion(
    question: string,
    context: CoachContext
  ): Promise<CoachResponse> {
    const safety = evaluateCoachingSafety(question);
    if (!safety.isSafe) {
      const safetyMsg: CoachMessage = {
        id: `local-safety-${Date.now()}`,
        role: 'coach',
        content: safety.safetyAdvice || 'Please stop and rest immediately if you experience pain.',
        timestamp: Date.now(),
        source: 'LOCAL_DETERMINISTIC',
        eventTrigger: 'USER_ASKED',
        safetyStatus: safety,
      };
      return {
        message: safetyMsg,
        safetyStatus: safety,
      };
    }

    const q = question.toLowerCase();
    const ex = context.currentExercise;
    const exName = ex?.name || 'this exercise';
    let answer = '';
    const suggestions: string[] = [];

    if (q.includes('easier') || q.includes('modify') || q.includes('too hard') || q.includes('regression')) {
      answer = `To regress ${exName}, reduce leverage (e.g. place knees down or elevate hands) or slow down to a partial active range with strict control.`;
      suggestions.push('Show demonstration', 'Breathing cue');
    } else if (q.includes('harder') || q.includes('progression') || q.includes('too easy')) {
      answer = `To progress ${exName}, add a 2-second pause at maximum tension or increase range of motion and eccentric descent tempo.`;
      suggestions.push('Form breakdown');
    } else if (q.includes('breathe') || q.includes('breathing')) {
      answer = `For ${exName}: Inhale deeply through your nose during the lowering phase, then exhale firmly through your mouth as you push or pull.`;
      suggestions.push('Next cue');
    } else if (q.includes('muscle') || q.includes('target') || q.includes('working')) {
      const muscles = ex?.targetMuscles?.join(', ') || 'core and primary working joints';
      answer = `${exName} targets your ${muscles}. Focus on feeling tension in the targeted muscles rather than straining your joints.`;
      suggestions.push('Technique cue');
    } else if (q.includes('form') || q.includes('cue') || q.includes('technique') || q.includes('how')) {
      const cues = ex?.cues || [];
      const cueList = cues.length > 0 ? cues.join('. ') : 'Keep your core braced, ribs down, and shoulders engaged away from your ears.';
      answer = `Key cues for ${exName}: ${cueList}.`;
      suggestions.push('Make it easier', 'Breathing pattern');
    } else {
      answer = `Focus on controlled movement, solid joint positioning, and rhythmic breathing during ${exName}. Use the demonstration carousel to check your alignment.`;
      suggestions.push('Form breakdown', 'Make it easier');
    }

    const message: CoachMessage = {
      id: `local-qa-${Date.now()}`,
      role: 'coach',
      content: answer,
      timestamp: Date.now(),
      source: 'LOCAL_DETERMINISTIC',
      eventTrigger: 'USER_ASKED',
      suggestions,
    };

    return {
      message,
      safetyStatus: safety,
      suggestedActions: suggestions,
    };
  }
}

/**
 * Remote Coach Service Interface & Provider Adapter
 */
export interface RemoteAIProvider {
  generateCoachResponse(
    prompt: string,
    context: CoachContext,
    systemInstruction: string,
    signal?: AbortSignal
  ): Promise<string>;
}

/**
 * Standard Remote Coach Service with strict timeout and fallback triggers.
 */
export class RemoteCoachService implements CoachService {
  private provider: RemoteAIProvider | null = null;
  private localFallback: LocalCoachService;
  private mode: CoachMode = 'COACH';
  private enabled: boolean = true;
  private timeoutMs: number = 4000;

  constructor(
    provider: RemoteAIProvider | null = null,
    localFallback: LocalCoachService = new LocalCoachService(),
    timeoutMs: number = 4000
  ) {
    this.provider = provider;
    this.localFallback = localFallback;
    this.timeoutMs = timeoutMs;
  }

  public getMode(): CoachMode {
    return this.mode;
  }

  public setMode(mode: CoachMode): void {
    this.mode = mode;
    this.localFallback.setMode(mode);
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.localFallback.setEnabled(enabled);
  }

  public getCapabilities(): CoachCapability {
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    return {
      canExplain: true,
      canSuggest: true,
      canVoice: true,
      isRemoteOnline: !!this.provider && isOnline,
      activeMode: this.mode,
    };
  }

  public async handleEvent(
    event: CoachEvent,
    context: CoachContext,
    extraPrompt?: string
  ): Promise<CoachResponse | null> {
    if (!this.enabled) return null;

    // Autonomy Gate
    if (this.mode === 'OBSERVE') return null;
    if (this.mode === 'EXPLAIN' && event !== 'USER_ASKED') return null;
    if (this.mode === 'SUGGEST') {
      const allowedEvents: CoachEvent[] = ['WORKOUT_STARTED', 'EXERCISE_STARTED', 'WORKOUT_COMPLETED', 'USER_ASKED'];
      if (!allowedEvents.includes(event)) return null;
    }

    if (!this.provider || (typeof navigator !== 'undefined' && navigator.onLine === false)) {
      return this.localFallback.handleEvent(event, context, extraPrompt);
    }

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeoutMs);

      const prompt = `Workout Event: ${event}. Current Exercise: ${context.currentExercise?.name || 'None'}. Segment Type: ${context.segmentType || 'ACTIVE'}. ${extraPrompt ? `User prompt: ${extraPrompt}` : ''} Provide a 1-2 sentence concise coaching cue.`;

      const aiText = await this.provider.generateCoachResponse(
        prompt,
        context,
        WORKOUT_AI_COACH_SYSTEM_INSTRUCTION,
        controller.signal
      );
      clearTimeout(timer);

      if (!aiText || aiText.trim() === '') {
        return this.localFallback.handleEvent(event, context, extraPrompt);
      }

      const safety = evaluateCoachingSafety(aiText);
      const message: CoachMessage = {
        id: `remote-msg-${Date.now()}`,
        role: 'coach',
        content: safety.isSafe ? aiText.trim() : safety.safetyAdvice || aiText.trim(),
        timestamp: Date.now(),
        source: 'REMOTE_AI',
        eventTrigger: event,
        safetyStatus: safety,
      };

      return {
        message,
        safetyStatus: safety,
      };
    } catch {
      // On timeout, network, or provider error, gracefully fall back to local coaching
      return this.localFallback.handleEvent(event, context, extraPrompt);
    }
  }

  public async askQuestion(
    question: string,
    context: CoachContext
  ): Promise<CoachResponse> {
    // 1. Safety check user question before sending to remote
    const safety = evaluateCoachingSafety(question);
    if (!safety.isSafe) {
      return this.localFallback.askQuestion(question, context);
    }

    if (!this.provider || (typeof navigator !== 'undefined' && navigator.onLine === false)) {
      return this.localFallback.askQuestion(question, context);
    }

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeoutMs);

      const prompt = `User Question: "${question}". Current Exercise: ${context.currentExercise?.name || 'General'}. Respond with clear, practical technique or modification guidance.`;

      const aiText = await this.provider.generateCoachResponse(
        prompt,
        context,
        WORKOUT_AI_COACH_SYSTEM_INSTRUCTION,
        controller.signal
      );
      clearTimeout(timer);

      if (!aiText || aiText.trim() === '') {
        return this.localFallback.askQuestion(question, context);
      }

      const responseSafety = evaluateCoachingSafety(aiText);
      const message: CoachMessage = {
        id: `remote-qa-${Date.now()}`,
        role: 'coach',
        content: responseSafety.isSafe ? aiText.trim() : responseSafety.safetyAdvice || aiText.trim(),
        timestamp: Date.now(),
        source: 'REMOTE_AI',
        eventTrigger: 'USER_ASKED',
        safetyStatus: responseSafety,
      };

      return {
        message,
        safetyStatus: responseSafety,
      };
    } catch {
      return this.localFallback.askQuestion(question, context);
    }
  }
}

/**
 * Default Coach Service Singleton
 * Initializes with deterministic local coaching by default.
 */
export const defaultLocalCoachService = new LocalCoachService('COACH', true);
export const defaultCoachService: CoachService = new RemoteCoachService(null, defaultLocalCoachService);
