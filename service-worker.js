/* Standalone cache namespace: cannot overwrite the Piano Pitch Trainer cache. */
const CACHE = 'violin-ear-trainer-v1-20261009';
const STATIC = ['./','./index.html','./styles.css','./i18n.js','./app.js','./manifest.webmanifest','./icon-192.png','./icon-512.png'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(STATIC)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('violin-ear-trainer-')&&k!==CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  if(event.request.method !== 'GET')return;
  const url = new URL(event.request.url);
  const local = url.origin === self.location.origin;
  if(local) {
    event.respondWith(fetch(event.request).then(response => {
      if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy)).catch(()=>{});}
      return response;
    }).catch(()=>caches.match(event.request)));
  } else if(url.hostname === 'surikov.github.io') {
    event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
      if(response.ok||response.type==='opaque')caches.open(CACHE).then(cache=>cache.put(event.request,response.clone())).catch(()=>{});
      return response;
    })));
  }
});
