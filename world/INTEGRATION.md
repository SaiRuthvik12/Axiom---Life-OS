# World System — The Nexus

Self-contained game world module for Axiom. Already integrated into `App.tsx`, `Terminal.tsx`, and `geminiService.ts`.

## Architecture

```
world/
├── types.ts              # All TypeScript interfaces
├── constants.ts          # Static game data (districts, structures, companions, etc.)
├── engine.ts             # Pure game logic — no side effects
├── narrative.ts          # Procedural text generation
├── service.ts            # Supabase persistence (JSONB document store)
├── schema.sql            # Database migration (run once in Supabase SQL Editor)
├── components/
│   ├── WorldView.tsx     # Main world page
│   ├── DistrictCard.tsx  # Individual district display
│   ├── CompanionPanel.tsx# Companion overview
│   └── ArtifactCard.tsx  # Social artifact display
└── index.ts              # Barrel exports
```

## Database

Run `world/schema.sql` in the Supabase SQL Editor to create the `world_states` table. Works without Supabase in demo mode (state held in memory).

## Design Philosophy

| Principle | Implementation |
|-----------|---------------|
| **Ownership** | Users build structures with earned credits. Decay creates loss aversion. |
| **Curiosity** | Locked districts, expedition silhouettes, fog of possibility. |
| **Comparison** | Artifacts show what was built (not raw XP). Milestones, not leaderboards. |
| **Anti-burnout** | Decay is gradual (not instant). Recovery is always possible. One bad day ≠ destruction. |
| **Companions** | Increase emotional stakes through presence, not guilt. Absence > accusation. |
