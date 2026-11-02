import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

// Auto-recuperação contra chunk cache antigo (Failed to fetch dynamically imported module)
window.addEventListener('vite:preloadError', (event) => {
  console.warn('🔄 Novo deploy detectado! Recarregando para buscar a versão mais recente dos arquivos...');
  event.preventDefault();
  window.location.reload();
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HashRouter>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </HashRouter>
  </StrictMode>,
)

// Gerenciamento de Service Worker
if ('serviceWorker' in navigator) {
  if (import.meta.env.DEV) {
    // Em desenvolvimento local, desregistra Service Worker e limpa caches para nunca travar em código antigo
    navigator.serviceWorker.getRegistrations().then(registrations => {
      for (const reg of registrations) {
        reg.unregister();
      }
    });
    if ('caches' in window) {
      caches.keys().then(names => {
        for (const name of names) {
          caches.delete(name);
        }
      });
    }
  } else {
    // Limpa caches antigos (pré-v50) que usavam Stale-While-Revalidate no index.html
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          if (name !== 'qg-prf-cache-v52') {
            caches.delete(name);
          }
        });
      });
    }

    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });

    window.addEventListener('load', () => {
      navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`)
        .then(reg => {
          console.log('Service Worker registrado com sucesso:', reg.scope);
          reg.update();
        })
        .catch(err => console.error('Erro ao registrar o Service Worker:', err));
    });
  }
}


