/* Service worker — ทำให้เป็นเว็บแอปที่ติดตั้งได้และเปิดตอนออฟไลน์
   เปลี่ยนอะไรใน index.html แล้ว อัปเวอร์ชัน CACHE ด้วยเสมอ ไม่งั้นผู้ใช้เก่าจะเห็นของเดิม */
const CACHE = 'parich-survey-v4';
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
    /* ไฟล์ของแอปเอง: เอาจากแคชก่อน ถ้าไม่มีค่อยออกเครือข่าย แล้วเก็บกลับ ตอนออฟไลน์ล้มเหลวให้ย้อนกลับมาที่หน้าหลัก */
    e.respondWith(
      caches.match(req, { ignoreSearch: true }).then(hit =>
        hit || fetch(req).then(res => {
          const cp = res.clone();
          caches.open(CACHE).then(c => c.put(req, cp));
          return res;
        }).catch(() => req.mode === 'navigate' ? caches.match('./index.html') : undefined)
      )
    );
  } else {
    /* ซีดีเอ็นฟอนต์และไอคอน (Google Fonts, Tabler): เก็บไว้ใช้ตอนออฟไลน์เมื่อโหลดสำเร็จครั้งแรก */
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
