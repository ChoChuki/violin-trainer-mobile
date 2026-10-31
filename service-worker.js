const CACHE_NAME = "violin-ear-trainer-v2.2.2";
const ASSETS = [
    "./", "./index.html", "./styles.css", "./app.js", "./i18n.js", "./demo-score.js",
    "./manifest.webmanifest", "./icon-192.png", "./icon-512.png"
];
const EXTERNAL = [
    "https://surikov.github.io/webaudiofont/npm/dist/WebAudioFontPlayer.js",
    "https://surikov.github.io/webaudiofontdata/sound/0400_JCLive_sf2_file.js"
];

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(async (cache) => {
            await cache.addAll(ASSETS.map((url) => new Request(url, { cache: "reload" })));
            for (const url of EXTERNAL) {
                const request = new Request(url, { mode: "no-cors" });
                const response = await fetch(request, { cache: "reload" });
                await cache.put(request, response);
            }
        })
    );
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
    if (event.request.method !== "GET") {
        return;
    }

    event.respondWith(
        caches.match(event.request).then((cached) => {
            if (cached) {
                return cached;
            }
            return fetch(event.request).then((response) => {
                const copy = response.clone();
                caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
                return response;
            }).catch(async () => {
                if (event.request.mode === "navigate") {
                    return caches.match("./index.html");
                }
                return Response.error();
            });
        })
    );
});
