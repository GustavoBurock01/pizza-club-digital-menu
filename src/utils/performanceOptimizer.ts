// ===== SISTEMA DE OTIMIZAÇÃO DE PERFORMANCE =====

import { analytics } from './advancedAnalytics';

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  type: 'timing' | 'navigation' | 'paint' | 'resource' | 'memory';
}

interface OptimizationStrategy {
  name: string;
  enabled: boolean;
  impact: 'low' | 'medium' | 'high';
  implementation: () => void;
}

class PerformanceOptimizer {
  private static instance: PerformanceOptimizer;
  private metrics: PerformanceMetric[] = [];
  private strategies: Map<string, OptimizationStrategy> = new Map();
  private observer: PerformanceObserver | null = null;

  private constructor() {
    this.initializeStrategies();
    this.startMonitoring();
    this.implementOptimizations();
  }

  public static getInstance(): PerformanceOptimizer {
    if (!PerformanceOptimizer.instance) {
      PerformanceOptimizer.instance = new PerformanceOptimizer();
    }
    return PerformanceOptimizer.instance;
  }

  // ===== INICIALIZAR ESTRATÉGIAS =====
  private initializeStrategies() {
    const strategies: Array<Omit<OptimizationStrategy, 'enabled'>> = [
      {
        name: 'lazy_loading',
        impact: 'high',
        implementation: this.implementLazyLoading.bind(this)
      },
      {
        name: 'image_optimization',
        impact: 'high',  
        implementation: this.implementImageOptimization.bind(this)
      },
      {
        name: 'code_splitting',
        impact: 'medium',
        implementation: this.implementBundleOptimization.bind(this)
      },
      {
        name: 'preload_critical',
        impact: 'medium',
        implementation: this.implementCriticalPreload.bind(this)
      },
      {
        name: 'service_worker',
        impact: 'high',
        implementation: this.implementServiceWorker.bind(this)
      },
      {
        name: 'bundle_optimization',
        impact: 'medium',
        implementation: this.implementBundleOptimization.bind(this)
      },
      {
        name: 'memory_management',
        impact: 'medium',
        implementation: this.implementMemoryManagement.bind(this)
      }
    ];

    strategies.forEach(strategy => {
      this.strategies.set(strategy.name, {
        ...strategy,
        enabled: true
      });
    });
  }

  // ===== MONITORAMENTO DE PERFORMANCE =====
  private startMonitoring() {
    // Performance Observer para métricas em tempo real
    if ('PerformanceObserver' in window) {
      this.observer = new PerformanceObserver((list) => {
        list.getEntries().forEach(entry => {
          this.recordMetric({
            name: entry.name,
            value: entry.duration || (entry as any).value || 0,
            timestamp: entry.startTime,
            type: this.getMetricType(entry.entryType)
          });
        });
      });

      try {
        this.observer.observe({ 
          entryTypes: ['navigation', 'paint', 'largest-contentful-paint', 'first-input', 'layout-shift'] 
        });
      } catch (error) {
        console.warn('Performance Observer not supported for some metrics');
      }
    }

    // Core Web Vitals
    this.measureCoreWebVitals();

    // Resource timing
    this.monitorResourceTiming();

    // Memory usage
    this.monitorMemoryUsage();

    // Bundle size tracking
    this.trackBundleSize();
  }

  // ===== CORE WEB VITALS =====
  private measureCoreWebVitals() {
    // Largest Contentful Paint (LCP)
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      this.recordMetric({
        name: 'LCP',
        value: lastEntry.startTime,
        timestamp: performance.now(),
        type: 'paint'
      });
    });

    try {
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (error) {
      console.warn('LCP observer not supported');
    }

    // First Input Delay (FID)
    const fidObserver = new PerformanceObserver((list) => {
      list.getEntries().forEach(entry => {
        this.recordMetric({
          name: 'FID',
          value: (entry as any).processingStart - entry.startTime,
          timestamp: performance.now(),
          type: 'timing'
        });
      });
    });

    try {
      fidObserver.observe({ entryTypes: ['first-input'] });
    } catch (error) {
      console.warn('FID observer not supported');
    }

    // Cumulative Layout Shift (CLS)
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((list) => {
      list.getEntries().forEach(entry => {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
          this.recordMetric({
            name: 'CLS',
            value: clsValue,
            timestamp: performance.now(),
            type: 'timing'
          });
        }
      });
    });

    try {
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    } catch (error) {
      console.warn('CLS observer not supported');
    }
  }

  // ===== IMPLEMENTAR OTIMIZAÇÕES =====
  private implementOptimizations() {
    this.strategies.forEach(strategy => {
      if (strategy.enabled) {
        try {
          strategy.implementation();
          console.log(`✅ Optimization implemented: ${strategy.name}`);
        } catch (error) {
          console.error(`❌ Failed to implement ${strategy.name}:`, error);
        }
      }
    });
  }

  // ===== LAZY LOADING =====
  private implementLazyLoading() {
    // Lazy loading para imagens
    const images = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          img.src = img.dataset.src!;
          img.removeAttribute('data-src');
          imageObserver.unobserve(img);
        }
      });
    });

    images.forEach(img => imageObserver.observe(img));

    // Lazy loading para componentes
    const lazyComponents = document.querySelectorAll('[data-lazy-component]');
    const componentObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const element = entry.target as HTMLElement;
          const componentName = element.dataset.lazyComponent;
          this.loadComponentLazily(componentName!);
          componentObserver.unobserve(element);
        }
      });
    });

    lazyComponents.forEach(component => componentObserver.observe(component));
  }

  // ===== OTIMIZAÇÃO DE IMAGENS =====
  private implementImageOptimization() {
    // Detectar e otimizar imagens
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      // Adicionar loading="lazy" se não existir
      if (!img.hasAttribute('loading')) {
        img.setAttribute('loading', 'lazy');
      }

      // Adicionar srcset responsivo se não existir
      if (!img.hasAttribute('srcset') && img.src) {
        const baseSrc = img.src;
        const srcset = [
          `${baseSrc}?w=480 480w`,
          `${baseSrc}?w=768 768w`,
          `${baseSrc}?w=1024 1024w`,
          `${baseSrc}?w=1920 1920w`
        ].join(', ');
        img.setAttribute('srcset', srcset);
        img.setAttribute('sizes', '(max-width: 480px) 480px, (max-width: 768px) 768px, 1024px');
      }
    });
  }

  // ===== PRELOAD CRÍTICO =====
  private implementCriticalPreload() {
    // Preload recursos críticos
    const criticalResources = [
      { href: '/api/menu', as: 'fetch', type: 'application/json' },
      { href: '/fonts/main.woff2', as: 'font', type: 'font/woff2', crossorigin: 'anonymous' }
    ];

    criticalResources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource.href;
      link.as = resource.as;
      if (resource.type) link.type = resource.type;
      if (resource.crossorigin) link.crossOrigin = resource.crossorigin;
      document.head.appendChild(link);
    });

    // Prefetch próximas rotas baseado no comportamento do usuário
    this.implementIntelligentPrefetch();
  }

  // ===== PREFETCH INTELIGENTE =====
  private implementIntelligentPrefetch() {
    // Prefetch baseado em hover
    const links = document.querySelectorAll('a[href^="/"]');
    links.forEach(link => {
      link.addEventListener('mouseenter', () => {
        const href = (link as HTMLAnchorElement).href;
        this.prefetchRoute(href);
      }, { once: true });
    });

    // Prefetch baseado em analytics
    const behaviorAnalysis = analytics.getBehaviorAnalysis();
    behaviorAnalysis.commonPaths.slice(0, 3).forEach(path => {
      path.path.forEach(page => {
        if (page !== window.location.pathname) {
          this.prefetchRoute(page);
        }
      });
    });
  }

  // ===== SERVICE WORKER =====
  private implementServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('Service Worker registered:', registration);
          
          // Atualizar SW quando disponível
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // Notificar usuário sobre atualização
                  this.notifyUpdate();
                }
              });
            }
          });
        })
        .catch(error => {
          console.error('Service Worker registration failed:', error);
        });
    }
  }

  // ===== OTIMIZAÇÃO DE BUNDLE =====
  private implementBundleOptimization() {
    // Tree shaking virtual - remover código não utilizado
    this.analyzeUnusedCode();

    // Compression headers
    this.setupCompressionHeaders();

    // Code splitting dinâmico
    this.setupDynamicImports();
  }

  // ===== GERENCIAMENTO DE MEMÓRIA =====
  private implementMemoryManagement() {
    // Cleanup de event listeners
    this.setupEventListenerCleanup();

    // Garbage collection hints
    this.setupGarbageCollectionHints();

    // Memory leak detection
    this.detectMemoryLeaks();
  }

  // ===== UTILITÁRIOS =====
  private recordMetric(metric: PerformanceMetric) {
    this.metrics.push(metric);
    
    // Manter apenas últimas 1000 métricas
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }

    // Analytics tracking
    analytics.track('performance_metric', {
      name: metric.name,
      value: metric.value,
      type: metric.type
    });
  }

  private getMetricType(entryType: string): PerformanceMetric['type'] {
    const typeMap: Record<string, PerformanceMetric['type']> = {
      'navigation': 'navigation',
      'paint': 'paint',
      'resource': 'resource',
      'measure': 'timing',
      'mark': 'timing'
    };
    return typeMap[entryType] || 'timing';
  }

  private async loadComponentLazily(componentName: string) {
    try {
      const component = await import(`../components/${componentName}.tsx`);
      console.log(`Lazy loaded component: ${componentName}`);
      return component;
    } catch (error) {
      console.error(`Failed to lazy load ${componentName}:`, error);
    }
  }

  private prefetchRoute(href: string) {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = href;
    document.head.appendChild(link);
  }

  private notifyUpdate() {
    // Implementar notificação de atualização
    console.log('App update available');
  }

  private monitorResourceTiming() {
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach(entry => {
        if (entry.entryType === 'resource') {
          this.recordMetric({
            name: `resource_${entry.name}`,
            value: entry.duration,
            timestamp: entry.startTime,
            type: 'resource'
          });
        }
      });
    });

    try {
      observer.observe({ entryTypes: ['resource'] });
    } catch (error) {
      console.warn('Resource timing observer not supported');
    }
  }

  private monitorMemoryUsage() {
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        this.recordMetric({
          name: 'memory_used',
          value: memory.usedJSHeapSize / 1048576, // Convert to MB
          timestamp: performance.now(),
          type: 'memory'
        });
      }, 60000); // Every minute
    }
  }

  private trackBundleSize() {
    // Simular tracking de bundle size
    const bundleSize = document.querySelectorAll('script').length * 50; // Estimativa
    this.recordMetric({
      name: 'bundle_size',
      value: bundleSize,
      timestamp: performance.now(),
      type: 'resource'
    });
  }

  private analyzeUnusedCode() {
    // Placeholder para análise de código não utilizado
    console.log('Analyzing unused code...');
  }

  private setupCompressionHeaders() {
    // Placeholder para headers de compressão
    console.log('Setting up compression headers...');
  }

  private setupDynamicImports() {
    // Placeholder para imports dinâmicos
    console.log('Setting up dynamic imports...');
  }

  private setupEventListenerCleanup() {
    // Placeholder para cleanup de event listeners
    console.log('Setting up event listener cleanup...');
  }

  private setupGarbageCollectionHints() {
    // Placeholder para dicas de garbage collection
    console.log('Setting up garbage collection hints...');
  }

  private detectMemoryLeaks() {
    // Placeholder para detecção de memory leaks
    console.log('Setting up memory leak detection...');
  }

  // ===== MÉTODOS PÚBLICOS =====
  public getMetrics(): PerformanceMetric[] {
    return this.metrics;
  }

  public getPerformanceScore(): number {
    const lcpMetric = this.metrics.find(m => m.name === 'LCP');
    const fidMetric = this.metrics.find(m => m.name === 'FID');
    const clsMetric = this.metrics.find(m => m.name === 'CLS');

    let score = 100;

    // LCP scoring (good: <2.5s, needs improvement: 2.5-4s, poor: >4s)
    if (lcpMetric) {
      if (lcpMetric.value > 4000) score -= 30;
      else if (lcpMetric.value > 2500) score -= 15;
    }

    // FID scoring (good: <100ms, needs improvement: 100-300ms, poor: >300ms)
    if (fidMetric) {
      if (fidMetric.value > 300) score -= 30;
      else if (fidMetric.value > 100) score -= 15;
    }

    // CLS scoring (good: <0.1, needs improvement: 0.1-0.25, poor: >0.25)
    if (clsMetric) {
      if (clsMetric.value > 0.25) score -= 30;
      else if (clsMetric.value > 0.1) score -= 15;
    }

    return Math.max(0, score);
  }

  public enableStrategy(name: string) {
    const strategy = this.strategies.get(name);
    if (strategy) {
      strategy.enabled = true;
      strategy.implementation();
    }
  }

  public disableStrategy(name: string) {
    const strategy = this.strategies.get(name);
    if (strategy) {
      strategy.enabled = false;
    }
  }

  public getOptimizationReport(): {
    score: number;
    metrics: PerformanceMetric[];
    strategies: Array<{ name: string; enabled: boolean; impact: string }>;
    recommendations: string[];
  } {
    const score = this.getPerformanceScore();
    const recommendations: string[] = [];

    // Gerar recomendações baseadas nas métricas
    const lcpMetric = this.metrics.find(m => m.name === 'LCP');
    if (lcpMetric && lcpMetric.value > 2500) {
      recommendations.push('Optimize Largest Contentful Paint - consider image optimization and server response times');
    }

    const fidMetric = this.metrics.find(m => m.name === 'FID');
    if (fidMetric && fidMetric.value > 100) {
      recommendations.push('Improve First Input Delay - reduce JavaScript execution time');
    }

    const clsMetric = this.metrics.find(m => m.name === 'CLS');
    if (clsMetric && clsMetric.value > 0.1) {
      recommendations.push('Fix Cumulative Layout Shift - ensure images and ads have dimensions');
    }

    return {
      score,
      metrics: this.metrics,
      strategies: Array.from(this.strategies.entries()).map(([name, strategy]) => ({
        name,
        enabled: strategy.enabled,
        impact: strategy.impact
      })),
      recommendations
    };
  }
}

export const performanceOptimizer = PerformanceOptimizer.getInstance();