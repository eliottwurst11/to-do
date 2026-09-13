// Docket service worker — minimal offline support for the app shell.
// Strategy: network-first for navigation/HTML, cache-first fallback for
// everything else, so the app still opens (with whatever was last loaded)
// when there's no connection.

var CACHE_NAME = "docket-cache-v1";

self.addEventListener("install", function(event){
  self.skipWaiting();
});

self.addEventListener("activate", function(event){
  event.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(
        keys.filter(function(key){ return key !== CACHE_NAME; })
            .map(function(key){ return caches.delete(key); })
      );
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function(event){
  var req = event.request;
  if(req.method !== "GET") return;

  event.respondWith(
    fetch(req).then(function(res){
      if(res && res.ok && (new URL(req.url)).origin === self.location.origin){
        var copy = res.clone();
        caches.open(CACHE_NAME).then(function(cache){ cache.put(req, copy); });
      }
      return res;
    }).catch(function(){
      return caches.match(req).then(function(cached){
        return cached || caches.match("./index.html");
      });
    })
  );
});
