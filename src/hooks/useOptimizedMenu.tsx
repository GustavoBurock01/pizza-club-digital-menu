// ===== HOOK DE MENU OTIMIZADO =====

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMenuStore } from '@/stores/simpleStore';
import { useEffect, useMemo } from 'react';
import { debounce } from '@/utils/performance';

// ===== FETCH FUNCTIONS =====
const fetchCategories = async () => {
  const { data, error } = await supabase
    .from('categories')
    .select(`
      *,
      subcategories (
        *,
        products (count)
      )
    `)
    .eq('is_active', true)
    .order('order_position');

  if (error) throw error;
  return data;
};

const fetchProducts = async (subcategoryId: string) => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('subcategory_id', subcategoryId)
    .eq('available', true)
    .order('name');

  if (error) throw error;
  return data;
};

// ===== MAIN HOOK =====
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
  } = useMenuStore();

  // ===== QUERIES =====
  const {
    data: categoriesData,
    isLoading: categoriesLoading,
    refetch: refetchCategories
  } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
    staleTime: 1000 * 60 * 30, // 30 minutes
    gcTime: 1000 * 60 * 60, // 1 hour
  });

  const {
    data: productsData,
    isLoading: productsLoading,
    refetch: refetchProducts
  } = useQuery({
    queryKey: ['products', selectedSubcategoryId || 'none'],
    queryFn: () => selectedSubcategoryId ? fetchProducts(selectedSubcategoryId) : Promise.resolve([]),
    enabled: !!selectedSubcategoryId,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  // ===== DEBOUNCED SEARCH =====
  const debouncedSetSearchTerm = useMemo(
    () => debounce((term: string) => setSearchTerm(term), 300),
    [setSearchTerm]
  );

  // ===== EFFECTS =====
  useEffect(() => {
    if (categoriesData) {
      setCategories(categoriesData);
    }
  }, [categoriesData, setCategories]);

  useEffect(() => {
    if (productsData) {
      setProducts(productsData);
    }
  }, [productsData, setProducts]);

  useEffect(() => {
    setLoading(categoriesLoading || productsLoading);
  }, [categoriesLoading, productsLoading, setLoading]);

  // ===== HANDLERS =====
  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setCurrentView('subcategories');
  };

  const handleSubcategorySelect = (subcategoryId: string) => {
    setSelectedSubcategory(subcategoryId);
    setCurrentView('products');
  };

  const handleBackToCategories = () => {
    setCurrentView('categories');
    setSelectedCategory(null);
    setSelectedSubcategory(null);
  };

  const handleBackToSubcategories = () => {
    setCurrentView('subcategories');
    setSelectedSubcategory(null);
  };

  // ===== COMPUTED VALUES =====
  const currentCategory = useMemo(() => {
    return categories.find(cat => cat.id === selectedCategoryId);
  }, [categories, selectedCategoryId]);

  const currentSubcategories = useMemo(() => {
    return currentCategory?.subcategories || [];
  }, [currentCategory]);

  const filteredProducts = useMemo(() => {
    if (!searchTerm) return products;
    return products.filter(product => 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

  return {
    // Data
    categories,
    subcategories: currentSubcategories,
    products: filteredProducts,
    
    // Current state
    currentView,
    selectedCategoryId,
    selectedSubcategoryId,
    currentCategory,
    searchTerm,
    isLoading,
    
    // Handlers
    handleCategorySelect,
    handleSubcategorySelect,
    handleBackToCategories,
    handleBackToSubcategories,
    setSearchTerm: debouncedSetSearchTerm,
    
    // Utils
    refreshData: () => {
      refetchCategories();
      if (selectedSubcategoryId) {
        refetchProducts();
      }
    }
  };
};