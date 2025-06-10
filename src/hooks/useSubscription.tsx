
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

interface SubscriptionStatus {
  subscribed: boolean;
  status: string;
  plan_name: string;
  plan_price: number;
  expires_at: string | null;
  loading: boolean;
}

export const useSubscription = () => {
  const { user, session } = useAuth();
  const { toast } = useToast();
  const [subscription, setSubscription] = useState<SubscriptionStatus>({
    subscribed: false,
    status: 'inactive',
    plan_name: 'Nenhum',
    plan_price: 0,
    expires_at: null,
    loading: true,
  });

  const checkSubscription = async () => {
    if (!user || !session) {
      setSubscription(prev => ({ ...prev, loading: false }));
      return;
    }

    try {
      setSubscription(prev => ({ ...prev, loading: true }));
      
      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      setSubscription({
        subscribed: data.subscribed || false,
        status: data.status || 'inactive',
        plan_name: data.plan_name || 'Nenhum',
        plan_price: data.plan_price || 0,
        expires_at: data.expires_at,
        loading: false,
      });
    } catch (error: any) {
      console.error('Error checking subscription:', error);
      toast({
        title: "Erro ao verificar assinatura",
        description: error.message,
        variant: "destructive",
      });
      setSubscription(prev => ({ ...prev, loading: false }));
    }
  };

  const createCheckout = async (planType: 'trial' | 'monthly' = 'monthly') => {
    if (!user || !session) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para assinar",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { planType },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      // Open Stripe checkout in a new tab
      window.open(data.url, '_blank');
    } catch (error: any) {
      console.error('Error creating checkout:', error);
      toast({
        title: "Erro ao criar checkout",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const openCustomerPortal = async () => {
    if (!user || !session) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para gerenciar sua assinatura",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      // Open customer portal in a new tab
      window.open(data.url, '_blank');
    } catch (error: any) {
      console.error('Error opening customer portal:', error);
      toast({
        title: "Erro ao abrir portal do cliente",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (user) {
      checkSubscription();
    }
  }, [user]);

  // Check for URL parameters after successful payment
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === 'true') {
      setTimeout(() => {
        checkSubscription();
        toast({
          title: "Pagamento realizado com sucesso!",
          description: "Sua assinatura foi ativada. Bem-vindo ao Pizza Club!",
        });
        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }, 2000);
    }
  }, []);

  return {
    subscription,
    checkSubscription,
    createCheckout,
    openCustomerPortal,
  };
};
