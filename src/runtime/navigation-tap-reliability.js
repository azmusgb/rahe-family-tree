// Interaction hardening for the Family Explorer shell.
// Keep this small and route-agnostic: native anchors still own navigation.
const NAV_LINK_SELECTOR = [
  '#family-mobile-dock a[href^="#"]',
  '#nav a[href^="#"]',
  '.site-header .brand[href^="#"]'
].join(',');

function closeTransientNavigation(except = null) {
  document.querySelectorAll('.mobile-more[open],.v158-mobile-more[open],.nav-menu[open],.v151-nav-menu[open]').forEach(details => {
    if (details !== except) {
      details.removeAttribute('open');
      details.querySelector('summary')?.setAttribute('aria-expanded', 'false');
    }
  });
}

// Close popovers before the browser follows a navigation anchor. This prevents
// an open <details> panel from remaining above the dock and intercepting the
// next tap during a route render.
document.addEventListener('click', event => {
  const link = event.target.closest?.(NAV_LINK_SELECTOR);
  if (!link) return;
  closeTransientNavigation();
}, { capture: true });

// Keep aria-expanded synchronized for the native details controls. iOS Safari
// can otherwise retain stale accessibility state across rapid open/close taps.
document.addEventListener('toggle', event => {
  const details = event.target;
  if (!(details instanceof HTMLDetailsElement)) return;
  if (!details.matches('.mobile-more,.v158-mobile-more,.nav-menu,.v151-nav-menu')) return;
  details.querySelector(':scope > summary')?.setAttribute('aria-expanded', String(details.open));
  if (details.open) closeTransientNavigation(details);
}, true);

// A route render is a hard boundary: no navigation overlay should survive it.
for (const name of ['hashchange', 'popstate', 'family-view-rendered', 'family-native-rendered']) {
  window.addEventListener(name, () => closeTransientNavigation());
}
