// Stable experience boundary. Current semantic controllers own shell navigation
// and native Family routes; historical implementations remain behind explicit
// boundaries only where they still provide behavior that has not been retired.
import './experience-core.js';
import '../../v15-family-focus.js';
import '../../platform-v13-runtime.js';
import './page-architecture.js';
import './navigation-shell.js';
import './native-family-v17-controller.js';

// UI resilience and route-specific presentation enhancers are additive. With
// esbuild splitting enabled these dynamic imports become lazy browser chunks
// instead of inflating the stable application entry bundle.
void import('./ui-resilience.js');
void import('./tree-controller.js');
void import('./site-branding.js');
void import('./record-ingestion.js');
void import('./stories-runtime.js');
void import('./mobile-family-density.js');
void import('./family-narrative.js');
void import('./mobile-experience.js');
void import('./mobile-ui-shell.js');
void import('./unified-family-experience.js');
void import('./family-branches-v17-5.js');
void import('./person-experience-v17-3.js');
void import('./experience-elevation-v17-4.js');
void import('./neutral-family-branding.js');
