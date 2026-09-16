# Composition CSS Sequential-Override Collapse

Phase 3 follows the hardened `core.css` cleanup and the mobile ownership reconciliation.

## Method

The permanent forensic scanner remains deliberately conservative: it automatically removes a top-level rule only when a later rule with the same selector covers every property with the same effective value and equal-or-stronger `!important` priority. That scan found no automatically removable `composition.css` blocks.

A deterministic composition pass then reconciled explicit same-context sequential overrides by moving the final effective declarations into the original owning rule and deleting only the later override block. Compatibility fallbacks were preserved in declaration order.

## Collapsed groups

The pass collapsed 11 sequential override groups covering:

- route page heading layout, title typography, and supporting copy;
- filter shell and filter-control geometry/backgrounds;
- site footer spacing/background;
- Home hero radius, shadow, height, and headline sizing;
- Home discovery spacing and discovery-card geometry/shadow.

The route-specific dashboard polish rules, responsive rules, state variants, and differently scoped selectors remain separate because they are intentional cascade contexts rather than redundant sequential overrides.

## Validation

Before the resulting `composition.css` was committed:

- the CSS-sensitive regression suite passed 70/70;
- the production build completed successfully;
- canonical completeness and graph generation remained green;
- no genealogy, evidence-state, privacy, routing, source, relationship, or runtime semantics were changed.

Temporary migration workflow and helper files were removed after the validated transformation. The reusable `scripts/css-forensics.mjs` composition audit/fix/assert capability remains for future static enforcement.
