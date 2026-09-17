# Mobile Shell v22 — Phase 6

Phase 6 evolves the phone experience from a responsive archive into a coherent mobile application shell.

## Goals

- Make **More** a concise command center rather than a grid of equivalent destinations.
- Reduce duplicate mobile chrome and give each route one clear hierarchy.
- Make **Person** navigation compact and sticky without hiding content behind stacked bars.
- Make **Tree** controls thumb-friendly and canvas-first.
- Preserve the existing navigation, route, genealogy, evidence, privacy, and search contracts.

## Interaction contract

1. Bottom dock remains the primary phone navigation.
2. Home / Families / Tree / People stay first-class dock destinations.
3. More contains grouped secondary destinations and Search as a prominent command.
4. Person quick actions become a horizontal action rail when space is constrained.
5. Tree receives a compact floating control rail with Center and Tools, leaving graph interaction unobstructed.
6. All mobile-only structural changes restore cleanly above the 720px breakpoint.
7. Reduced-motion users receive no animated scrolling or transition-dependent state.

## Data safety

This phase is presentation and navigation only. It does not mutate genealogy records, relationships, evidence states, source metadata, privacy flags, or canonical graph data.
