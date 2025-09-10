import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

interface AttendantStats {
  pendingOrders: number;
  preparingOrders: number;
  avgDeliveryTime: number;
  todayCustomers: number;
}

export function useAttendantStats() {
  const queryClient = useQueryClient();

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('stats_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["attendant-stats"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const { data: stats, isLoading } = useQuery({
    queryKey: ["attendant-stats"],
    queryFn: async (): Promise<AttendantStats> => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Buscar pedidos pendentes
      const { data: pendingOrders } = await supabase
        .from("orders")
        .select("id")
        .eq("status", "pending");

      // Buscar pedidos em preparo
      const { data: preparingOrders } = await supabase
        .from("orders")
        .select("id")
        .in("status", ["confirmed", "preparing"]);

      // Buscar clientes únicos hoje
      const { data: todayOrders } = await supabase
        .from("orders")
        .select("user_id")
        .gte("created_at", today.toISOString());

      const uniqueCustomers = new Set(todayOrders?.map(order => order.user_id) || []).size;

      // Calcular tempo médio de entrega (simulado por enquanto)
      const avgDeliveryTime = 35; // Será calculado com dados reais posteriormente

      return {
        pendingOrders: pendingOrders?.length || 0,
        preparingOrders: preparingOrders?.length || 0,
        avgDeliveryTime,
        todayCustomers: uniqueCustomers,
      };
    },
    refetchInterval: 10000, // Atualizar a cada 10 segundos
  });

  return {
    stats,
    loading: isLoading,
  };
}