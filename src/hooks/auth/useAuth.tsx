// ===== AUTH HOOK - PURO, SEM SUBSCRIPTION =====

import { useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // ===== AUTH STATE MANAGEMENT =====
  useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;
        
        console.log('[AUTH] State changed:', event);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (event === 'SIGNED_OUT') {
          // Clear auth caches
          try {
            const keysToRemove: string[] = [];
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key && (
                key.startsWith('subscription_') ||
                key.startsWith('auth_') ||
                key.startsWith('login_block')
              )) {
                keysToRemove.push(key);
              }
            }
            keysToRemove.forEach(key => localStorage.removeItem(key));
            console.log('[AUTH] Cleared caches:', keysToRemove.length);
          } catch (e) {
            console.warn('[AUTH] Failed to clear cache:', e);
          }
        }
        
        if (mounted) setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!mounted) return;
      if (error) console.error('[AUTH] Session error:', error);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // ===== SIGN IN =====
  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Redirect based on role
      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .maybeSingle();

        const role = profile?.role || 'customer';
        
        setTimeout(() => {
          switch (role) {
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
      }

      toast({
        title: "Login realizado!",
        description: "Bem-vindo de volta!",
      });

      return data;
    } catch (error: any) {
      console.error('[AUTH] Sign in error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // ===== SIGN UP =====
  const signUp = useCallback(async (email: string, password: string, userData: any) => {
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
            console.error('[AUTH] Error creating address:', addressError);
          }
        }
      }

      toast({
        title: "Conta criada com sucesso!",
        description: "Verifique seu email para confirmar a conta.",
      });

      return data;
    } catch (error: any) {
      console.error('[AUTH] Sign up error:', error);
      toast({
        title: "Erro ao criar conta",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // ===== SIGN OUT =====
  const signOut = useCallback(async () => {
    try {
      console.log('[AUTH] Signing out');
      
      // Clear state immediately
      setSession(null);
      setUser(null);
      
      // Clear caches
      try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (
            key.startsWith('subscription_') ||
            key.startsWith('auth_') ||
            key.startsWith('login_block')
          )) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
      } catch (e) {
        console.warn('[AUTH] Cache clear failed:', e);
      }
      
      // Perform logout
      await supabase.auth.signOut();
      
      toast({
        title: "Logout realizado!",
        description: "Até a próxima!",
      });
      
      // Redirect to auth page
      window.location.href = '/auth';
    } catch (error: any) {
      console.error('[AUTH] Sign out error:', error);
      
      // Ensure user is cleared locally regardless
      setSession(null);
      setUser(null);
      
      toast({
        title: "Logout realizado",
        description: "Sessão encerrada.",
      });
      
      // Redirect even on error
      window.location.href = '/auth';
    }
  }, [toast]);

  // ===== UPDATE PROFILE =====
  const updateProfile = useCallback(async (data: any) => {
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
      console.error('[AUTH] Update profile error:', error);
      toast({
        title: "Erro ao atualizar perfil",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  }, [user, toast]);

  // ===== UTILITY =====
  const isAuthenticated = useCallback(() => {
    return !!user && !!session;
  }, [user, session]);

  return {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
    isAuthenticated,
  };
};
