// Service worker for the staff screen (/service). Only shows waiter-call
// notifications and brings the screen to the front when one is tapped.

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch { /* plain text push */ }
  const title = data.title || "Neuer Ruf";
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || "",
      tag: data.tag || "oriz-service",
      renotify: true,
      requireInteraction: true,
      vibrate: [200, 100, 200],
      icon: "/icon.svg",
      badge: "/icon.svg",
      data: { url: data.url || "/service" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL((event.notification.data && event.notification.data.url) || "/service", self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      const open = windows.find((w) => w.url.startsWith(self.location.origin + "/service"));
      return open ? open.focus() : self.clients.openWindow(url);
    }),
  );
});
