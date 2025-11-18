// ===== QUERY BATCHING HOOK - FASE 2.5 =====
// Agrupa múltiplas queries para executar em paralelo

import { useQueries, UseQueryOptions } from '@tanstack/react-query';

interface BatchQuery {
  queryKey: any[];
  queryFn: () => Promise<any>;
  options?: Omit<UseQueryOptions, 'queryKey' | 'queryFn'>;
}

/**
 * Hook para executar múltiplas queries em paralelo
 * Útil para reduzir waterfalls de requests
 * 
 * @example
 * const queries = useQueryBatching([
 *   { queryKey: ['user', userId], queryFn: fetchUser },
 *   { queryKey: ['orders', userId], queryFn: fetchOrders },
 *   { queryKey: ['addresses', userId], queryFn: fetchAddresses },
 * ]);
 * 
 * const [userQuery, ordersQuery, addressesQuery] = queries;
 */
export const useQueryBatching = (queries: BatchQuery[]) => {
  return useQueries({
    queries: queries.map(q => ({
      queryKey: q.queryKey,
      queryFn: q.queryFn,
      staleTime: 5 * 60 * 1000, // 5 minutos default
      ...q.options,
    })),
  });
};

/**
 * Hook para aguardar todas as queries finalizarem
 * Retorna true quando todas estiverem prontas
 */
export const useQueryBatchStatus = (results: any[]) => {
  const isLoading = results.some(r => r.isLoading);
  const isError = results.some(r => r.isError);
  const isSuccess = results.every(r => r.isSuccess);
  
  return {
    isLoading,
    isError,
    isSuccess,
    errors: results.filter(r => r.error).map(r => r.error),
  };
};
