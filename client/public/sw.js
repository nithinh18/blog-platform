// Intentionally minimal: registering a service worker with a fetch handler
// is what makes Chrome/Android treat the site as "installable" (the
// manifest alone isn't enough on those browsers). This one does no caching
// and never intercepts requests — every fetch just falls through to the
// network exactly as if there were no service worker at all. That's a
// deliberate choice: offline caching has real failure modes (serving stale
// JS/CSS after a deploy, cache invalidation bugs) that aren't worth the risk
// here. If offline support is wanted later, add caching logic in this file.
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', () => {
  // No-op: let the browser handle every request normally.
});
