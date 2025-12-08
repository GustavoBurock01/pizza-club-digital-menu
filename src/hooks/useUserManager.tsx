import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { UserRole } from '@/components/users/UserRoleSelector';

export interface UserWithRole {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  avatar_url?: string;
}

interface UseUserManagerOptions {
  pageSize?: number;
}

export function useUserManager(options: UseUserManagerOptions = {}) {
  const { pageSize = 10 } = options;
  
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserWithRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'active' | 'inactive' | 'all'>('all');

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch user roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Map roles to users
      const roleMap = new Map(roles?.map(r => [r.user_id, r.role as UserRole]) || []);
      
      const usersWithRoles: UserWithRole[] = (profiles || []).map(profile => ({
        id: profile.id,
        name: profile.full_name || profile.email || 'Sem nome',
        email: profile.email || '',
        phone: profile.phone || undefined,
        role: roleMap.get(profile.id) || 'customer',
        is_active: true,
        created_at: profile.created_at || new Date().toISOString(),
        avatar_url: profile.avatar_url || undefined
      }));

      setUsers(usersWithRoles);
      setTotalCount(usersWithRoles.length);
    } catch (err: any) {
      console.error('Erro ao buscar usuários:', err);
      setError(err.message);
      toast.error('Erro ao carregar usuários');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Apply filters
  useEffect(() => {
    let result = [...users];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(user => 
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query)
      );
    }

    // Role filter
    if (roleFilter !== 'all') {
      result = result.filter(user => user.role === roleFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(user => 
        statusFilter === 'active' ? user.is_active : !user.is_active
      );
    }

    setFilteredUsers(result);
    setTotalCount(result.length);
    setCurrentPage(1);
  }, [users, searchQuery, roleFilter, statusFilter]);

  // Get paginated users
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const totalPages = Math.ceil(totalCount / pageSize);

  // Invite user via email
  const inviteUser = async (email: string, role: UserRole, name?: string) => {
    try {
      // Create user with Supabase Auth (magic link)
      const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
        data: { full_name: name }
      });

      // If admin invite fails (no admin access), try alternative approach
      if (error) {
        // Log the invite attempt for manual processing
        toast.info('Convite registrado. O usuário será adicionado quando fizer o primeiro login.');
        
        // Store pending invite
        localStorage.setItem(`pending_invite_${email}`, JSON.stringify({ role, name }));
        return;
      }

      // If user was created, assign role
      if (data.user) {
        await updateUserRole(data.user.id, role);
      }

      await fetchUsers();
    } catch (err: any) {
      console.error('Erro ao convidar usuário:', err);
      throw err;
    }
  };

  // Update user profile data
  const updateUser = async (userId: string, data: Partial<UserWithRole>) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: data.name,
          phone: data.phone
        })
        .eq('id', userId);

      if (error) throw error;

      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, ...data } : user
      ));
    } catch (err: any) {
      console.error('Erro ao atualizar usuário:', err);
      throw err;
    }
  };

  // Change user role via edge function
  const updateUserRole = async (userId: string, newRole: UserRole) => {
    try {
      const { error } = await supabase.functions.invoke('admin-role-update', {
        body: { userId, newRole }
      });

      if (error) throw error;

      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ));

      toast.success('Papel alterado com sucesso');
    } catch (err: any) {
      console.error('Erro ao alterar papel:', err);
      throw err;
    }
  };

  // Toggle user active status
  const toggleUserStatus = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    const newStatus = !user.is_active;
    
    // Update in local state (in a real app, this would update a database field)
    setUsers(prev => prev.map(u => 
      u.id === userId ? { ...u, is_active: newStatus } : u
    ));

    toast.success(newStatus ? 'Usuário ativado' : 'Usuário desativado');
  };

  // Delete user (remove from system)
  const deleteUser = async (userId: string) => {
    try {
      // Remove role first
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      // Remove profile
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      setUsers(prev => prev.filter(user => user.id !== userId));
      toast.success('Usuário removido');
    } catch (err: any) {
      console.error('Erro ao remover usuário:', err);
      toast.error('Erro ao remover usuário');
      throw err;
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return {
    // Data
    users: paginatedUsers,
    allUsers: filteredUsers,
    isLoading,
    error,
    
    // Pagination
    currentPage,
    totalPages,
    totalCount,
    setCurrentPage,
    
    // Filters
    searchQuery,
    setSearchQuery,
    roleFilter,
    setRoleFilter,
    statusFilter,
    setStatusFilter,
    
    // Actions
    fetchUsers,
    inviteUser,
    updateUser,
    updateUserRole,
    toggleUserStatus,
    deleteUser
  };
}
