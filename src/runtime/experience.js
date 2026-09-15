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
const presentationModules=[
  import('./ui-resilience.js'),
  import('./site-branding.js'),
  import('./record-ingestion.js'),
  import('./stories-runtime.js'),
  import('./mobile-family-density.js'),
  import('./family-narrative.js'),
  import('./unified-family-experience.js'),
  import('./family-branches-v17-5.js'),
  import('./person-experience-v17-3.js'),
  import('./experience-elevation-v17-4.js')
];

// Final UI-only shell naming layer. Register it only after every presentation
// chunk has settled so surname-specific branding cannot win a cold-load race.
// allSettled preserves the final naming layer even if a noncritical enhancer
// fails to load. Genealogy content is not rewritten.
void Promise.allSettled(presentationModules).then(()=>import('./neutral-family-branding.js'));
