importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.4.1/workbox-sw.js');

workbox.routing.registerRoute(
    ({request}) => request.destination === 'image',
    new workbox.strategies.NetworkFirst()
  );

// workbox.loadModule('workbox-strategies');

// self.addEventListener('fetch', event => {
//   if (event.request.url.endsWith('.png')) {
//     // Referencing workbox.strategies will now work as expected.
//     const cacheFirst = new workbox.strategies.CacheFirst();
//     event.respondWith(cacheFirst.handle({request: event.request}));
//   }
// });