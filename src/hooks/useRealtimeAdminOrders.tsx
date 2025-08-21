import { useEffect, useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/services/supabase';
import { QUERY_KEYS } from '@/services/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

// ===== HOOK PARA PEDIDOS EM TEMPO REAL (ADMIN/ATTENDANT) =====

export const useRealtimeAdminOrders = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);

  // Query para todos os pedidos (admin view)
  const { data: orders = [], isLoading } = useQuery({
    queryKey: QUERY_KEYS.ADMIN_ORDERS,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          profiles (full_name, email, phone),
          addresses (street, number, neighborhood, city),
          order_items (
            *,
            products (name, price)
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50); // Limitar para performance

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 30 * 1000, // 30 segundos
    gcTime: 2 * 60 * 1000, // 2 minutos
    refetchOnWindowFocus: false,
  });

  // Query para pedidos pendentes (prioridade)
  const { data: pendingOrders = [] } = useQuery({
    queryKey: [...QUERY_KEYS.ADMIN_ORDERS, 'pending'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          profiles (full_name, phone),
          order_items (
            *,
            products (name)
          )
        `)
        .in('status', ['pending', 'confirmed'])
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 15 * 1000, // 15 segundos para pedidos pendentes
    refetchInterval: 30 * 1000, // Backup polling a cada 30s
  });

  // Real-time para novos pedidos
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('admin-orders')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          console.log('New order received:', payload);
          
          // Mostrar notificação de novo pedido
          toast({
            title: "🔔 Novo Pedido!",
            description: `Pedido #${payload.new.id.slice(0, 8)} recebido`,
            duration: 10000,
          });

          // Invalidar queries relacionadas
          queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ADMIN_ORDERS });
          queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ADMIN_STATS });
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
          console.log('Order updated:', payload);
          
          // Atualizar cache específico se necessário
          queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ADMIN_ORDERS });
        }
      )
      .subscribe((status) => {
        console.log('Admin orders realtime status:', status);
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
      setIsConnected(false);
    };
  }, [user?.id, queryClient, toast]);

  // Atualizar status do pedido
  const updateOrderStatus = useCallback(async (orderId: string, newStatus: string, notes?: string) => {
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

    // Invalidar cache
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ADMIN_ORDERS });
  }, [queryClient, toast]);

  // Marcar como confirmado
  const confirmOrder = useCallback(async (orderId: string) => {
    await updateOrderStatus(orderId, 'confirmed');
  }, [updateOrderStatus]);

  // Marcar como preparando
  const startPreparing = useCallback(async (orderId: string) => {
    await updateOrderStatus(orderId, 'preparing');
  }, [updateOrderStatus]);

  // Marcar como saiu para entrega
  const markOutForDelivery = useCallback(async (orderId: string) => {
    await updateOrderStatus(orderId, 'out_for_delivery');
  }, [updateOrderStatus]);

  // Marcar como entregue
  const markDelivered = useCallback(async (orderId: string) => {
    await updateOrderStatus(orderId, 'delivered');
  }, [updateOrderStatus]);

  return {
    orders,
    pendingOrders,
    isLoading,
    isConnected,
    updateOrderStatus,
    confirmOrder,
    startPreparing,
    markOutForDelivery,
    markDelivered,
    refreshOrders: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ADMIN_ORDERS });
      queryClient.invalidateQueries({ queryKey: [...QUERY_KEYS.ADMIN_ORDERS, 'pending'] });
    }
  };
};