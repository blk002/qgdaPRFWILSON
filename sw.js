const CACHE_NAME = 'qg-prf-cache-v50';
// Base derivada da localização do próprio SW (ex.: '/qgdaPRFWILSON/')
const BASE = self.location.pathname.replace(/sw\.js$/, '');

// Instalação do Service Worker
self.addEventListener('install', () => {
  self.skipWaiting();
});

// Ativação e limpeza de caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Estratégia Fetch: Network-First para HTML/navegação (garante que todo deploy entre no ar imediatamente)
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.port === '5173') {
    return;
  }

  if (request.method !== 'GET') {
    return;
  }

  // Nunca intercepta o próprio sw.js, Supabase ou chamadas de auth
  if (url.pathname.endsWith('/sw.js') || url.hostname.includes('supabase.co') || url.pathname.includes('/auth/')) {
    return;
  }

  // Para documentos HTML / navegação: SEMPRE Network-First (nunca prende o usuário em versão antiga)
  const isHtmlNavigation =
    request.mode === 'navigate' ||
    (request.headers.get('accept') || '').includes('text/html') ||
    url.pathname.endsWith('/') ||
    url.pathname.endsWith('/index.html');

  if (isHtmlNavigation && url.origin === self.location.origin) {
    event.respondWith(
      fetch(request, { cache: 'no-store' })
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return networkResponse;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Para assets com hash (JS/CSS/Fontes): Network-First com fallback de cache
  if (url.origin === self.location.origin || url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return networkResponse;
        })
        .catch(() => caches.match(request))
    );
  }
});

// Listener para Notificações Push nativas
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data = { body: event.data.text() };
    }
  }

  const title = data.title || 'QG DA PRF — Alerta do Centro de Comando';
  const options = {
    body: data.body || 'Seu horário de estudo ou revisão está pendente. Não perca a ofensiva!',
    icon: BASE + 'favicon.svg',
    badge: BASE + 'favicon.svg',
    vibrate: [100, 50, 100],
    data: data.data || { url: BASE + '#/hoje' },
    actions: [
      { action: 'open', title: 'Estudar Agora' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Listener para clique na Notificação
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  let targetUrl = BASE;
  if (event.notification.data && event.notification.data.url) {
    targetUrl = event.notification.data.url;
  }

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Se houver uma aba aberta da plataforma, foca nela
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus().then((focusedClient) => {
            if (focusedClient.url !== self.location.origin + targetUrl) {
              return focusedClient.navigate(targetUrl);
            }
          });
        }
      }
      // Se não houver, abre uma nova janela
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
