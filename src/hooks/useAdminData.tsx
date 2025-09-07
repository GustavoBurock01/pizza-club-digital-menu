// ===== HOOK ADMIN SIMPLES =====

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xpgsfovrxguphlvncgwn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhwZ3Nmb3ZyeGd1cGhsdm5jZ3duIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0NDU5MjgsImV4cCI6MjA2NTAyMTkyOH0.oAeHjwZ-JzP3OG_WebpFXb5tP3n9K3IdfHY4e6DLaTE';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface AdminStats {
  totalOrders: number;
  totalRevenue: number;
  totalProducts: number;
  totalUsers: number;
  averageOrderValue: number;
  revenueGrowth: number;
  todayOrders: number;
  pendingOrders: number;
  completedOrders: number;
  todayRevenue: number;
  topSellingProducts: any[];
}

const fetchAdminStats = async (): Promise<AdminStats> => {
  try {
    const { data: orders } = await supabase
      .from('orders')
      .select('*')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
    
    const { data: products } = await supabase
      .from('products')
      .select('id')
      .eq('available', true);
    
    const { data: users } = await supabase
      .from('profiles')
      .select('id');

    const ordersList = orders || [];
    const productsList = products || [];
    const usersList = users || [];

    const todayOrders = ordersList.length;
    const pendingOrders = ordersList.filter(o => o.status === 'pending').length;
    const completedOrders = ordersList.filter(o => o.status === 'delivered').length;
    const todayRevenue = ordersList.reduce((sum, order) => sum + (order.total_amount || 0), 0);
    const averageOrderValue = todayOrders > 0 ? todayRevenue / todayOrders : 0;

    return {
      totalOrders: ordersList.length,
      totalRevenue: todayRevenue,
      totalProducts: productsList.length,
      totalUsers: usersList.length,
      averageOrderValue,
      revenueGrowth: 0,
      todayOrders,
      pendingOrders,
      completedOrders,
      todayRevenue,
      topSellingProducts: []
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      totalOrders: 0,
      totalRevenue: 0,
      totalProducts: 0,
      totalUsers: 0,
      averageOrderValue: 0,
      revenueGrowth: 0,
      todayOrders: 0,
      pendingOrders: 0,
      completedOrders: 0,
      todayRevenue: 0,
      topSellingProducts: []
    };
  }
};

export const useAdminData = () => {
  const { data: stats, isLoading: loading, refetch } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: fetchAdminStats,
    staleTime: 120000,
    gcTime: 600000,
    refetchInterval: 300000,
  });

  return {
    stats: stats || {
      totalOrders: 0,
      totalRevenue: 0,
      totalProducts: 0,
      totalUsers: 0,
      averageOrderValue: 0,
      revenueGrowth: 0,
      todayOrders: 0,
      pendingOrders: 0,
      completedOrders: 0,
      todayRevenue: 0,
      topSellingProducts: []
    },
    loading,
    refreshStats: refetch
  };
};