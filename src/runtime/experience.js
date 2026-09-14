// Stable experience boundary. Historical implementation modules remain behind
// the runtime boundary, while Family Home / People / Person now use the native
// v17 archive controller instead of post-render v15.7–v15.10 reshaping.
import './experience-core.js';
import '../../v15-1-runtime.js';
import '../../v15-family-focus.js';
import '../../platform-v13-runtime.js';
import './page-architecture.js';
import './navigation-shell.js';
import './native-family-v17-controller.js';
import './v17-6-stability.js';

// Workbench, Stories, Tree/mobile density, site naming, unified family,
// biography-first person presentation, media-specific narrative, branch
// destinations, and the current premium family-facing elevation layer remain
// additive capabilities after the stable Family route controller. v17.6 is
// intentionally synchronous above so tree-state restoration happens before
// slower presentation-only dynamic layers can delay the first interactive view.
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
