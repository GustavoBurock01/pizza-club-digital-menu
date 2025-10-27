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

  // Verificar assinatura no banco (sincronizada via webhooks)
  const checkDbSubscription = useCallback(async (): Promise<boolean | 'unknown'> => {
    if (!userId) return false;

    try {
      console.log('[SUBSCRIPTION-CHECK] Checking DB subscription for user:', userId);

      // Lê a assinatura mais recente do usuário
      const { data, error } = await supabase
        .from('subscriptions')
        .select('status,current_period_end')
        .eq('user_id', userId)
        .order('current_period_end', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('[SUBSCRIPTION-CHECK] DB error checking subscription:', error);
        const cached = getCachedStatus();
        return cached?.isActive ?? 'unknown';
      }

      if (!data) {
        // Sem registro ainda: tratar como desconhecido
        return 'unknown';
      }

      const periodEndOk = data.current_period_end
        ? new Date(data.current_period_end).getTime() > Date.now()
        : true;
      const active = data.status === 'active' && periodEndOk;
      console.log('[SUBSCRIPTION-CHECK] DB subscription status:', { active, data });

      return active;
    } catch (error) {
      console.error('[SUBSCRIPTION-CHECK] Exception (DB):', error);
      const cached = getCachedStatus();
      return cached?.isActive ?? 'unknown';
    }
  }, [userId, getCachedStatus]);

  // Verificar assinatura (cache ou DB)
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

    // Se não tem cache, verificar no DB (sincronizado por webhooks)
    setIsLoading(true);
    const status = await checkDbSubscription();

    if (status === 'unknown') {
      console.warn('[SUBSCRIPTION-CHECK] Status unknown, skipping enforcement for now');
      setIsLoading(false);
      setHasBeenChecked(false);
      return;
    }

    setIsActive(status);
    setCachedStatus(status);
    setIsLoading(false);
    setHasBeenChecked(true);
  }, [userId, getCachedStatus, checkDbSubscription, setCachedStatus])

  // Forçar nova verificação (ignorando cache)
  const forceCheck = useCallback(async () => {
    if (!userId) return;
    
    console.log('[SUBSCRIPTION-CHECK] Forcing new check');
    clearCache();
    setHasBeenChecked(false);
    setIsLoading(true);
    
    const status = await checkDbSubscription();

    if (status === 'unknown') {
      setIsLoading(false);
      setHasBeenChecked(false);
      return;
    }

    setIsActive(status);
    setCachedStatus(status);
    setIsLoading(false);
    setHasBeenChecked(true);
  }, [userId, clearCache, checkDbSubscription, setCachedStatus])

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
