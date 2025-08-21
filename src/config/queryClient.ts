// ===== CONFIGURAÇÃO OTIMIZADA DO REACT QUERY PARA PERFORMANCE =====

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 10 * 60 * 1000, // 10 minutos (aumentado)
      gcTime: 30 * 60 * 1000, // 30 minutos (aumentado)
      networkMode: 'offlineFirst',
      // Configurações de performance
      refetchOnMount: false, // Evitar refetch desnecessário
      refetchOnReconnect: 'always', // Apenas quando reconectar
    },
    mutations: {
      retry: false,
      networkMode: 'online',
    },
  },
});

// ===== CACHE LAYERS ESTRATÉGICOS =====
export const CACHE_STRATEGIES = {
  // Cache ultra-longo para dados estáticos (24h)
  STATIC: {
    staleTime: 24 * 60 * 60 * 1000, // 24 horas
    gcTime: 7 * 24 * 60 * 60 * 1000, // 7 dias
  },
  // Cache longo para dados semi-estáticos (1h)
  SEMI_STATIC: {
    staleTime: 60 * 60 * 1000, // 1 hora
    gcTime: 6 * 60 * 60 * 1000, // 6 horas
  },
  // Cache médio para dados dinâmicos (5min)
  DYNAMIC: {
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 30 * 60 * 1000, // 30 minutos
  },
  // Cache curto para dados críticos (30s)
  CRITICAL: {
    staleTime: 30 * 1000, // 30 segundos
    gcTime: 2 * 60 * 1000, // 2 minutos
  },
};

// ===== FUNÇÕES DE INVALIDAÇÃO OTIMIZADAS =====
export const invalidateQueries = {
  all: () => queryClient.invalidateQueries(),
  
  // Invalidação granular para performance
  menu: () => {
    queryClient.invalidateQueries({ queryKey: ['categories'] });
    queryClient.removeQueries({ queryKey: ['products'], exact: false });
  },
  
  orders: () => {
    queryClient.invalidateQueries({ queryKey: ['orders'] });
    queryClient.invalidateQueries({ queryKey: ['recent-orders'] });
  },
  
  // Pré-loading estratégico
  preloadMenu: async () => {
    await queryClient.prefetchQuery({
      queryKey: ['categories'],
      staleTime: CACHE_STRATEGIES.STATIC.staleTime,
    });
  },
  
  // Background refresh
  backgroundRefresh: () => {
    queryClient.refetchQueries({ 
      queryKey: ['orders'],
      type: 'active',
    });
  },
};

// ===== PERFORMANCE MONITORING =====
export const performanceMonitor = {
  startTime: Date.now(),
  
  logQueryPerformance: (queryKey: any[], duration: number) => {
    if (duration > 1000) { // Log se demorar mais que 1s
      console.warn(`🐌 Slow query detected: ${JSON.stringify(queryKey)} took ${duration}ms`);
    }
  },
  
  trackCacheHit: (queryKey: any[], fromCache: boolean) => {
    const prefix = fromCache ? '⚡ Cache HIT' : '🌐 Network fetch';
    console.log(`${prefix}: ${JSON.stringify(queryKey)}`);
  },
};