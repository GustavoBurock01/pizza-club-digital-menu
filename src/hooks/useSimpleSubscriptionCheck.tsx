import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SubscriptionCache {
  isActive: boolean;
  checkedAt: number;
  userId: string;
}

const CACHE_KEY = 'subscription_status';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 horas

export function useSimpleSubscriptionCheck(userId?: string) {
  const [isActive, setIsActive] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasBeenChecked, setHasBeenChecked] = useState<boolean>(false);

  // Ler do cache
  const getCachedStatus = useCallback((): SubscriptionCache | null => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;
      
      const data: SubscriptionCache = JSON.parse(cached);
      const now = Date.now();
      
      // Verificar se o cache é válido (não expirou, é do mesmo usuário e é positivo)
      if (data.userId === userId && data.isActive && (now - data.checkedAt) < CACHE_DURATION) {
        return data;
      }
      
      return null;
    } catch (error) {
      console.error('[SUBSCRIPTION-CACHE] Error reading cache:', error);
      return null;
    }
  }, [userId]);

  // Salvar no cache
  const setCachedStatus = useCallback((active: boolean) => {
    if (!userId) return;
    
    // Só cachear quando estiver ATIVA para evitar falsos negativos persistentes
    if (!active) {
      try {
        localStorage.removeItem(CACHE_KEY);
      } catch (error) {
        console.error('[SUBSCRIPTION-CACHE] Error clearing cache for false status:', error);
      }
      return;
    }

    try {
      const cache: SubscriptionCache = {
        isActive: true,
        checkedAt: Date.now(),
        userId,
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch (error) {
      console.error('[SUBSCRIPTION-CACHE] Error saving cache:', error);
    }
  }, [userId]);

  // Limpar cache
  const clearCache = useCallback(() => {
    try {
      localStorage.removeItem(CACHE_KEY);
    } catch (error) {
      console.error('[SUBSCRIPTION-CACHE] Error clearing cache:', error);
    }
  }, []);

  // Verificar assinatura no Stripe
  const checkStripeSubscription = useCallback(async (): Promise<boolean> => {
    if (!userId) return false;

    try {
      console.log('[SUBSCRIPTION-CHECK] Checking Stripe subscription for user:', userId);
      
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        console.error('[SUBSCRIPTION-CHECK] No valid session');
        return false;
      }

      const { data, error } = await supabase.functions.invoke('subscription/check', {
        headers: { 'Authorization': `Bearer ${session.session.access_token}` },
      });

      if (error) {
        console.error('[SUBSCRIPTION-CHECK] Error checking subscription:', error);
        // Em caso de erro, usar o cache se disponível
        const cached = getCachedStatus();
        return cached?.isActive ?? false;
      }

      const active = data?.subscribed === true && data?.status === 'active';
      console.log('[SUBSCRIPTION-CHECK] Stripe subscription status:', { active, data });
      
      return active;
    } catch (error) {
      console.error('[SUBSCRIPTION-CHECK] Exception:', error);
      // Em caso de erro, usar o cache se disponível
      const cached = getCachedStatus();
      return cached?.isActive ?? false;
    }
  }, [userId, getCachedStatus]);

  // Verificar assinatura (cache ou Stripe)
  const checkSubscription = useCallback(async () => {
    if (!userId) {
      setIsActive(false);
      setIsLoading(false);
      setHasBeenChecked(true);
      return;
    }

    // Tentar usar o cache primeiro
    const cached = getCachedStatus();
    if (cached) {
      console.log('[SUBSCRIPTION-CHECK] Using cached status:', cached.isActive);
      setIsActive(cached.isActive);
      setIsLoading(false);
      setHasBeenChecked(true);
      return;
    }

    // Se não tem cache, verificar no Stripe
    setIsLoading(true);
    const active = await checkStripeSubscription();
    
    setIsActive(active);
    setCachedStatus(active);
    setIsLoading(false);
    setHasBeenChecked(true);
  }, [userId, getCachedStatus, checkStripeSubscription, setCachedStatus]);

  // Forçar nova verificação (ignorando cache)
  const forceCheck = useCallback(async () => {
    if (!userId) return;
    
    console.log('[SUBSCRIPTION-CHECK] Forcing new check');
    clearCache();
    setHasBeenChecked(false);
    setIsLoading(true);
    
    const active = await checkStripeSubscription();
    setIsActive(active);
    setCachedStatus(active);
    setIsLoading(false);
    setHasBeenChecked(true);
  }, [userId, clearCache, checkStripeSubscription, setCachedStatus]);

  // Verificar quando o userId muda
  useEffect(() => {
    if (userId && !hasBeenChecked) {
      checkSubscription();
    }
  }, [userId, hasBeenChecked, checkSubscription]);

  // Limpar cache quando o usuário faz logout
  useEffect(() => {
    if (!userId) {
      clearCache();
      setIsActive(false);
      setHasBeenChecked(false);
    }
  }, [userId, clearCache]);

  return {
    isActive,
    isLoading,
    hasBeenChecked,
    forceCheck,
    clearCache,
  };
}
