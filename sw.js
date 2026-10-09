// WATCHMAN veb-ilovasi service worker'i:
// 1) ilova qobig'ini keshlaydi - internet sekin bo'lsa ham tez ochiladi;
// 2) serverdan kelgan push-bildirishnomalarni ko'rsatadi (ilova yopiq bo'lsa ham).
// index.html dagi ?v= bilan bir xil raqam - har yangilanishda ikkalasini oshiring.
const CACHE = 'watchman-v8';
const SHELL = [
  './',
  './index.html',
  './styles.css?v=8',
  './app.js?v=8',
  './manifest.webmanifest',
  './icons/apple-touch-icon.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './img/ic_bot_aux1.svg',
  './img/ic_bot_aux2.svg',
  './img/ic_bot_aux3.svg',
  './img/ic_bot_bagaj.svg',
  './img/ic_bot_lock.svg',
  './img/ic_bot_mator_block_off.svg',
  './img/ic_bot_mator_block_on.svg',
  './img/ic_bot_un_lock.svg',
  './img/ic_car.png',
  './img/ic_car_tutun1.svg',
  './img/ic_car_tutun2.svg',
  './img/ic_lock.svg',
  './img/ic_lock_ochiq.svg',
  './img/ic_menu_local.svg',
  './img/ic_bot_signal.svg',
  './img/ic_bot_fara.svg',
  './img/ic_bot_telefon.svg',
  './img/ic_bot_bakavoy.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// Tarmoq birinchi, bo'lmasa kesh - yangi versiya chiqsa darhol olinadi.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  event.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
        return res;
      })
      .catch(() => caches.match(req).then((r) => r || caches.match('./index.html'))),
  );
});

// iOS har bir push uchun bildirishnoma ko'rsatilishini talab qiladi - shuning
// uchun har doim ko'rsatamiz.
self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch { data = { body: event.data && event.data.text() }; }
  const title = data.title || 'WATCHMAN';
  const options = {
    body: data.body || 'Yangi xabar',
    icon: 'icons/icon-192.png',
    badge: 'icons/icon-192.png',
    tag: 'watchman-' + (data.ts || Date.now()),
    data: { url: './' },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if ('focus' in c) return c.focus();
      }
      return self.clients.openWindow('./');
    }),
  );
});
