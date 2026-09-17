# Mobile Shell v22 — Phase 6

Phase 6 evolves the phone experience from a responsive archive into a coherent mobile application shell.

## Implemented

- **Route-aware mobile back navigation** now follows an internal route trail before falling back to People, Families, or Home. This prevents Person and Branch views from feeling like dead-end pages while avoiding unsafe browser-history assumptions.
- **More behaves as a real modal sheet** with a stable dialog label, `aria-modal`, focus handoff on open, and focus return to the More trigger on close.
- **Home discovery is broader but shorter**: the long secondary preview stack remains collapsed on phones, while the compact launcher links directly to Stories, People, Photos, Timeline, Places, and Research.
- **Person quick actions expose an explicit compact-flow contract** and receive contextual accessible labels without changing the underlying actions or data.
- **Tree is canvas-first**: its mobile control surface is an explicit toolbar, the graph is keyboard-focusable, and the canvas is exposed as a labelled interactive region.
- All mobile-only structural changes continue to restore cleanly above the 720px breakpoint.

## Interaction contract

1. Bottom dock remains the primary phone navigation.
2. Home / Families / Tree / People stay first-class dock destinations.
3. More contains grouped secondary destinations and Search as a prominent command.
4. Person quick actions remain subordinate to the person identity header.
5. Tree controls remain outside the graph interaction surface so pan/zoom gestures are not intercepted.
6. Mobile route history is bounded and transient; it is never persisted to storage.
7. Reduced-motion behavior continues to avoid animation-dependent state.

## Validation coverage

`test-mobile-shell-v22.mjs` now locks the route trail, modal focus contract, expanded compact discovery destinations, contextual person-action accessibility, and the tree toolbar/canvas semantics. Existing Mobile Shell ownership tests remain intact.

## Data safety

This phase is presentation and navigation only. It does not mutate genealogy records, relationships, evidence states, source metadata, privacy flags, or canonical graph data.
