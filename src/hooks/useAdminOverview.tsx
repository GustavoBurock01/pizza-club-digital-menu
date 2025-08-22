import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

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

export const useAdminOverview = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminOverviewStats>({
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
  });
  const [error, setError] = useState<string | null>(null);

  const loadOverviewStats = async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // Buscar dados em paralelo
      const [ordersRes, productsRes, customersRes, todayOrdersRes, yesterdayOrdersRes, topProductsRes] = await Promise.all([
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

      if (ordersRes.error) throw ordersRes.error;
      if (productsRes.error) throw productsRes.error;
      if (customersRes.error) throw customersRes.error;

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

      // Produtos mais vendidos
      const productStats = (topProductsRes.data || []).reduce((acc, item) => {
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

      setStats({
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
        topSellingProducts
      });

      setError(null);
    } catch (err) {
      console.error('Erro ao carregar estatísticas overview:', err);
      setError('Erro ao carregar dados do dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOverviewStats();
    
    // Atualizar a cada 30 segundos
    const interval = setInterval(loadOverviewStats, 30000);
    return () => clearInterval(interval);
  }, []);

  return { 
    stats, 
    loading, 
    error, 
    refreshStats: loadOverviewStats 
  };
};