# Workout PWA

Mobile-first, local-first interactive home-training companion.

> **Core Promise:** Open → Follow → Train → Progress.

---

## Technology Stack

- **Framework:** React 19 + TypeScript (ES2022)
- **Styling:** Tailwind CSS v4
- **Animation:** `motion/react`
- **Icons:** `lucide-react`
- **Build Tool:** Vite 6
- **Architecture:** Local-First PWA, Domain-Driven Design, Repository Pattern

---

## Development Commands

```bash
# Start development server
npm run dev

# Run TypeScript type check
npm run lint

# Build production bundle
npm run build
```

---

## Current Status: Phase 0 (Project Foundation)

This repository contains the completed **Phase 0** architectural foundation:
- Application shell with 4 primary destinations (Home, Train, Progress, Library)
- Mobile-first responsive layout with accessible 44px+ touch targets
- High-contrast, minimal design system and atomic UI components
- Domain type contracts for Exercises, Workouts, Progression, and Session State
- Data repository, sync queue, media, and AI boundary abstractions
- PWA manifest and mobile viewport configuration
- Comprehensive architecture and product documentation in `/docs`

---

## Roadmap

- [x] **Phase 0:** Foundation + Application Shell
- [ ] **Phase 1:** Exercise Domain + Exercise Library
- [ ] **Phase 2:** Workout Domain + Workout Generation
- [ ] **Phase 3:** Training State Machine + Timestamp-Based Timer
- [ ] **Phase 4:** Training Player
- [ ] **Phase 5:** Local Persistence
- [ ] **Phase 6:** Progression Engine
- [ ] **Phase 7:** Trainer / Demonstration System
- [ ] **Phase 8:** YouTube + Media
- [ ] **Phase 9:** AI Coach
- [ ] **Phase 10:** Authentication + Cloud Sync
- [ ] **Phase 11:** PWA + Offline Optimization
- [ ] **Phase 12:** Testing + Performance + Production Polish
