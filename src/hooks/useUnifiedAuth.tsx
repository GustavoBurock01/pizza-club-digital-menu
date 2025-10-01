// ===== SISTEMA DE AUTENTICAÇÃO UNIFICADO SIMPLIFICADO =====

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
  createCheckout: (planType?: 'annual' | 'monthly' | 'trial') => Promise<void>;
  refreshSubscription: () => Promise<void>;
  
  // Utility Functions
  isAuthenticated: () => boolean;
  hasValidSubscription: () => boolean;
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
      (event, session) => {
        if (!mounted) return;
        
        console.log('[UNIFIED-AUTH] Auth state changed:', event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        
        // Clear subscription on logout
        if (event === 'SIGNED_OUT') {
          setSubscription({
            subscribed: false,
            status: 'inactive',
            plan_name: 'Nenhum',
            plan_price: 0,
            expires_at: null,
            loading: false,
            hasSubscriptionHistory: false,
          });
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
    });

    return () => {
      mounted = false;
      authSubscription.unsubscribe();
    };
  }, []);

  // ===== SUBSCRIPTION MANAGEMENT - SIMPLIFIED =====
  const refreshSubscription = useCallback(async () => {
    if (!user || !session) {
      setSubscription(prev => ({ ...prev, subscribed: false, status: 'inactive', loading: false }));
      return;
    }

    console.log('[UNIFIED-AUTH] Refreshing subscription for user:', user.id);
    setSubscription(prev => ({ ...prev, loading: true }));

    try {
      // Verificar diretamente no banco de dados
      const { data: subData, error } = await supabase
        .from('subscriptions')
        .select('status, plan_name, plan_price, expires_at')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (subData && subData.status === 'active') {
        const now = new Date();
        const expiresAt = subData.expires_at ? new Date(subData.expires_at) : null;
        const isExpired = expiresAt && expiresAt < now;

        setSubscription({
          subscribed: !isExpired,
          status: isExpired ? 'expired' : subData.status,
          plan_name: subData.plan_name || 'Nenhum',
          plan_price: subData.plan_price || 0,
          expires_at: subData.expires_at,
          loading: false,
          hasSubscriptionHistory: true,
        });
      } else {
        setSubscription({
          subscribed: false,
          status: 'inactive',
          plan_name: 'Nenhum',
          plan_price: 0,
          expires_at: null,
          loading: false,
          hasSubscriptionHistory: false,
        });
      }
    } catch (error: any) {
      console.error('[UNIFIED-AUTH] Error refreshing subscription:', error);
      setSubscription(prev => ({ ...prev, loading: false, subscribed: false, status: 'inactive' }));
    }
  }, [user, session]);

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

      // Refresh subscription on successful login
      if (data.user) {
        setTimeout(() => {
          refreshSubscription();
        }, 1000);
      }

      if (data.user) {
        try {
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
          }, 300);
        } catch (roleError) {
          console.error('[UNIFIED-AUTH] Error checking user role:', roleError);
          setTimeout(() => {
            window.location.href = '/dashboard';
          }, 300);
        }
      }

      toast({
        title: "Login realizado com sucesso!",
        description: "Bem-vindo de volta!",
      });
    } catch (error: any) {
      console.error('[UNIFIED-AUTH] Sign in error:', error);
      // Don't show toast here - let the form handle error display
      throw error;
    } finally {
      setLoading(false);
    }
  };

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

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('URL de checkout não retornada');
      }
    } catch (error: any) {
      console.error('[UNIFIED-AUTH] Create checkout error:', error);
      toast({
        title: "Erro ao criar checkout",
        description: error.message || 'Erro interno do servidor',
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