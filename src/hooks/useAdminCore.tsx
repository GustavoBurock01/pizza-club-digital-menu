// ===== HOOK ADMIN UNIFICADO - CONSOLIDA useAdminData + useAdminOverviewOptimized =====

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CACHE_STRATEGIES } from '@/config/queryClient';

export interface AdminCoreStats {
  totalOrders: number;
  totalRevenue: number;
  totalProducts: number;
  totalCustomers: number;
  pendingOrders: number;
  completedOrders: number;
  todayOrders: number;
  todayRevenue: number;
  averageOrderValue: number;
  revenueGrowth: number;
  topSellingProducts: Array<{
    name: string;
    quantity: number;
    revenue: number;
  }>;
}

const QUERY_KEYS = {
  ADMIN_STATS: ['admin', 'stats'] as const,
  ADMIN_REALTIME: ['admin', 'realtime'] as const,
};

export const useAdminCore = (options?: { realtime?: boolean }) => {
  const { realtime = false } = options || {};

  const { data: stats, isLoading, error, refetch } = useQuery({
    queryKey: QUERY_KEYS.ADMIN_STATS,
    queryFn: async (): Promise<AdminCoreStats> => {
      console.log('🏢 Fetching unified admin stats');
      
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // Consolidated parallel queries for optimal performance
      const [
        ordersRes,
        productsRes,
        customersRes,
        todayOrdersRes,
        yesterdayOrdersRes,
        topProductsRes
      ] = await Promise.all([
        supabase.from('orders').select('total_amount, status, created_at'),
        supabase.from('products').select('id').eq('available', true),
        supabase.from('profiles').select('id').neq('role', 'admin'),
        supabase
          .from('orders')
          .select('total_amount, status')
          .gte('created_at', `${today}T00:00:00`)
          .lt('created_at', `${today}T23:59:59`),
        supabase
          .from('orders')
          .select('total_amount')
          .gte('created_at', `${yesterday}T00:00:00`)
          .lt('created_at', `${yesterday}T23:59:59`),
        supabase
          .from('order_items')
          .select(`
            quantity,
            total_price,
            products!inner (name)
          `)
          .limit(100)
      ]);

      const orders = ordersRes.data || [];
      const products = productsRes.data || [];
      const customers = customersRes.data || [];
      const todayOrders = todayOrdersRes.data || [];
      const yesterdayOrders = yesterdayOrdersRes.data || [];
      const topProductsData = topProductsRes.data || [];

      // Calculate metrics
      const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0);
      const todayRevenue = todayOrders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0);
      const yesterdayRevenue = yesterdayOrders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0);
      
      const pendingOrders = orders.filter(o => ['pending', 'confirmed', 'preparing'].includes(o.status)).length;
      const completedOrders = orders.filter(o => o.status === 'delivered').length;
      const averageOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;
      const revenueGrowth = yesterdayRevenue > 0 ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100 : 0;

      // Top selling products aggregation
      const productStats = topProductsData.reduce((acc, item) => {
        const productName = item.products?.name || 'Produto sem nome';
        if (!acc[productName]) {
          acc[productName] = { name: productName, quantity: 0, revenue: 0 };
        }
        acc[productName].quantity += item.quantity;
        acc[productName].revenue += Number(item.total_price);
        return acc;
      }, {} as Record<string, { name: string; quantity: number; revenue: number }>);

      const topSellingProducts = Object.values(productStats)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);

      return {
        totalOrders: orders.length,
        totalRevenue,
        totalProducts: products.length,
        totalCustomers: customers.length,
        pendingOrders,
        completedOrders,
        todayOrders: todayOrders.length,
        todayRevenue,
        averageOrderValue,
        revenueGrowth,
        topSellingProducts
      };
    },
    // Use different cache strategies based on realtime requirement
    ...(realtime ? CACHE_STRATEGIES.CRITICAL : CACHE_STRATEGIES.DYNAMIC),
    refetchOnWindowFocus: realtime,
    refetchInterval: realtime ? 30000 : false, // 30s if realtime, otherwise no polling
    retry: 1,
  });

  return {
    stats: stats || {
      totalOrders: 0,
      totalRevenue: 0,
      totalProducts: 0,
      totalCustomers: 0,
      pendingOrders: 0,
      completedOrders: 0,
      todayOrders: 0,
      todayRevenue: 0,
      averageOrderValue: 0,
      revenueGrowth: 0,
      topSellingProducts: []
    },
    loading: isLoading,
    error: error?.message || null,
    refreshStats: () => refetch()
  };
};