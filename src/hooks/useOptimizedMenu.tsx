// ===== HOOK DE MENU OTIMIZADO =====

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedStore } from '@/stores/simpleStore';
import { optimizedCache } from '@/utils/optimizedCache';
import { CACHE_STRATEGIES } from '@/config/queryClient';

const fetchMenuData = async () => {
  // Buscar categorias com suas subcategorias
  const { data: categories, error: categoriesError } = await supabase
    .from('categories')
    .select(`
      id, name, description, order_position,
      subcategories(
        id, name, description, order_position
      )
    `)
    .order('order_position');

  if (categoriesError) {
    console.error('Categories Error:', categoriesError);
    throw categoriesError;
  }

  // Buscar produtos separadamente 
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('*')
    .eq('is_available', true)
    .order('name');

  if (productsError) {
    console.error('Products Error:', productsError);
    throw productsError;
  }

  console.log('Fetched data:', { categories, products });
  return { categories: categories || [], products: products || [] };
};

export const useOptimizedMenu = () => {
  const {
    categories,
    products,
    selectedCategoryId,
    selectedSubcategoryId,
    currentView,
    searchTerm,
    isLoading,
    setCategories,
    setProducts,
    setSelectedCategory,
    setSelectedSubcategory,
    setCurrentView,
    setSearchTerm,
    setLoading
  } = useUnifiedStore();

  // Single query para dados do menu
  const { data, isLoading: queryLoading, error } = useQuery({
    queryKey: ['menu-data'],
    queryFn: fetchMenuData,
    ...CACHE_STRATEGIES.STATIC,
  });

  console.log('Menu query result:', { data, queryLoading, error });

  // Atualizar store quando dados chegarem
  if (data && !queryLoading) {
    if (categories.length === 0) setCategories(data.categories);
    if (products.length === 0) setProducts(data.products);
  }

  // Produtos filtrados otimizados
  const getFilteredProducts = () => {
    if (!products.length) return [];
    
    let filtered = products;
    
    if (selectedSubcategoryId) {
      filtered = filtered.filter(p => p.subcategory_id === selectedSubcategoryId);
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(term) ||
        p.description?.toLowerCase().includes(term)
      );
    }
    
    return filtered;
  };

  // Navegação simplificada
  const handleCategorySelect = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    if (!category?.subcategories?.length) return;
    
    setSelectedCategory(categoryId);
    setCurrentView('subcategories');
  };

  const handleSubcategorySelect = (subcategoryId: string) => {
    setSelectedSubcategory(subcategoryId);
    setCurrentView('products');
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setSelectedSubcategory(null);
    setCurrentView('categories');
  };

  const handleBackToSubcategories = () => {
    setSelectedSubcategory(null);
    setCurrentView('subcategories');
  };

  return {
    // Data
    categories,
    products: getFilteredProducts(),
    allProducts: products,
    
    // State
    selectedCategoryId,
    selectedSubcategoryId,
    currentView,
    searchTerm,
    isLoading: queryLoading || isLoading,
    error,
    
    // Actions
    handleCategorySelect,
    handleSubcategorySelect,
    handleBackToCategories,
    handleBackToSubcategories,
    setSearchTerm,
    
    // Utils
    getCurrentCategory: () => categories.find(c => c.id === selectedCategoryId),
    getCurrentSubcategory: () => {
      const category = categories.find(c => c.id === selectedCategoryId);
      return category?.subcategories?.find(s => s.id === selectedSubcategoryId);
    }
  };
};