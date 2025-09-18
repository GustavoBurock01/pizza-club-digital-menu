// ===== SISTEMA DE AUTENTICAÇÃO UNIFICADO =====

import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
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
  signUp: (email: string, password: string, userData: any) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: any) => Promise<void>;
  
  // Subscription Actions
  checkSubscription: (forceCheck?: boolean) => Promise<void>;
  createCheckout: (planType?: 'annual' | 'monthly' | 'trial') => Promise<void>;
  openCustomerPortal: () => Promise<void>;
  
  // Utility Functions
  isAuthenticated: () => boolean;
  hasValidSubscription: () => boolean;
  canAccessFeature: (feature: string) => boolean;
}

const UnifiedAuthContext = createContext<UnifiedAuthContextType | undefined>(undefined);

export const UnifiedAuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionStatus>({
    subscribed: false,
    status: 'inactive',
    plan_name: 'Nenhum',
    plan_price: 0,
    expires_at: null,
    loading: true,
    hasSubscriptionHistory: false,
  });

  const { toast } = useToast();

  // ===== AUTH STATE MANAGEMENT =====
  useEffect(() => {
    let mounted = true;

    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        console.log('[UNIFIED-AUTH] Auth state changed:', event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('[UNIFIED-AUTH] User signed in, checking subscription');
          await checkSubscriptionInternal();
        }
        
        if (event === 'SIGNED_OUT') {
          console.log('[UNIFIED-AUTH] User signed out, clearing subscription');
          setSubscription(prev => ({
            ...prev,
            subscribed: false,
            status: 'inactive',
            loading: false
          }));
          clearSubscriptionCache();
        }
        
        if (mounted) {
          setLoading(false);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!mounted) return;
      
      if (error) {
        console.error('[UNIFIED-AUTH] Error getting session:', error);
      }
      
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      if (session?.user) {
        checkSubscriptionInternal();
      }
    });

    return () => {
      mounted = false;
      authSubscription.unsubscribe();
    };
  }, []);

  // ===== SUBSCRIPTION MANAGEMENT =====
  const clearSubscriptionCache = useCallback(() => {
    if (user) {
      localStorage.removeItem(`subscription_data_${user.id}`);
      localStorage.removeItem(`subscription_last_check_${user.id}`);
    }
  }, [user]);

  const checkSubscriptionHistory = async () => {
    if (!user || !session) return false;

    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('id, status, created_at, sync_status')
        .eq('user_id', user.id)
        .neq('status', 'pending')
        .neq('sync_status', 'pending')
        .limit(1);

      if (error) {
        console.error('[UNIFIED-AUTH] Error checking subscription history:', error);
        return false;
      }

      return data && data.length > 0;
    } catch (error: any) {
      console.error('[UNIFIED-AUTH] Error checking subscription history:', error);
      return false;
    }
  };

  const checkSubscriptionInternal = async (forceCheck = false) => {
    if (!user || !session) {
      setSubscription(prev => ({ ...prev, loading: false }));
      return;
    }

    const userCacheKey = `subscription_data_${user.id}`;
    const userLastCheckKey = `subscription_last_check_${user.id}`;
    
    const hasHistory = await checkSubscriptionHistory();
    const shouldUseCache = hasHistory && !forceCheck;
    
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
      
      if (hasHistory && subscriptionData.subscribed) {
        const now = Date.now();
        localStorage.setItem(userLastCheckKey, now.toString());
        localStorage.setItem(userCacheKey, JSON.stringify(subscriptionData));
      } else {
        localStorage.removeItem(userCacheKey);
        localStorage.removeItem(userLastCheckKey);
      }

      // Clean other user caches
      Object.keys(localStorage).forEach(key => {
        if ((key.startsWith('subscription_data_') || key.startsWith('subscription_last_check_')) && 
            !key.includes(user.id)) {
          localStorage.removeItem(key);
        }
      });

    } catch (error: any) {
      console.error('[UNIFIED-AUTH] Error checking subscription:', error);
      toast({
        title: "Erro ao verificar assinatura",
        description: error.message,
        variant: "destructive",
      });
      setSubscription(prev => ({ ...prev, loading: false }));
    }
  };

  // ===== AUTH ACTIONS =====
  const signUp = async (email: string, password: string, userData: any) => {
    try {
      setLoading(true);
      const redirectUrl = `${window.location.origin}/dashboard`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: userData.name,
            phone: userData.phone,
            cpf: userData.cpf
          }
        }
      });

      if (error) throw error;

      if (data.user && !error) {
        if (userData.address) {
          const { error: addressError } = await supabase
            .from('addresses')
            .insert({
              user_id: data.user.id,
              street: userData.address.street,
              number: userData.address.number,
              complement: userData.address.complement || null,
              neighborhood: userData.address.neighborhood,
              zip_code: userData.address.zipCode,
              reference_point: userData.address.reference || null,
              is_default: true
            });

          if (addressError) {
            console.error('[UNIFIED-AUTH] Error creating address:', addressError);
          }
        }

        const { error: subscriptionError } = await supabase
          .from('subscriptions')
          .insert({
            user_id: data.user.id,
            status: 'pending',
            plan_name: 'Mensal',
            plan_price: 9.90
          });

        if (subscriptionError) {
          console.error('[UNIFIED-AUTH] Error creating subscription:', subscriptionError);
        }
      }

      toast({
        title: "Conta criada com sucesso!",
        description: "Verifique seu email para confirmar a conta.",
      });
    } catch (error: any) {
      console.error('[UNIFIED-AUTH] Sign up error:', error);
      toast({
        title: "Erro ao criar conta",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        try {
          await new Promise(resolve => setTimeout(resolve, 500));
          
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', data.user.id)
            .maybeSingle();

          const userRole = profile?.role || 'customer';

          setTimeout(() => {
            switch (userRole) {
              case 'admin':
                window.location.href = '/admin';
                break;
              case 'attendant':
                window.location.href = '/attendant';
                break;
              default:
                window.location.href = '/dashboard';
                break;
            }
          }, 100);
        } catch (roleError) {
          console.error('[UNIFIED-AUTH] Error checking user role:', roleError);
          setTimeout(() => {
            window.location.href = '/dashboard';
          }, 100);
        }
      }

      toast({
        title: "Login realizado com sucesso!",
        description: "Bem-vindo de volta!",
      });
    } catch (error: any) {
      console.error('[UNIFIED-AUTH] Sign in error:', error);
      toast({
        title: "Erro ao fazer login",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.log('[UNIFIED-AUTH] No active session found, clearing local state');
        setSession(null);
        setUser(null);
        setSubscription(prev => ({ ...prev, subscribed: false, status: 'inactive' }));
        clearSubscriptionCache();
        
        toast({
          title: "Logout realizado com sucesso!",
          description: "Até a próxima!",
        });
        return;
      }

      const { error } = await supabase.auth.signOut();
      
      if (error) {
        if (error.message.includes('session') || error.message.includes('Session')) {
          console.log('[UNIFIED-AUTH] Session already invalid, clearing local state');
          setSession(null);
          setUser(null);
          setSubscription(prev => ({ ...prev, subscribed: false, status: 'inactive' }));
          clearSubscriptionCache();
          
          toast({
            title: "Logout realizado com sucesso!",
            description: "Até a próxima!",
          });
          return;
        }
        throw error;
      }
      
      toast({
        title: "Logout realizado com sucesso!",
        description: "Até a próxima!",
      });
    } catch (error: any) {
      console.error('[UNIFIED-AUTH] Sign out error:', error);
      
      setSession(null);
      setUser(null);
      setSubscription(prev => ({ ...prev, subscribed: false, status: 'inactive' }));
      clearSubscriptionCache();
      
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
  const checkSubscription = useCallback((forceCheck = false) => {
    return checkSubscriptionInternal(forceCheck);
  }, [user, session]);

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
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { 
          plan_type: planType
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      clearSubscriptionCache();
      window.open(data.url, '_blank');
    } catch (error: any) {
      console.error('[UNIFIED-AUTH] Error creating checkout:', error);
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

      window.open(data.url, '_blank');
    } catch (error: any) {
      console.error('[UNIFIED-AUTH] Error opening customer portal:', error);
      
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

  // ===== UTILITY FUNCTIONS =====
  const isAuthenticated = useCallback(() => {
    return !!user && !!session;
  }, [user, session]);

  const hasValidSubscription = useCallback(() => {
    return subscription.subscribed && subscription.status === 'active';
  }, [subscription.subscribed, subscription.status]);

  const canAccessFeature = useCallback((feature: string) => {
    if (!isAuthenticated()) return false;
    
    // Free features available to all authenticated users
    const freeFeatures = ['browse_menu', 'view_profile', 'basic_orders'];
    if (freeFeatures.includes(feature)) return true;
    
    // Premium features require valid subscription
    return hasValidSubscription();
  }, [isAuthenticated, hasValidSubscription]);

  // Auto-refresh on focus and URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === 'true') {
      setTimeout(() => {
        checkSubscriptionInternal();
        toast({
          title: "Pagamento realizado com sucesso!",
          description: "Sua assinatura foi ativada. Bem-vindo ao Pizza Club!",
        });
        window.history.replaceState({}, document.title, window.location.pathname);
      }, 2000);
    }
  }, []);

  useEffect(() => {
    const handleFocus = () => {
      if (!user) return;
      
      const userLastCheckKey = `subscription_last_check_${user.id}`;
      const lastCheck = localStorage.getItem(userLastCheckKey);
      const tenMinutesInMs = 10 * 60 * 1000;
      const now = Date.now();
      
      if (!lastCheck || (now - parseInt(lastCheck)) > tenMinutesInMs) {
        checkSubscriptionInternal();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user]);

  const value = {
    user,
    session,
    loading,
    subscription,
    signUp,
    signIn,
    signOut,
    updateProfile,
    checkSubscription,
    createCheckout,
    openCustomerPortal,
    isAuthenticated,
    hasValidSubscription,
    canAccessFeature,
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
  const { subscription, checkSubscription, createCheckout, openCustomerPortal } = useUnifiedAuth();
  return { subscription, checkSubscription, createCheckout, openCustomerPortal };
};