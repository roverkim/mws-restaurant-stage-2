const staticCacheName = 'restaurant-1';

self.addEventListener('install', event => {
  const toCache = [
    '/',
    'index.html',
    'restaurant.html',
    'css/styles.css',
    'js/dbhelper.js',
    'js/main.js',
    'js/restaurant_info.js',
    'data/restaurants.json',
    'img/',
    '/restaurant.html?id=1',
    '/restaurant.html?id=2',
    '/restaurant.html?id=3',
    '/restaurant.html?id=4',
    '/restaurant.html?id=5',
    '/restaurant.html?id=6',
    '/restaurant.html?id=7',
    '/restaurant.html?id=8',
    '/restaurant.html?id=9',
    '/restaurant.html?id=10'
  ];

  event.waitUntil(caches.open(staticCacheName).then(cache => {
    toCache.forEach(link => cache.add(link));
  }))
});

self.addEventListener('activate', function(event) {
  event.waitUntil(caches.keys().then(function(cacheNames) {
    return Promise.all(cacheNames.filter(function(cacheName) {
      return cacheName.startsWith('restaurant-') && cacheName != staticCacheName;
    }).map(function(cacheName) {
      return caches.delete(cacheName);
    }));
  }));
});


self.addEventListener('fetch', function(event) {
  if (event.request.method === 'GET') {
    // console.log('Method is ', event.request.method);
    event.respondWith(caches.match(event.request).then(function(response) {
      // Fetch and cache the response if response has not been cached.
      return response || fetch(event.request).then(fetchResponse => {
        return caches.open(staticCacheName).then(cache => {
          cache.put(event.request, fetchResponse.clone());
          return fetchResponse;
        })
      });
    }));
  }
});
