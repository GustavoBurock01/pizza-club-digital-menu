import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback, useMemo } from 'react';
import { supabase } from '@/services/supabase';
import { QUERY_KEYS } from '@/services/supabase';
import { useToast } from '@/hooks/use-toast';
import { Product, Category, Subcategory, CurrentView } from '@/types';

// ===== HOOK OTIMIZADO PARA MENU COM REACT QUERY =====

export const useMenuOptimized = () => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string>("");
  const [currentView, setCurrentView] = useState<CurrentView>('categories');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query para categorias (cache agressivo para dados estáticos)
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: QUERY_KEYS.CATEGORIES,
    queryFn: async () => {
      // Cache no localStorage para dados críticos
      const cacheKey = 'categories_cache';
      const cached = localStorage.getItem(cacheKey);
      const cacheTime = localStorage.getItem(`${cacheKey}_time`);
      
      // Usar cache se menos de 1 hora
      if (cached && cacheTime && Date.now() - parseInt(cacheTime) < 60 * 60 * 1000) {
        return JSON.parse(cached);
      }

      const [categoriesRes, subcategoriesRes, productCountsRes] = await Promise.all([
        supabase
          .from('categories')
          .select('*')
          .eq('is_active', true)
          .order('order_position'),
        supabase
          .from('subcategories')
          .select('*')
          .eq('is_active', true)
          .order('order_position'),
        supabase
          .from('products')
          .select('subcategory_id')
          .eq('is_available', true)
      ]);

      if (categoriesRes.error) throw categoriesRes.error;
      if (subcategoriesRes.error) throw subcategoriesRes.error;
      if (productCountsRes.error) throw productCountsRes.error;

      const subcategoryProductCounts = productCountsRes.data.reduce((acc: Record<string, number>, product) => {
        if (product.subcategory_id) {
          acc[product.subcategory_id] = (acc[product.subcategory_id] || 0) + 1;
        }
        return acc;
      }, {});

      const result = categoriesRes.data.map(category => ({
        ...category,
        subcategories: subcategoriesRes.data
          .filter(sub => sub.category_id === category.id)
          .map(sub => ({
            ...sub,
            product_count: subcategoryProductCounts[sub.id] || 0
          }))
      }));

      // Armazenar no localStorage
      localStorage.setItem(cacheKey, JSON.stringify(result));
      localStorage.setItem(`${cacheKey}_time`, Date.now().toString());

      return result;
    },
    staleTime: 30 * 60 * 1000, // 30 minutos
    gcTime: 60 * 60 * 1000, // 1 hora
    refetchOnWindowFocus: false,
  });

  // Query para produtos de uma subcategoria específica - cache otimizado
  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: [...QUERY_KEYS.PRODUCTS, selectedSubcategoryId],
    queryFn: async () => {
      if (!selectedSubcategoryId) return [];
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('subcategory_id', selectedSubcategoryId)
        .eq('is_available', true)
        .order('order_position');

      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedSubcategoryId && currentView === 'products',
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    refetchOnWindowFocus: false,
  });

  // Handlers otimizados com useCallback
  const handleSubcategorySelect = useCallback((categoryId: string, subcategoryId: string) => {
    setSelectedCategoryId(categoryId);
    
    if (subcategoryId) {
      setSelectedSubcategoryId(subcategoryId);
      setCurrentView('products');
    } else {
      setCurrentView('subcategories');
    }
  }, []);

  const handleBackToCategories = useCallback(() => {
    setSelectedCategoryId("");
    setSelectedSubcategoryId("");
    setCurrentView('categories');
  }, []);

  const handleBackToSubcategories = useCallback(() => {
    setSelectedSubcategoryId("");
    setCurrentView('subcategories');
  }, []);

  // Funções computadas com useMemo para otimização
  const getCurrentCategoryName = useMemo(() => {
    return () => {
      const category = categories.find(cat => cat.id === selectedCategoryId);
      return category?.name || "";
    };
  }, [categories, selectedCategoryId]);

  const getCurrentSubcategoryName = useMemo(() => {
    return () => {
      const category = categories.find(cat => cat.id === selectedCategoryId);
      const subcategory = category?.subcategories.find(sub => sub.id === selectedSubcategoryId);
      return subcategory?.name || "";
    };
  }, [categories, selectedCategoryId, selectedSubcategoryId]);

  // Função para invalidar cache quando necessário
  const refreshData = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CATEGORIES });
    if (selectedSubcategoryId) {
      queryClient.invalidateQueries({ queryKey: [...QUERY_KEYS.PRODUCTS, selectedSubcategoryId] });
    }
  }, [queryClient, selectedSubcategoryId]);

  return {
    categories,
    products,
    loading: categoriesLoading || productsLoading,
    currentView,
    selectedCategoryId,
    selectedSubcategoryId,
    handleSubcategorySelect,
    handleBackToCategories,
    handleBackToSubcategories,
    getCurrentCategoryName,
    getCurrentSubcategoryName,
    refreshData,
  };
};