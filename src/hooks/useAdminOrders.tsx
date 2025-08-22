import { useEffect, useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface AdminOrder {
  id: string;
  user_id: string;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivering' | 'delivered' | 'cancelled';
  total_amount: number;
  delivery_fee: number;
  payment_method: string;
  payment_status: string;
  created_at: string;
  updated_at: string;
  notes?: string;
  profiles?: {
    full_name: string;
    email: string;
    phone?: string;
  };
  addresses?: {
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    complement?: string;
  };
  order_items?: Array<{
    id: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    products?: {
      name: string;
      price: number;
    };
  }>;
}

export const useAdminOrders = (filters?: { status?: string; limit?: number }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);

  // Query para todos os pedidos ou filtrados
  const { data: orders = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-orders', filters],
    queryFn: async () => {
      let query = supabase
        .from('orders')
        .select(`
          *,
          profiles!orders_user_id_fkey (full_name, email, phone),
          addresses (street, number, neighborhood, city, complement),
          order_items (
            *,
            products (name, price)
          )
        `)
        .order('created_at', { ascending: false });

      if (filters?.status) {
        if (filters.status === 'pending') {
          query = query.in('status', ['pending', 'confirmed', 'preparing']);
        } else {
          query = query.eq('status', filters.status as 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivering' | 'delivered' | 'cancelled');
        }
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      } else {
        query = query.limit(50);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 30 * 1000, // 30 segundos
    gcTime: 2 * 60 * 1000, // 2 minutos
    refetchOnWindowFocus: false,
  });

  // Real-time para novos pedidos
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('admin-orders-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          console.log('Novo pedido recebido:', payload);
          
          toast({
            title: "🔔 Novo Pedido!",
            description: `Pedido #${payload.new.id.slice(0, 8)} recebido`,
            duration: 10000,
          });

          // Invalidar cache para atualizar
          queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
          queryClient.invalidateQueries({ queryKey: ['admin-overview'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          console.log('Pedido atualizado:', payload);
          queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
      setIsConnected(false);
    };
  }, [user?.id, queryClient, toast]);

  // Atualizar status do pedido
  const updateOrderStatus = useCallback(async (
    orderId: string, 
    newStatus: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivering' | 'delivered' | 'cancelled', 
    notes?: string
  ) => {
    try {
      const updateData: any = { 
        status: newStatus,
        updated_at: new Date().toISOString()
      };

      if (notes) updateData.notes = notes;

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: "Status atualizado",
        description: `Pedido marcado como ${newStatus}`,
      });

      // Atualizar cache
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-overview'] });
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar status do pedido",
        variant: "destructive"
      });
    }
  }, [queryClient, toast]);

  // Ações rápidas
  const confirmOrder = useCallback((orderId: string) => 
    updateOrderStatus(orderId, 'confirmed'), [updateOrderStatus]);

  const startPreparing = useCallback((orderId: string) => 
    updateOrderStatus(orderId, 'preparing'), [updateOrderStatus]);

  const markReady = useCallback((orderId: string) => 
    updateOrderStatus(orderId, 'ready'), [updateOrderStatus]);

  const markDelivering = useCallback((orderId: string) => 
    updateOrderStatus(orderId, 'delivering'), [updateOrderStatus]);

  const markDelivered = useCallback((orderId: string) => 
    updateOrderStatus(orderId, 'delivered'), [updateOrderStatus]);

  const cancelOrder = useCallback((orderId: string, reason?: string) => 
    updateOrderStatus(orderId, 'cancelled', reason), [updateOrderStatus]);

  return {
    orders,
    isLoading,
    isConnected,
    updateOrderStatus,
    confirmOrder,
    startPreparing,
    markReady,
    markDelivering,
    markDelivered,
    cancelOrder,
    refreshOrders: refetch
  };
};