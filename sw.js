// VidyaKosh Offline Assets Manager - sw.js

const CACHE_NAME = "vidyakosh-cache-v1";
// Assets to cache immediately for offline usage
const ASSETS_TO_CACHE = [
    "/",
    "/index.html",
    "/manifest.json",
    "/app.js",
    "/subject.html",
    "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap",
    "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
];

// 1. Install Event: Cache all core UI assets
self.addEventListener("install", (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log("🟢 Service Worker: Caching core assets for offline usage...");
            return cache.addAll(ASSETS_TO_CACHE);
        }).then(() => self.skipWaiting())
    );
});

// 2. Activate Event: Clean up old caches if any
self.addEventListener("activate", (e) => {
    e.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        console.log("🧹 Service Worker: Clearing old cache storage...");
                        return caches.delete(cache);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// 3. Fetch Event: Intercept network requests and serve from cache if offline
self.addEventListener("fetch", (e) => {
    // Ignore external API fetches (handled by app.js via IndexedDB)
    if (e.request.url.includes("github.io")) return;

    e.respondWith(
        caches.match(e.request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse; // Return from cache if found
            }
            // Otherwise try to fetch from network
            return fetch(e.request).catch(() => {
                // If both fail and user is requesting HTML page, show offline fallback if needed
                console.log("📴 Offline and asset not found in cache.");
            });
        })
    );
});