# Training Player Architecture (Phase 4)

## 1. Architectural Role & Principles

The **Training Player** (`src/features/training/components/TrainingPlayer.tsx`) is the primary follow-along interactive surface of the Workout PWA.

### Core Invariant: Single Source of Truth
The Training Player does **not** maintain its own countdown timers, intervals, or state machines. All execution logic, remaining time calculations, performance records, and state transitions are strictly governed by the Phase 3 `TrainingEngine` (`src/domain/training-state/engine.ts`).

The React hook `useTrainingEngine` (`src/features/training/hooks/useTrainingEngine.ts`) binds the UI to this engine, querying timestamps and derived timing via `engine.getDerivedTiming()`.

```
┌────────────────────────────────────────────────────────┐
│                   Workout Domain                       │
│    (Deterministic Generator / Exercise Repository)     │
└──────────────────────────┬─────────────────────────────┘
                           │ Workout Plan
                           ▼
┌────────────────────────────────────────────────────────┐
│                   Training Engine                      │
│     - State Machine (PREPARING, ACTIVE, REST, ...)     │
│     - Timestamp Timing (intendedEndTime - now)         │
│     - Performance Records                              │
└──────────────────────────┬─────────────────────────────┘
                           │ Session / Derived Timing
                           ▼
┌────────────────────────────────────────────────────────┐
│                React Hook: useTrainingEngine           │
│     - 100ms Ticker for UI Re-renders                   │
│     - Action Dispatches (START, PAUSE, SKIP, ...)      │
└──────────────────────────┬─────────────────────────────┘
                           │
      ┌────────────────────┴────────────────────┐
      ▼                                         ▼
┌───────────────────────────────┐ ┌───────────────────────────────┐
│     TrainingPlayer (Stage)    │ │      TrainingControls         │
│ - PreparationView             │ │ - Play / Pause (Resume)       │
│ - Active Exercise Stage       │ │ - Skip / Previous             │
│ - RestView                    │ │ - Complete Reps               │
│ - WorkoutComplete             │ │ - +10s / -10s Adjustments     │
└───────────────────────────────┘ └───────────────────────────────┘
```

---

## 2. Component Hierarchy

1. **`TrainingPlayer.tsx`**: Top-level container coordinating stage routing, headers, and modals.
2. **`TrainingProgress.tsx`**: Overall progress bar, segment counters (`Segment 3 of 14`), section badges (`Warm-Up Phase`, `Main Work Circuit`, `Cooldown Phase`).
3. **`TrainingTimer.tsx`**: Large high-legibility digits (`MM:SS` or `Reps`), progress track, and state pill.
4. **`TrainingControls.tsx`**: Ergonomically sized touch targets (≥44px/56px) for Play/Pause, Skip, Previous, Rep completion, and ±10s time adjustments.
5. **`ExerciseDemonstration.tsx`**: Visual movement placeholder ready for Phase 7 (3D trainer / video animations) without modifying training algorithms.
6. **`ExerciseGuidance.tsx`**: Form cues, breathing patterns, setup instructions, and common mistake warnings from domain exercise metadata.
7. **`PreparationView.tsx`**: Dedicated preparation countdown with upcoming first exercise preview.
8. **`RestView.tsx`**: Dedicated rest interval countdown with next exercise preview.
9. **`WorkoutComplete.tsx`**: Honest session completion summary displaying active time, completed vs skipped segments, and adherence log without fake health metrics or calories.
10. **`AbandonConfirmModal.tsx`**: Safe confirmation dialog to prevent accidental session termination.

---

## 3. Ergonomics & Safety

- **Background Throttling Resistance**: Uses timestamp delta math (`intendedEndTime - currentTime`) to prevent drift when the browser is backgrounded or throttled.
- **Mobile First**: All touch targets meet or exceed 44×44px, optimized for one-handed operation during active movement.
- **Honest Metrics**: Never fabricates burned calories, heart rate scores, or medical claims.
- **Safe Quit**: Exiting requires explicit confirmation, dispatching `ABANDON` to the engine before returning to the hub.
