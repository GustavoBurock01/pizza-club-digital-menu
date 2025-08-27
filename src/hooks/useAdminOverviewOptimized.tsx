// ===== HOOK ADMIN OVERVIEW OTIMIZADO - ELIMINA POLLING AGRESSIVO =====

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { memoryCache } from '@/utils/performance';
import { CACHE_STRATEGIES } from '@/config/queryClient';

export interface AdminOverviewStats {
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

const CACHE_KEY = 'admin-overview-stats';
const QUERY_KEY = ['admin-overview-optimized'];

export const useAdminOverviewOptimized = () => {
  // Query otimizada usando materialized view quando possível
  const { data: stats, isLoading, error, refetch } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async (): Promise<AdminOverviewStats> => {
      // Tentar cache em memória primeiro
      const cachedData = memoryCache.get(CACHE_KEY);
      if (cachedData) {
        console.log('⚡ Cache HIT: Admin stats from memory');
        return cachedData;
      }

      console.log('🌐 Fetching admin stats from database');
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // OTIMIZAÇÃO 1: Usar a materialized view para stats básicas
      const statsViewPromise = supabase
        .from('admin_stats_view')
        .select('*')
        .single();

      // OTIMIZAÇÃO 2: Query consolidada para dados temporais (fallback para queries simples)
      const todayOrdersPromise = supabase
        .from('orders')
        .select('total_amount, status')
        .gte('created_at', `${today}T00:00:00`)
        .lt('created_at', `${today}T23:59:59`);

      const yesterdayOrdersPromise = supabase
        .from('orders')
        .select('total_amount')
        .gte('created_at', `${yesterday}T00:00:00`)
        .lt('created_at', `${yesterday}T23:59:59`);

      // OTIMIZAÇÃO 3: Top produtos otimizada
      const topProductsPromise = supabase
        .from('order_items')
        .select(`
          quantity,
          total_price,
          products!inner (name)
        `)
        .limit(100);

      try {
        const [statsRes, todayOrdersRes, yesterdayOrdersRes, topProductsRes] = await Promise.all([
          statsViewPromise,
          todayOrdersPromise,
          yesterdayOrdersPromise,
          topProductsPromise
        ]);

        if (statsRes.error) {
          // Fallback para queries individuais se materialized view não existir
          return await loadStatsWithFallback(today, yesterday);
        }

        const baseStats = statsRes.data;
        const todayOrders = todayOrdersRes.data || [];
        const yesterdayOrders = yesterdayOrdersRes.data || [];
        const topProductsData = topProductsRes.data || [];

        // Calcular métricas temporais
        const todayRevenue = todayOrders.reduce((sum, order) => sum + Number(order.total_amount), 0);
        const yesterdayRevenue = yesterdayOrders.reduce((sum, order) => sum + Number(order.total_amount), 0);
        const revenueGrowth = yesterdayRevenue > 0 ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100 : 0;

        // Produtos mais vendidos
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

        const result: AdminOverviewStats = {
          totalOrders: baseStats.total_orders || 0,
          totalRevenue: Number(baseStats.total_revenue || 0),
          totalProducts: baseStats.total_products || 0,
          totalCustomers: baseStats.total_users || 0,
          pendingOrders: baseStats.pending_orders || 0,
          completedOrders: baseStats.completed_orders || 0,
          todayOrders: todayOrders.length,
          todayRevenue,
          averageOrderValue: Number(baseStats.avg_order_value || 0),
          revenueGrowth,
          topSellingProducts
        };

        // Cache em memória por 2 minutos
        memoryCache.set(CACHE_KEY, result, 2 * 60 * 1000);
        return result;

      } catch (error) {
        console.error('❌ Error in optimized admin stats:', error);
        return await loadStatsWithFallback(today, yesterday);
      }
    },
    ...CACHE_STRATEGIES.DYNAMIC, // Cache de 5 minutos
    refetchOnWindowFocus: false,
    refetchInterval: false, // CRITICAL: Remove polling agressivo
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
    refreshStats: () => {
      memoryCache.clear(); // Limpar cache em memória
      refetch();
    }
  };
};

// Fallback para quando materialized view não existir
async function loadStatsWithFallback(today: string, yesterday: string): Promise<AdminOverviewStats> {
  console.log('📊 Loading stats with fallback queries');
  
  // Query consolidada mais eficiente
  const [ordersRes, productsRes, customersRes, todayOrdersRes, yesterdayOrdersRes] = await Promise.all([
    supabase.from('orders').select('total_amount, status, created_at'),
    supabase.from('products').select('id'),
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
      .lt('created_at', `${yesterday}T23:59:59`)
  ]);

  const orders = ordersRes.data || [];
  const todayOrders = todayOrdersRes.data || [];
  const yesterdayOrders = yesterdayOrdersRes.data || [];

  // Calcular estatísticas
  const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total_amount), 0);
  const todayRevenue = todayOrders.reduce((sum, order) => sum + Number(order.total_amount), 0);
  const yesterdayRevenue = yesterdayOrders.reduce((sum, order) => sum + Number(order.total_amount), 0);
  
  const pendingOrders = orders.filter(o => ['pending', 'confirmed', 'preparing'].includes(o.status)).length;
  const completedOrders = orders.filter(o => o.status === 'delivered').length;
  const averageOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;
  const revenueGrowth = yesterdayRevenue > 0 ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100 : 0;

  return {
    totalOrders: orders.length,
    totalRevenue,
    totalProducts: productsRes.data?.length || 0,
    totalCustomers: customersRes.data?.length || 0,
    pendingOrders,
    completedOrders,
    todayOrders: todayOrders.length,
    todayRevenue,
    averageOrderValue,
    revenueGrowth,
    topSellingProducts: [] // Top produtos seria uma query separada no fallback
  };
}