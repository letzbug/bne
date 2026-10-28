/* Service Worker: hält die Installation auch bei wackeligem WLAN am Laufen.
   Programmdateien: zuerst aus dem Cache. Inhalte (content/*.json): zuerst aus dem Netz, sonst Cache.
   Nach Änderungen an Programmdateien VERSION erhöhen. */
var VERSION = 'tirelefil-1.0.0';
var CORE = ['./', 'index.html', 'css/fonts.css', 'css/app.css', 'js/qr.js', 'js/fil.js', 'js/app.js',
  'content/config.json', 'content/content.json', 'content/translations.json', 'assets/icon.svg', 'manifest.webmanifest'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(CORE); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  var isContent = url.origin === location.origin && url.pathname.indexOf('/content/') >= 0;
  var isFont = /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if (isContent) {
    e.respondWith(fetch(req).then(function (res) {
      var copy = res.clone(); caches.open(VERSION).then(function (c) { c.put(req, copy); });
      return res;
    }).catch(function () { return caches.match(req, { ignoreSearch: true }); }));
    return;
  }
  if (url.origin === location.origin || isFont) {
    e.respondWith(caches.match(req, { ignoreSearch: true }).then(function (hit) {
      return hit || fetch(req).then(function (res) {
        if (res && (res.ok || res.type === 'opaque')) { var copy = res.clone(); caches.open(VERSION).then(function (c) { c.put(req, copy); }); }
        return res;
      });
    }));
  }
});
