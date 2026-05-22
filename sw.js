const CACHE_NAME = 'qg-prf-cache-v1';
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/icons.svg'
];

// Instalação do Service Worker e cache inicial (Precache)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('📦 [Service Worker] Pre-caching shell assets');
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Ativação e limpeza de caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('🧹 [Service Worker] Cleaning old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Estratégia Fetch: Stale-While-Revalidate para estáticos locais, ignora Supabase e externos
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignora requisições não-GET
  if (request.method !== 'GET') {
    return;
  }

  // Ignora Supabase e chamadas de autenticação externas
  if (url.hostname.includes('supabase.co') || url.pathname.includes('/auth/')) {
    return;
  }

  // Para assets da própria origem ou fontes externas comuns (Google Fonts)
  if (url.origin === self.location.origin || url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          const fetchedResponse = fetch(request).then((networkResponse) => {
            // Salva na cache somente requisições válidas de sucesso
            if (networkResponse.status === 200) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          }).catch((err) => {
            console.warn('⚠️ [Service Worker] Fetch failed, serving cached fallback:', err);
          });

          // Retorna a cache imediatamente se existir (Stale), caso contrário aguarda a rede
          return cachedResponse || fetchedResponse;
        });
      })
    );
  }
});

// Listener para Notificações Push nativas
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { body: event.data.text() };
    }
  }

  const title = data.title || 'QG DA PRF — Alerta do Centro de Comando';
  const options = {
    body: data.body || 'Seu horário de estudo ou revisão está pendente. Não perca a ofensiva!',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    vibrate: [100, 50, 100],
    data: data.data || { url: '/#/hoje' },
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
  
  let targetUrl = '/';
  if (event.notification.data && event.notification.data.url) {
    targetUrl = event.notification.data.url;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Se houver uma aba aberta da plataforma, foca nela
      for (let client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus().then((focusedClient) => {
            if (focusedClient.url !== self.location.origin + targetUrl) {
              return focusedClient.navigate(targetUrl);
            }
          });
        }
      }
      // Se não houver, abre uma nova janela
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
