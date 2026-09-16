# Mobile CSS Ownership Reconciliation

This phase follows the hardened `core.css` forensic cleanup.

## Baseline

Across `experience.css`, `home-responsive.css`, `interaction.css`, and `mobile.css` the ownership audit initially measured:

- 905 parsed rules
- 23 cross-file selector overlaps
- 16 overlaps between `interaction.css` and `mobile.css`
- 7 overlaps between `experience.css` and `mobile.css`
- 0 direct selector overlaps involving `home-responsive.css`

## Reconciliation

The first pass moved visual mobile-shell rules duplicated between `interaction.css` and `mobile.css` into `mobile.css`, keeping `interaction.css` focused on hidden state, focus, disclosure, touch, and reduced-motion contracts. Existing mobile declarations remained later in the cascade and retained precedence.

The second pass resolved the remaining `experience.css` / `mobile.css` overlaps by domain rather than by breakpoint alone:

- Mobile More sheet geometry is owned by `mobile.css`.
- Family Graph person-preview presentation is owned by `experience.css`.
- mobile Tree workspace and toolbar presentation are owned by `experience.css`.
- `home-responsive.css` remains the sole Home/dashboard responsive owner and required no selector migration.

## Result

The final generated audit reports:

- 905 parsed rules
- **0 cross-file selector overlaps** among the four mobile-related owners
- empty cross-file pair counts

The reconciliation passed the CSS-sensitive regression suite and a full production build before the migration helpers were retired. The persistent audit script and generated report remain available for later CSS-budget/static-check enforcement.
