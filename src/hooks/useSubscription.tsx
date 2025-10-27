// ===== HOOK ÚNICO DE ASSINATURA - REFATORADO (FASE 2) =====

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SubscriptionData } from './subscription/types';
import { getLocalCache, setLocalCache, clearLocalCache, CACHE_DURATION_MS } from './subscription/useSubscriptionCache';
import { fetchSubscription } from './subscription/useSubscriptionFetch';
import { useSubscriptionRealtime } from './subscription/useSubscriptionRealtime';

// ===== HOOK PRINCIPAL =====
export const useSubscription = (userId?: string) => {
  const queryClient = useQueryClient();

  // React Query com staleTime de 24h
  const query = useQuery({
    queryKey: ['subscription', userId],
    queryFn: () => fetchSubscription(userId!),
    enabled: !!userId,
    staleTime: CACHE_DURATION_MS, // 24 horas
    gcTime: CACHE_DURATION_MS,
    retry: 2,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    // Usar cache local como initialData
    initialData: () => {
      if (!userId) return undefined;
      return getLocalCache(userId) || undefined;
    },
  });

  // Salvar no localStorage quando fetch bem-sucedido
  useEffect(() => {
    if (query.data && userId && !query.isError) {
      setLocalCache(userId, query.data);
    }
  }, [query.data, userId, query.isError]);

  // Hook Realtime
  useSubscriptionRealtime(userId);

  // ===== MÉTODOS =====
  const reconcile = useCallback(async () => {
    if (!userId) return;
    
    try {
      console.log('[SUBSCRIPTION] Reconciling with Stripe...');
      
      // Primary reconciliation against Stripe updating Supabase
      const { data, error } = await supabase.functions.invoke('reconcile-subscription', {
        body: { user_id: userId }
      });
      
      if (error) {
        console.error('[SUBSCRIPTION] Reconciliation error:', error);
        throw error;
      }
      
      console.log('[SUBSCRIPTION] Reconciliation result:', data);
    } catch (error) {
      console.error('[SUBSCRIPTION] Reconciliation failed, trying fallback check-subscription...', error);
      // Fallback: direct check that also upserts an active sub if found
      try {
        const { data: checkData, error: checkError } = await supabase.functions.invoke('check-subscription', {});
        if (checkError) {
          console.error('[SUBSCRIPTION] Fallback check-subscription error:', checkError);
        } else {
          console.log('[SUBSCRIPTION] Fallback check-subscription result:', checkData);
          // If subscribed, optimistically seed local cache for instant unlock
          if ((checkData as any)?.subscribed) {
            const payload = checkData as any;
            const optimistic: SubscriptionData = {
              isActive: true,
              status: payload.status || 'active',
              planName: payload.plan_name || 'Ativo',
              planPrice: Number(payload.plan_price) || 0,
              expiresAt: payload.expires_at || null,
              stripeSubscriptionId: payload.stripe_subscription_id || null,
            };
            setLocalCache(userId, optimistic);
            // Also update React Query cache immediately for instant unlock
            queryClient.setQueryData(['subscription', userId], optimistic as any);
          }
        }
      } catch (fallbackErr) {
        console.error('[SUBSCRIPTION] Fallback check-subscription failed:', fallbackErr);
      }
    } finally {
      // Mark that we've attempted reconciliation to avoid UI deadlocks
      try { sessionStorage.setItem(`reconciled_${userId}`, String(Date.now())); } catch {}
      // Trigger refetch after any attempt
      queryClient.invalidateQueries({ queryKey: ['subscription', userId] });
    }
  }, [userId, queryClient]);

  const refresh = useCallback(async () => {
    if (!userId) return;
    
    console.log('[SUBSCRIPTION] Manual refresh requested');
    clearLocalCache(userId);
    await queryClient.invalidateQueries({ queryKey: ['subscription', userId] });
  }, [userId, queryClient]);

  const clearCache = useCallback(() => {
    if (!userId) return;
    
    console.log('[SUBSCRIPTION] Clearing all caches');
    clearLocalCache(userId);
    queryClient.removeQueries({ queryKey: ['subscription', userId] });
  }, [userId, queryClient]);

  // ===== AUTO RECONCILE ON FIRST LOAD =====
  useEffect(() => {
    if (userId && !query.isLoading && !query.data?.isActive) {
      // Reconciliar se nunca tentou OU se a última tentativa tem mais de 60s
      const lastRecon = Number(sessionStorage.getItem(`reconciled_${userId}`) || '0');
      const shouldReconcile = !lastRecon || (Date.now() - lastRecon > 60_000);
      if (shouldReconcile) {
        console.log('[SUBSCRIPTION] First load - attempting reconciliation');
        const timeout = setTimeout(() => {
          reconcile().then(() => {
            try { sessionStorage.setItem(`reconciled_${userId}`, String(Date.now())); } catch {}
          });
        }, 1000);
        return () => clearTimeout(timeout);
      }
    }
  }, [userId, query.isLoading, query.data?.isActive, reconcile]);

  return {
    // Data
    subscription: query.data,
    isActive: query.data?.isActive ?? false,
    status: query.data?.status ?? 'inactive',
    planName: query.data?.planName ?? 'Nenhum',
    planPrice: query.data?.planPrice ?? 0,
    expiresAt: query.data?.expiresAt,
    
    // Loading states
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    
    // Methods
    refresh,
    clearCache,
    reconcile,
  };
};
