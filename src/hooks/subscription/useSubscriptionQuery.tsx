// ===== HOOK SUBSCRIPTION QUERY - FASE 2.4 =====
// Responsável apenas por buscar dados de subscription
// - React Query setup
// - Local cache (localStorage)
// - Fetch da subscription do banco
// - Validação de status ativo

import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { applyStrategy } from '@/config/queryCacheMapping';

export interface SubscriptionData {
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

export const clearLocalCache = (userId: string) => {
  try {
    localStorage.removeItem(`${CACHE_KEY}_${userId}`);
  } catch {
    // Silently fail
  }
};

// ===== FETCH SUBSCRIPTION DO BANCO =====
const fetchSubscription = async (userId: string): Promise<SubscriptionData> => {
  console.log('[SUBSCRIPTION-QUERY] Fetching from database for user:', userId);

  const { data, error } = await supabase
    .from('subscriptions')
    .select('status, plan_name, plan_price, expires_at, stripe_subscription_id')
    .eq('user_id', userId)
    .order('expires_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('[SUBSCRIPTION-QUERY] Database error:', error);
    throw error;
  }

  // Sem assinatura = inativo
  if (!data) {
    console.log('[SUBSCRIPTION-QUERY] No subscription found');
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

  console.log('[SUBSCRIPTION-QUERY] Fetched:', result);
  return result;
};

// ===== HOOK PRINCIPAL =====
export const useSubscriptionQuery = (userId?: string) => {
  // React Query com cache strategy de subscription
  const query = useQuery({
    queryKey: ['subscription', userId],
    queryFn: () => fetchSubscription(userId!),
    enabled: !!userId,
    ...applyStrategy('subscription'),
    retry: 2,
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

  return {
    subscription: query.data,
    isActive: query.data?.isActive ?? false,
    status: query.data?.status ?? 'inactive',
    planName: query.data?.planName ?? 'Nenhum',
    planPrice: query.data?.planPrice ?? 0,
    expiresAt: query.data?.expiresAt,
    stripeSubscriptionId: query.data?.stripeSubscriptionId,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  };
};
