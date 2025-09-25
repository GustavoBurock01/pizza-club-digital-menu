import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

// ===== TIPOS UNIFICADOS =====

export type SubscriptionStatus = 'active' | 'pending' | 'canceled' | 'cancelled' | 'expired' | 'trial' | 'inactive';

export interface Subscription {
  id: string;
  user_id: string;
  status: SubscriptionStatus;
  plan_name: string;
  plan_price: number;
  started_at: string | null;
  expires_at: string | null;
  payment_method?: string | null;
  stripe_subscription_id?: string | null;
  stripe_price_id?: string | null;
  sync_status: string;
  last_webhook_event?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionValidation {
  isValid: boolean;
  status: SubscriptionStatus;
  expiresAt: string | null;
  planName: string;
  planPrice: number;
  lastChecked: string;
}

// ===== CHAVES DE QUERY =====

export const SUBSCRIPTION_QUERY_KEYS = {
  subscription: (userId: string) => ['subscription', userId],
  all: ['subscriptions'] as const,
} as const;

// ===== HOOK CENTRAL =====

interface UseSubscriptionCoreOptions {
  enabled?: boolean;
  staleTime?: number;
  refetchInterval?: number;
}

export function useSubscriptionCore(
  userId?: string,
  options: UseSubscriptionCoreOptions = {}
) {
  const queryClient = useQueryClient();
  
  const {
    enabled = !!userId,
    staleTime = 30_000, // 30 segundos
    refetchInterval = false,
  } = options;

  // ===== FETCH FUNCTION =====

  const fetchSubscription = useCallback(async (): Promise<Subscription | null> => {
    if (!userId) {
      throw new Error('User ID is required for subscription check');
    }

    console.log('[SUBSCRIPTION-CORE] Fetching subscription for user:', userId);

    try {
      // Pegar sessão atual de forma mais robusta
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !sessionData.session?.access_token) {
        console.error('[SUBSCRIPTION-CORE] No valid session:', sessionError);
        throw new Error('User not authenticated - no valid session');
      }

      // Chamar a edge function de verificação
      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: {
          'Authorization': `Bearer ${sessionData.session.access_token}`,
        },
      });

      if (error) {
        console.error('[SUBSCRIPTION-CORE] Error calling check-subscription:', error);
        
        // Se for erro de autenticação, propagar como erro de auth
        if (error.message?.includes('Authentication') || error.message?.includes('unauthenticated')) {
          throw new Error('Authentication required - please login again');
        }
        
        throw error;
      }

      // Se retornou dados de assinatura válida, buscar registro completo no DB
      if (data?.subscribed) {
        const { data: dbSubscription, error: dbError } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', userId)
          .eq('status', 'active')
          .single();

        if (dbError) {
          console.warn('[SUBSCRIPTION-CORE] DB subscription not found, using edge function data');
          // Retornar dados mínimos baseados na edge function
          return {
            id: 'temp-' + userId,
            user_id: userId,
            status: data.status as SubscriptionStatus,
            plan_name: data.plan_name || 'Desconhecido',
            plan_price: data.plan_price || 0,
            started_at: null,
            expires_at: data.expires_at || null,
            stripe_subscription_id: null,
            stripe_price_id: null,
            sync_status: 'edge-function',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
        }

        return dbSubscription;
      }

      // Não há assinatura ativa
      return null;

    } catch (error) {
      console.error('[SUBSCRIPTION-CORE] Error fetching subscription:', error);
      throw error;
    }
  }, [userId]);

  // ===== QUERY =====

  const query = useQuery({
    queryKey: SUBSCRIPTION_QUERY_KEYS.subscription(userId || ''),
    queryFn: fetchSubscription,
    enabled,
    staleTime,
    refetchInterval,
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // ===== COMPUTED VALUES =====

  const isActive = useMemo((): boolean => {
    if (!query.data) return false;
    
    const { status, expires_at } = query.data;
    
    // Status deve ser 'active'
    if (status !== 'active') return false;
    
    // Se tem data de expiração, verificar se não expirou
    if (expires_at) {
      const expirationDate = new Date(expires_at);
      const now = new Date();
      return expirationDate > now;
    }
    
    // Se não tem data de expiração mas status é ativo, considerar válido
    return true;
  }, [query.data]);

  const subscriptionValidation = useMemo((): SubscriptionValidation => {
    const subscription = query.data;
    
    return {
      isValid: isActive,
      status: subscription?.status || 'inactive',
      expiresAt: subscription?.expires_at || null,
      planName: subscription?.plan_name || 'Nenhum',
      planPrice: subscription?.plan_price || 0,
      lastChecked: new Date().toISOString(),
    };
  }, [query.data, isActive]);

  // ===== METHODS =====

  const refresh = useCallback(async (): Promise<void> => {
    console.log('[SUBSCRIPTION-CORE] Refreshing subscription data');
    await query.refetch();
  }, [query]);

  const forceReconcile = useCallback(async (): Promise<void> => {
    if (!userId) {
      throw new Error('User ID is required for reconciliation');
    }

    console.log('[SUBSCRIPTION-CORE] Force reconciling subscription for user:', userId);

    try {
      // Invalidar cache primeiro
      queryClient.invalidateQueries({ 
        queryKey: SUBSCRIPTION_QUERY_KEYS.subscription(userId) 
      });

      // Chamar reconciliação via edge function (será implementada)
      const { error } = await supabase.functions.invoke('reconcile-subscription', {
        body: { user_id: userId },
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) {
        console.error('[SUBSCRIPTION-CORE] Error in force reconcile:', error);
        throw error;
      }

      // Atualizar dados após reconciliação
      await refresh();

    } catch (error) {
      console.error('[SUBSCRIPTION-CORE] Force reconcile failed:', error);
      throw error;
    }
  }, [userId, queryClient, refresh]);

  const invalidate = useCallback((): void => {
    if (!userId) return;
    
    console.log('[SUBSCRIPTION-CORE] Invalidating subscription cache');
    queryClient.invalidateQueries({ 
      queryKey: SUBSCRIPTION_QUERY_KEYS.subscription(userId) 
    });
  }, [userId, queryClient]);

  // ===== RETURN =====

  return {
    // Data
    data: query.data,
    subscription: query.data,
    validation: subscriptionValidation,
    
    // Status
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    isFetching: query.isFetching,
    
    // Computed
    isActive: isActive,
    isSubscribed: isActive, // alias for compatibility
    
    // Methods
    refresh,
    refetch: refresh, // alias
    forceReconcile,
    invalidate,
  };
}

// ===== QUERY CLIENT UTILITIES =====

export const subscriptionQueryUtils = {
  invalidateUser: (queryClient: ReturnType<typeof useQueryClient>, userId: string) => {
    queryClient.invalidateQueries({ 
      queryKey: SUBSCRIPTION_QUERY_KEYS.subscription(userId) 
    });
  },
  
  invalidateAll: (queryClient: ReturnType<typeof useQueryClient>) => {
    queryClient.invalidateQueries({ 
      queryKey: SUBSCRIPTION_QUERY_KEYS.all 
    });
  },
  
  setSubscriptionData: (
    queryClient: ReturnType<typeof useQueryClient>,
    userId: string,
    data: Subscription | null
  ) => {
    queryClient.setQueryData(SUBSCRIPTION_QUERY_KEYS.subscription(userId), data);
  },
};