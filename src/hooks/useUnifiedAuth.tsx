// ===== UNIFIED AUTH HOOK (WRAPPER) - SIMPLIFICADO =====
// ⚠️ DEPRECATED: Use useAuth from '@/hooks/auth/useAuth' directly para auth
// ou useSubscriptionContext() para subscription
// Este hook será removido em versão futura

import { createContext, useContext, ReactNode, useCallback, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { useAuth as useAuthCore } from '@/hooks/auth/useAuth';
import { useSubscriptionContext } from '@/providers/SubscriptionProvider';
import { SecureStorage } from '@/utils/secureStorage';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SubscriptionStatus {
  subscribed: boolean;
  status: string;
  plan_name: string;
  plan_price: number;
  expires_at: string | null;
  loading: boolean;
  hasSubscriptionHistory: boolean;
}

interface UnifiedAuthContextType {
  // Auth State
  user: User | null;
  session: Session | null;
  loading: boolean;
  
  // Subscription State (DEPRECATED - use useSubscriptionContext)
  subscription: SubscriptionStatus;
  
  // Auth Actions
  signUp: (email: string, password: string, userData: any) => Promise<any>;
  signIn: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
  updateProfile: (data: any) => Promise<void>;
  
  // Subscription Actions
  createCheckout: (planType?: 'annual' | 'monthly' | 'trial') => Promise<void>;
  refreshSubscription: () => Promise<void>;
  reconcileSubscription: () => Promise<void>;
  
  // Utility Functions
  isAuthenticated: () => boolean;
  hasValidSubscription: () => boolean;
}

const UnifiedAuthContext = createContext<UnifiedAuthContextType | undefined>(undefined);

export const UnifiedAuthProvider = ({ children }: { children: ReactNode }) => {
  // Use auth core + subscription context (evita duplicação de canais realtime)
  const auth = useAuthCore();
  const subscription = useSubscriptionContext();
  const { toast } = useToast();

  // ===== CREATE CHECKOUT =====
  const createCheckout = useCallback(async (planType: 'annual' | 'monthly' | 'trial' = 'annual') => {
    try {
      if (!auth.user || !auth.session) {
        toast({
          title: "Erro na autenticação",
          description: "Você precisa estar logado para criar uma assinatura.",
          variant: "destructive",
        });
        return;
      }

      console.log('[UNIFIED-AUTH] Creating checkout session for plan:', planType);

      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { plan_type: planType },
        headers: {
          Authorization: `Bearer ${auth.session.access_token}`,
        },
      });

      if (error) {
        console.error('[UNIFIED-AUTH] Edge function error:', error);
        throw new Error(error.message || 'Erro ao conectar com o servidor de pagamento');
      }

      if (data?.error) {
        console.error('[UNIFIED-AUTH] Checkout error from edge function:', data.error);
        throw new Error(data.error);
      }

      if (data?.url) {
        console.log('[UNIFIED-AUTH] Redirecting to Stripe checkout:', data.url);
        window.location.href = data.url;
      } else {
        throw new Error('URL de checkout não retornada. Verifique a configuração do Stripe.');
      }
    } catch (error: any) {
      console.error('[UNIFIED-AUTH] Create checkout error:', error);
      
      let errorMessage = 'Erro ao processar pagamento. Por favor, tente novamente.';
      
      if (error.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      toast({
        title: "Erro ao criar checkout",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      });
      
      throw error;
    }
  }, [auth.user, auth.session, toast]);

  // ===== SUBSCRIPTION STATUS (formato antigo para compatibilidade) =====
  // ⚠️ DEPRECATED - Use useSubscriptionContext() directly instead
  const subscriptionStatus: SubscriptionStatus = {
    subscribed: subscription.isActive,
    status: subscription.status,
    plan_name: subscription.planName,
    plan_price: subscription.planPrice,
    expires_at: subscription.expiresAt,
    loading: subscription.isLoading,
    hasSubscriptionHistory: subscription.isActive,
  };

  // ===== UTILITY FUNCTIONS =====
  const isAuthenticated = useCallback(() => {
    return !!auth.user && !!auth.session;
  }, [auth.user, auth.session]);

  const hasValidSubscription = useCallback(() => {
    return subscription.isActive;
  }, [subscription.isActive]);

  // Refresh subscription only after successful checkout redirect
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === 'true') {
      setTimeout(() => {
        subscription.refresh();
        toast({
          title: "Pagamento realizado com sucesso!",
          description: "Sua assinatura foi ativada. Bem-vindo ao Pizza Club!",
        });
        window.history.replaceState({}, document.title, window.location.pathname);
      }, 2000);
    }
  }, [subscription, toast]);

  const value: UnifiedAuthContextType = {
    user: auth.user,
    session: auth.session,
    loading: auth.loading || subscription.isLoading,
    subscription: subscriptionStatus,
    signUp: auth.signUp,
    signIn: auth.signIn,
    signOut: async () => {
      subscription.clearCache();
      await SecureStorage.clearAll();
      await auth.signOut();
    },
    updateProfile: auth.updateProfile,
    createCheckout,
    refreshSubscription: subscription.refresh,
    reconcileSubscription: subscription.reconcile,
    isAuthenticated,
    hasValidSubscription,
  };

  return <UnifiedAuthContext.Provider value={value}>{children}</UnifiedAuthContext.Provider>;
};

export const useUnifiedAuth = () => {
  const context = useContext(UnifiedAuthContext);
  if (context === undefined) {
    throw new Error('useUnifiedAuth must be used within an UnifiedAuthProvider');
  }
  
  if (process.env.NODE_ENV === 'development') {
    console.warn('[DEPRECATED] useUnifiedAuth is deprecated. Use useAuth or useSubscriptionContext directly.');
  }
  
  return context;
};

// Export useAuth core como padrão (RECOMENDADO)
export const useAuth = useAuthCore;
