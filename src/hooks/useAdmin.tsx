import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AdminUser {
  role: string;
  isAdmin: boolean;
  isLoading: boolean;
}

export const useAdmin = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [adminState, setAdminState] = useState<AdminUser>({
    role: '',
    isAdmin: false,
    isLoading: true
  });

  useEffect(() => {
    const checkAdminRole = async () => {
      if (authLoading) return;
      
      if (!user) {
        setAdminState({
          role: '',
          isAdmin: false,
          isLoading: false
        });
        return;
      }

      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (error) throw error;

        const isAdmin = profile?.role === 'admin';
        
        setAdminState({
          role: profile?.role || '',
          isAdmin,
          isLoading: false
        });

        if (!isAdmin) {
          toast({
            title: 'Acesso negado',
            description: 'Você não tem permissão de administrador.',
            variant: 'destructive'
          });
        }
      } catch (error) {
        console.error('Erro ao verificar role do admin:', error);
        setAdminState({
          role: '',
          isAdmin: false,
          isLoading: false
        });
      }
    };

    checkAdminRole();
  }, [user, authLoading, toast]);

  return adminState;
};