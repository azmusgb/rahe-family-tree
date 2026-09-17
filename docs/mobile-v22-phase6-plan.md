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

`mobile-ui-ownership.js`, `mobile-ui-shell.js`, `mobile-ui-transient.js`, and `mobile-ui-phase7.js` own transient interaction state, but each subdomain has one final owner:

- `mobile-ui-shell.js`: mobile structure, route-aware Back, search handoff, and route composition
- `mobile-ui-transient.js`: More open/closed state, backdrop visibility, modal focus entry/containment, dismissal, and focus return
- `mobile-ui-phase7.js`: route-aware More commands, Tree Focus mode, and temporary Person navigation suppression
- `mobile-ui-ownership.js`: startup ownership declaration

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
- Removed duplicate More modal/focus ownership from `mobile-ui-shell.js`.
- Removed document-wide navigation observation that existed only to keep the old More implementation alive.
- Removed persisted `lastRoute` state.
- Reduced legacy scheduling to a single animation frame.
- Centralized backdrop, focus entry, Escape, Tab containment, dismissal, and focus-return behavior in `mobile-ui-transient.js`.
- Made the More backdrop non-focusable so pointer dismissal does not become part of the keyboard tab cycle.
- Ported the validated Phase 4 transient People-search focus handoff onto the phases 5–8 branch.
- Kept structural More composition in the v22 shell and contextual destination composition in the Phase 7 layer.
- Added permanent source-contract tests preventing transient ownership from drifting back into the shell or legacy module.
- Added Playwright coverage for focus entry, focus containment, Escape, backdrop cleanup, and deterministic focus return.

## Data safety

This work is presentation, continuity, and navigation only. It does not mutate genealogy records, relationships, evidence states, source metadata, privacy flags, or canonical graph data.

## Release-candidate gates

Before release:

1. Run the permanent source-contract suite.
2. Run the full production build and canonical/evidence integrity gates.
3. Run all four Playwright browser shards against the built artifact.
4. Confirm Home, People, Person, Families, Tree, and More have no horizontal overflow.
5. Confirm desktop restoration after crossing above 720px.
6. Confirm More focus entry, containment, Escape, backdrop dismissal, and focus return with keyboard and pointer input.
7. Confirm Tree Focus mode enters and exits cleanly with keyboard input.
8. Confirm persisted storage contains continuity data only and no transient route/search/modal state.
9. Merge only from the exact validated PR head SHA.
