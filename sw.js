// 여백 리더 service worker: 앱 껍데기와 글꼴을 캐시해 오프라인에서도 열리게 한다.
const CACHE = 'yeobaek-v10';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
// stale-while-revalidate: 캐시를 먼저 보여 주고 뒤에서 새 버전을 받아 둔다.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || !e.request.url.startsWith('http')) return;
  // cache only the app itself, its fonts and its library; translation/dictionary lookups always go to the network
  const url = new URL(e.request.url);
  const cacheable = url.origin === location.origin || ['fonts.googleapis.com', 'fonts.gstatic.com', 'cdnjs.cloudflare.com'].includes(url.hostname);
  if (!cacheable) return;
  // 페이지 자체는 네트워크 우선: 새 버전이 바로 반영되고, 오프라인이면 캐시로 연다.
  if (e.request.mode === 'navigate') {
    // revalidate past the browser's HTTP cache (GitHub Pages sends max-age=600), so a push shows up on the next open
    e.respondWith(fetch(e.request.url, { cache: 'no-cache', credentials: 'same-origin' }).then(res => {
      const copy = res.clone(); caches.open(CACHE).then(c => c.put('./index.html', copy)); return res;
    }).catch(() => caches.match('./index.html')));
    return;
  }
  e.respondWith(caches.open(CACHE).then(async cache => {
    const hit = await cache.match(e.request);
    const net = fetch(e.request).then(res => {
      if (res.ok || res.type === 'opaque') cache.put(e.request, res.clone());
      return res;
    }).catch(() => hit);
    return hit || net;
  }));
});
