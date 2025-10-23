// ===== SUBSCRIPTION HOOK - SEPARADO E FOCADO =====

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/auth/useAuth';

export interface SubscriptionData {
  subscribed: boolean;
  status: string;
  plan_name: string;
  plan_price: number;
  expires_at: string | null;
  checked_at: string;
}

export const SUBSCRIPTION_KEYS = {
  subscription: (userId: string) => ['subscription', userId],
};

export const useSubscription = () => {
  const { user, session } = useAuth();
  const queryClient = useQueryClient();

  // ===== FETCH FUNCTION =====
  const fetchSubscription = useCallback(async (): Promise<SubscriptionData | null> => {
    if (!user || !session) {
      console.log('[SUBSCRIPTION] No user or session');
      return null;
    }

    console.log('[SUBSCRIPTION] Fetching for user:', user.id);

    try {
      const { data, error } = await supabase.functions.invoke(
        'subscription/check',
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (error) {
        console.error('[SUBSCRIPTION] Fetch error:', error);
        throw error;
      }

      console.log('[SUBSCRIPTION] Received data:', data);
      return data;
    } catch (error) {
      console.error('[SUBSCRIPTION] Fetch failed:', error);
      throw error;
    }
  }, [user, session]);

  // ===== QUERY =====
  const query = useQuery({
    queryKey: SUBSCRIPTION_KEYS.subscription(user?.id || ''),
    queryFn: fetchSubscription,
    enabled: !!user && !!session,
    staleTime: 5 * 60 * 1000, // 5 min
    refetchInterval: false,
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // ===== COMPUTED VALUES =====
  const isActive = useMemo(() => {
    return query.data?.subscribed === true && query.data?.status === 'active';
  }, [query.data]);

  // ===== METHODS =====
  const refresh = useCallback(async () => {
    console.log('[SUBSCRIPTION] Refreshing');
    await query.refetch();
  }, [query]);

  const reconcile = useCallback(async () => {
    if (!session) {
      throw new Error('No session for reconciliation');
    }

    console.log('[SUBSCRIPTION] Reconciling');
    
    try {
      const { data, error } = await supabase.functions.invoke(
        'subscription/reconcile',
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (error) {
        console.error('[SUBSCRIPTION] Reconcile error:', error);
        throw error;
      }

      console.log('[SUBSCRIPTION] Reconciled:', data);
      await refresh();
    } catch (error) {
      console.error('[SUBSCRIPTION] Reconcile failed:', error);
      throw error;
    }
  }, [session, refresh]);

  const invalidate = useCallback(() => {
    if (!user) return;
    console.log('[SUBSCRIPTION] Invalidating cache');
    queryClient.invalidateQueries({
      queryKey: SUBSCRIPTION_KEYS.subscription(user.id),
    });
  }, [user, queryClient]);

  return {
    subscription: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    isActive,
    refresh,
    reconcile,
    invalidate,
  };
};
