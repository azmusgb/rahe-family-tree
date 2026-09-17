# Runtime retirement sequence

1. Move route taxonomy and contextual destinations to navigation-model.js.
2. Establish detail-aware transient route state and prove Person/Branch same-route Back.
3. Remove routeKey-only trail from mobile-ui-shell.js; mobile-route-state.js becomes sole Back owner.
4. Move Person section ownership out of historical mobile enhancer into a semantic controller.
5. Keep mobile-ui-transient.js as sole More interaction owner; simplify structural composition around it.
6. Coalesce Tree post-render work around explicit graph lifecycle events.
7. Remove version-prefixed runtime ownership markers after semantic contracts have coverage.

Each removal must happen by deleting superseded ownership, not by adding another compatibility arm.
