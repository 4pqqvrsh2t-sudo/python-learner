const CACHE = 'pyrecall-v1';
const CORE = ['/', '/app.js', '/styles.css', '/manifest.webmanifest', '/icon.svg'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(CORE)));
  self.skipWaiting();
});
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).pathname.startsWith('/api/')) return;
  event.respondWith(fetch(event.request).then(r => {
    const clone = r.clone();
    caches.open(CACHE).then(c => c.put(event.request, clone));
    return r;
  }).catch(() => caches.match(event.request).then(r => r || caches.match('/'))));
});

self.addEventListener('push', event => {
  if (!event.data) return;
  let data;
  try { data = event.data.json(); } catch { return; }
  const n = data;
  event.waitUntil(self.registration.showNotification(n.title || 'PyRecall', {
    body: n.body || '',
    icon: '/icon.svg',
    badge: '/icon.svg',
    data: { navigate: n.navigate || '/' }
  }));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const target = event.notification?.data?.navigate || '/';
  event.waitUntil(clients.matchAll({ type:'window', includeUncontrolled:true }).then(list => {
    for (const client of list) {
      if ('navigate' in client) client.navigate(target);
      return client.focus();
    }
    return clients.openWindow(target);
  }));
});
