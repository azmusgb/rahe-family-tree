# Mobile Shell v22 — Phases 6–7

The phone experience is being evolved from a responsive archive into a coherent mobile application shell while preserving the canonical genealogy, evidence, privacy, source, and route contracts.

## Phase 6 contract

- Make **More** a concise command center rather than a grid of equivalent destinations.
- Reduce duplicate mobile chrome and give each route one clear hierarchy.
- Make **Person** navigation compact and sticky without hiding content behind stacked bars.
- Make **Tree** controls thumb-friendly and canvas-first.
- Preserve the existing navigation, route, genealogy, evidence, privacy, and search contracts.

## Phase 7 evolution

Phase 7 builds on that contract with context-aware behavior rather than adding more permanent chrome.

1. **Route-aware More**
   - More keeps Search and grouped archive destinations.
   - A Current Context section changes by route so Person, Tree, Media, Stories, Timeline, Places, and Research expose relevant next destinations.
   - The navigation shell remains the sole owner of dock order and primary navigation.
2. **One Person section controller**
   - The app-style Person section tabs are the primary phone sub-navigation.
   - The legacy Person navigation is suppressed only while the phone controller exists.
   - Desktop restoration is explicit and reversible.
3. **Tree focus mode**
   - A Focus control is added to the existing mobile tree toolbar.
   - Focus mode temporarily removes nonessential graph summary/tool chrome while preserving the graph and the exit control.
   - Escape exits focus mode.
   - Focus state is transient and is never written to browser storage.
4. **Continuity without transient-state persistence**
   - Existing recent-person and last-tree continuity remains owned by `mobile-experience.js`.
   - Search handoff, open sheets, route trail, and Tree focus remain transient runtime state.
5. **Accessibility**
   - More remains a labelled modal sheet with focus handoff and return.
   - Person has one labelled section controller.
   - Tree is an explicitly labelled interactive region with toolbar controls and a keyboard exit path.

## Mobile hierarchy

The intended phone hierarchy is:

**Global:** dedicated header → route content → bottom dock.

**Home:** editorial hero → search → primary launcher → relationship preview → compact Discover destinations.

**Person:** identity cover → quick actions → one Person section controller → profile content.

**Tree:** compact tree toolbar → graph canvas, with optional Focus mode.

**More:** Search → Current Context → Discover → Research → recent people when available.

## Restoration contract

Every phone-only structural change must restore above the 720px breakpoint. No mobile phase may permanently move, hide, rename, or mutate canonical content when the viewport returns to desktop width.

## Data safety

These phases are presentation and navigation only. They do not mutate genealogy records, relationships, evidence states, source metadata, privacy flags, or canonical graph data.

## Next validation gates

Before merge:

- run the permanent Mobile Shell v22 contract tests;
- run the full production build;
- execute phone interaction tests at small, standard, and large phone widths;
- verify More open/close/focus behavior;
- verify Person legacy navigation restoration at desktop width;
- verify Tree Focus enter/exit/Escape behavior;
- verify no horizontal overflow and no dock interception of Tree gestures;
- verify reduced-motion behavior remains non-animated;
- require the PR head used for validation to be the exact head merged.
