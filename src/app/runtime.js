// Canonical browser runtime composition root.
// Import order is intentionally equivalent to the production-certified v23 baseline.
import './router.js';
import './base-controls.js';
import '../../media.js';
import '../../deployment.js';
import '../features/family/index.js';
import '../features/media/index.js';
import '../features/tree/index.js';
import '../features/search/index.js';
import '../features/media/page.js';
import './experience.js';
