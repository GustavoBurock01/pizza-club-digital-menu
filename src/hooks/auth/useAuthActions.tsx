// ===== AUTH ACTIONS HOOK - GERENCIA AÇÕES DE AUTENTICAÇÃO =====

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface SignUpData {
  name: string;
  phone: string;
  cpf: string;
  address?: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    zipCode: string;
    reference?: string;
  };
}

export const useAuthActions = () => {
  const [redirecting, setRedirecting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // ===== SIGN IN =====
  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Redirect based on role
      if (data.user) {
        setRedirecting(true);
        
        try {
          const { data: roleData, error: roleError } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', data.user.id)
            .limit(1)
            .maybeSingle();

          if (roleError) {
            console.warn('[AUTH ACTIONS] Error fetching role, defaulting to customer:', roleError);
          }

          const role = roleData?.role || 'customer';
          
          console.log('[AUTH ACTIONS] User role detected:', role);
          
          setTimeout(() => {
            switch (role) {
              case 'admin':
                navigate('/admin');
                break;
              case 'attendant':
                navigate('/attendant');
                break;
              default:
                navigate('/dashboard');
                break;
            }
            setRedirecting(false);
          }, 300);
        } catch (roleError) {
          console.error('[AUTH ACTIONS] Error in role redirect:', roleError);
          navigate('/dashboard');
          setRedirecting(false);
        }
      }

      toast({
        title: "Login realizado!",
        description: "Bem-vindo de volta!",
      });

      return data;
    } catch (error: any) {
      console.error('[AUTH ACTIONS] Sign in error:', error);
      throw error;
    }
  }, [toast, navigate]);

  // ===== SIGN UP =====
  const signUp = useCallback(async (email: string, password: string, userData: SignUpData) => {
    try {
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

      // Create address if provided
      if (data.user && !error && userData.address) {
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
          console.error('[AUTH ACTIONS] Error creating address:', addressError);
        }
      }

      toast({
        title: "Conta criada com sucesso!",
        description: "Verifique seu email para confirmar a conta.",
      });

      return data;
    } catch (error: any) {
      console.error('[AUTH ACTIONS] Sign up error:', error);
      toast({
        title: "Erro ao criar conta",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  }, [toast]);

  // ===== SIGN OUT =====
  const signOut = useCallback(async () => {
    try {
      console.log('[AUTH ACTIONS] Signing out');
      
      // Clear caches
      try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (
            key.startsWith('subscription_') ||
            key.startsWith('auth_') ||
            key.startsWith('query-cache') ||
            key.startsWith('unified-store')
          )) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
        console.log('[AUTH ACTIONS] Cleared caches:', keysToRemove.length);
      } catch (e) {
        console.warn('[AUTH ACTIONS] Failed to clear cache:', e);
      }
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // Navigate to auth page
      navigate('/auth');
      
      toast({
        title: "Logout realizado",
        description: "Você saiu da sua conta com sucesso.",
      });
    } catch (error: any) {
      console.error('[AUTH ACTIONS] Sign out error:', error);
      toast({
        title: "Erro ao fazer logout",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  }, [toast, navigate]);

  // ===== UPDATE PROFILE =====
  const updateProfile = useCallback(async (updates: any) => {
    try {
      const { error } = await supabase.auth.updateUser({
        data: updates
      });

      if (error) throw error;

      toast({
        title: "Perfil atualizado!",
        description: "Suas informações foram salvas com sucesso.",
      });
    } catch (error: any) {
      console.error('[AUTH ACTIONS] Update profile error:', error);
      toast({
        title: "Erro ao atualizar perfil",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  }, [toast]);

  return {
    signIn,
    signUp,
    signOut,
    updateProfile,
    redirecting,
  };
};
