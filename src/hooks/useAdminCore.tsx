// ===== HOOK ADMIN UNIFICADO - CONSOLIDA useAdminData + useAdminOverviewOptimized =====

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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
};

async function fetchAdminStats(): Promise<AdminCoreStats> {
  console.log('🏢 Fetching real admin stats from database');
  
  try {
    // Get date for today calculations
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());

    // Parallel queries for better performance
    const [
      ordersResult,
      productsResult,
      customersResult,
      topProductsResult
    ] = await Promise.all([
      // Orders statistics
      supabase
        .from('orders')
        .select('id, total_amount, status, created_at'),
      
      // Products count
      supabase
        .from('products')
        .select('id', { count: 'exact' }),
      
      // Customers count
      supabase
        .from('profiles')
        .select('id', { count: 'exact' })
        .eq('role', 'customer'),
      
      // Top selling products
      supabase
        .from('order_items')
        .select(`
          quantity,
          unit_price,
          total_price,
          products!inner(name)
        `)
    ]);

    if (ordersResult.error) throw ordersResult.error;
    if (productsResult.error) throw productsResult.error;
    if (customersResult.error) throw customersResult.error;
    if (topProductsResult.error) throw topProductsResult.error;

    const orders = ordersResult.data || [];
    const totalProducts = productsResult.count || 0;
    const totalCustomers = customersResult.count || 0;
    const orderItems = topProductsResult.data || [];

    // Calculate order statistics
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0);
    const pendingOrders = orders.filter(order => order.status === 'pending').length;
    const completedOrders = orders.filter(order => order.status === 'delivered').length;
    
    // Today's statistics
    const todayOrders = orders.filter(order => 
      new Date(order.created_at) >= todayStart
    );
    const todayOrdersCount = todayOrders.length;
    const todayRevenue = todayOrders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0);
    
    // Last month's revenue for growth calculation
    const lastMonthOrders = orders.filter(order => {
      const orderDate = new Date(order.created_at);
      return orderDate >= lastMonthStart && orderDate < todayStart;
    });
    const lastMonthRevenue = lastMonthOrders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0);
    
    // Calculate revenue growth
    const revenueGrowth = lastMonthRevenue > 0 
      ? ((todayRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
      : 0;

    // Average order value
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Calculate top selling products
    const productStats = orderItems.reduce((acc, item) => {
      const productName = item.products?.name || 'Produto desconhecido';
      if (!acc[productName]) {
        acc[productName] = { quantity: 0, revenue: 0 };
      }
      acc[productName].quantity += item.quantity || 0;
      acc[productName].revenue += Number(item.total_price || 0);
      return acc;
    }, {} as Record<string, { quantity: number; revenue: number }>);

    const topSellingProducts = Object.entries(productStats)
      .map(([name, stats]) => ({
        name,
        quantity: stats.quantity,
        revenue: stats.revenue
      }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    return {
      totalOrders,
      totalRevenue,
      totalProducts,
      totalCustomers,
      pendingOrders,
      completedOrders,
      todayOrders: todayOrdersCount,
      todayRevenue,
      averageOrderValue,
      revenueGrowth,
      topSellingProducts
    };

  } catch (error) {
    console.error('Error fetching admin stats:', error);
    // Return empty stats on error
    return {
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
    };
  }
}

export const useAdminCore = (options?: { realtime?: boolean }) => {
  const { realtime = false } = options || {};

  const { data: stats, isLoading, error, refetch } = useQuery({
    queryKey: QUERY_KEYS.ADMIN_STATS,
    queryFn: fetchAdminStats,
    // Simple cache configuration
    staleTime: realtime ? 30 * 1000 : 60 * 60 * 1000, // 30s realtime, 1h normal
    gcTime: realtime ? 2 * 60 * 1000 : 6 * 60 * 60 * 1000, // 2m realtime, 6h normal
    refetchOnWindowFocus: realtime,
    refetchInterval: realtime ? 30000 : false,
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