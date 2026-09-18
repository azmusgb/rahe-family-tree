// Stable experience boundary. Historical implementation modules remain behind
// the runtime boundary, while Family Home / People / Person now use the native
// v17 archive controller instead of post-render v15.7–v15.10 reshaping.
import './experience-core.js';
import '../features/family/focus.js';
import '../platform/genealogy-runtime.js';
import './page-architecture.js';
import '../features/navigation/shell.js';
import '../platform/performance/contracts.js';
import '../features/family/controller.js';

// Interaction-critical controllers stay in the initial entry chunk. Route,
// Tree, mobile dock, and history correctness must never depend on a later
// network fetch completing before the user's first interaction. The detail-aware
// route-state controller is initialized before the legacy mobile shell so it is
// the authoritative smart-Back owner rather than a compatibility follower.
import '../features/tree/controller.js';
import '../features/navigation/mobile-ownership.js';
import '../features/navigation/mobile-experience.js';
import '../features/navigation/mobile-route-state.js';
import '../features/navigation/mobile-shell.js';
import '../features/navigation/mobile-transient.js';
import '../features/navigation/mobile-enhancements.js';

// Presentation-only startup capabilities that still apply broadly. Route-bound
// presentation modules are registered in route-capabilities.js and load only
// after their committed route is active.
const presentationModules=[
  import('./ui-resilience.js'),
  import('./site-branding.js'),
  import('../features/navigation/mobile-family-density.js'),
  import('../features/family/branches.js')
];

// Final UI-only shell naming layer. Register it only after every startup
// presentation chunk has settled so surname-specific branding cannot win a
// cold-load completion race. Route-scoped capabilities do not own shell naming.
// allSettled preserves the final naming layer even if a noncritical enhancer
// fails to load. Genealogy content is not rewritten.
void Promise.allSettled(presentationModules).then(()=>import('../features/family/branding.js'));
