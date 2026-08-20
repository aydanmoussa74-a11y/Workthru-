# Architecture Overview — Workout PWA

## Structural Boundaries

The codebase enforces strict separation of concerns across architectural layers:

```
src/
├── app/          # Application shell, routing, global providers
├── features/     # Feature screen presentations (Home, Train, Progress, Library)
├── domain/       # Core business logic, entities, rules (Exercise, Workout, Progression, State)
├── data/         # Data persistence layers (Local StorageAdapter, Repositories, Sync)
├── ai/           # Controlled tool interfaces for AI coach
├── media/        # Video embeds, animations, audio cue abstractions
├── ui/           # Reusable atomic design system, icons, motion tokens
├── lib/          # Pure helper utilities
└── types/        # Global TypeScript type definitions
```

## Architectural Guidelines
1. **Domain Layer Authority:** The domain layer is the single source of truth for workouts, state transitions, and progression. The UI contains zero workout generation or timer algorithms.
2. **Timer Reliability:** Timers use timestamp differentials (`intendedEndTime - currentTime`) to prevent drift when backgrounded or throttled.
3. **Local-First Resilience:** The application is fully operable without network connection. Cloud sync is queue-based and non-blocking.
