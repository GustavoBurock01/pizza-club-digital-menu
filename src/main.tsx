import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// ===== CONFIGURAÇÃO INICIAL DE PERFORMANCE =====

// Configurar performance observer para métricas
if ('PerformanceObserver' in window) {
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      // Log apenas métricas importantes
      if (entry.entryType === 'navigation') {
        const navEntry = entry as PerformanceNavigationTiming;
        console.log('📊 Navigation timing:', {
          domContentLoaded: navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart,
          loadComplete: navEntry.loadEventEnd - navEntry.loadEventStart,
        });
      }
    }
  });
  
  observer.observe({ entryTypes: ['navigation', 'largest-contentful-paint'] });
}

// Configurar service worker para cache
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Falha silenciosa para não afetar a experiência
    });
  });
}

// Preload crítico
const preloadCriticalResources = () => {
  // Preload fonte crítica
  const fontLink = document.createElement('link');
  fontLink.rel = 'preload';
  fontLink.href = '/fonts/inter.woff2';
  fontLink.as = 'font';
  fontLink.type = 'font/woff2';
  fontLink.crossOrigin = 'anonymous';
  document.head.appendChild(fontLink);
};

preloadCriticalResources();

// Render da aplicação
createRoot(document.getElementById("root")!).render(<App />);