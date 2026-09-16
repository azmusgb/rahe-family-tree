# CSS Cleanup Roadmap

The stylesheet topology is consolidated. The next phase reduces semantic debt without changing genealogy, evidence, privacy, routing, or interaction behavior.

## Execution order

1. **Core forensics** — remove only provably superseded rules first, then use coverage and route ownership evidence before deleting anything else.
2. **Mobile ownership reconciliation** — eliminate overlapping ownership across `mobile.css`, `experience.css`, `interaction.css`, and `home-responsive.css`.
3. **Composition collapse** — fold sequential override passes into the final effective declarations in `composition.css`.
4. **Canonical component classes** — migrate `.vXX-*` compatibility selector arms to semantic class names, retaining temporary runtime aliases only where required.
5. **Token cleanup** — collapse equivalent aliases and retire `--v16-*` token names after reference count reaches zero.
6. **Print deduplication** — organize `print.css` by output concern instead of historical source-file sections.
7. **Budgets and static checks** — enforce source/output size budgets, duplicate-rule checks, and unused-selector reporting in CI.

## Ownership boundaries

- `tokens.css`: design tokens only; no component selectors.
- `core.css`: reset, document primitives, shared controls, shared cards/tables, and genuinely cross-route primitives. Route-specific presentation should migrate out over time.
- `composition.css`: cross-route visual composition only; no historical stabilization layers after reconciliation.
- `experience.css`: graph/tree and route-experience presentation that is neither global interaction behavior nor mobile-only adaptation.
- `home-responsive.css`: Home/dashboard component ownership across breakpoints.
- `interaction.css`: accessibility, hidden-state, focus, disclosure, touch, motion, and other cross-module interaction contracts only.
- `mobile.css`: shell-level mobile adaptation, safe-area behavior, and truly cross-route mobile-only behavior. Component-specific mobile rules should live with the component owner.
- `print.css`: print/PDF behavior only.

## Safety rules

- No selector removal solely because a name looks old.
- No evidence-state, privacy, genealogy, or routing changes in CSS cleanup PRs.
- Remove a rule automatically only when a later top-level rule with the same selector fully replaces every declaration with equal or stronger `!important` semantics.
- Keep interaction-critical Tree/mobile behavior stable while CSS ownership changes.
- Every cleanup PR must pass the repository validation workflow before merge.
