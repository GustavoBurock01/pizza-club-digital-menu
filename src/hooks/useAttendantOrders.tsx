import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useAttendantOrders() {
  const queryClient = useQueryClient();

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
    refetchInterval: 10000, // Atualizar a cada 10 segundos
  });

  const updateOrderMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
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