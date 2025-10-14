// ===== HOOK PARA FETCH DE ITENS COM RETRY =====

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useOrderItems = (orderId: string | undefined, isOpen: boolean) => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    let retries = 0;
    const maxRetries = 3;

    const fetchWithRetry = async () => {
      if (!orderId || !isOpen) {
        setItems([]);
        setLoading(false);
        return;
      }

      setLoading(true);

      while (retries < maxRetries) {
        try {
          console.log(`[ORDER-ITEMS] Fetching items for order ${orderId} (attempt ${retries + 1})`);
          
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
            .order('created_at', { ascending: true });

          if (error) throw error;

          console.log(`[ORDER-ITEMS] Found ${data?.length || 0} items`);
          setItems(data || []);
          setLoading(false);
          return;
        } catch (error) {
          retries++;
          console.error(`[ORDER-ITEMS] Retry ${retries}/${maxRetries}:`, error);
          
          if (retries >= maxRetries) {
            toast({
              title: "Erro ao carregar itens",
              description: "Tente recarregar a página.",
              variant: "destructive",
            });
            setItems([]);
            setLoading(false);
          } else {
            // Aguardar antes de tentar novamente (backoff exponencial)
            await new Promise(resolve => setTimeout(resolve, 1000 * retries));
          }
        }
      }
    };

    fetchWithRetry();
  }, [orderId, isOpen, toast]);

  return { items, loading };
};
