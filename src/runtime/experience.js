// Stable experience boundary. Keep side-effect initialization order explicit:
// primary v15 behavior, v15.1 relayout, family-focus layer, platform runtime,
// route-aware page architecture, v15.7 family-first home flow, v15.8 shell,
// v15.9 people/person presentation, v15.10 disclosure, v15.11 family overhaul,
// then the dedicated mobile tree presentation layer.
import './experience-core.js';
import '../../v15-1-runtime.js';
import '../../v15-family-focus.js';
import '../../platform-v13-runtime.js';
import './page-architecture.js';
import './home-flow.js';
import './navigation-shell.js';
import './people-person-experience.js';
import './compact-disclosure.js';
import './mobile-family-overhaul.js';
import './mobile-tree-experience.js';
