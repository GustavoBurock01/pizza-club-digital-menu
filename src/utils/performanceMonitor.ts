// ===== PERFORMANCE MONITORING (FASE 3) =====

interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private enabled: boolean = import.meta.env.DEV;

  /**
   * Mede o tempo de execução de uma função síncrona
   */
  measureSync<T>(name: string, fn: () => T): T {
    if (!this.enabled) return fn();

    const startTime = performance.now();
    const result = fn();
    const endTime = performance.now();
    const duration = endTime - startTime;

    this.metrics.push({
      name,
      duration,
      timestamp: Date.now(),
    });

    if (duration > 100) {
      console.warn(`⚠️ Slow operation: ${name} took ${duration.toFixed(2)}ms`);
    }

    return result;
  }

  /**
   * Mede o tempo de execução de uma função assíncrona
   */
  async measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    if (!this.enabled) return fn();

    const startTime = performance.now();
    const result = await fn();
    const endTime = performance.now();
    const duration = endTime - startTime;

    this.metrics.push({
      name,
      duration,
      timestamp: Date.now(),
    });

    if (duration > 500) {
      console.warn(`⚠️ Slow async operation: ${name} took ${duration.toFixed(2)}ms`);
    }

    return result;
  }

  /**
   * Marca o início de uma medição
   */
  mark(name: string) {
    if (!this.enabled) return;
    performance.mark(`${name}-start`);
  }

  /**
   * Marca o fim de uma medição e calcula a duração
   */
  measureEnd(name: string) {
    if (!this.enabled) return;

    try {
      performance.mark(`${name}-end`);
      performance.measure(name, `${name}-start`, `${name}-end`);

      const measure = performance.getEntriesByName(name)[0];
      if (measure && measure.duration > 100) {
        console.warn(`⚠️ ${name} took ${measure.duration.toFixed(2)}ms`);
      }

      // Limpar marcas
      performance.clearMarks(`${name}-start`);
      performance.clearMarks(`${name}-end`);
      performance.clearMeasures(name);
    } catch (e) {
      console.error('Performance measure error:', e);
    }
  }

  /**
   * Obtém métricas coletadas
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Limpa métricas antigas (manter apenas últimas 100)
   */
  cleanup() {
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }
  }

  /**
   * Relatório de performance
   */
  report() {
    if (!this.enabled || this.metrics.length === 0) return;

    console.group('📊 Performance Report');
    
    const avgDuration = this.metrics.reduce((acc, m) => acc + m.duration, 0) / this.metrics.length;
    console.log(`Average operation time: ${avgDuration.toFixed(2)}ms`);

    const slowest = [...this.metrics].sort((a, b) => b.duration - a.duration).slice(0, 5);
    console.log('Slowest operations:', slowest);

    console.groupEnd();
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Limpar métricas antigas a cada 5 minutos
if (import.meta.env.DEV) {
  setInterval(() => performanceMonitor.cleanup(), 5 * 60 * 1000);
}
