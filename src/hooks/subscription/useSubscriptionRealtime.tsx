// ===== SUBSCRIPTION REALTIME (EXTRAÍDO) =====

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { clearLocalCache } from './useSubscriptionCache';

export const useSubscriptionRealtime = (userId?: string) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    console.log('[SUBSCRIPTION] Setting up realtime listener for user:', userId);

    const channel = supabase
      .channel(`subscription_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subscriptions',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('[SUBSCRIPTION] Realtime update received:', payload);
          queryClient.invalidateQueries({ queryKey: ['subscription', userId] });
          clearLocalCache(userId);
        }
      )
      .subscribe();

    return () => {
      console.log('[SUBSCRIPTION] Cleaning up realtime listener');
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);
};
