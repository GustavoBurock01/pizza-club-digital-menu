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
    let isMounted = true;
    
    const checkAdminRole = async () => {
      if (authLoading) return;
      
      if (!user) {
        if (isMounted) {
          setAdminState({
            role: '',
            isAdmin: false,
            isLoading: false
          });
        }
        return;
      }

      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle(); // Usar maybeSingle para evitar erros se não encontrar

        if (error) {
          console.error('Error checking admin role:', error);
          if (isMounted) {
            setAdminState({
              role: '',
              isAdmin: false,
              isLoading: false
            });
          }
          return;
        }

        const isAdmin = profile?.role === 'admin';
        
        if (isMounted) {
          setAdminState({
            role: profile?.role || 'customer',
            isAdmin,
            isLoading: false
          });
        }
      } catch (error) {
        console.error('Error checking admin role:', error);
        if (isMounted) {
          setAdminState({
            role: '',
            isAdmin: false,
            isLoading: false
          });
        }
      }
    };

    checkAdminRole();

    return () => {
      isMounted = false;
    };
  }, [user?.id, authLoading, toast]); // Usar user.id ao invés de user para evitar re-renders

  return adminState;
};