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
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        console.warn('[SUBSCRIPTION-ACTIONS] No active session, skipping reconciliation', sessionError);
        // Clear cache on auth errors
        clearLocalCache(userId);
        queryClient.removeQueries({ queryKey: ['subscription', userId] });
        return;
      }
      
      // Verify session is not expired (within 5 minutes of expiry)
      const expiresAt = session.expires_at ? session.expires_at * 1000 : 0;
      const now = Date.now();
      const fiveMinutes = 5 * 60 * 1000;
      
      if (expiresAt > 0 && (expiresAt - now) < fiveMinutes) {
        console.warn('[SUBSCRIPTION-ACTIONS] Session near expiry, skipping reconciliation');
        return;
      }
      
      // Primary reconciliation against Stripe updating Supabase
      const { data, error } = await supabase.functions.invoke('reconcile-subscription', {
        body: { user_id: userId }
      });
      
      // Handle 401/403 errors (authentication issues) - don't retry
      if (error) {
        const errorData = (data as any) || {};
        if (errorData.requiresLogin || error.message?.includes('Authentication') || error.message?.includes('Session')) {
          console.warn('[SUBSCRIPTION-ACTIONS] Authentication error, clearing cache:', errorData);
          clearLocalCache(userId);
          queryClient.removeQueries({ queryKey: ['subscription', userId] });
          return;
        }
        
        console.error('[SUBSCRIPTION-ACTIONS] Reconciliation error:', error);
        throw error;
      }
      
      console.log('[SUBSCRIPTION-ACTIONS] Reconciliation result:', data);
    } catch (error: any) {
      // Don't do fallback for authentication errors
      if (error?.message?.includes('Authentication') || error?.message?.includes('Session')) {
        console.warn('[SUBSCRIPTION-ACTIONS] Skipping fallback due to auth error');
        return;
      }
      
      console.error('[SUBSCRIPTION-ACTIONS] Reconciliation failed:', error);
    } finally {
      // Mark that we've attempted reconciliation to avoid UI deadlocks
      try { 
        sessionStorage.setItem(`reconciled_${userId}`, String(Date.now())); 
      } catch {}
      
      // Trigger refetch after any attempt (only if session is valid)
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        queryClient.invalidateQueries({ queryKey: ['subscription', userId] });
      }
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
