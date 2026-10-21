/* ====================================================================
   service-worker.js  —  KILL SWITCH (v3)

   Purpose: any browser that still has the OLD service worker registered
   from the previous version of this site will receive THIS file, which:
     1. Skips waiting and claims all clients immediately.
     2. Deletes every cache stored under this origin.
     3. Unregisters itself so future loads go straight to the network.

   After every visitor has hit the site once, this worker effectively
   removes itself, restoring normal request flow.
   ==================================================================== */

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil((async () => {
        // 1. Nuke every cache.
        try {
            const names = await caches.keys();
            await Promise.all(names.map((n) => caches.delete(n)));
        } catch (_) { /* ignore */ }

        // 2. Take control of all open pages.
        try { await self.clients.claim(); } catch (_) {}

        // 3. Unregister this worker.
        try { await self.registration.unregister(); } catch (_) {}

        // 4. Reload any controlled clients so they fetch fresh from the network.
        try {
            const clients = await self.clients.matchAll({ type: 'window' });
            clients.forEach((client) => {
                try { client.navigate(client.url); } catch (_) {}
            });
        } catch (_) {}
    })());
});

// Pass-through: never serve from cache.
self.addEventListener('fetch', (event) => {
    // do nothing — let the network handle it
});
