const CACHE_VERSION = 'v1.0.0';
const CACHE_NAME = `richard-jiang-site-${CACHE_VERSION}`;

// Assets to cache immediately on install
const CRITICAL_ASSETS = [
  '/',
  '/index.html',
  '/blogs.html',
  '/reflection.html',
  '/film.html',
  '/music.html',
  '/travel.html',
  '/styles/common.css',
  '/components.js',
  '/main.js',
  '/router.js',
  '/components/navigation.html',
  '/components/footer.html'
];

// Cache strategies
const CACHE_STRATEGIES = {
  CACHE_FIRST: 'cache-first',
  NETWORK_FIRST: 'network-first',
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate'
};

// Determine strategy based on request
function getStrategy(url) {
  // Cache first for static assets
  if (url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|webp|ico|woff2|woff|ttf)$/)) {
    return CACHE_STRATEGIES.CACHE_FIRST;
  }
  
  // Stale while revalidate for HTML pages and components
  if (url.pathname.match(/\.(html)$/) || url.pathname === '/') {
    return CACHE_STRATEGIES.STALE_WHILE_REVALIDATE;
  }
  
  // Network first for everything else
  return CACHE_STRATEGIES.NETWORK_FIRST;
}

// Install event - cache critical assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching critical assets');
        return cache.addAll(CRITICAL_ASSETS);
      })
      .then(() => {
        console.log('[Service Worker] Installation complete');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[Service Worker] Installation failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== CACHE_NAME)
            .map((cacheName) => {
              console.log('[Service Worker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('[Service Worker] Activation complete');
        return self.clients.claim();
      })
  );
});

// Fetch event - handle requests with appropriate strategy
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    // But cache CDN resources
    if (url.hostname.includes('cdn') || url.hostname.includes('googleapis') || url.hostname.includes('gstatic')) {
      event.respondWith(cacheFirst(event.request));
    }
    return;
  }
  
  const strategy = getStrategy(url);
  
  switch (strategy) {
    case CACHE_STRATEGIES.CACHE_FIRST:
      event.respondWith(cacheFirst(event.request));
      break;
    case CACHE_STRATEGIES.NETWORK_FIRST:
      event.respondWith(networkFirst(event.request));
      break;
    case CACHE_STRATEGIES.STALE_WHILE_REVALIDATE:
      event.respondWith(staleWhileRevalidate(event.request));
      break;
  }
});

// Cache First Strategy - best for static assets
async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  
  if (cached) {
    return cached;
  }
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.error('[Service Worker] Fetch failed:', error);
    throw error;
  }
}

// Network First Strategy - best for dynamic content
async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }
    throw error;
  }
}

// Stale While Revalidate - best for HTML pages
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  
  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch((error) => {
      console.error('[Service Worker] Revalidation failed:', error);
      return cached;
    });
  
  return cached || fetchPromise;
}

// Handle messages from the client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(CACHE_NAME)
        .then((cache) => cache.addAll(event.data.urls))
    );
  }
});
