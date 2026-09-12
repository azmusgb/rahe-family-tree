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

// Workbench, Stories, Tree/mobile density, site naming and media-specific
// narrative helpers remain additive capabilities after the stable Family route
// controller so the historical initialization contract stays unchanged.
void import('./site-branding.js');
void import('./record-ingestion.js');
void import('./stories-runtime.js');
void import('./mobile-family-density.js');
void import('./family-narrative.js');
