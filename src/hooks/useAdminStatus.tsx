import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface AdminStatus {
  isAdmin: boolean;
  role: string;
  loading: boolean;
}

export const useAdminStatus = () => {
  const { user, loading: authLoading } = useAuth();
  const [adminStatus, setAdminStatus] = useState<AdminStatus>({
    isAdmin: false,
    role: 'customer',
    loading: true
  });

  useEffect(() => {
    let isMounted = true;

    const checkAdminStatus = async () => {
      if (authLoading) return;
      
      if (!user) {
        if (isMounted) {
          setAdminStatus({
            isAdmin: false,
            role: 'customer',
            loading: false
          });
        }
        return;
      }

      try {
        // Verificar role diretamente da tabela profiles
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching user role:', error);
          if (isMounted) {
            setAdminStatus({
              isAdmin: false,
              role: 'customer',
              loading: false
            });
          }
          return;
        }

        const userRole = profile?.role || 'customer';
        const isAdmin = userRole === 'admin';

        if (isMounted) {
          setAdminStatus({
            isAdmin,
            role: userRole,
            loading: false
          });
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        if (isMounted) {
          setAdminStatus({
            isAdmin: false,
            role: 'customer',
            loading: false
          });
        }
      }
    };

    checkAdminStatus();

    return () => {
      isMounted = false;
    };
  }, [user?.id, authLoading]);

  return adminStatus;
};