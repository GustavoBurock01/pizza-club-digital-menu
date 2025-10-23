// ===== WRAPPER DE COMPATIBILIDADE - USA useAuth + useSubscription =====

import { createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { useAuth } from '@/hooks/auth/useAuth';
import { useSubscription } from '@/hooks/subscription/useSubscription';
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
  
  // Subscription State
  subscription: SubscriptionStatus;
  
  // Auth Actions
  signUp: (email: string, password: string, userData: any) => Promise<any>;
  signIn: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
  updateProfile: (data: any) => Promise<void>;
  
  // Subscription Actions
  createCheckout: (planType?: 'annual' | 'monthly' | 'trial') => Promise<void>;
  refreshSubscription: () => Promise<void>;
  
  // Utility Functions
  isAuthenticated: () => boolean;
  hasValidSubscription: () => boolean;
}

const UnifiedAuthContext = createContext<UnifiedAuthContextType | undefined>(undefined);

export const UnifiedAuthProvider = ({ children }: { children: ReactNode }) => {
  // Use new separated hooks
  const auth = useAuth();
  const sub = useSubscription();
  const { toast } = useToast();

  // ===== CREATE CHECKOUT (mantido do código antigo) =====
  const createCheckout = async (planType: 'annual' | 'monthly' | 'trial' = 'annual') => {
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
  };

  // ===== SUBSCRIPTION STATUS (formato antigo para compatibilidade) =====
  const subscriptionStatus: SubscriptionStatus = {
    subscribed: sub.isActive,
    status: sub.subscription?.status || 'inactive',
    plan_name: sub.subscription?.plan_name || 'Nenhum',
    plan_price: sub.subscription?.plan_price || 0,
    expires_at: sub.subscription?.expires_at || null,
    loading: sub.isLoading,
    hasSubscriptionHistory: !!sub.subscription,
  };

  // Delegate to auth hook
  const signUp = auth.signUp;
  const signIn = auth.signIn;
  const signOut = auth.signOut;
  const updateProfile = auth.updateProfile;

  // Delegate to subscription hook
  const refreshSubscription = sub.refresh;

  const signOut = async () => {
    try {
      console.log('[UNIFIED-AUTH] Starting logout process');
      
      // Clear all state IMMEDIATELY
      setSession(null);
      setUser(null);
      setSubscription({
        subscribed: false,
        status: 'inactive',
        plan_name: 'Nenhum',
        plan_price: 0,
        expires_at: null,
        loading: false,
        hasSubscriptionHistory: false,
      });
      
      // CRITICAL: Clear ALL localStorage caches related to subscription and auth
      try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (
            key.startsWith('subscription_') ||
            key.startsWith('login_block') ||
            key.startsWith('auth_') ||
            key.startsWith('user_cache_')
          )) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
        console.log('[UNIFIED-AUTH] Cleared localStorage caches:', keysToRemove);
      } catch (storageError) {
        console.warn('[UNIFIED-AUTH] Failed to clear localStorage:', storageError);
      }
      
      // Perform logout
      try {
        const { error } = await supabase.auth.signOut();
        if (error && !error.message.includes('session')) {
          console.warn('[UNIFIED-AUTH] Logout warning:', error.message);
        }
      } catch (logoutError: any) {
        console.warn('[UNIFIED-AUTH] Logout call failed:', logoutError.message);
      }
      
      toast({
        title: "Logout realizado com sucesso!",
        description: "Até a próxima!",
      });
      
    } catch (error: any) {
      console.error('[UNIFIED-AUTH] Logout error:', error);
      
      // Ensure user is cleared locally regardless of error
      setSession(null);
      setUser(null);
      setSubscription({
        subscribed: false,
        status: 'inactive',
        plan_name: 'Nenhum',
        plan_price: 0,
        expires_at: null,
        loading: false,
        hasSubscriptionHistory: false,
      });
      
      toast({
        title: "Logout realizado",
        description: "Sessão encerrada.",
      });
    }
  };

  const updateProfile = async (data: any) => {
    try {
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Perfil atualizado!",
        description: "Suas informações foram salvas com sucesso.",
      });
    } catch (error: any) {
      console.error('[UNIFIED-AUTH] Update profile error:', error);
      toast({
        title: "Erro ao atualizar perfil",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  // ===== SUBSCRIPTION ACTIONS =====
  const createCheckout = async (planType: 'annual' | 'monthly' | 'trial' = 'annual') => {
    try {
      if (!user || !session) {
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
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('[UNIFIED-AUTH] Edge function error:', error);
        throw new Error(error.message || 'Erro ao conectar com o servidor de pagamento');
      }

      // Check if the response contains an error message
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
      
      // Extract meaningful error message
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
        duration: 5000, // Show for longer
      });
      
      throw error; // Re-throw for component to handle
    }
  };

  // ===== UTILITY FUNCTIONS =====
  const isAuthenticated = useCallback(() => {
    return !!user && !!session;
  }, [user, session]);

  const hasValidSubscription = useCallback(() => {
    return subscription.subscribed && subscription.status === 'active';
  }, [subscription.subscribed, subscription.status]);

  // Auto-refresh subscription when auth state is resolved
  useEffect(() => {
    if (!user || !session) {
      setSubscription(prev => ({ ...prev, subscribed: false, status: 'inactive', loading: false }));
      return;
    }
    // User logged in: refresh subscription immediately
    refreshSubscription();
  }, [user?.id, session?.access_token, refreshSubscription]);

  // Auto-refresh subscription on success
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === 'true') {
      setTimeout(() => {
        refreshSubscription();
        toast({
          title: "Pagamento realizado com sucesso!",
          description: "Sua assinatura foi ativada. Bem-vindo ao Pizza Club!",
        });
        window.history.replaceState({}, document.title, window.location.pathname);
      }, 2000);
    }
  }, [refreshSubscription, toast]);

  // Auto-refresh on window focus
  useEffect(() => {
    const handleFocus = () => {
      if (user) {
        refreshSubscription();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user, refreshSubscription]);

  const value = {
    user,
    session,
    loading,
    subscription,
    signUp,
    signIn,
    signOut,
    updateProfile,
    createCheckout,
    refreshSubscription,
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
  return context;
};

// Backward compatibility exports
export const useAuth = useUnifiedAuth;
export const useSubscription = () => {
  const { subscription, refreshSubscription, createCheckout } = useUnifiedAuth();
  return { subscription, refreshSubscription, createCheckout };
};