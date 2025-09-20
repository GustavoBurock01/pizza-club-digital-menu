// ===== PROVIDER UNIFICADO DE ATENDENTE OTIMIZADO =====

import { createContext, useContext, ReactNode, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// ===== TIPOS CONSOLIDADOS =====
interface AttendantStats {
  pendingOrders: number;
  preparingOrders: number;
  avgDeliveryTime: number;
  todayCustomers: number;
}

interface AttendantOrder {
  id: string;
  user_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  status: string;
  total_amount: number;
  delivery_fee: number;
  payment_method: string;
  payment_status: string;
  created_at: string;
  updated_at: string;
  items_count: number;
  total_items: number;
  street?: string;
  number?: string;
  neighborhood?: string;
  city?: string;
  notes?: string;
}

interface AttendantContextType {
  // Data
  stats: AttendantStats | undefined;
  orders: AttendantOrder[] | undefined;
  
  // Loading states
  loading: boolean;
  isUpdating: boolean;
  
  // Actions
  updateOrderStatus: (orderId: string, status: string) => Promise<void>;
  refreshData: () => void;
  
  // Quick actions
  confirmOrder: (orderId: string) => Promise<void>;
  startPreparation: (orderId: string) => Promise<void>;
  markReady: (orderId: string) => Promise<void>;
  markDelivered: (orderId: string) => Promise<void>;
  cancelOrder: (orderId: string) => Promise<void>;
}

const AttendantContext = createContext<AttendantContextType | undefined>(undefined);

// ===== PROVIDER COMPONENT =====
export const AttendantProvider = ({ children }: { children: ReactNode }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const queryClient = useQueryClient();

  // ===== QUERY ÚNICA PARA DADOS COMBINADOS =====
  const { data: combinedData, isLoading: loading, refetch } = useQuery({
    queryKey: ['attendant-data'],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Single optimized query para todos os dados necessários
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          id,
          user_id,
          customer_name,
          customer_phone,
          status,
          total_amount,
          delivery_fee,
          payment_method,
          payment_status,
          created_at,
          updated_at,
          notes,
          addresses!orders_address_id_fkey (
            street,
            number,
            neighborhood,
            city
          ),
          profiles!orders_user_id_fkey (
            email
          ),
          order_items!order_items_order_id_fkey (
            id,
            quantity
          )
        `)
        .in('status', ['pending', 'confirmed', 'preparing', 'ready', 'delivering'])
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // Processar dados dos pedidos
      const orders: AttendantOrder[] = (ordersData || []).map(order => ({
        id: order.id,
        user_id: order.user_id,
        customer_name: order.customer_name,
        customer_phone: order.customer_phone,
        customer_email: order.profiles?.email,
        status: order.status,
        total_amount: order.total_amount,
        delivery_fee: order.delivery_fee,
        payment_method: order.payment_method,
        payment_status: order.payment_status,
        created_at: order.created_at,
        updated_at: order.updated_at,
        items_count: order.order_items?.length || 0,
        total_items: order.order_items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0,
        street: order.addresses?.street,
        number: order.addresses?.number,
        neighborhood: order.addresses?.neighborhood,
        city: order.addresses?.city,
        notes: order.notes
      }));

      // Calcular estatísticas a partir dos dados já carregados
      const stats: AttendantStats = {
        pendingOrders: orders.filter(o => o.status === 'pending').length,
        preparingOrders: orders.filter(o => ['confirmed', 'preparing'].includes(o.status)).length,
        avgDeliveryTime: 35, // Será calculado com dados reais posteriormente
        todayCustomers: new Set(
          orders
            .filter(o => new Date(o.created_at) >= today)
            .map(o => o.user_id)
        ).size,
      };

      return { orders, stats };
    },
    staleTime: 30000, // 30 segundos
    refetchInterval: 60000, // 1 minuto (reduzido de múltiplos polls)
    retry: 2,
  });

  // ===== REAL-TIME SUBSCRIPTION UNIFICADO =====
  useEffect(() => {
    const channel = supabase
      .channel('attendant-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders'
        },
        () => {
          // Invalidate única query em vez de múltiplas
          queryClient.invalidateQueries({ queryKey: ['attendant-data'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'order_items'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['attendant-data'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // ===== ACTIONS OTIMIZADAS =====
  const updateOrderStatus = useCallback(async (orderId: string, status: string) => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: status as any,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) throw error;

      // Invalidate e refetch
      queryClient.invalidateQueries({ queryKey: ['attendant-data'] });
      
      toast.success("Status do pedido atualizado!");
    } catch (error: any) {
      console.error('Error updating order status:', error);
      toast.error("Erro ao atualizar status do pedido");
      throw error;
    } finally {
      setIsUpdating(false);
    }
  }, [queryClient]);

  const refreshData = useCallback(() => {
    refetch();
    toast.success("Dados atualizados!");
  }, [refetch]);

  // Quick actions otimizadas
  const confirmOrder = useCallback(async (orderId: string) => {
    try {
      await updateOrderStatus(orderId, 'confirmed');
      toast.success("Pedido confirmado!");
    } catch (error) {
      toast.error("Erro ao confirmar pedido");
    }
  }, [updateOrderStatus]);

  const startPreparation = useCallback(async (orderId: string) => {
    try {
      await updateOrderStatus(orderId, 'preparing');
      toast.success("Preparo iniciado!");
    } catch (error) {
      toast.error("Erro ao iniciar preparo");
    }
  }, [updateOrderStatus]);

  const markReady = useCallback(async (orderId: string) => {
    try {
      await updateOrderStatus(orderId, 'ready');
      toast.success("Pedido pronto!");
    } catch (error) {
      toast.error("Erro ao marcar como pronto");
    }
  }, [updateOrderStatus]);

  const markDelivered = useCallback(async (orderId: string) => {
    try {
      await updateOrderStatus(orderId, 'delivered');
      toast.success("Pedido entregue!");
    } catch (error) {
      toast.error("Erro ao marcar como entregue");
    }
  }, [updateOrderStatus]);

  const cancelOrder = useCallback(async (orderId: string) => {
    try {
      await updateOrderStatus(orderId, 'cancelled');
      toast.success("Pedido cancelado!");
    } catch (error) {
      toast.error("Erro ao cancelar pedido");
    }
  }, [updateOrderStatus]);

  const value: AttendantContextType = {
    stats: combinedData?.stats,
    orders: combinedData?.orders,
    loading,
    isUpdating,
    updateOrderStatus,
    refreshData,
    confirmOrder,
    startPreparation,
    markReady,
    markDelivered,
    cancelOrder,
  };

  return (
    <AttendantContext.Provider value={value}>
      {children}
    </AttendantContext.Provider>
  );
};

// ===== HOOK UNIFICADO =====
export const useAttendant = () => {
  const context = useContext(AttendantContext);
  if (context === undefined) {
    throw new Error('useAttendant must be used within an AttendantProvider');
  }
  return context;
};