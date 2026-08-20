# Phase 5: Local-First Persistence Architecture

## 1. Architectural Philosophy: Local-First

The Workout PWA is fundamentally local-first. Core training features function reliably without:
- An account or login requirement
- Cloud storage or remote servers
- Third-party tracking or telemetry
- Network connectivity

All workout snapshots, completed history logs, and user preferences reside directly in the client's browser database using IndexedDB.

---

## 2. IndexedDB Schema & Object Stores (Schema Version 1)

Database Name: `WorkoutAppDB`
Version: `1`

### Object Stores:

### 1. `training_sessions`
- **Purpose**: Persists in-flight active workout sessions for automatic checkpointing and interruption recovery.
- **Key Path**: `sessionId` (string)
- **Indexes**:
  - `by_workoutId`: For querying sessions associated with a specific workout.
  - `by_updatedAt`: For chronological retrieval of the most recent in-flight session.
  - `by_state`: For filtering active/preparing/paused/rest states from completed/abandoned.
- **Record Structure**:
  ```ts
  interface PersistedTrainingSession {
    sessionId: string;
    workoutId: string;
    workout: Workout;
    snapshot: TrainingStateSnapshot;
    state: TrainingState;
    createdAt: number;
    updatedAt: number;
  }
  ```

### 2. `completed_workouts`
- **Purpose**: Stores completed workout summaries, active durations, and segment-by-segment execution logs.
- **Key Path**: `id` (string, matching sessionId)
- **Indexes**:
  - `by_completedAt`: For reverse chronological history listing (newest first).
  - `by_workoutId`: For tracking performance across recurring workout routines.
  - `by_sessionId`: Unique index ensuring deduplication.
- **Record Structure**:
  ```ts
  interface PersistedCompletedWorkout {
    id: string;
    sessionId: string;
    workoutId: string;
    workoutTitle: string;
    workoutFocus: TrainingFocus;
    startedAt: number;
    completedAt: number;
    plannedDurationMs: number;
    actualDurationMs: number;
    totalActiveMs: number;
    totalPausedMs: number;
    completedSegmentsCount: number;
    skippedSegmentsCount: number;
    totalSegmentsCount: number;
    records: SegmentRecord[];
    createdAt: number;
  }
  ```

### 3. `user_preferences`
- **Purpose**: Stores local training preferences (experience level, equipment, default duration, training focus, warmup/cooldown settings).
- **Key Path**: `key` (string)
- **Record Structure**:
  ```ts
  interface PersistedPreferenceEntry<T> {
    key: string;
    value: T;
    updatedAt: number;
  }
  ```

---

## 3. Repositories Pattern

React components and UI views never access raw IndexedDB APIs or `localStorage` directly. All data access occurs through typed domain repositories:

1. **`TrainingSessionRepository`** (`src/data/repositories/training-session.repository.ts`):
   - `saveSession(session)` / `saveSnapshot(workout, snapshot)`: Persists in-flight session state.
   - `getSession(sessionId)`: Retrieves a specific session.
   - `getLatestIncompleteSession()`: Finds in-flight sessions that require recovery.
   - `checkInterruptedSession(staleThresholdMs)`: Validates snapshot integrity and calculates session age.
   - `deleteSession(sessionId)`: Deletes session upon completion or discard.
   - `clearAllSessions()`: Clears active sessions store.

2. **`CompletedWorkoutRepository`** (`src/data/repositories/completed-workout.repository.ts`):
   - `saveFromSession(workout, session)`: Transforms finished engine state into history record.
   - `getCompletedWorkouts(options)`: Lists history sorted descending by completion timestamp.
   - `deleteCompletedWorkout(id)`: Deletes individual workout history.
   - `clearCompletedWorkouts()`: Clears all history.
   - `getCount()`: Returns total count of completed workouts.

3. **`PreferencesRepository`** (`src/data/repositories/preferences.repository.ts`):
   - `getTrainingPreferences()`: Retrieves user preferences with safe domain defaults.
   - `saveTrainingPreferences(prefs)`: Merges and saves updated preferences.
   - `resetTrainingPreferences()`: Resets back to domain defaults.

---

## 4. Autosave Checkpoint Triggers vs. Timer Independence

To ensure high performance and prevent unnecessary database writes:
- **No Per-Tick Writes**: The 100ms UI render tick does **NOT** write to IndexedDB.
- **Event-Driven Checkpoints**: Checkpoints are persisted only on discrete state transitions:
  - Session Start (`START`)
  - Segment Transitions (`COMPLETE_SEGMENT`, `SKIP`, `PREVIOUS`)
  - Pause / Resume (`PAUSE`, `RESUME`)
  - Time Adjustments (`ADD_TIME`, `REDUCE_TIME`)
  - Automatic Segment Expiration (driven by timestamp calculation)
- **Lifecycle Events**:
  - `document.visibilityState === 'hidden'`: Captures snapshot when the user switches tabs or backgrounds the PWA.
  - `pagehide` / `beforeunload`: Captures snapshot during browser navigation or reload.
- **Completion / Abandonment**:
  - `COMPLETED`: Automatically saves record to `completed_workouts` and removes session from `training_sessions`.
  - `ABANDONED`: Removes session from `training_sessions`.

---

## 5. Interruption Recovery & Stale Session Policy

When the user opens the application after a crash, reload, or background termination:
1. The app calls `checkInterruptedSession()`.
2. If an in-flight snapshot is detected:
   - Snapshot is validated (`version === 1`, required fields present).
   - Age is calculated (`Date.now() - session.updatedAt`).
   - If `ageMs > 24 hours` (`DEFAULT_STALE_SESSION_THRESHOLD_MS`), the session is marked `isStale: true`.
3. **Explicit User Control**:
   - The user is presented with a Recovery Banner showing workout details and elapsed progress.
   - **Resume**: Recreates the training engine using `TrainingEngine.fromSnapshot(workout, snapshot)` and continues training seamlessly from the exact paused timestamp and segment.
   - **Discard**: Prompts confirmation and deletes the session.
   - **Zero Silent Mutation**: The system never silently resumes or deletes interrupted sessions without explicit user intent.

---

## 6. Privacy & Data Ownership

- **100% Client-Side**: No cloud accounts, external databases, or tracking scripts.
- **Data Erasure**: The Progress screen provides an "Erase All Local Data" capability that clears all IndexedDB stores with safety confirmation.
