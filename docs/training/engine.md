# Training State Machine & Timestamp Timing Engine (Phase 3)

## 1. Architectural Role
The Training Engine (`src/domain/training-state/`) provides the deterministic runtime execution system for workouts. It is completely decoupled from React, DOM, browser rendering, and UI frameworks. The UI in Phase 4 (Training Player) will consume this engine.

## 2. Explicit State Lifecycle
The engine operates on strict, explicit state transitions:
```
                ┌──────────────┐
                │ NOT_STARTED  │
                └──────┬───────┘
                       │ START
                       ▼
┌───────────┐  next    ┌──────────────┐   next   ┌──────────────┐
│ PREPARING │ ───────> │    ACTIVE    │ ───────> │     REST     │
└─────┬─────┘ segment  └──────┬───────┘  segment └──────┬───────┘
      │                       │                         │
      │ PAUSE                 │ PAUSE                   │ PAUSE
      ▼                       ▼                         ▼
┌───────────────────────────────────────────────────────────────┐
│                            PAUSED                             │
└──────────────────────────────┬────────────────────────────────┘
                               │ RESUME
                               ▼
                    (Restores previous state)
                               │
            ┌──────────────────┴──────────────────┐
            │                                     │
            ▼ COMPLETE_SESSION / ALL DONE         ▼ ABANDON
    ┌───────────────┐                     ┌───────────────┐
    │   COMPLETED   │                     │   ABANDONED   │
    └───────────────┘                     └───────────────┘
```

## 3. Timestamp-Based Timing (Drift-Free)
To ensure reliable timing on mobile devices with background throttling, tab freezing, or execution suspension:
- **No naive `setInterval(() => remaining--, 1000)`**: The engine never decrements counters.
- **Timestamp Calculations**:
  - `remainingTime = Math.max(0, segmentEndTimestamp - now)`
  - `elapsedActiveTime = now - segmentStartTimestamp - accumulatedPauseMs`
- **Pause/Resume Shift**:
  - When paused at timestamp $T_{\text{pause}}$, time freeze is stored.
  - Upon resume at timestamp $T_{\text{resume}}$, delta $\Delta = T_{\text{resume}} - T_{\text{pause}}$ is computed.
  - `segmentEndTimestamp += \Delta`, shifting the finish point into the future by the exact pause duration.
  - `accumulatedPauseMs += \Delta`, preserving active work duration calculations.

## 4. Clock Abstraction & Deterministic Testing
- `Clock` interface allows zero-latency unit testing.
- `FakeClock` enables testing 60-minute workouts and background suspensions in sub-millisecond test executions without `setTimeout` or `sleep`.

## 5. Session Snapshots & Persistence Ready
- `engine.getSnapshot()` produces a serializable `TrainingStateSnapshot` capturing current segment, active timestamps, pause accumulators, and completed records.
- `TrainingEngine.fromSnapshot(workout, snapshot, clock)` deterministically rehydrates runtime state for page reloads or interruption recovery (Phase 5).
