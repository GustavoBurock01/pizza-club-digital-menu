// ===== HOOK ÚNICO DE ASSINATURA - OTIMIZADO =====
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
    .select('status, plan_name, plan_price, current_period_end, stripe_subscription_id')
    .eq('user_id', userId)
    .order('current_period_end', { ascending: false })
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
  const periodEndOk = data.current_period_end
    ? new Date(data.current_period_end).getTime() > Date.now()
    : false;

  const isActive = data.status === 'active' && periodEndOk;

  const result: SubscriptionData = {
    isActive,
    status: data.status || 'inactive',
    planName: data.plan_name || 'Nenhum',
    planPrice: Number(data.plan_price) || 0,
    expiresAt: data.current_period_end,
    stripeSubscriptionId: data.stripe_subscription_id,
  };

  console.log('[SUBSCRIPTION] Fetched:', result);
  return result;
};

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
      
      const { data, error } = await supabase.functions.invoke('subscription/reconcile', {
        body: { user_id: userId }
      });
      
      if (error) {
        console.error('[SUBSCRIPTION] Reconciliation error:', error);
        return;
      }
      
      console.log('[SUBSCRIPTION] Reconciliation result:', data);
      
      // Refresh após reconciliação
      clearLocalCache(userId);
      queryClient.invalidateQueries({ queryKey: ['subscription', userId] });
    } catch (error) {
      console.error('[SUBSCRIPTION] Reconciliation failed:', error);
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
      // Tentar reconciliar apenas uma vez após o primeiro load
      const hasReconciled = sessionStorage.getItem(`reconciled_${userId}`);
      if (!hasReconciled) {
        console.log('[SUBSCRIPTION] First load - attempting reconciliation');
        
        // Set timeout para evitar reconsciliação muito rápida no primeiro load
        const timeout = setTimeout(() => {
          reconcile().then(() => {
            sessionStorage.setItem(`reconciled_${userId}`, 'true');
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
