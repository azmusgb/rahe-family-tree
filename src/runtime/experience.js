// Stable experience boundary. Keep side-effect initialization order explicit:
// primary v15 behavior, v15.1 relayout, family-focus layer, platform runtime,
// route-aware page architecture, then the v15.7 family-first home flow.
import './experience-core.js';
import '../../v15-1-runtime.js';
import '../../v15-family-focus.js';
import '../../platform-v13-runtime.js';
import './page-architecture.js';
import './home-flow.js';
