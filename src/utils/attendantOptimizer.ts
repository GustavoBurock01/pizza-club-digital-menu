// ===== OTIMIZADOR ESPECÍFICO PARA ATENDENTES =====

import { performanceOptimizer } from './performanceOptimizer';

class AttendantOptimizer {
  private static instance: AttendantOptimizer;
  
  // Cache específico para dados de atendimento
  private orderCache = new Map<string, any>();
  private statsCache = new Map<string, any>();
  private lastUpdate = new Map<string, number>();
  
  static getInstance(): AttendantOptimizer {
    if (!AttendantOptimizer.instance) {
      AttendantOptimizer.instance = new AttendantOptimizer();
    }
    return AttendantOptimizer.instance;
  }

  // Otimizar busca de pedidos para atendentes
  optimizeOrdersFetch = performanceOptimizer.debounce((callback: () => void, key: string) => {
    const cacheKey = `orders_${key}`;
    const lastFetch = this.lastUpdate.get(cacheKey) || 0;
    const now = Date.now();
    
    // Cache por 30 segundos para evitar requisições desnecessárias
    if (now - lastFetch < 30000) {
      const cached = this.orderCache.get(cacheKey);
      if (cached) {
        return cached;
      }
    }
    
    this.lastUpdate.set(cacheKey, now);
    callback();
  }, 1000);

  // Otimizar atualizações de estatísticas
  optimizeStatsUpdate = performanceOptimizer.debounce((callback: () => void) => {
    const cacheKey = 'attendant_stats';
    const lastFetch = this.lastUpdate.get(cacheKey) || 0;
    const now = Date.now();
    
    // Cache por 10 segundos para stats
    if (now - lastFetch < 10000) {
      const cached = this.statsCache.get(cacheKey);
      if (cached) {
        return cached;
      }
    }
    
    this.lastUpdate.set(cacheKey, now);
    callback();
  }, 500);

  // Limpar cache quando necessário
  clearCache(type?: 'orders' | 'stats') {
    switch (type) {
      case 'orders':
        this.orderCache.clear();
        break;
      case 'stats':
        this.statsCache.clear();
        break;
      default:
        this.orderCache.clear();
        this.statsCache.clear();
        this.lastUpdate.clear();
        break;
    }
  }

  // Otimizar notificações de som
  playNotificationSound = performanceOptimizer.debounce(() => {
    // Tocar som apenas se não tocou nos últimos 5 segundos
    if ('Audio' in window) {
      try {
        // Som simples de notificação
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DwwGIcAzON0/LNfSMGJXzI8NuOPwoc');
        audio.volume = 0.3;
        audio.play().catch(() => {
          // Silently fail if audio cannot be played
        });
      } catch (error) {
        // Silently fail
      }
    }
  }, 5000);

  // Verificar performance e alertar sobre lentidão
  checkPerformance() {
    const performance = window.performance;
    if (performance && performance.now) {
      const startTime = performance.now();
      
      // Simular operação
      setTimeout(() => {
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        // Se está demorando mais que 1 segundo, há problema
        if (duration > 1000) {
          console.warn('🐌 Performance issue detected in attendant system:', duration + 'ms');
        }
      }, 0);
    }
  }
}

export const attendantOptimizer = AttendantOptimizer.getInstance();