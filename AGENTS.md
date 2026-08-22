# AGENTS.md — Workout PWA Engineering Rules

## 1. Product Principles
- **Follow, Don't Figure It Out**: Guide the user without decision fatigue.
- **Demonstrate, Don't Just Explain**: Prioritize visual movement demonstration over long text.
- **Progress, Don't Punish**: Focus on consistency and capability rather than shaming.
- **Capability Over Appearance**: Never make body size, appearance, or ranking a central metric.
- **AI Assists; System Governs**: AI must operate strictly through controlled domain tool contracts.
- **Local First**: Core training must function completely offline without accounts or cloud requirements.

## 2. Architecture & Domain Integrity
- Maintain clean boundaries: `app` | `features` | `domain` | `data` | `ai` | `media` | `ui`.
- The domain layer is the single source of truth. UI components must never contain workout generation or progression algorithms.
- Primary workout timers must use timestamp calculations (`intendedEndTime - currentTime`) to prevent background throttling drift.
- Local persistence belongs in repository adapters (IndexedDB/local storage), never scattered throughout React components.

## 3. Design System Standards
- Aesthetic: focused, calm, technical, athletic, human, minimal.
- Avoid generic AI slop: no purple-to-blue gradients, no ghost cards, no unnecessary rounded containers, no fake statistics.
- Mobile portrait first with >=44px touch targets. Maintain strict WCAG AA contrast.

## 4. Phase Discipline
- Implement strictly one phase at a time without jumping ahead or creating fake backend stubs.

## 5. AI Coach Invariants (Phase 9)
- **TrainingEngine is Authoritative; AI Coach is Advisory**: The AI Coach must NEVER directly control timers, segment transitions, workout state, exercise order, completion state, persistence, or progression decisions. AI output provides technique cues, pacing, explanations, and encouragement. The user and TrainingEngine remain in full control.
- **No Periodic Tick AI Triggers**: AI evaluations must only trigger on discrete domain events or direct user inquiries, never on repetitive timer ticks.
- **Safety Over Extravagance**: Strict refusal of injury diagnosis, medical prescriptions, extreme punishment encouragement, and aesthetic body comparisons. Stop and rest immediately on reported pain.

