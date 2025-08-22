import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AdminCustomer {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  role: string;
  created_at: string;
  avatar_url?: string;
  // Estatísticas do cliente
  totalOrders: number;
  totalSpent: number;
  lastOrderDate?: string;
  favoriteProducts: string[];
  // Endereços
  addresses: Array<{
    id: string;
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    is_default: boolean;
  }>;
}

export interface CustomerStats {
  totalCustomers: number;
  newCustomersThisMonth: number;
  activeCustomers: number; // Com pedidos nos últimos 30 dias
  topCustomers: Array<{
    id: string;
    name: string;
    totalSpent: number;
    orderCount: number;
  }>;
  customerGrowth: number; // % crescimento mensal
}

export const useAdminCustomers = (filters?: { limit?: number; search?: string }) => {
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [stats, setStats] = useState<CustomerStats>({
    totalCustomers: 0,
    newCustomersThisMonth: 0,
    activeCustomers: 0,
    topCustomers: [],
    customerGrowth: 0
  });
  const [error, setError] = useState<string | null>(null);

  const loadCustomers = async () => {
    try {
      setLoading(true);

      // Query base para clientes
      let customersQuery = supabase
        .from('profiles')
        .select(`
          *,
          addresses (*)
        `)
        .eq('role', 'customer')
        .order('created_at', { ascending: false });

      if (filters?.limit) {
        customersQuery = customersQuery.limit(filters.limit);
      } else {
        customersQuery = customersQuery.limit(50);
      }

      if (filters?.search) {
        customersQuery = customersQuery.or(
          `full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`
        );
      }

      const { data: customersData, error: customersError } = await customersQuery;
      
      if (customersError) throw customersError;

      // Buscar estatísticas de pedidos por cliente
      const { data: orderStats, error: orderStatsError } = await supabase
        .from('orders')
        .select(`
          user_id,
          total_amount,
          created_at,
          order_items (
            products (name)
          )
        `);

      if (orderStatsError) throw orderStatsError;

      // Processar dados dos clientes
      const processedCustomers: AdminCustomer[] = (customersData || []).map(customer => {
        const customerOrders = orderStats?.filter(order => order.user_id === customer.id) || [];
        const totalSpent = customerOrders.reduce((sum, order) => sum + Number(order.total_amount), 0);
        const lastOrder = customerOrders.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0];

        // Produtos favoritos (mais pedidos)
        const productCounts: Record<string, number> = {};
        customerOrders.forEach(order => {
          order.order_items?.forEach(item => {
            if (item.products?.name) {
              productCounts[item.products.name] = (productCounts[item.products.name] || 0) + 1;
            }
          });
        });

        const favoriteProducts = Object.entries(productCounts)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 3)
          .map(([product]) => product);

        return {
          ...customer,
          totalOrders: customerOrders.length,
          totalSpent,
          lastOrderDate: lastOrder?.created_at,
          favoriteProducts,
          addresses: customer.addresses || []
        };
      });

      setCustomers(processedCustomers);

      // Calcular estatísticas gerais
      await loadCustomerStats(processedCustomers, orderStats || []);
      
      setError(null);
    } catch (err) {
      console.error('Erro ao carregar clientes:', err);
      setError('Erro ao carregar dados dos clientes');
    } finally {
      setLoading(false);
    }
  };

  const loadCustomerStats = async (customers: AdminCustomer[], orderStats: any[]) => {
    try {
      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Novos clientes este mês
      const newCustomersThisMonth = customers.filter(customer => 
        new Date(customer.created_at) >= thisMonth
      ).length;

      const newCustomersLastMonth = customers.filter(customer => {
        const createdDate = new Date(customer.created_at);
        return createdDate >= lastMonth && createdDate < thisMonth;
      }).length;

      // Clientes ativos (com pedidos nos últimos 30 dias)
      const activeCustomers = customers.filter(customer =>
        customer.lastOrderDate && new Date(customer.lastOrderDate) >= thirtyDaysAgo
      ).length;

      // Top clientes por gasto
      const topCustomers = customers
        .sort((a, b) => b.totalSpent - a.totalSpent)
        .slice(0, 10)
        .map(customer => ({
          id: customer.id,
          name: customer.full_name,
          totalSpent: customer.totalSpent,
          orderCount: customer.totalOrders
        }));

      // Crescimento mensal
      const customerGrowth = newCustomersLastMonth > 0 
        ? ((newCustomersThisMonth - newCustomersLastMonth) / newCustomersLastMonth) * 100 
        : 0;

      setStats({
        totalCustomers: customers.length,
        newCustomersThisMonth,
        activeCustomers,
        topCustomers,
        customerGrowth
      });
    } catch (err) {
      console.error('Erro ao calcular estatísticas dos clientes:', err);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [filters?.limit, filters?.search]);

  return {
    customers,
    stats,
    loading,
    error,
    refreshCustomers: loadCustomers
  };
};