/* BNE Kiosk Service Worker — network-first, offline fallback.
   On connection: update code and content. Without connection: use cached installation.
   Bump VERSION for each deployment. */
var VERSION = 'tirelefil-2.1.1-network-first';
var PREFIX = 'tirelefil-';
var CORE = ['./', 'index.html', 'css/fonts.css', 'css/app.css', 'js/qr.js', 'js/fil.js', 'js/app.js',
  'content/config.json', 'content/content.json', 'content/translations.json', 'assets/icon.svg', 'assets/brand/bne-logo.svg', 'manifest.webmanifest'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(CORE); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k.indexOf(PREFIX) === 0 && k !== VERSION; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  var isFont = /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if (url.origin !== location.origin && !isFont) return;
  e.respondWith(fetch(req).then(function (res) {
    if (res && (res.ok || res.type === 'opaque')) {
      var copy = res.clone();
      e.waitUntil(caches.open(VERSION).then(function (c) { return c.put(req, copy); }).catch(function () {}));
    }
    return res;
  }).catch(function () { return caches.match(req, { ignoreSearch: true }); }));
});
