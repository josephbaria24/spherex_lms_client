/* SphereX installability worker. Pass-through only — does not cache app data. */
self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting())
})

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener("fetch", () => {
  /* Chrome requires a fetch handler before it will offer installation. */
})
