const CACHE_NAME = "violin-ear-trainer-v2.2.12";
const ASSETS = [
    "./", "./index.html", "./styles.css", "./app.js", "./i18n.js", "./demo-score.js", "./ap-science.js", "./ap-memory.js", "./relative-course.js", "./relative-ui.js", "./training-tracker.js",
    "./manifest.webmanifest", "./icon-192.png", "./icon-512.png"
];
const EXTERNAL = [
    "https://surikov.github.io/webaudiofont/npm/dist/WebAudioFontPlayer.js",
    "https://surikov.github.io/webaudiofontdata/sound/0400_JCLive_sf2_file.js"
];

// Cache the external WebAudioFont scripts as opaque responses and also serve
// them from this cache when offline.  The earlier fetch handler never looked
// at cross-origin requests, making offline-first startup fail despite caching.
self.addEventListener("install", (event) => {
    event.waitUntil((async () => {
        const cache = await caches.open(CACHE_NAME);
        await cache.addAll(ASSETS.map((url) => new Request(url, {cache:"reload"})));
        // A temporary CDN outage must not prevent the local app from installing.
        await Promise.all(EXTERNAL.map(async (url) => {
            try {
                const req = new Request(url, {mode:"no-cors"});
                const response = await fetch(req, {cache:"reload"});
                if (response.ok || response.type === "opaque") await cache.put(req, response);
            } catch (_) { /* Online playback can retry if this was not cached. */ }
        }));
    })());
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((names) => Promise.all(
            names.filter((name) => name !== CACHE_NAME)
                .map((name) => caches.delete(name))
        ))
    );
    self.clients.claim();
});

self.addEventListener("fetch", (event) => {
    if (event.request.method !== "GET") return;
    const local = event.request.url.startsWith(self.registration.scope);
    const audioScript = EXTERNAL.includes(event.request.url);
    if (!local && !audioScript) return;

    event.respondWith((async () => {
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match(event.request);
        if (cached) return cached;
        try {
            const response = await fetch(event.request);
            if (response.ok || response.type === "opaque") {
                await cache.put(event.request, response.clone());
            }
            return response;
        } catch (_) {
            if (local && event.request.mode === "navigate") {
                return await cache.match("./index.html") || Response.error();
            }
            return Response.error();
        }
    })());
});
