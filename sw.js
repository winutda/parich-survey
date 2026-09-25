/* Service worker — ทำให้เป็นเว็บแอปที่ติดตั้งได้และเปิดตอนออฟไลน์
   หน้า HTML ใช้ network-first: ออนไลน์อยู่ตอนไหนได้เวอร์ชันล่าสุดเสมอ ไม่มีเรื่องค้างของเก่าอีก
   เปลี่ยนอะไรใน index.html แล้ว อัปเวอร์ชัน CACHE ด้วยเสมอ */
const CACHE = 'parich-survey-v9';
const CORE = ['./', './index.html', './manifest.webmanifest', './icon.svg'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    if (req.mode === 'navigate' || req.destination === 'document') {
      /* หน้าเว็บ: เอาจากเครือข่ายก่อนเสมอ ตกลงมาค่อยใช้แคช (ออฟไลน์) */
      e.respondWith(
        fetch(req).then(res => {
          const cp = res.clone();
          caches.open(CACHE).then(c => c.put(req, cp));
          return res;
        }).catch(() => caches.match(req, { ignoreSearch: true }).then(hit => hit || caches.match('./index.html')))
      );
    } else {
      /* ไฟล์ประกอบ: แคชก่อน เครือข่ายสำรอง */
      e.respondWith(
        caches.match(req, { ignoreSearch: true }).then(hit =>
          hit || fetch(req).then(res => {
            const cp = res.clone();
            caches.open(CACHE).then(c => c.put(req, cp));
            return res;
          }).catch(() => undefined)
        )
      );
    }
  } else {
    /* ซีดีเอ็นฟอนต์และไอคอน: เก็บไว้ใช้ตอนออฟไลน์เมื่อโหลดสำเร็จครั้งแรก */
    e.respondWith(
      caches.match(req).then(hit =>
        hit || fetch(req).then(res => {
          if (res.ok) { const cp = res.clone(); caches.open(CACHE).then(c => c.put(req, cp)); }
          return res;
        })
      )
    );
  }
});
