// ✅ FASE 2: HOOK REFATORADO COM REACT QUERY

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface OrderItem {
  id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  customizations: any;
  products: {
    name: string;
    image_url: string;
  } | null;
}

export const useOrderItems = (orderId: string | undefined, isOpen: boolean) => {
  const { toast } = useToast();

  // ✅ FASE 2: Usar React Query com retry automático
  const { data: items = [], isLoading: loading, error } = useQuery<OrderItem[]>({
    queryKey: ['order-items', orderId],
    queryFn: async ({ signal }) => {
      if (!orderId) {
        return [];
      }

      console.log(`[ORDER-ITEMS] Fetching items for order ${orderId}`);
      
      // ✅ FASE 2: AbortController integrado com React Query
      const { data, error } = await supabase
        .from('order_items')
        .select(`
          id,
          product_id,
          quantity,
          unit_price,
          total_price,
          customizations,
          products (
            name,
            image_url
          )
        `)
        .eq('order_id', orderId)
        .order('created_at', { ascending: true })
        .abortSignal(signal as any);

      if (error) {
        console.error('[ORDER-ITEMS] Error:', error);
        throw error;
      }

      console.log(`[ORDER-ITEMS] Found ${data?.length || 0} items`);
      return (data || []) as OrderItem[];
    },
    enabled: !!orderId && isOpen, // ✅ FASE 2: Só fetch quando necessário
    staleTime: 30000, // 30 segundos
    retry: 3, // ✅ FASE 2: React Query faz retry automático
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000), // ✅ FASE 2: Backoff exponencial
  });

  // ✅ FASE 2: Mostrar toast apenas quando houver erro final
  useEffect(() => {
    if (error) {
      console.error('[ORDER-ITEMS] Final error after retries:', error);
      toast({
        title: "Erro ao carregar itens",
        description: "Tente recarregar a página.",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  return { items, loading };
};
