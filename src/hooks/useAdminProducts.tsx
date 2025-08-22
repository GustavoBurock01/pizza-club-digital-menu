import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AdminProduct {
  id: string;
  name: string;
  description?: string;
  price: number;
  is_available: boolean;
  category_id?: string;
  subcategory_id?: string;
  image_url?: string;
  order_position: number;
  created_at: string;
  updated_at: string;
  ingredients?: string[];
  categories?: {
    name: string;
  };
  subcategories?: {
    name: string;
  };
  // Estatísticas do produto
  totalSold: number;
  totalRevenue: number;
  averageRating?: number;
  lastOrderDate?: string;
}

export interface ProductStats {
  totalProducts: number;
  availableProducts: number;
  outOfStockProducts: number;
  topSellingProducts: Array<AdminProduct>;
  lowStockProducts: Array<AdminProduct>;
  recentlyAdded: Array<AdminProduct>;
  totalRevenue: number;
  averagePrice: number;
}

export const useAdminProducts = (filters?: { 
  category?: string; 
  subcategory?: string; 
  available?: boolean; 
  limit?: number;
  search?: string;
}) => {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [stats, setStats] = useState<ProductStats>({
    totalProducts: 0,
    availableProducts: 0,
    outOfStockProducts: 0,
    topSellingProducts: [],
    lowStockProducts: [],
    recentlyAdded: [],
    totalRevenue: 0,
    averagePrice: 0
  });
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [subcategories, setSubcategories] = useState<Array<{ id: string; name: string; category_id: string }>>([]);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const loadProducts = async () => {
    try {
      setLoading(true);

      // Query base para produtos
      let productsQuery = supabase
        .from('products')
        .select(`
          *,
          categories (name),
          subcategories (name)
        `)
        .order('order_position', { ascending: true });

      // Aplicar filtros
      if (filters?.category) {
        productsQuery = productsQuery.eq('category_id', filters.category);
      }
      
      if (filters?.subcategory) {
        productsQuery = productsQuery.eq('subcategory_id', filters.subcategory);
      }
      
      if (filters?.available !== undefined) {
        productsQuery = productsQuery.eq('is_available', filters.available);
      }

      if (filters?.search) {
        productsQuery = productsQuery.or(
          `name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
        );
      }

      if (filters?.limit) {
        productsQuery = productsQuery.limit(filters.limit);
      }

      const { data: productsData, error: productsError } = await productsQuery;
      
      if (productsError) throw productsError;

      // Buscar estatísticas de vendas por produto
      const { data: salesData, error: salesError } = await supabase
        .from('order_items')
        .select(`
          product_id,
          quantity,
          total_price,
          orders!inner (created_at, status)
        `)
        .eq('orders.status', 'delivered');

      if (salesError) throw salesError;

      // Buscar categorias e subcategorias
      const [categoriesRes, subcategoriesRes] = await Promise.all([
        supabase.from('categories').select('id, name').eq('is_active', true),
        supabase.from('subcategories').select('id, name, category_id').eq('is_active', true)
      ]);

      if (categoriesRes.data) setCategories(categoriesRes.data);
      if (subcategoriesRes.data) setSubcategories(subcategoriesRes.data);

      // Processar produtos com estatísticas
      const processedProducts: AdminProduct[] = (productsData || []).map(product => {
        const productSales = salesData?.filter(sale => sale.product_id === product.id) || [];
        const totalSold = productSales.reduce((sum, sale) => sum + sale.quantity, 0);
        const totalRevenue = productSales.reduce((sum, sale) => sum + Number(sale.total_price), 0);
        const lastSale = productSales.sort((a, b) => 
          new Date(b.orders.created_at).getTime() - new Date(a.orders.created_at).getTime()
        )[0];

        return {
          ...product,
          totalSold,
          totalRevenue,
          lastOrderDate: lastSale?.orders.created_at
        };
      });

      setProducts(processedProducts);

      // Calcular estatísticas gerais
      await loadProductStats(processedProducts);
      
      setError(null);
    } catch (err) {
      console.error('Erro ao carregar produtos:', err);
      setError('Erro ao carregar dados dos produtos');
    } finally {
      setLoading(false);
    }
  };

  const loadProductStats = async (products: AdminProduct[]) => {
    try {
      const availableProducts = products.filter(p => p.is_available).length;
      const outOfStockProducts = products.filter(p => !p.is_available).length;
      
      const topSellingProducts = products
        .sort((a, b) => b.totalSold - a.totalSold)
        .slice(0, 5);

      const recentlyAdded = products
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5);

      const totalRevenue = products.reduce((sum, product) => sum + product.totalRevenue, 0);
      const averagePrice = products.length > 0 ? 
        products.reduce((sum, product) => sum + product.price, 0) / products.length : 0;

      setStats({
        totalProducts: products.length,
        availableProducts,
        outOfStockProducts,
        topSellingProducts,
        lowStockProducts: [], // TODO: Implementar quando tivermos controle de estoque
        recentlyAdded,
        totalRevenue,
        averagePrice
      });
    } catch (err) {
      console.error('Erro ao calcular estatísticas dos produtos:', err);
    }
  };

  // Atualizar produto
  const updateProduct = async (productId: string, updates: Partial<AdminProduct>) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', productId);

      if (error) throw error;

      toast({
        title: "Produto atualizado",
        description: "Produto atualizado com sucesso",
      });

      // Recarregar produtos
      await loadProducts();
    } catch (error) {
      console.error('Erro ao atualizar produto:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar produto",
        variant: "destructive"
      });
    }
  };

  // Toggle disponibilidade
  const toggleAvailability = async (productId: string, isAvailable: boolean) => {
    await updateProduct(productId, { is_available: isAvailable });
  };

  useEffect(() => {
    loadProducts();
  }, [filters?.category, filters?.subcategory, filters?.available, filters?.limit, filters?.search]);

  return {
    products,
    stats,
    categories,
    subcategories,
    loading,
    error,
    updateProduct,
    toggleAvailability,
    refreshProducts: loadProducts
  };
};