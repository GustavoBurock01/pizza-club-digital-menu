// ===== HOOK SIMPLIFICADO PARA VERIFICAÇÃO DE ASSINATURA =====

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedAuth } from './useUnifiedAuth';

export const useSimpleSubscription = () => {
  const { user, session } = useUnifiedAuth();
  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkSubscription = async () => {
      if (!user || !session) {
        setIsActive(false);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        
        const { data, error } = await supabase
          .from('subscriptions')
          .select('status, expires_at')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('[SIMPLE-SUBSCRIPTION] Error:', error);
          setIsActive(false);
          return;
        }

        if (data && data.status === 'active') {
          // Verificar se não expirou
          const now = new Date();
          const expiresAt = data.expires_at ? new Date(data.expires_at) : null;
          const isExpired = expiresAt && expiresAt < now;
          
          setIsActive(!isExpired);
        } else {
          setIsActive(false);
        }
      } catch (error) {
        console.error('[SIMPLE-SUBSCRIPTION] Error:', error);
        setIsActive(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkSubscription();
  }, [user, session]);

  return { isActive, isLoading };
};