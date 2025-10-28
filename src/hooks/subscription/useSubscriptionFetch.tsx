// ===== SUBSCRIPTION FETCH LOGIC (EXTRAÍDO) =====

import { supabase } from '@/integrations/supabase/client';
import { SubscriptionData } from './types';

export const fetchSubscription = async (userId: string): Promise<SubscriptionData> => {
  console.log('[SUBSCRIPTION] Fetching from database for user:', userId);

  const { data, error } = await supabase
    .from('subscriptions')
    .select('status, plan_name, plan_price, expires_at, stripe_subscription_id')
    .eq('user_id', userId)
    .order('expires_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('[SUBSCRIPTION] Database error:', error);
    throw error;
  }

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

  console.log('[SUBSCRIPTION] Fetched:', result);
  return result;
};
