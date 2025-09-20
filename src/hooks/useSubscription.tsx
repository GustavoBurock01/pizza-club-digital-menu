
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedAuth } from './useUnifiedAuth';
import { useToast } from './use-toast';

interface SubscriptionStatus {
  subscribed: boolean;
  status: string;
  plan_name: string;
  plan_price: number;
  expires_at: string | null;
  loading: boolean;
  hasSubscriptionHistory: boolean;
}

export const useSubscription = () => {
  const { user, session } = useUnifiedAuth();
  const { toast } = useToast();
  const [subscription, setSubscription] = useState<SubscriptionStatus>({
    subscribed: false,
    status: 'inactive',
    plan_name: 'Nenhum',
    plan_price: 0,
    expires_at: null,
    loading: true,
    hasSubscriptionHistory: false,
  });

  const checkSubscriptionHistory = async () => {
    if (!user || !session) return false;

    try {
      // FASE 2: Verificar histórico apenas de assinaturas reais (não registros órfãos)
      const { data, error } = await supabase
        .from('subscriptions')
        .select('id, status, created_at, sync_status')
        .eq('user_id', user.id)
        .neq('status', 'pending') // Ignorar registros pendentes
        .neq('sync_status', 'pending') // Ignorar sync pendente
        .limit(1);

      if (error) {
        console.error('Error checking subscription history:', error);
        return false;
      }

      // Usuário tem histórico apenas se teve assinatura real (não registros órfãos)
      return data && data.length > 0;
    } catch (error: any) {
      console.error('Error checking subscription history:', error);
      return false;
    }
  };

  const checkSubscription = async (forceCheck = false) => {
    if (!user || !session) {
      setSubscription(prev => ({ ...prev, loading: false }));
      return;
    }

    // FASE 2: Cache inteligente baseado no histórico
    const userCacheKey = `subscription_data_${user.id}`;
    const userLastCheckKey = `subscription_last_check_${user.id}`;
    
    // Primeiro verifica o histórico de assinaturas
    const hasHistory = await checkSubscriptionHistory();
    const shouldUseCache = hasHistory && !forceCheck;
    
    // Para novos usuários (sem histórico), sempre verificar em tempo real
    if (shouldUseCache) {
      const lastCheck = localStorage.getItem(userLastCheckKey);
      const fourHoursInMs = 4 * 60 * 60 * 1000;
      const now = Date.now();
      
      if (lastCheck && (now - parseInt(lastCheck)) < fourHoursInMs) {
        const cachedData = localStorage.getItem(userCacheKey);
        if (cachedData) {
          try {
            const parsedData = JSON.parse(cachedData);
            setSubscription(prev => ({ ...prev, ...parsedData, loading: false }));
            return;
          } catch {
            localStorage.removeItem(userCacheKey);
            localStorage.removeItem(userLastCheckKey);
          }
        }
      }
    }

    try {
      setSubscription(prev => ({ ...prev, loading: true }));
      
      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      const subscriptionData = {
        subscribed: data.subscribed || false,
        status: data.status || 'inactive',
        plan_name: data.plan_name || 'Nenhum',
        plan_price: data.plan_price || 0,
        expires_at: data.expires_at,
        loading: false,
        hasSubscriptionHistory: hasHistory,
      };

      setSubscription(subscriptionData);
      
      // Cache apenas para usuários com histórico válido e dados consistentes
      if (hasHistory && subscriptionData.subscribed) {
        const now = Date.now();
        localStorage.setItem(userLastCheckKey, now.toString());
        localStorage.setItem(userCacheKey, JSON.stringify(subscriptionData));
      } else {
        // Limpar cache para novos usuários ou dados inconsistentes
        localStorage.removeItem(userCacheKey);
        localStorage.removeItem(userLastCheckKey);
      }

      // Limpar caches de outros usuários
      Object.keys(localStorage).forEach(key => {
        if ((key.startsWith('subscription_data_') || key.startsWith('subscription_last_check_')) && 
            !key.includes(user.id)) {
          localStorage.removeItem(key);
        }
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

  const createCheckout = async (planType: 'annual' | 'monthly' | 'trial' = 'annual') => {
    if (!user || !session) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para assinar",
        variant: "destructive",
      });
      return;
    }

    try {
      // Get price_id based on plan type from environment
      const priceIdMap = {
        annual: 'STRIPE_PRICE_ID_ANNUAL',
        monthly: 'STRIPE_PRICE_ID_MONTHLY', 
        trial: 'STRIPE_PRICE_ID_TRIAL'
      };

      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { 
          plan_type: planType
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      // CORREÇÃO 5: Invalida cache específico do usuário
      if (user) {
        localStorage.removeItem(`subscription_last_check_${user.id}`);
        localStorage.removeItem(`subscription_data_${user.id}`);
      }

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

      if (error) {
        // Tratamento específico para erro de portal não configurado
        if (error.message.includes('portal') || error.message.includes('billing')) {
          toast({
            title: "Portal não configurado",
            description: "O portal de gerenciamento precisa ser configurado no Stripe. Entre em contato com o suporte.",
            variant: "destructive",
          });
        } else {
          throw error;
        }
        return;
      }

      // Open customer portal in a new tab
      window.open(data.url, '_blank');
    } catch (error: any) {
      console.error('Error opening customer portal:', error);
      
      // Mensagem mais específica baseada no tipo de erro
      let errorMessage = error.message;
      if (error.message.includes('500') || error.message.includes('non-2xx')) {
        errorMessage = "Portal de gerenciamento não configurado. Entre em contato com o suporte.";
      }
      
      toast({
        title: "Erro ao abrir portal do cliente",
        description: errorMessage,
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

  // Auto-refresh on focus to catch webhook updates
  useEffect(() => {
    const handleFocus = () => {
      // CORREÇÃO 6: Verifica cache específico do usuário
      if (!user) return;
      
      const userLastCheckKey = `subscription_last_check_${user.id}`;
      const lastCheck = localStorage.getItem(userLastCheckKey);
      const tenMinutesInMs = 10 * 60 * 1000;
      const now = Date.now();
      
      if (!lastCheck || (now - parseInt(lastCheck)) > tenMinutesInMs) {
        checkSubscription();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user]);

  return {
    subscription,
    checkSubscription,
    createCheckout,
    openCustomerPortal,
  };
};
