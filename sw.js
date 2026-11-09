const CACHE_NAME = 'rosario-cruxvincet-app-v2';
const AUDIO_CACHE_NAME = 'rosario-cruxvincet-audio-vault';
const XOR_KEY = new Uint8Array([0x43, 0x52, 0x56, 0x58, 0x56, 0x49, 0x4E, 0x43, 0x45, 0x54, 0x31, 0x39, 0x35, 0x38, 0x4D, 0x52]);

const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './README.md',
  './LICENSE.md',
  './data/cartucho-rosario-la.json',
  './assets/icons/apple-touch-icon.png',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/icon-1024.png',
  './assets/img/portada-sanctum-rosarium.jpg',
  './assets/img/boton-entrar-letras.jpg',
  './assets/img/crucifijo-cristo.jpg',
  './assets/img/san-miguel.jpg',
  './assets/img/pergamino-latente.jpg',
  './assets/img/pergamino-florecido.jpg',
  './assets/img/pergamino-dorado.jpg',
  './assets/img/sello-idioma.jpg',
  './assets/img/querubin-apostolado.jpg',
  './assets/img/misterios/gaudiosa-1.jpg',
  './assets/img/misterios/gaudiosa-2.jpg',
  './assets/img/misterios/gaudiosa-3.jpg',
  './assets/img/misterios/gaudiosa-4.jpg',
  './assets/img/misterios/gaudiosa-5.jpg',
  './assets/img/misterios/dolorosa-1.jpg',
  './assets/img/misterios/dolorosa-2.jpg',
  './assets/img/misterios/dolorosa-3.jpg',
  './assets/img/misterios/dolorosa-4.jpg',
  './assets/img/misterios/dolorosa-5.jpg',
  './assets/img/misterios/gloriosa-1.jpg',
  './assets/img/misterios/gloriosa-2.jpg',
  './assets/img/misterios/gloriosa-3.jpg',
  './assets/img/misterios/gloriosa-4.jpg',
  './assets/img/misterios/gloriosa-5.jpg'
];

const AUDIO_ASSETS = [
  './audio/rosario-maestro-la.mp3'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)),
      caches.open(AUDIO_CACHE_NAME).then(async (audioCache) => {
        await audioCache.addAll(AUDIO_ASSETS);
        const rawResp = await audioCache.match('./audio/rosario-maestro-la.mp3');
        if (rawResp) {
          const rawBuf = await rawResp.arrayBuffer();
          const encBytes = new Uint8Array(rawBuf.slice(0));
          const lim = Math.min(encBytes.byteLength, 16384);
          for (let i = 0; i < lim; i++) encBytes[i] ^= XOR_KEY[i % XOR_KEY.length];
          await audioCache.put('./audio/rosario-maestro-la.cvx', new Response(encBytes, {
            headers: { 'Content-Type': 'application/octet-stream' }
          }));
        }
      })
    ]).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME && key !== AUDIO_CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    ).then(() => self.clients.claim())
  );
});

async function serveAudioWithRangeSupport(request) {
  const audioCache = await caches.open(AUDIO_CACHE_NAME);
  let cachedResp = await audioCache.match('./audio/rosario-maestro-la.cvx');
  let isEncrypted = true;

  if (!cachedResp) {
    cachedResp = await audioCache.match(request, { ignoreSearch: true });
    isEncrypted = request.url.endsWith('.cvx');
  }
  if (!cachedResp) {
    try {
      const netResp = await fetch(request);
      if (netResp && netResp.status === 200) {
        audioCache.put(request, netResp.clone());
      }
      return netResp;
    } catch (err) {
      return new Response('', { status: 404 });
    }
  }

  const arrayBuffer = await cachedResp.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  if (isEncrypted) {
    const limit = Math.min(bytes.byteLength, 16384);
    for (let i = 0; i < limit; i++) {
      bytes[i] ^= XOR_KEY[i % XOR_KEY.length];
    }
  }

  const totalLength = bytes.byteLength;
  const rangeHeader = request.headers.get('range');
  if (!rangeHeader) {
    return new Response(bytes, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': String(totalLength),
        'Accept-Ranges': 'bytes'
      }
    });
  }

  const parts = rangeHeader.replace(/bytes=/, '').split('-');
  const start = parseInt(parts[0], 10) || 0;
  const end = parts[1] ? parseInt(parts[1], 10) : totalLength - 1;
  const safeEnd = Math.min(totalLength - 1, Math.max(start, end));
  const chunk = bytes.subarray(start, safeEnd + 1);

  return new Response(chunk, {
    status: 206,
    statusText: 'Partial Content',
    headers: {
      'Content-Type': 'audio/mpeg',
      'Content-Range': `bytes ${start}-${safeEnd}/${totalLength}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': String(chunk.byteLength)
    }
  });
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.pathname.endsWith('.mp3') || url.pathname.endsWith('.cvx')) {
    event.respondWith(serveAudioWithRangeSupport(event.request));
    return;
  }
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then((cached) => {
      return cached || fetch(event.request).then((resp) => {
        if (resp && resp.status === 200 && resp.type === 'basic') {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then((c) => c.put(event.request, clone));
        }
        return resp;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
