/**
 * AI Coach Domain Types (Phase 9)
 * Strongly-typed coaching layer adhering to strict advisory boundaries.
 * TrainingEngine is the single authoritative source of truth.
 */

/**
 * Autonomy and coaching modes:
 * - OBSERVE: No unsolicited coaching.
 * - EXPLAIN: Respond only to explicit user questions.
 * - SUGGEST: Provide contextual suggestions at meaningful workout events.
 * - COACH: Provide concise contextual coaching cues during meaningful workout events.
 */
export type CoachMode = 'OBSERVE' | 'EXPLAIN' | 'SUGGEST' | 'COACH';

/**
 * Meaningful workout lifecycle events that can trigger coaching cues.
 * Note: Remote AI / local coach is NEVER called on timer ticks.
 */
export type CoachEvent =
  | 'WORKOUT_STARTED'
  | 'EXERCISE_STARTED'
  | 'REST_STARTED'
  | 'EXERCISE_COMPLETED'
  | 'EXERCISE_SKIPPED'
  | 'WORKOUT_COMPLETED'
  | 'USER_ASKED'
  | 'DEMONSTRATION_CHANGED';

/** Message roles */
export type CoachMessageRole = 'coach' | 'user' | 'system';

/** Source indicator ensuring transparency between local heuristics and remote AI */
export type CoachSource = 'LOCAL_DETERMINISTIC' | 'REMOTE_AI';

/** Safety categories for proactive protection */
export type SafetyCategory =
  | 'PAIN_OR_INJURY'
  | 'MEDICAL_DIAGNOSIS'
  | 'EXTREME_CHALLENGE'
  | 'BODY_IMAGE'
  | 'NONE';

/** Evaluated safety status */
export interface CoachSafetyStatus {
  isSafe: boolean;
  flaggedCategory: SafetyCategory;
  safetyAdvice?: string;
}

/** Individual coaching message */
export interface CoachMessage {
  id: string;
  role: CoachMessageRole;
  content: string;
  timestamp: number;
  source: CoachSource;
  eventTrigger?: CoachEvent;
  suggestions?: string[];
  safetyStatus?: CoachSafetyStatus;
}

/** Structured context derived from current application state without inventing data */
export interface CoachContext {
  sessionId: string;
  workoutId: string;
  workoutTitle?: string;
  workoutFocus?: string;
  experienceLevel?: string;
  currentExercise?: {
    id: string;
    name: string;
    category?: string;
    targetMuscles?: string[];
    cues?: string[];
  } | null;
  currentSegment?: {
    index: number;
    type: string;
    targetDurationSec?: number;
    targetReps?: number;
    exerciseId?: string;
  } | null;
  segmentType?: string;
  remainingTimeSec?: number;
  completedSegmentsCount: number;
  skippedSegmentsCount: number;
  totalSegmentsCount: number;
  selectedVariation?: {
    id: string;
    name: string;
    difficultyDelta?: number;
  } | null;
  availableDemonstrations?: {
    count: number;
    sources: string[];
  };
  activeDemonstrationSource?: string;
  recentCoachMessages?: CoachMessage[];
}

/** Coach capabilities descriptor */
export interface CoachCapability {
  canExplain: boolean;
  canSuggest: boolean;
  canVoice: boolean;
  isRemoteOnline: boolean;
  activeMode: CoachMode;
}

/** Unified response from the coaching service */
export interface CoachResponse {
  message: CoachMessage;
  safetyStatus: CoachSafetyStatus;
  suggestedActions?: string[];
}

/** Core Coach Service interface */
export interface CoachService {
  /** Handle a meaningful workout lifecycle event */
  handleEvent(
    event: CoachEvent,
    context: CoachContext,
    extraPrompt?: string
  ): Promise<CoachResponse | null>;

  /** Answer a direct user question regarding form, movement, or training */
  askQuestion(
    question: string,
    context: CoachContext
  ): Promise<CoachResponse>;

  /** Get and set active coach mode */
  getMode(): CoachMode;
  setMode(mode: CoachMode): void;

  /** Get and set enabled state */
  isEnabled(): boolean;
  setEnabled(enabled: boolean): void;

  /** Inspect capabilities */
  getCapabilities(): CoachCapability;
}
