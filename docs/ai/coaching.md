# AI Coach System Architecture (Phase 9)

## 1. Overview & Core Invariant

The **AI Coach System** introduces an advisory intelligence layer into Workout PWA.

### The Golden Invariant
> **TrainingEngine is Authoritative; AI Coach is Advisory.**

The AI Coach must **never** directly control:
- Timers or clock ticks
- Segment transitions (Preparation → Active → Rest → Complete)
- Workout execution state
- Exercise order or workout composition
- Completion or abandonment states
- Local persistence or database records
- Progression / Regression decisions

The AI Coach observes domain events and user inquiries to provide concise technique cues, breathing patterns, movement regressions, and encouragement. The user and the TrainingEngine remain in complete control.

---

## 2. Architectural Boundaries

```
┌────────────────────────────────────────────────────────┐
│                     UI Layer                           │
│  [TrainingPlayer] ──> renders ──> [CoachPanel]         │
│          │                               │             │
│          ▼                               ▼             │
│  [TrainingEngine] ──(events)──> [CoachService]         │
│  (Authoritative State)           (Advisory Intelligence)
└────────────────────────────────────────────────────────┘
```

- **`TrainingEngine`**: Authoritative single source of truth for workout progression and timing.
- **`CoachService`**: Pluggable abstraction supporting deterministic local coaching (`LocalCoachService`) and remote AI (`RemoteCoachService`).
- **`CoachContext`**: Pure data snapshot derived from engine state (no hallucinated reps, metrics, or visual claims).
- **`evaluateCoachingSafety`**: Synchronous pre- and post-generation safety filter.
- **`VoiceService`**: Optional Web Speech API wrapper for hands-free audio cues.

---

## 3. Autonomy Modes

Users can adjust the coach's autonomy level at any time:

1. **`OBSERVE` (Silent)**:
   - The coach remains silent. No unsolicited cues are generated during workout events.
2. **`EXPLAIN` (On-Demand)**:
   - Cues are only delivered when the user explicitly taps "Ask" or taps a suggestion chip.
3. **`SUGGEST` (Milestones)**:
   - Provides brief coaching only at major milestones (`WORKOUT_STARTED`, `EXERCISE_STARTED`, `WORKOUT_COMPLETED`).
4. **`COACH` (Full Guidance)**:
   - Provides concise 1–2 sentence technique cues on all transitions (`EXERCISE_STARTED`, `REST_STARTED`, `EXERCISE_COMPLETED`, `EXERCISE_SKIPPED`, etc.).

---

## 4. Safety Guardrails & Principles

The AI Coach strictly enforces non-negotiable safety rules:

- **Pain & Physical Distress**: Any report of acute pain, sharp aches, joint clicking with swelling, dizziness, or shortness of breath triggers an immediate safety notice:
  > *"Please stop the current exercise and rest immediately. Training through pain can cause or worsen injury. If pain persists, consult a qualified healthcare provider."*
- **No Medical Diagnosis or Prescription**: Refuses requests to diagnose tears, strains, or recommend pharmaceuticals.
- **No Extreme Training / Punishment**: Refuses requests for dangerous challenges, dehydration, or training to collapse.
- **No Body-Image Shaming**: Explicitly rejects aesthetic body-ranking, spot-reduction myths, and appearance-based value metrics. Focuses exclusively on movement capability and consistency.

---

## 5. Event-Driven Architecture (No Timer Tick Polling)

To prevent resource exhaustion, battery drain, and cognitive clutter:
- The coach **never** triggers on every timer tick.
- The coach **only** evaluates cues on discrete domain events (`WORKOUT_STARTED`, `EXERCISE_STARTED`, `REST_STARTED`, `EXERCISE_COMPLETED`, `EXERCISE_SKIPPED`, `WORKOUT_COMPLETED`, `DEMONSTRATION_CHANGED`) or explicit user questions.

---

## 6. Offline First & Transparency

- **Deterministic Local Engine**: `LocalCoachService` provides 100% offline, zero-latency coaching cues derived directly from exercise movement taxonomy and coaching cues.
- **Graceful Fallback**: If remote AI is configured but encounters a network failure, timeout (4000ms), or offline status, the system instantly and silently falls back to local coaching.
- **Source Transparency**: Every message clearly identifies its origin via the `source` field (`LOCAL_DETERMINISTIC` vs `REMOTE_AI`).
