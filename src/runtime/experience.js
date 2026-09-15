// Stable experience boundary. Current semantic controllers own shell navigation
// and native Family routes; historical implementations remain behind explicit
// boundaries only where they still provide behavior that has not been retired.
import './experience-core.js';
import '../../v15-family-focus.js';
import '../../platform-v13-runtime.js';
import './page-architecture.js';
import './navigation-shell.js';
import './native-family-v17-controller.js';

// Navigation-critical tree-controller.js, mobile-experience.js, and mobile-ui-shell.js
// are loaded eagerly by native-family-v17-controller.js so route correctness does not
// depend on lazy chunk timing while this boundary keeps its stable import contract.

// Non-critical presentation enhancers remain lazy so the v20 build still gains
// real ESM code splitting without making route correctness depend on chunk timing.
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
void import('./neutral-family-branding.js');
