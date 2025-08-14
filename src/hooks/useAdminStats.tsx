import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AdminStats {
  totalOrders: number;
  totalRevenue: number;
  totalProducts: number;
  totalUsers: number;
  pendingOrders: number;
  completedOrders: number;
  todayOrders: number;
  todayRevenue: number;
  averageOrderValue: number;
  topProducts: Array<{
    name: string;
    quantity: number;
    revenue: number;
  }>;
}

export const useAdminStats = () => {
  const [stats, setStats] = useState<AdminStats>({
    totalOrders: 0,
    totalRevenue: 0,
    totalProducts: 0,
    totalUsers: 0,
    pendingOrders: 0,
    completedOrders: 0,
    todayOrders: 0,
    todayRevenue: 0,
    averageOrderValue: 0,
    topProducts: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];

      // Buscar estatísticas básicas
      const [ordersRes, productsRes, usersRes, todayOrdersRes] = await Promise.all([
        supabase.from('orders').select('total_amount, status, created_at'),
        supabase.from('products').select('id'),
        supabase.from('profiles').select('id'),
        supabase
          .from('orders')
          .select('total_amount, status')
          .gte('created_at', `${today}T00:00:00`)
          .lt('created_at', `${today}T23:59:59`)
      ]);

      if (ordersRes.error) throw ordersRes.error;
      if (productsRes.error) throw productsRes.error;
      if (usersRes.error) throw usersRes.error;
      if (todayOrdersRes.error) throw todayOrdersRes.error;

      const orders = ordersRes.data || [];
      const todayOrders = todayOrdersRes.data || [];

      // Calcular estatísticas
      const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total_amount), 0);
      const todayRevenue = todayOrders.reduce((sum, order) => sum + Number(order.total_amount), 0);
      const pendingOrders = orders.filter(o => o.status === 'pending').length;
      const completedOrders = orders.filter(o => o.status === 'delivered').length;
      const averageOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

      // Buscar produtos mais vendidos
      const { data: topProductsData } = await supabase
        .from('order_items')
        .select(`
          quantity,
          total_price,
          products (name)
        `)
        .limit(100);

      // Agrupar produtos mais vendidos
      const productStats = (topProductsData || []).reduce((acc, item) => {
        const productName = item.products?.name || 'Produto sem nome';
        if (!acc[productName]) {
          acc[productName] = { name: productName, quantity: 0, revenue: 0 };
        }
        acc[productName].quantity += item.quantity;
        acc[productName].revenue += Number(item.total_price);
        return acc;
      }, {} as Record<string, { name: string; quantity: number; revenue: number }>);

      const topProducts = Object.values(productStats)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);

      setStats({
        totalOrders: orders.length,
        totalRevenue,
        totalProducts: productsRes.data?.length || 0,
        totalUsers: usersRes.data?.length || 0,
        pendingOrders,
        completedOrders,
        todayOrders: todayOrders.length,
        todayRevenue,
        averageOrderValue,
        topProducts
      });

      setError(null);
    } catch (err) {
      console.error('Erro ao carregar estatísticas:', err);
      setError('Erro ao carregar estatísticas do painel');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
    
    // Atualizar estatísticas a cada 30 segundos
    const interval = setInterval(loadStats, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return { stats, loading, error, refreshStats: loadStats };
};