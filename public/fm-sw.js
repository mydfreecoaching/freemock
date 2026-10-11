/* Push notifications (Firebase Cloud Messaging, data messages) for the Free Mock Test site. */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('push', (event) => {
  let j = {};
  try { j = event.data ? event.data.json() : {}; } catch (e) { j = { data: { body: event.data && event.data.text() } }; }
  const d = j.data || j.notification || j;
  const title = d.title || 'Free Mock Test';
  event.waitUntil(self.registration.showNotification(title, {
    body: d.body || '',
    icon: '/icon.png',
    badge: '/icon.png',
    tag: d.tag || undefined,
    data: { link: d.link || '/dashboard' },
  }));
});
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = new URL((event.notification.data && event.notification.data.link) || '/dashboard', self.location.origin).href;
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
    for (const c of list) if (c.url === url && 'focus' in c) return c.focus();
    return self.clients.openWindow(url);
  }));
});
