import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { attendantOptimizer } from "@/utils/attendantOptimizer";

export function useAttendantOrders() {
  const queryClient = useQueryClient();

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('orders_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders'
        },
        () => {
          // Invalidate queries when orders change
          queryClient.invalidateQueries({ queryKey: ["attendant-orders"] });
          queryClient.invalidateQueries({ queryKey: ["attendant-stats"] });
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
          // Invalidate queries when order items change
          queryClient.invalidateQueries({ queryKey: ["attendant-orders"] });
          queryClient.invalidateQueries({ queryKey: ["attendant-stats"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const { data: orders, isLoading } = useQuery({
    queryKey: ["attendant-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc("get_order_details_for_staff");

      if (error) {
        console.error("Erro ao buscar pedidos:", error);
        throw error;
      }

      return data || [];
    },
    staleTime: 30000, // Cache por 30 segundos
    refetchInterval: 15000, // Refetch a cada 15 segundos (otimizado)
  });

  const updateOrderMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      // Performance check antes da mutação
      attendantOptimizer.checkPerformance();
      
      const { error } = await supabase
        .from("orders")
        .update({ 
          status: status as any,
          updated_at: new Date().toISOString()
        })
        .eq("id", orderId);

      if (error) throw error;
    },
    onSuccess: () => {
      // Limpar cache específico para forçar refresh
      attendantOptimizer.clearCache('orders');
      
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ["attendant-orders"] });
      queryClient.invalidateQueries({ queryKey: ["attendant-stats"] });
    },
  });

  const updateOrderStatus = async (orderId: string, status: string) => {
    return updateOrderMutation.mutateAsync({ orderId, status });
  };

  return {
    orders,
    loading: isLoading,
    updateOrderStatus,
    isUpdating: updateOrderMutation.isPending,
  };
}