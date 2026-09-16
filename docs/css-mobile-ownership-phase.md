# Mobile CSS Ownership Reconciliation

This phase follows the hardened `core.css` forensic cleanup.

Current measured baseline across `experience.css`, `home-responsive.css`, `interaction.css`, and `mobile.css`:

- 905 parsed rules
- 23 cross-file selector overlaps
- 16 overlaps between `interaction.css` and `mobile.css`
- 7 overlaps between `experience.css` and `mobile.css`
- 0 direct selector overlaps involving `home-responsive.css`

The first reconciliation pass moves visual mobile-shell rules duplicated between `interaction.css` and `mobile.css` into `mobile.css`, keeping `interaction.css` focused on hidden state, focus, disclosure, touch, and reduced-motion contracts. Existing mobile declarations remain later in the cascade and therefore retain precedence.

A second pass will address the remaining `experience.css` / `mobile.css` overlaps, primarily Family Graph preview and mobile Tree surfaces, with route-specific regression coverage before merge.
