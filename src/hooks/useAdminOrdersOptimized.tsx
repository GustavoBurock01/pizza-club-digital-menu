// ===== HOOK ADMIN ORDERS OTIMIZADO - QUERIES CONSOLIDADAS E CACHE INTELIGENTE =====

import { useEffect, useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedAuth } from '@/hooks/useUnifiedAuth';
import { useToast } from '@/hooks/use-toast';
import { CACHE_STRATEGIES } from '@/config/queryClient';
import { memoryCache } from '@/utils/performance';

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

interface UseAdminOrdersOptions {
  status?: string;
  limit?: number;
  enableRealtime?: boolean;
}

// Query deduplication map
const activeQueries = new Map<string, Promise<AdminOrder[]>>();

export const useAdminOrdersOptimized = (options: UseAdminOrdersOptions = {}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);

  const { status, limit = 50, enableRealtime = true } = options;

  // OTIMIZAÇÃO 1: Query key baseada em parâmetros
  const queryKey = ['admin-orders-optimized', { status, limit }];
  const cacheKey = `admin-orders-${status || 'all'}-${limit}`;

  // OTIMIZAÇÃO 2: Query consolidada com cache inteligente
  const { data: orders = [], isLoading, refetch } = useQuery({
    queryKey,
    queryFn: async (): Promise<AdminOrder[]> => {
      // Check memory cache first
      const cached = memoryCache.get(cacheKey);
      if (cached) {
        console.log('⚡ Cache HIT: Admin orders from memory');
        return cached;
      }

      // Query deduplication
      const queryId = JSON.stringify({ status, limit });
      if (activeQueries.has(queryId)) {
        console.log('🔄 Deduplicating concurrent query');
        return activeQueries.get(queryId)!;
      }

      const queryPromise = fetchOrdersOptimized(status, limit);
      activeQueries.set(queryId, queryPromise);

      try {
        const result = await queryPromise;
        // Cache for 1 minute
        memoryCache.set(cacheKey, result, 60 * 1000);
        return result;
      } finally {
        activeQueries.delete(queryId);
      }
    },
    enabled: !!user?.id,
    ...CACHE_STRATEGIES.CRITICAL, // 30 segundos de cache
    refetchOnWindowFocus: false,
  });

  // OTIMIZAÇÃO 3: Real-time otimizado com invalidação granular
  useEffect(() => {
    if (!user?.id || !enableRealtime) return;

    const channel = supabase
      .channel('admin-orders-optimized')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          console.log('📦 New order received');
          
          toast({
            title: "🔔 Novo Pedido!",
            description: `Pedido #${payload.new.id.slice(0, 8)} recebido`,
            duration: 10000,
          });

          // OTIMIZAÇÃO: Invalidação granular apenas para queries relevantes
          const newOrder = payload.new as any;
          invalidateRelevantQueries(newOrder.status);
          
          // Clear memory cache
          memoryCache.clear();
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
          console.log('📦 Order updated');
          
          const updatedOrder = payload.new as any;
          const oldOrder = payload.old as any;
          
          // Invalidar apenas se status mudou
          if (updatedOrder.status !== oldOrder.status) {
            invalidateRelevantQueries(updatedOrder.status);
            invalidateRelevantQueries(oldOrder.status);
          }
          
          // Update cache optimistically
          updateOrderInCache(updatedOrder);
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
      setIsConnected(false);
    };
  }, [user?.id, enableRealtime, queryClient, toast]);

  // OTIMIZAÇÃO 4: Update otimista no cache
  const updateOrderStatus = useCallback(async (
    orderId: string, 
    newStatus: AdminOrder['status'], 
    notes?: string
  ) => {
    try {
      // Optimistic update
      queryClient.setQueryData(queryKey, (oldData: AdminOrder[] | undefined) => {
        if (!oldData) return oldData;
        return oldData.map(order => 
          order.id === orderId 
            ? { ...order, status: newStatus, notes, updated_at: new Date().toISOString() }
            : order
        );
      });

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

      // Clear relevant cache
      memoryCache.clear();

    } catch (error) {
      console.error('❌ Error updating order status:', error);
      
      // Revert optimistic update
      queryClient.invalidateQueries({ queryKey });
      
      toast({
        title: "Erro",
        description: "Erro ao atualizar status do pedido",
        variant: "destructive"
      });
    }
  }, [queryClient, toast, queryKey]);

  // Helper functions for status updates
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

  // Helper functions
  function invalidateRelevantQueries(orderStatus: string) {
    // Invalidar apenas queries relacionadas ao status
    queryClient.invalidateQueries({ 
      queryKey: ['admin-orders-optimized'],
      predicate: (query) => {
        const params = query.queryKey[1] as any;
        return !params?.status || params.status === orderStatus || params.status === 'pending';
      }
    });
  }

  function updateOrderInCache(updatedOrder: any) {
    // Update all relevant caches
    queryClient.setQueriesData(
      { queryKey: ['admin-orders-optimized'] },
      (oldData: AdminOrder[] | undefined) => {
        if (!oldData) return oldData;
        return oldData.map(order => 
          order.id === updatedOrder.id ? { ...order, ...updatedOrder } : order
        );
      }
    );
  }

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
    refreshOrders: () => {
      memoryCache.clear();
      refetch();
    }
  };
};

// OTIMIZAÇÃO 5: Query otimizada sem JOINs desnecessários
async function fetchOrdersOptimized(status?: string, limit: number = 50): Promise<AdminOrder[]> {
  console.log('🌐 Fetching optimized admin orders');
  
  let query = supabase
    .from('orders')
    .select(`
      id,
      user_id,
      status,
      total_amount,
      delivery_fee,
      payment_method,
      payment_status,
      created_at,
      updated_at,
      notes
    `)
    .order('created_at', { ascending: false });

  // Apply filters - EXCLUIR pedidos com payment_status pending para o painel principal
  if (status) {
    if (status === 'pending') {
      // Para aba "pending", mostrar apenas pedidos confirmados em preparo
      query = query.in('status', ['confirmed', 'preparing']);
    } else if (status === 'awaiting-payment') {
      // Nova aba para pedidos aguardando pagamento
      query = query.eq('payment_status', 'pending');
    } else {
      query = query.eq('status', status as 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivering' | 'delivered' | 'cancelled');
    }
  } else {
    // Por padrão, filtrar apenas pedidos com pagamento confirmado ou processado
    query = query.not('payment_status', 'eq', 'pending');
  }

  query = query.limit(limit);

  const { data: orders, error } = await query;
  
  if (error) throw error;

  // Fetch related data only when needed (lazy loading approach)
  if (orders && orders.length > 0) {
    const userIds = [...new Set(orders.map(order => order.user_id))];
    
    // Parallel fetch for related data
    const [profilesRes, addressesRes] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, full_name, email, phone')
        .in('id', userIds),
      supabase
        .from('addresses')
        .select('user_id, street, number, neighborhood, city, complement')
        .in('user_id', userIds)
    ]);

    // Map related data
    const profilesMap = new Map(profilesRes.data?.map(p => [p.id, p]) || []);
    const addressesMap = new Map(addressesRes.data?.map(a => [a.user_id, a]) || []);

    return orders.map(order => ({
      ...order,
      profiles: profilesMap.get(order.user_id),
      addresses: addressesMap.get(order.user_id),
      order_items: [] // Load on demand
    }));
  }

  return orders || [];
}