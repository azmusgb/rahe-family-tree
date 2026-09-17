# Mobile Shell v22 — Phases 6–8

The phone experience is evolving from a responsive archive into a coherent mobile application shell with explicit state ownership.

## Goals

- Make **More** a concise command center rather than a grid of equivalent destinations.
- Reduce duplicate mobile chrome and give each route one clear hierarchy.
- Make **Person** navigation compact and sticky without hiding content behind stacked bars.
- Make **Tree** controls thumb-friendly and canvas-first.
- Preserve the existing navigation, route, genealogy, evidence, privacy, and search contracts.
- Give transient UI state exactly one owner so older mobile layers cannot compete with v22.

## Interaction contract

1. Bottom dock remains the primary phone navigation.
2. Home / Families / Tree / People stay first-class dock destinations.
3. More contains grouped secondary destinations and Search as a prominent command.
4. Person quick actions become a horizontal action rail when space is constrained.
5. Tree receives a compact floating control rail with Center and Tools, leaving graph interaction unobstructed.
6. All mobile-only structural changes restore cleanly above the 720px breakpoint.
7. Reduced-motion users receive no animated scrolling or transition-dependent state.
8. Mobile Back uses a bounded in-memory route trail; it is never persisted.
9. More behaves as a modal sheet with deterministic focus entry, focus containment, Escape dismissal, backdrop dismissal, and focus return.
10. More may expose route-aware contextual destinations, but navigation-shell remains the sole owner of bottom-dock structure and ordering.
11. Person has one primary phone section controller; legacy profile navigation is suppressed only on phones and restored above the breakpoint.
12. Tree Focus mode is transient and reversible; secondary tree chrome may hide while the graph remains the primary interactive region.

## Phase 8 ownership contract

Mobile state is split by durability rather than by historical module generation.

### v22 transient ownership

`mobile-ui-ownership.js`, `mobile-ui-shell.js`, `mobile-ui-transient.js`, and `mobile-ui-phase7.js` own transient interaction state:

- pending search handoff
- route-aware Back trail
- More open/closed state
- backdrop visibility
- modal focus containment and focus return
- route-aware More commands
- Tree Focus mode
- temporary Person navigation suppression

None of those states are written to browser storage.

### Durable continuity ownership

`mobile-experience.js` is reduced to durable continuity and presentation enhancement only. It may persist:

- recently viewed people
- recently viewed families
- the last useful Tree context

It no longer owns More/modal behavior and no longer persists `lastRoute`.

### Startup ordering

`mobile-ui-ownership.js` executes before the legacy mobile enhancer. This makes ownership explicit before any DOM-ready callback can run and prevents startup races between v20 and v22 behavior.

## Phase 8 cleanup completed

- Removed legacy More open/close/backdrop/focus-trap implementation from `mobile-experience.js`.
- Removed document-wide navigation observation that existed only to keep the old More implementation alive.
- Removed persisted `lastRoute` state.
- Reduced legacy scheduling to a single animation frame.
- Centralized backdrop, Escape, Tab containment, dismissal, and focus-return behavior in `mobile-ui-transient.js`.
- Kept structural More composition in the v22 shell and contextual destination composition in the Phase 7 layer.
- Added permanent source-contract tests preventing transient ownership from drifting back into the legacy module.

## Data safety

This work is presentation, continuity, and navigation only. It does not mutate genealogy records, relationships, evidence states, source metadata, privacy flags, or canonical graph data.

## Next gates

Before release:

1. Run the permanent source-contract suite.
2. Run Playwright mobile interaction tests at representative phone widths.
3. Confirm Home, People, Person, Families, Tree, and More have no horizontal overflow.
4. Confirm desktop restoration after crossing above 720px.
5. Confirm More focus containment and Tree Focus mode with keyboard input.
6. Confirm persisted storage contains continuity data only and no transient route/search/modal state.
