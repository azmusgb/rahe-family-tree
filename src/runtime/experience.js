// Stable experience boundary. Historical implementation modules remain behind
// the runtime boundary, while Family Home / People / Person now use the native
// v17 archive controller instead of post-render v15.7–v15.10 reshaping.
import './experience-core.js';
import '../../v15-family-focus.js';
import '../../platform-v13-runtime.js';
import './page-architecture.js';
import './navigation-shell.js';
import './native-family-v17-controller.js';

// Interaction-critical controllers stay in the initial entry chunk. Route,
// Tree, mobile dock, and history correctness must never depend on a later
// network fetch completing before the user's first interaction.
import './tree-controller.js';
import './mobile-experience.js';
import './mobile-ui-shell.js';

// Presentation-only capabilities are safe split points. They remain additive
// and do not own routing, history, the persistent navigation shell, or canonical
// genealogy state.
void import('./ui-resilience.js');
void import('./site-branding.js');
void import('./record-ingestion.js');
void import('./stories-runtime.js');
void import('./mobile-family-density.js');
void import('./family-narrative.js');
void import('./unified-family-experience.js');
void import('./family-branches-v17-5.js');
void import('./person-experience-v17-3.js');
void import('./experience-elevation-v17-4.js');

// Final UI-only shell naming layer. This intentionally runs after legacy and
// current presentation enhancers so neutral archive labels cannot be replaced
// by surname-specific shell branding. Genealogy content is not rewritten.
void import('./neutral-family-branding.js');
