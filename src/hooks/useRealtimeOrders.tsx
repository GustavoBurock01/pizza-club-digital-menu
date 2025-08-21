import { useEffect, useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/services/supabase';
import { QUERY_KEYS } from '@/services/supabase';
import { useAuth } from '@/hooks/useAuth';

// ===== HOOK PARA PEDIDOS EM TEMPO REAL =====

interface RealtimeOrder {
  id: string;
  user_id: string;
  status: string;
  total_amount: number;
  created_at: string;
  updated_at: string;
  payment_status: string;
  notes?: string;
}

export const useRealtimeOrders = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);

  // Query para pedidos do usuário
  const { data: orders = [], isLoading } = useQuery({
    queryKey: [...QUERY_KEYS.ORDERS, user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products (name, price)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 30 * 1000, // 30 segundos
    gcTime: 2 * 60 * 1000, // 2 minutos
    refetchOnWindowFocus: false,
  });

  // Configurar real-time para pedidos do usuário
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`orders:user:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Order update received:', payload);
          
          // Invalidar e refetch dos pedidos
          queryClient.invalidateQueries({ 
            queryKey: [...QUERY_KEYS.ORDERS, user.id] 
          });

          // Se é um novo pedido ou mudança de status, mostrar notificação
          if (payload.eventType === 'UPDATE') {
            const newOrder = payload.new as RealtimeOrder;
            // Aqui poderia adicionar toast notification
          }
        }
      )
      .subscribe((status) => {
        console.log('Orders realtime status:', status);
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
      setIsConnected(false);
    };
  }, [user?.id, queryClient]);

  // Função para atualizar status do pedido (admin/attendant)
  const updateOrderStatus = useCallback(async (orderId: string, newStatus: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivering' | 'delivered' | 'cancelled') => {
    const { error } = await supabase
      .from('orders')
      .update({ 
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    if (error) throw error;

    // Atualizar cache local
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ORDERS });
  }, [queryClient]);

  return {
    orders,
    isLoading,
    isConnected,
    updateOrderStatus,
    refreshOrders: () => queryClient.invalidateQueries({ queryKey: [...QUERY_KEYS.ORDERS, user?.id] })
  };
};