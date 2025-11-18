// ===== SMART PREFETCH HOOK - FASE 2.5 =====
// Prefetch estratégico baseado em user behavior

import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useCallback } from 'react';

interface PrefetchOptions {
  enabled?: boolean;
  delay?: number;
  priority?: 'high' | 'low';
}

/**
 * Hook para prefetch inteligente de queries
 * Executa prefetch com delay e prioridade configuráveis
 * 
 * @example
 * // Prefetch menu ao entrar no dashboard
 * useSmartPrefetch({
 *   queryKey: ['menu', 'products'],
 *   queryFn: fetchProducts,
 *   enabled: isLoggedIn,
 *   priority: 'high',
 * });
 */
export const useSmartPrefetch = (
  queryKey: any[],
  queryFn: () => Promise<any>,
  options: PrefetchOptions = {}
) => {
  const queryClient = useQueryClient();
  const { enabled = true, delay = 0, priority = 'low' } = options;

  const executePrefetch = useCallback(async () => {
    // Verificar se já está em cache
    const existing = queryClient.getQueryData(queryKey);
    if (existing) {
      console.log(`⚡ Prefetch skipped (cached): ${JSON.stringify(queryKey)}`);
      return;
    }

    try {
      await queryClient.prefetchQuery({
        queryKey,
        queryFn,
        staleTime: 10 * 60 * 1000, // 10 minutos
      });
      
      console.log(`🚀 Prefetched: ${JSON.stringify(queryKey)}`);
    } catch (error) {
      console.error('❌ Prefetch failed:', error);
    }
  }, [queryClient, queryKey, queryFn]);

  useEffect(() => {
    if (!enabled) return;

    if (priority === 'high') {
      // Prefetch imediato
      executePrefetch();
    } else {
      // Prefetch com delay
      const timer = setTimeout(executePrefetch, delay || 100);
      return () => clearTimeout(timer);
    }
  }, [enabled, priority, delay, executePrefetch]);
};

/**
 * Hook para prefetch de rotas baseado em hover
 * Útil para prefetch ao passar o mouse em links
 */
export const usePrefetchOnHover = (
  queryKey: any[],
  queryFn: () => Promise<any>
) => {
  const queryClient = useQueryClient();

  const handleMouseEnter = useCallback(() => {
    queryClient.prefetchQuery({
      queryKey,
      queryFn,
      staleTime: 5 * 60 * 1000,
    });
  }, [queryClient, queryKey, queryFn]);

  return {
    onMouseEnter: handleMouseEnter,
    onTouchStart: handleMouseEnter, // Mobile support
  };
};
