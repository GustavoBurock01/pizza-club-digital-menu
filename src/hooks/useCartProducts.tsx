import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/services/supabase';
import { CartItem } from '@/types';

interface ProductInfo {
  id: string;
  name: string;
  category_name: string;
  subcategory_name: string;
}

export const useCartProducts = (items: CartItem[]) => {
  const productIds = items.map(item => item.productId);

  const { data: productsInfo = [] } = useQuery({
    queryKey: ['cart-products', productIds.join(',')],
    queryFn: async () => {
      if (productIds.length === 0) return [];

      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          categories:category_id (name),
          subcategories:subcategory_id (name)
        `)
        .in('id', productIds);

      if (error) throw error;

      return (data || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        category_name: p.categories?.name || 'Produto',
        subcategory_name: p.subcategories?.name || ''
      })) as ProductInfo[];
    },
    enabled: productIds.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const getProductInfo = (productId: string): ProductInfo | undefined => {
    return productsInfo.find(p => p.id === productId);
  };

  return {
    productsInfo,
    getProductInfo
  };
};
