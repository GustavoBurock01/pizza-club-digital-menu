// ===== HOOK ADMIN ULTRA SIMPLES =====

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

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

export const useAdminData = () => {
  const [stats, setStats] = useState<AdminStats>({
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
  });
  
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      // Fetch básico sem tipos complexos
      const ordersResult = await (supabase as any)
        .from('orders')
        .select('*')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      const productsResult = await (supabase as any)
        .from('products')
        .select('id')
        .eq('available', true);

      const usersResult = await (supabase as any)
        .from('profiles')
        .select('id');

      const orders = ordersResult.data || [];
      const products = productsResult.data || [];
      const users = usersResult.data || [];

      // Calcular métricas
      const todayOrders = orders.length;
      const pendingOrders = orders.filter(o => o.status === 'pending').length;
      const completedOrders = orders.filter(o => o.status === 'delivered').length;
      const todayRevenue = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
      const averageOrderValue = todayOrders > 0 ? todayRevenue / todayOrders : 0;

      setStats({
        totalOrders: orders.length,
        totalRevenue: todayRevenue,
        totalProducts: products.length,
        totalUsers: users.length,
        averageOrderValue,
        revenueGrowth: 0,
        todayOrders,
        pendingOrders,
        completedOrders,
        todayRevenue,
        topSellingProducts: []
      });
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    
    // Auto refresh a cada 5 minutos
    const interval = setInterval(fetchStats, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const refreshStats = () => {
    fetchStats();
  };

  return {
    stats,
    loading,
    refreshStats
  };
};