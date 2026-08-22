# Demonstration & Trainer System Architecture (Phase 7)

## 1. Overview & Core Product Intent

The Demonstration System is an independent, modular training visualizer for the Workout PWA. It enables users to **follow visual demonstrations** while preparing for, performing, or reviewing exercises.

### Core Principle
> **The Demonstration System is decoupled from the Training Engine.**

Switching or pausing a movement demonstration must **never**:
1. Reset the workout timer or alter elapsed time.
2. Advance, repeat, or alter the current exercise segment.
3. Modify workout progression records.
4. Mutate or reset the authoritative `TrainingEngine` snapshot.

---

## 2. Source Types

The domain model supports multiple distinct demonstration modalities per exercise:

| Source Type | Description | Current Status |
| :--- | :--- | :--- |
| `REAL_PERSON` | Athletic demonstration showing human movement cadence, posture, and tempo | **Active (Curated & Offline)** |
| `THREE_D_TRAINER` | Biomechanical kinematic model highlighting joints, skeletal alignment, and muscle tension vectors | **Active (Vector Kinematics)** |
| `FUTURE_AI_GENERATED` | Generative biomechanical adaptation layer | *Reserved for future phase* |
| `FUTURE_EXTERNAL_VIDEO` | Embedded video source | *Reserved for Phase 8* |

---

## 3. Fallback Hierarchy

When a user opens an exercise demonstration or progresses through a workout session:

```
+-------------------------------------------------------------+
| 1. Selected Demonstration (e.g. Real Person or 3D Trainer)   |
+-------------------------------------------------------------+
                              ↓ (if unavailable or offline)
+-------------------------------------------------------------+
| 2. Alternative Available Source for the same exercise       |
+-------------------------------------------------------------+
                              ↓ (if no media exists)
+-------------------------------------------------------------+
| 3. Explicit "Demonstration Unavailable" notification         |
+-------------------------------------------------------------+
                              ↓
+-------------------------------------------------------------+
| 4. Written Technique Guidance & Form Cues                   |
+-------------------------------------------------------------+
```

Never fabricate or simulate unavailable media. The system explicitly and politely communicates media availability while keeping the written movement cues immediately accessible.

---

## 4. Availability State Machine

Demonstration resolution is modeled via explicit states:

- `LOADING`: Initial asset lookup and capability resolution.
- `AVAILABLE`: One or more demonstration assets are ready for playback.
- `UNAVAILABLE`: No demonstration media exists or media requires an active internet connection when the client is offline.
- `ERROR`: An unexpected repository or decoding error occurred, providing a retry trigger.

---

## 5. Demonstration Switching & UI Integration

- **Carousel Navigation**: Users can switch between available demonstrations using previous/next buttons, dot indicators, or horizontal touch swipe gestures.
- **Accessible Touch Targets**: All interactive controls maintain $\ge 44\text{px}$ touch targets with visible focus rings and ARIA roles.
- **Training Player Integration**:
  - **Preparation State**: Previews the starting exercise demonstration so the user can set their posture before the active countdown.
  - **Active State**: Displays continuous, looped demonstration synchronized to segment tempo.
  - **Rest State**: Shows a demonstration preview of the *upcoming* exercise so the user can review movement mechanics during recovery.

---

## 6. Safety & Non-Medical Standards

Demonstrations are visual training guides designed to support proper exercise form and technique. They do not constitute medical advice or injury rehabilitation protocols. Technique cues emphasize controlled tempo, stable breathing, and training within a pain-free range of motion.
