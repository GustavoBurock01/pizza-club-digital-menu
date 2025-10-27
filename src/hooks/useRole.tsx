import { useState, useEffect } from 'react';
import { supabase } from '@/services/supabase';
import { useUnifiedAuth } from '@/hooks/useUnifiedAuth';

export type UserRole = 'admin' | 'attendant' | 'customer';

export interface RoleStatus {
  role: UserRole | null;
  isAdmin: boolean;
  isAttendant: boolean;
  isCustomer: boolean;
  loading: boolean;
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
}

export const useRole = (): RoleStatus => {
  const { user, loading: authLoading } = useUnifiedAuth();
  const [roleState, setRoleState] = useState<{
    role: UserRole | null;
    loading: boolean;
  }>({
    role: null,
    loading: true
  });

  useEffect(() => {
    let isMounted = true;

    const checkUserRole = async () => {
      if (authLoading) return;
      
      if (!user) {
        if (isMounted) {
          setRoleState({ role: null, loading: false });
        }
        return;
      }

      try {
        // Usar nova tabela user_roles ao invés de profiles
        const { data: userRoles, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .order('role', { ascending: true })
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error('Error fetching user role:', error);
          if (isMounted) {
            setRoleState({ role: 'customer', loading: false });
          }
          return;
        }

        const userRole = (userRoles?.role as UserRole) || 'customer';

        if (isMounted) {
          setRoleState({ role: userRole, loading: false });
        }
      } catch (error) {
        console.error('Error checking user role:', error);
        if (isMounted) {
          setRoleState({ role: 'customer', loading: false });
        }
      }
    };

    checkUserRole();

    return () => {
      isMounted = false;
    };
  }, [user?.id, authLoading]);

  const hasRole = (role: UserRole): boolean => {
    return roleState.role === role;
  };

  const hasAnyRole = (roles: UserRole[]): boolean => {
    return roleState.role ? roles.includes(roleState.role) : false;
  };

  return {
    role: roleState.role,
    isAdmin: roleState.role === 'admin',
    isAttendant: roleState.role === 'attendant',
    isCustomer: roleState.role === 'customer',
    loading: roleState.loading,
    hasRole,
    hasAnyRole
  };
};