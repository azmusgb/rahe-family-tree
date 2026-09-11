// Stable experience boundary. Keep side-effect initialization order explicit:
// primary v15 behavior, v15.1 relayout, family-focus layer, platform runtime,
// then route-aware page architecture.
import './experience-core.js';
import '../../v15-1-runtime.js';
import '../../v15-family-focus.js';
import '../../platform-v13-runtime.js';
import './page-architecture.js';
