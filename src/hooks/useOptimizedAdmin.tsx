// ===== ADMIN HOOKS OTIMIZADOS =====

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CACHE_STRATEGIES } from '@/config/queryClient';
import { optimizedCache } from '@/utils/optimizedCache';

// Query unificada para dashboard admin
const fetchAdminDashboard = async () => {
  try {
    const [ordersRes, usersRes, productsRes] = await Promise.all([
      supabase
        .from('orders')
        .select('id, status, total_amount, created_at, user_id')
        .order('created_at', { ascending: false })
        .limit(100),
      
      supabase
        .from('profiles')
        .select('id, display_name, created_at')
        .order('created_at', { ascending: false })
        .limit(50),
      
      supabase
        .from('products')
        .select('id, name, price, is_available, category_id')
        .limit(100)
    ]);

    return {
      orders: ordersRes.data || [],
      users: usersRes.data || [],
      products: productsRes.data || [],
      ordersError: ordersRes.error,
      usersError: usersRes.error,
      productsError: productsRes.error
    };
  } catch (error) {
    throw error;
  }
};

export const useOptimizedAdminDashboard = () => {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: fetchAdminDashboard,
    ...CACHE_STRATEGIES.SEMI_STATIC,
  });

  // Stats calculados
  const stats = data ? {
    totalOrders: data.orders.length,
    totalRevenue: data.orders.reduce((sum, order) => sum + (order.total_amount || 0), 0),
    totalUsers: data.users.length,
    totalProducts: data.products.length,
    pendingOrders: data.orders.filter(o => o.status === 'pending').length,
    deliveredOrders: data.orders.filter(o => o.status === 'delivered').length,
    activeProducts: data.products.filter(p => p.is_available).length
  } : null;

  const invalidateAdminData = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
    optimizedCache.invalidateByPattern(/^admin-/);
  };

  return {
    orders: data?.orders || [],
    users: data?.users || [],
    products: data?.products || [],
    stats,
    isLoading,
    error: error || data?.ordersError || data?.usersError || data?.productsError,
    invalidateAdminData
  };
};

// Hook específico para orders
export const useOptimizedAdminOrders = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-orders-detailed'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          profiles(display_name),
          order_items(*, products(name, price))
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    ...CACHE_STRATEGIES.DYNAMIC,
  });

  return {
    orders: data || [],
    isLoading,
    error
  };
};