# Workthru

**A mobile-first workout companion built around guided training, progression, and local-first software.**

Workthru started as an experiment in building a workout application that feels simple to use while still having a proper software architecture underneath it.

The basic idea is straightforward:

> Open → Follow → Train → Progress

The project is being built around structured exercise data, workouts, training state, progression, demonstrations, and local persistence rather than putting everything inside the UI.

---

## What I'm Building

Workthru is designed around four main parts:

- **Home** — the starting point for getting into a workout
- **Train** — the actual training experience
- **Progress** — tracking development over time
- **Library** — browsing and exploring exercises

The application is intended to work well on mobile and keep the core experience useful even when there is no network connection.

---

## The Exercise Model

Exercises aren't stored as just a name and a description.

Each exercise can contain:

- Category
- Movement pattern
- Primary and secondary muscles
- Equipment requirements
- Experience level
- Setup instructions
- Execution instructions
- Breathing guidance
- Form cues
- Common mistakes
- Safety notes
- Progression and regression relationships
- Demonstration media

This gives the rest of the application structured data to work with instead of relying on UI-specific information.

---

## Architecture

The project is separated into several layers:

```text
src/
├── app/          # Application shell and global providers
├── features/     # User-facing features and screens
├── domain/       # Exercises, workouts, progression and state
├── data/         # Persistence, repositories and synchronization
├── ai/           # Controlled AI interfaces
├── media/        # Demonstrations, video and audio
├── ui/            # Reusable UI components
├── lib/           # General utilities
└── types/         # Shared TypeScript types
