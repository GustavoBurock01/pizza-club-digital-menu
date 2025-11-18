// ===== PERFORMANCE OPTIMIZER - FASE 3 =====
// Mantém compatibilidade com API anterior + novos utilitários

import { debounce, throttle, measurePerformance } from './performance';

// Strategy management for optimization features
interface OptimizationStrategy {
  name: string;
  enabled: boolean;
  impact: string;
  description: string;
}

class PerformanceOptimizer {
  private strategies: Map<string, OptimizationStrategy> = new Map();

  constructor() {
    // Initialize default strategies
    this.strategies.set('lazy-loading', {
      name: 'lazy-loading',
      enabled: true,
      impact: 'High',
      description: 'Lazy load images and components'
    });
    
    this.strategies.set('query-deduplication', {
      name: 'query-deduplication',
      enabled: true,
      impact: 'Medium',
      description: 'Deduplicate simultaneous queries'
    });
    
    this.strategies.set('bundle-splitting', {
      name: 'bundle-splitting',
      enabled: true,
      impact: 'High',
      description: 'Split code into optimized chunks'
    });
  }

  // Export debounce and throttle from performance.ts
  debounce = debounce;
  throttle = throttle;

  enableStrategy(name: string) {
    const strategy = this.strategies.get(name);
    if (strategy) {
      strategy.enabled = true;
      console.log(`✅ Strategy enabled: ${name}`);
    }
  }

  disableStrategy(name: string) {
    const strategy = this.strategies.get(name);
    if (strategy) {
      strategy.enabled = false;
      console.log(`❌ Strategy disabled: ${name}`);
    }
  }

  getOptimizationReport() {
    return {
      strategies: Array.from(this.strategies.values()),
      timestamp: Date.now(),
    };
  }

  isStrategyEnabled(name: string): boolean {
    return this.strategies.get(name)?.enabled ?? false;
  }
}

// Singleton instance
export const performanceOptimizer = new PerformanceOptimizer();

// Re-export utility functions
export { debounce, throttle, measurePerformance };

// New utilities for Fase 3
export const memoize = <T extends (...args: any[]) => any>(func: T): T => {
  const cache = new Map<string, ReturnType<T>>();
  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = JSON.stringify(args);
    if (cache.has(key)) return cache.get(key)!;
    const result = func(...args);
    cache.set(key, result);
    return result;
  }) as T;
};

export const measureTime = async <T>(
  name: string,
  fn: () => Promise<T> | T
): Promise<T> => {
  const start = performance.now();
  try {
    const result = await fn();
    console.log(`⏱️ ${name}: ${(performance.now() - start).toFixed(2)}ms`);
    return result;
  } catch (error) {
    console.error(`❌ ${name} failed: ${(performance.now() - start).toFixed(2)}ms`);
    throw error;
  }
};
