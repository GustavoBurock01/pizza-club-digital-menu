import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// ===== PHASE 4: PREMIUM EXPERIENCE INITIALIZATION =====

// ===== SERVICE WORKER REGISTRATION =====
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('✅ Service Worker registrado:', registration.scope);
      
      // Listen for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // Notify app about update
              window.dispatchEvent(new CustomEvent('sw-update-available'));
            }
          });
        }
      });
    } catch (error) {
      console.log('❌ Service Worker registration failed:', error);
    }
  });
}

// ===== PERFORMANCE MONITORING AVANÇADO =====
if ('PerformanceObserver' in window) {
  // Core Web Vitals Observer
  const vitalsObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      const metric = {
        name: entry.name || entry.entryType,
        value: (entry as any).value || entry.startTime,
        timestamp: Date.now(),
      };

      // Store in analytics
      window.dispatchEvent(new CustomEvent('performance-metric', { detail: metric }));
      
      // Development logging
      if (!import.meta.env.PROD) {
        console.log('📊 Performance Metric:', metric);
      }
    }
  });

  vitalsObserver.observe({ 
    entryTypes: ['navigation', 'largest-contentful-paint', 'first-input', 'layout-shift'] 
  });

  // Resource timing observer
  const resourceObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.duration > 1000) { // Log slow resources
        console.warn('🐌 Slow resource:', entry.name, entry.duration + 'ms');
      }
    }
  });

  resourceObserver.observe({ entryTypes: ['resource'] });
}

// ===== PWA ENHANCEMENTS =====
// App install prompt handling
let deferredPrompt: any = null;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  window.dispatchEvent(new CustomEvent('pwa-installable'));
});

// Handle app installed
window.addEventListener('appinstalled', () => {
  console.log('🚀 PWA instalado com sucesso');
  window.dispatchEvent(new CustomEvent('pwa-installed'));
});

// ===== CRITICAL RESOURCE PRELOADING =====
const preloadCriticalResources = () => {
  // Critical font preload
  const fontLink = document.createElement('link');
  fontLink.rel = 'preload';
  fontLink.href = '/fonts/inter.woff2';
  fontLink.as = 'font';
  fontLink.type = 'font/woff2';
  fontLink.crossOrigin = 'anonymous';
  document.head.appendChild(fontLink);

  // Preload critical API endpoint
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(() => {
      // Warm up cache for critical routes
      fetch('/api/menu').catch(() => {}); // Silent fail
    });
  }
};

// ===== ERROR BOUNDARY GLOBAL =====
window.addEventListener('error', (event) => {
  // Track JavaScript errors
  window.dispatchEvent(new CustomEvent('app-error', {
    detail: {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: event.error?.stack,
    }
  }));
});

window.addEventListener('unhandledrejection', (event) => {
  // Track promise rejections
  window.dispatchEvent(new CustomEvent('app-error', {
    detail: {
      message: 'Unhandled Promise Rejection',
      error: event.reason,
    }
  }));
});

// ===== NETWORK STATUS MONITORING =====
const updateNetworkStatus = () => {
  window.dispatchEvent(new CustomEvent('network-status', {
    detail: {
      online: navigator.onLine,
      connection: (navigator as any).connection,
    }
  }));
};

window.addEventListener('online', updateNetworkStatus);
window.addEventListener('offline', updateNetworkStatus);

// ===== INITIALIZATION =====
preloadCriticalResources();

// Initialize app with performance monitoring
const startTime = performance.now();

createRoot(document.getElementById("root")!).render(<App />);

// Track app initialization time
window.addEventListener('load', () => {
  const loadTime = performance.now() - startTime;
  console.log(`⚡ App inicializado em ${loadTime.toFixed(2)}ms`);
  
  window.dispatchEvent(new CustomEvent('app-loaded', {
    detail: { loadTime }
  }));
});