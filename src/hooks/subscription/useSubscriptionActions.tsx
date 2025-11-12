// ===== HOOK SUBSCRIPTION ACTIONS - FASE 2.4 =====
// Responsável por ações de subscription
// - reconcile() - Sincronizar com Stripe
// - refresh() - Forçar refetch
// - clearCache() - Limpar localStorage
// - Realtime subscription updates

import { useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { clearLocalCache } from './useSubscriptionQuery';
import type { SubscriptionData } from './useSubscriptionQuery';

export const useSubscriptionActions = (userId?: string) => {
  const queryClient = useQueryClient();

  // ===== REALTIME: Escutar mudanças na tabela subscriptions =====
  useEffect(() => {
    if (!userId) return;

    console.log('[SUBSCRIPTION-ACTIONS] Setting up realtime listener for user:', userId);

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
          console.log('[SUBSCRIPTION-ACTIONS] Realtime update received:', payload);
          
          // Invalidar cache do React Query
          queryClient.invalidateQueries({ queryKey: ['subscription', userId] });
          
          // Limpar cache local para forçar nova busca
          clearLocalCache(userId);
        }
      )
      .subscribe();

    return () => {
      console.log('[SUBSCRIPTION-ACTIONS] Cleaning up realtime listener');
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);

  // ===== RECONCILE: Sincronizar com Stripe =====
  const reconcile = useCallback(async () => {
    if (!userId) return;
    
    try {
      console.log('[SUBSCRIPTION-ACTIONS] Reconciling with Stripe...');
      
      // Get fresh session token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.warn('[SUBSCRIPTION-ACTIONS] No active session, skipping reconciliation');
        return;
      }
      
      // Primary reconciliation against Stripe updating Supabase
      const { data, error } = await supabase.functions.invoke('reconcile-subscription', {
        body: { user_id: userId }
      });
      
      if (error) {
        console.error('[SUBSCRIPTION-ACTIONS] Reconciliation error:', error);
        throw error;
      }
      
      console.log('[SUBSCRIPTION-ACTIONS] Reconciliation result:', data);
    } catch (error) {
      console.error('[SUBSCRIPTION-ACTIONS] Reconciliation failed, trying fallback check-subscription...', error);
      
      // Fallback: direct check that also upserts an active sub if found
      try {
        const { data: checkData, error: checkError } = await supabase.functions.invoke('check-subscription', {});
        
        if (checkError) {
          console.error('[SUBSCRIPTION-ACTIONS] Fallback check-subscription error:', checkError);
        } else {
          console.log('[SUBSCRIPTION-ACTIONS] Fallback check-subscription result:', checkData);
          
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
            
            // Update React Query cache immediately for instant unlock
            queryClient.setQueryData(['subscription', userId], optimistic as any);
          }
        }
      } catch (fallbackErr) {
        console.error('[SUBSCRIPTION-ACTIONS] Fallback check-subscription failed:', fallbackErr);
      }
    } finally {
      // Mark that we've attempted reconciliation to avoid UI deadlocks
      try { 
        sessionStorage.setItem(`reconciled_${userId}`, String(Date.now())); 
      } catch {}
      
      // Trigger refetch after any attempt
      queryClient.invalidateQueries({ queryKey: ['subscription', userId] });
    }
  }, [userId, queryClient]);

  // ===== REFRESH: Forçar atualização =====
  const refresh = useCallback(async () => {
    if (!userId) return;
    
    console.log('[SUBSCRIPTION-ACTIONS] Manual refresh requested');
    clearLocalCache(userId);
    await queryClient.invalidateQueries({ queryKey: ['subscription', userId] });
  }, [userId, queryClient]);

  // ===== CLEAR CACHE: Limpar todos os caches =====
  const clearCache = useCallback(() => {
    if (!userId) return;
    
    console.log('[SUBSCRIPTION-ACTIONS] Clearing all caches');
    clearLocalCache(userId);
    queryClient.removeQueries({ queryKey: ['subscription', userId] });
  }, [userId, queryClient]);

  return {
    reconcile,
    refresh,
    clearCache,
  };
};
