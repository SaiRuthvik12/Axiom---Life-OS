/// <reference lib="webworker" />
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

declare let self: ServiceWorkerGlobalScope;

// ── Workbox Precaching ──
// The __WB_MANIFEST placeholder is replaced at build time with the precache manifest
precacheAndRoute(self.__WB_MANIFEST);

// ── Runtime Caching (same rules as previous generateSW config) ──
registerRoute(
  /^https:\/\/cdn\.tailwindcss\.com\/.*/i,
  new CacheFirst({
    cacheName: 'tailwind-cdn',
    plugins: [
      new ExpirationPlugin({ maxEntries: 1, maxAgeSeconds: 60 * 60 * 24 * 30 }),
    ],
  })
);

registerRoute(
  /^https:\/\/fonts\.googleapis\.com\/.*/i,
  new CacheFirst({
    cacheName: 'google-fonts',
    plugins: [
      new ExpirationPlugin({ maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 }),
    ],
  })
);

// ── Push Notification Handler ──
// Receives push events from the Web Push server and displays system notifications.
self.addEventListener('push', (event: PushEvent) => {
  if (!event.data) return;

  let payload: { title?: string; body?: string; icon?: string; badge?: string; tag?: string; url?: string; type?: string };

  try {
    payload = event.data.json();
  } catch {
    // Fallback for plain text payloads
    payload = { title: 'Axiom', body: event.data.text() };
  }

  const title = payload.title ?? 'Axiom | Life OS';
  const options: NotificationOptions = {
    body: payload.body ?? '',
    icon: payload.icon ?? '/icon.svg',
    badge: payload.badge ?? '/icon.svg',
    tag: payload.tag ?? `axiom-${Date.now()}`,
    data: {
      url: payload.url ?? '/',
      type: payload.type ?? 'general',
    },
    // Vibrate pattern for mobile: short-long-short
    vibrate: [100, 200, 100],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// ── Notification Click Handler ──
// Opens the app or focuses an existing window when a notification is tapped.
self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Focus an existing window if one is open
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open a new window
      return self.clients.openWindow(targetUrl);
    })
  );
});

// ── Message Handler ──
// Allows the main page to trigger local notifications via postMessage.
// Used for world events and milestones (client-side triggered).
self.addEventListener('message', (event: ExtendableMessageEvent) => {
  if (event.data?.type === 'SHOW_NOTIFICATION') {
    const { title, body, tag, icon, url, notifType } = event.data;
    event.waitUntil(
      self.registration.showNotification(title ?? 'Axiom', {
        body: body ?? '',
        icon: icon ?? '/icon.svg',
        badge: '/icon.svg',
        tag: tag ?? `axiom-local-${Date.now()}`,
        data: { url: url ?? '/', type: notifType ?? 'local' },
        vibrate: [100, 200, 100],
      })
    );
  }
});
