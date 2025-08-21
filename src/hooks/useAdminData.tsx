import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AdminStats {
  totalOrders: number;
  totalRevenue: number;
  totalProducts: number;
  totalUsers: number;
  pendingOrders: number;
  completedOrders: number;
}

export interface Order {
  id: string;
  user_id: string;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivering' | 'delivered' | 'cancelled';
  total_amount: number;
  created_at: string;
  payment_method: string;
  profiles?: {
    full_name: string;
    email: string;
  };
  addresses?: {
    street: string;
    number: string;
    neighborhood: string;
  };
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  is_available: boolean;
  category_id: string;
  subcategory_id: string;
  categories?: {
    name: string;
  };
  subcategories?: {
    name: string;
  };
}

export interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  role: string;
  created_at: string;
}

export const useAdminData = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats>({
    totalOrders: 0,
    totalRevenue: 0,
    totalProducts: 0,
    totalUsers: 0,
    pendingOrders: 0,
    completedOrders: 0
  });
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const { toast } = useToast();

  const loadStats = async () => {
    try {
      const [ordersRes, productsRes, usersRes] = await Promise.all([
        supabase.from('orders').select('total_amount, status'),
        supabase.from('products').select('id'),
        supabase.from('profiles').select('id')
      ]);

      const orders = ordersRes.data || [];
      const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total_amount), 0);
      const pendingOrders = orders.filter(o => ['pending', 'confirmed', 'preparing'].includes(o.status)).length;
      const completedOrders = orders.filter(o => o.status === 'delivered').length;

      setStats({
        totalOrders: orders.length,
        totalRevenue,
        totalProducts: productsRes.data?.length || 0,
        totalUsers: usersRes.data?.length || 0,
        pendingOrders,
        completedOrders
      });
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const loadOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          profiles!orders_user_id_fkey(full_name, email),
          addresses(street, number, neighborhood)
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
    }
  };

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories(name),
          subcategories(name)
        `)
        .order('name')
        .limit(20);

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    }
  };

  const updateOrderStatus = async (orderId: string, status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivering' | 'delivered' | 'cancelled') => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: 'Status atualizado',
        description: 'Status do pedido atualizado com sucesso.'
      });

      // Recarregar apenas pedidos
      await loadOrders();
      await loadStats();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar status do pedido.',
        variant: 'destructive'
      });
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadStats(),
        loadOrders(),
        loadProducts(),
        loadUsers()
      ]);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar dados do painel.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  return {
    loading,
    stats,
    orders,
    products,
    users,
    updateOrderStatus,
    refreshData: loadAllData
  };
};