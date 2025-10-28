// ===== AUTH ACTIONS (EXTRAÍDO) =====

import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { User } from '@supabase/supabase-js';

export const useAuthActions = (user: User | null) => {
  const { toast } = useToast();

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Redirect baseado na role (agora usando user_roles)
      if (data.user) {
        const { data: userRole } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', data.user.id)
          .order('role', { ascending: true })
          .limit(1)
          .maybeSingle();

        const role = userRole?.role || 'customer';
        
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
    }
  }, [toast]);

  const signUp = useCallback(async (email: string, password: string, userData: any) => {
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
    }
  }, [toast]);

  const signOut = useCallback(async () => {
    try {
      console.log('[AUTH] Signing out');
      
      // Clear caches
      clearAuthCaches();
      
      // Perform logout
      await supabase.auth.signOut();
      
      toast({
        title: "Logout realizado!",
        description: "Até a próxima!",
      });
      
      window.location.href = '/auth';
    } catch (error: any) {
      console.error('[AUTH] Sign out error:', error);
      
      toast({
        title: "Logout realizado",
        description: "Sessão encerrada.",
      });
      
      window.location.href = '/auth';
    }
  }, [toast]);

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

  return { signIn, signUp, signOut, updateProfile };
};

// Helper para limpar caches
const clearAuthCaches = () => {
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
};
