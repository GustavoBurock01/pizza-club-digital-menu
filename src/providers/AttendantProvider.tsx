// ===== PROVIDER UNIFICADO DE ATENDENTE OTIMIZADO =====

import { createContext, useContext, ReactNode, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useThermalPrint } from '@/hooks/useThermalPrint';

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
  delivery_method: string;
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

// ✅ FASE 2: Connection state tracking
interface ConnectionState {
  isConnected: boolean;
  reconnectAttempts: number;
  lastError?: string;
}

interface AttendantContextType {
  // Data
  stats: AttendantStats | undefined;
  orders: AttendantOrder[] | undefined;
  
  // Loading states
  loading: boolean;
  isUpdating: boolean;
  
  // ✅ FASE 2: Connection status
  connectionState: ConnectionState;
  
  // Actions
  updateOrderStatus: (orderId: string, status: string) => Promise<void>;
  refreshData: () => void;
  
  // Quick actions
  confirmOrder: (orderId: string) => Promise<void>;
  startPreparation: (orderId: string) => Promise<void>;
  markReady: (orderId: string, deliveryMethod: string) => Promise<void>;
  markDelivered: (orderId: string) => Promise<void>;
  cancelOrder: (orderId: string) => Promise<void>;
}

const AttendantContext = createContext<AttendantContextType | undefined>(undefined);

// ===== PROVIDER COMPONENT =====
export const AttendantProvider = ({ children }: { children: ReactNode }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  
  // ✅ FASE 2: Connection state management
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    isConnected: false,
    reconnectAttempts: 0,
  });
  
  const queryClient = useQueryClient();
  const { printOrder } = useThermalPrint();

  // ===== QUERY ÚNICA PARA DADOS COMBINADOS =====
  const { data: combinedData, isLoading: loading, refetch } = useQuery({
    queryKey: ['attendant-data'],
    queryFn: async () => {
      // ⚠️ CRÍTICO: Filtrar apenas últimas 24 horas
      const last24Hours = new Date();
      last24Hours.setHours(last24Hours.getHours() - 24);

      // ✅ FASE 2: Paginação com limit(100)
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          id,
          user_id,
          customer_name,
          customer_phone,
          delivery_method,
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
        .gte('created_at', last24Hours.toISOString())
        .neq('status', 'cancelled')
        .order('created_at', { ascending: false })
        .limit(100); // ✅ FASE 2: Limitar a 100 pedidos

      if (ordersError) throw ordersError;

      // Processar dados dos pedidos
      const orders: AttendantOrder[] = (ordersData || []).map(order => ({
        id: order.id,
        user_id: order.user_id,
        customer_name: order.customer_name,
        customer_phone: order.customer_phone,
        customer_email: order.profiles?.email,
        status: order.status,
        delivery_method: order.delivery_method || 'delivery',
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
            .filter(o => new Date(o.created_at) >= last24Hours)
            .map(o => o.user_id)
        ).size,
      };

      return { orders, stats };
    },
    staleTime: 10000, // 10 segundos (reduzido para atualizar mais rápido)
    refetchInterval: 30000, // 30 segundos (fallback se realtime falhar)
    refetchOnWindowFocus: true, // Refetch ao voltar para a aba
    retry: 2,
  });

  // ✅ FASE 2 + FASE 3: REAL-TIME COM AUTO-RECONNECT, CONNECTION STATE E PAYMENT STATUS
  useEffect(() => {
    console.log('🔴 [ATTENDANT] Configurando realtime subscription');
    
    let reconnectTimeout: NodeJS.Timeout;
    let channelRef: any = null;
    let paymentChannelRef: any = null;
    
    const setupChannel = () => {
      // Limpar canal anterior se existir
      if (channelRef) {
        console.log('🔴 [ATTENDANT] Limpando canal anterior');
        supabase.removeChannel(channelRef);
      }
      
      channelRef = supabase
        .channel('attendant-realtime', {
          config: {
            broadcast: { self: false },
            presence: { key: 'attendant' }
          }
        })
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'orders'
          },
          (payload) => {
            console.log('🔴 [ATTENDANT] Pedido atualizado via realtime:', payload.eventType, payload.new);
            
            // Invalidate e refetch imediatamente
            queryClient.invalidateQueries({ queryKey: ['attendant-data'] });
            queryClient.refetchQueries({ queryKey: ['attendant-data'] });
            
            // Toast para novo pedido
            if (payload.eventType === 'INSERT') {
              const newOrder = payload.new as any;
              toast.info(`🔔 Novo pedido #${newOrder.id.substring(0, 8)}`, {
                description: `Cliente: ${newOrder.customer_name || 'N/A'}`
              });
              
              // Tocar som de notificação
              const audio = new Audio('/bell.mp3');
              audio.play().catch(() => console.log('Não foi possível tocar o som de notificação'));
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'order_items'
          },
          (payload) => {
            console.log('🔴 [ATTENDANT] Item do pedido atualizado via realtime:', payload.eventType);
            queryClient.invalidateQueries({ queryKey: ['attendant-data'] });
          }
        )
        .subscribe((status) => {
          console.log('🔴 [ATTENDANT] Realtime status:', status);
          
          if (status === 'SUBSCRIBED') {
            console.log('✅ [ATTENDANT] Realtime CONECTADO com sucesso!');
            setConnectionState({
              isConnected: true,
              reconnectAttempts: 0,
            });
            toast.success('Conexão estabelecida!', {
              description: 'Recebendo atualizações em tempo real',
              duration: 2000,
            });
          } else if (status === 'CHANNEL_ERROR') {
            console.error('❌ [ATTENDANT] Erro no canal realtime');
            handleConnectionError('Erro no canal realtime');
          } else if (status === 'TIMED_OUT') {
            console.error('⏰ [ATTENDANT] Timeout na conexão realtime');
            handleConnectionError('Timeout na conexão');
          } else if (status === 'CLOSED') {
            console.warn('⚠️ [ATTENDANT] Conexão realtime fechada');
            setConnectionState(prev => ({
              ...prev,
              isConnected: false,
            }));
          }
        });
    };
    
    // ✅ FASE 2: Auto-reconnect com backoff exponencial
    const handleConnectionError = (error: string) => {
      setConnectionState(prev => {
        const newAttempts = prev.reconnectAttempts + 1;
        
        // Máximo de 5 tentativas
        if (newAttempts > 5) {
          toast.error('Falha na reconexão', {
            description: 'Recarregue a página para tentar novamente',
          });
          return {
            isConnected: false,
            reconnectAttempts: newAttempts,
            lastError: error,
          };
        }
        
        // Calcular delay com backoff exponencial (1s, 2s, 4s, 8s, 16s)
        const delay = Math.min(1000 * Math.pow(2, newAttempts - 1), 16000);
        
        toast.warning(`Reconectando em ${delay / 1000}s...`, {
          description: `Tentativa ${newAttempts} de 5`,
          duration: delay,
        });
        
        // Tentar reconectar após o delay
        reconnectTimeout = setTimeout(() => {
          console.log(`🔄 [ATTENDANT] Tentando reconectar (tentativa ${newAttempts})`);
          setupChannel();
        }, delay);
        
        return {
          isConnected: false,
          reconnectAttempts: newAttempts,
          lastError: error,
        };
      });
    };
    
    // Configurar canal inicial
    setupChannel();
    
    // ✅ FASE 3: Canal separado para updates de payment_status
    paymentChannelRef = supabase
      .channel('payment-status-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: 'payment_status=eq.paid'
        },
        (payload) => {
          console.log('💰 [ATTENDANT] Pagamento confirmado:', payload.new);
          
          const order = payload.new as any;
          
          // Invalidar queries
          queryClient.invalidateQueries({ queryKey: ['attendant-data'] });
          
          // Notificação especial para pagamento confirmado
          toast.success('💰 Pagamento Confirmado!', {
            description: `Pedido #${order.id.substring(0, 8)} - ${order.customer_name}`,
            duration: 5000,
          });
          
          // Som especial de pagamento confirmado
          const audio = new Audio('/sounds/success.mp3');
          audio.volume = 0.7;
          audio.play().catch(() => console.log('Não foi possível tocar som de pagamento'));
        }
      )
      .subscribe((status) => {
        console.log('💰 [ATTENDANT] Payment channel status:', status);
      });

    // ✅ FASE 2: Cleanup robusto
    return () => {
      console.log('🔴 [ATTENDANT] Removendo canais realtime');
      clearTimeout(reconnectTimeout);
      if (channelRef) {
        supabase.removeChannel(channelRef);
      }
      if (paymentChannelRef) {
        supabase.removeChannel(paymentChannelRef);
      }
    };
  }, [queryClient]);

  // ===== ACTIONS OTIMIZADAS COM OPTIMISTIC UPDATES =====
  const updateOrderStatus = useCallback(async (orderId: string, status: string) => {
    setIsUpdating(true);
    
    try {
      // ✅ ERRO 4 FIX: OPTIMISTIC UPDATE - atualizar cache antes da resposta
      queryClient.setQueryData(['attendant-data'], (old: any) => {
        if (!old) return old;
        
        return {
          ...old,
          orders: old.orders.map((order: AttendantOrder) =>
            order.id === orderId
              ? { ...order, status, updated_at: new Date().toISOString() }
              : order
          ),
          stats: {
            ...old.stats,
            pendingOrders: old.orders.filter((o: AttendantOrder) => 
              o.id === orderId ? status === 'pending' : o.status === 'pending'
            ).length,
            preparingOrders: old.orders.filter((o: AttendantOrder) =>
              o.id === orderId 
                ? ['confirmed', 'preparing'].includes(status)
                : ['confirmed', 'preparing'].includes(o.status)
            ).length,
          }
        };
      });

      // Fazer atualização no servidor
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: status as any,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) throw error;

      // Invalidar para refetch em background
      queryClient.invalidateQueries({ queryKey: ['attendant-data'] });
      
      toast.success("Status do pedido atualizado!");
    } catch (error: any) {
      console.error('Error updating order status:', error);
      
      // ✅ ROLLBACK em caso de erro
      queryClient.invalidateQueries({ queryKey: ['attendant-data'] });
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
      
      // Tentar imprimir após confirmar (não bloqueia se falhar)
      printOrder(orderId).catch((error) => {
        console.error('Erro ao imprimir pedido:', error);
        toast.error('Pedido confirmado, mas falha na impressão', {
          description: 'Você pode reimprimir manualmente',
        });
      });
    } catch (error) {
      toast.error("Erro ao confirmar pedido");
    }
  }, [updateOrderStatus, printOrder]);

  const startPreparation = useCallback(async (orderId: string) => {
    try {
      await updateOrderStatus(orderId, 'preparing');
      toast.success("Preparo iniciado!");
    } catch (error) {
      toast.error("Erro ao iniciar preparo");
    }
  }, [updateOrderStatus]);

  const markReady = useCallback(async (orderId: string, deliveryMethod: string) => {
    try {
      // Se for retirada, marca como ready. Se for delivery, marca como in_delivery
      const newStatus = deliveryMethod === 'pickup' ? 'ready' : 'in_delivery';
      await updateOrderStatus(orderId, newStatus);
      toast.success(deliveryMethod === 'pickup' ? "Pronto para retirada!" : "Saiu para entrega!");
    } catch (error) {
      toast.error("Erro ao atualizar status");
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
    connectionState, // ✅ FASE 2: Expor connection state
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