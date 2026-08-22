# Exercise Progression Engine Architecture

**Phase 6: Deterministic, Explainable, Conservative Progression Engine**

---

## 1. Core Philosophy: Progress, Don't Punish

The Workout PWA progression engine evaluates training history to produce clear, conservative, and fully explainable exercise progression recommendations.

### Guiding Principles:
1. **Earned Through Consistency**: Progression is earned through repeated, stable execution over multiple workouts, never by simply completing a single lucky session.
2. **Voluntary User Control**: The engine **never** automatically forces a user to advance or regress. Recommendations are transparent suggestions that the user explicitly chooses to accept or maintain.
3. **Conservative Regression**: Life events, fatigue, and occasional incomplete workouts are normal. Regression is suggested only after sustained consecutive difficulty (e.g. 3 consecutive skips/failures), never after a single off-day.
4. **Capability Over Appearance**: Progression metrics are strictly movement-based (completed sets, volume consistency, adherence). Body metrics (weight, BMI, body fat, calorie estimates) are strictly excluded.
5. **Deterministic & Auditable**: Given identical exposure history and rule configuration, the engine will always produce identical recommendations.

---

## 2. Rule Architecture & Versioning

The engine uses versioned rule definitions (`ruleVersion: 1`) to ensure deterministic historical evaluations.

### Standard Progression Rules (`DEFAULT_PROGRESSION_RULES` - v1):

| Rule Parameter | Value | Rationale |
| :--- | :--- | :--- |
| `ruleVersion` | `1` | Semantic version of active evaluation rules. |
| `minimumCompletedExposures` | `3` | Requires at least 3 successful completions before progression is eligible. |
| `minimumCompletionRatio` | `0.80` (80%) | Ensures high movement proficiency in the lookback window. |
| `minimumConsecutiveCompletions` | `2` | Requires immediate recent stability before advancing. |
| `lookbackWindow` | `5` | Evaluates recent capability rather than stale historical sessions. |
| `consecutiveSkippedThresholdForRegression` | `3` | Conservative threshold; prevents knee-jerk regression from isolated bad days. |
| `minimumExposuresForRegression` | `3` | Requires at least 3 total exposures before suggesting regression. |

---

## 3. Evaluation Lifecycle & Flow

```
Completed Workouts (IndexedDB)
         ↓
  History Adapter (extracts ExerciseExposure[])
         ↓
  Evidence Computation (lookback window = 5)
         ↓
  Deterministic Evaluator (evaluateProgression)
         ↓
  ProgressionEvaluation (Outcome + Confidence + Explanation)
         ↓
  Movement Ladder UI (Voluntary User Choice)
         ↓
  User Progression Preference (IndexedDB)
         ↓
  Workout Generator (Optional Substitution)
```

---

## 4. Recommendation Outcomes

| Recommendation | Condition | User Action |
| :--- | :--- | :--- |
| `PROGRESS` | 3+ completed exposures, ≥80% completion ratio, 2+ consecutive completions, progression variation exists. | Can accept next variation or keep current. |
| `MAINTAIN` | Baseline consistency established, but criteria for progression not yet met. | Continue building practice with current variation. |
| `REGRESS` | 3+ consecutive skips or severely incomplete sessions, regression variation exists. | Can opt to practice an accessible regression. |
| `INSUFFICIENT_DATA` | Fewer than 3 completed exposures recorded for this exercise. | Continue normal workouts until baseline is met. |
| `NO_PROGRESSION_AVAILABLE` | Meets progression criteria, but already at the top variation of the ladder. | Master variation maintained at maximum level. |

---

## 5. Movement Ladders in the Application

The application organizes foundational bodyweight and minimal-equipment movements into structured ladders:

1. **Push-Up Ladder**:
   - `Wall Push-Up` (Foundation / Wall)
   - `Incline Push-Up` (Beginner / Chair or Bench)
   - `Knee Push-Up` (Beginner / Floor)
   - `Standard Push-Up` (Intermediate / Floor)
   - `Diamond Push-Up` (Advanced / Triceps & Chest)
   - `Pike Push-Up` (Advanced / Vertical Shoulder Press)

2. **Squat & Lower Body Ladder**:
   - `Chair Squat / Assisted Squat` (Foundation)
   - `Bodyweight Squat` (Beginner)
   - `Split Squat` (Beginner / Unilateral)
   - `Reverse Lunge` (Intermediate)
   - `Bulgarian Split Squat` (Advanced)

3. **Core Stability & Plank Ladder**:
   - `Knee Plank` (Foundation)
   - `Forearm Plank` (Beginner)
   - `Side Plank` (Intermediate)
   - `Hollow Body Hold` (Advanced)

4. **Pull & Row Ladder**:
   - `Doorway Row` (Foundation)
   - `Inverted Table Row` (Intermediate)
   - `Negative Pull-Up` (Intermediate / Bar)
   - `Standard Pull-Up` (Advanced / Bar)

5. **Posterior Chain & Hinge Ladder**:
   - `Glute Bridge` (Foundation)
   - `Single-Leg Glute Bridge` (Intermediate)
   - `Good Morning` (Intermediate)

---

## 6. Voluntary Preference & Workout Generator Integration

When a user accepts a progression or selects a preferred variation:
1. The decision is saved to local storage (`user_progression_preferences` in `PreferencesRepository`).
2. When the user generates a new workout session, `WorkoutRequest.preferredVariations` provides the active variations.
3. The generator substitutes the preferred variation provided equipment and focus criteria are met.
4. If the user never changes variations, workouts generate with default foundational exercises.

---

## 7. Ethical Constraints & Safety Boundaries

- **Zero Shaming**: Incomplete sessions or skips are handled with constructive, non-judgmental guidance.
- **No Body Metrics**: The engine never requests or evaluates weight, waist circumference, calories, or physique photos.
- **No Medical Claims**: Progression advice relates strictly to exercise difficulty and movement volume, never medical diagnoses or rehabilitation guarantees.
