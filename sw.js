/* ==========================================
   Service Worker — تحدي الحساب الذهني
   يُخزّن الملفات للعب بدون إنترنت
========================================== */
const CACHE = 'math-quiz-v2';

const CACHE_URLS = [
  './',
  './mental-math-quiz.html',
  'https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;700;900&family=Orbitron:wght@700;900&display=swap',
  'https://fonts.gstatic.com/s/tajawal/v4/Iura6YBj_oCad4k1nzSBC45I.woff2',
  'https://fonts.gstatic.com/s/orbitron/v25/yMJMMIlzdpvBhQQL_SC3X9yhF25-T1nyGy6BoWgz.woff2'
];

/* ── التثبيت: تخزين كل الملفات ── */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => {
      // نحاول تخزين كل ملف — إذا فشل أي منها لا نوقف العملية
      return Promise.allSettled(
        CACHE_URLS.map(url =>
          cache.add(url).catch(() => console.log('[SW] تعذّر تخزين:', url))
        )
      );
    }).then(() => self.skipWaiting())
  );
});

/* ── التفعيل: حذف الكاش القديم ── */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE).map(k => {
          console.log('[SW] حذف كاش قديم:', k);
          return caches.delete(k);
        })
      )
    ).then(() => self.clients.claim())
  );
});

/* ── الاعتراض: كاش أولاً ثم الشبكة ── */
self.addEventListener('fetch', event => {
  // تجاهل طلبات غير GET
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      // ليس في الكاش — نحاول الشبكة ونخزّن النتيجة
      return fetch(event.request).then(response => {
        if (!response || response.status !== 200 || response.type === 'error') {
          return response;
        }
        const toCache = response.clone();
        caches.open(CACHE).then(cache => cache.put(event.request, toCache));
        return response;
      }).catch(() => {
        // لا إنترنت ولا كاش — نُعيد صفحة الخطأ
        return cached || new Response('لا يوجد اتصال بالإنترنت', {
          status: 503,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
      });
    })
  );
});
