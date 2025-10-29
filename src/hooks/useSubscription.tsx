// ===== HOOK ÚNICO DE ASSINATURA - OTIMIZADO =====
// ⚠️ DEPRECATED (FASE 2.3) - Use useSubscriptionContext() instead
//
// Este hook será removido em versão futura.
// Migre para: import { useSubscriptionContext } from '@/providers/SubscriptionProvider';
//
// Verificação: 1x por dia via cache
// Sincronização: Automática via webhooks + realtime

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SubscriptionData {
  isActive: boolean;
  status: string;
  planName: string;
  planPrice: number;
  expiresAt: string | null;
  stripeSubscriptionId: string | null;
}

const CACHE_KEY = 'subscription_cache';
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 horas

// ===== CACHE LOCAL (BACKUP) =====
const getLocalCache = (userId: string): SubscriptionData | null => {
  try {
    const cached = localStorage.getItem(`${CACHE_KEY}_${userId}`);
    if (!cached) return null;

    const { data, timestamp } = JSON.parse(cached);
    const now = Date.now();

    // Cache válido por 24h
    if (now - timestamp < CACHE_DURATION_MS) {
      return data;
    }

    // Cache expirado
    localStorage.removeItem(`${CACHE_KEY}_${userId}`);
    return null;
  } catch {
    return null;
  }
};

const setLocalCache = (userId: string, data: SubscriptionData) => {
  try {
    localStorage.setItem(
      `${CACHE_KEY}_${userId}`,
      JSON.stringify({ data, timestamp: Date.now() })
    );
  } catch {
    // Silently fail se localStorage estiver cheio
  }
};

const clearLocalCache = (userId: string) => {
  try {
    localStorage.removeItem(`${CACHE_KEY}_${userId}`);
  } catch {
    // Silently fail
  }
};

// ===== FETCH SUBSCRIPTION DO BANCO =====
const fetchSubscription = async (userId: string): Promise<SubscriptionData> => {
  console.log('[SUBSCRIPTION] Fetching from database for user:', userId);

  const { data, error } = await supabase
    .from('subscriptions')
    .select('status, plan_name, plan_price, expires_at, stripe_subscription_id')
    .eq('user_id', userId)
    .order('expires_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('[SUBSCRIPTION] Database error:', error);
    throw error;
  }

  // Sem assinatura = inativo
  if (!data) {
    console.log('[SUBSCRIPTION] No subscription found');
    return {
      isActive: false,
      status: 'inactive',
      planName: 'Nenhum',
      planPrice: 0,
      expiresAt: null,
      stripeSubscriptionId: null,
    };
  }

  // Verificar se está ativa e não expirou
  const periodEndOk = data.expires_at
    ? new Date(data.expires_at).getTime() > Date.now()
    : false;

  const statusText = String((data as any).status);
  const isActive = (statusText === 'active' || statusText === 'trialing') && periodEndOk;

  const result: SubscriptionData = {
    isActive,
    status: data.status || 'inactive',
    planName: data.plan_name || 'Nenhum',
    planPrice: Number(data.plan_price) || 0,
    expiresAt: data.expires_at,
    stripeSubscriptionId: data.stripe_subscription_id,
  };

  console.log('[SUBSCRIPTION] Fetched:', result);
  return result;
};

// ===== HOOK PRINCIPAL =====
/**
 * @deprecated Use useSubscriptionContext() instead
 * This hook will be removed in the next major version.
 * 
 * Migration guide:
 * - Old: const { isActive, status } = useSubscription(user?.id);
 * - New: const { isActive, status } = useSubscriptionContext();
 */
export const useSubscription = (userId?: string) => {
  const queryClient = useQueryClient();
  
  // Log deprecation warning in development
  if (process.env.NODE_ENV === 'development') {
    console.warn(
      '[DEPRECATED] useSubscription is deprecated. Use useSubscriptionContext() instead.',
      '\nSee docs/MIGRATION_SUBSCRIPTION.md for migration guide.'
    );
  }

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

  // ===== REALTIME: Escutar mudanças na tabela subscriptions =====
  useEffect(() => {
    if (!userId) return;

    console.log('[SUBSCRIPTION] Setting up realtime listener for user:', userId);

    const channel = supabase
      .channel(`subscription_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'subscriptions',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('[SUBSCRIPTION] Realtime update received:', payload);
          
          // Invalidar cache do React Query
          queryClient.invalidateQueries({ queryKey: ['subscription', userId] });
          
          // Limpar cache local para forçar nova busca
          clearLocalCache(userId);
        }
      )
      .subscribe();

    return () => {
      console.log('[SUBSCRIPTION] Cleaning up realtime listener');
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);

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
