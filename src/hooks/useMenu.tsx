
import { useState, useEffect } from "react";
import { supabase } from "@/services/supabase";
import { useToast } from "@/hooks/use-toast";
import { Product, Category, Subcategory, CurrentView } from '@/types';

export const useMenu = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string>("");
  const [currentView, setCurrentView] = useState<CurrentView>('categories');
  const { toast } = useToast();

  const fetchCategoriesAndSubcategories = async () => {
    try {
      // Buscar categorias
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('order_position');

      if (categoriesError) throw categoriesError;

      // Buscar subcategorias
      const { data: subcategoriesData, error: subcategoriesError } = await supabase
        .from('subcategories')
        .select('*')
        .eq('is_active', true)
        .order('order_position');

      if (subcategoriesError) throw subcategoriesError;

      // Contar produtos por subcategoria
      const { data: productCounts, error: countError } = await supabase
        .from('products')
        .select('subcategory_id')
        .eq('is_available', true);

      if (countError) throw countError;

      const subcategoryProductCounts = productCounts.reduce((acc: Record<string, number>, product) => {
        if (product.subcategory_id) {
          acc[product.subcategory_id] = (acc[product.subcategory_id] || 0) + 1;
        }
        return acc;
      }, {});

      // Organizar dados hierarquicamente
      const categoriesWithSubcategories = categoriesData.map(category => ({
        ...category,
        subcategories: subcategoriesData
          .filter(sub => sub.category_id === category.id)
          .map(sub => ({
            ...sub,
            product_count: subcategoryProductCounts[sub.id] || 0
          }))
      }));

      setCategories(categoriesWithSubcategories);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar cardápio",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProductsBySubcategory = async (subcategoryId: string) => {
    try {
      setLoading(true);
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('subcategory_id', subcategoryId)
        .eq('is_available', true)
        .order('order_position');

      if (productsError) throw productsError;

      setProducts(productsData || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar produtos",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubcategorySelect = (categoryId: string, subcategoryId: string) => {
    setSelectedCategoryId(categoryId);
    
    if (subcategoryId) {
      setSelectedSubcategoryId(subcategoryId);
      setCurrentView('products');
      fetchProductsBySubcategory(subcategoryId);
    } else {
      setCurrentView('subcategories');
    }
  };

  const handleBackToCategories = () => {
    setSelectedCategoryId("");
    setSelectedSubcategoryId("");
    setCurrentView('categories');
    setProducts([]);
  };

  const handleBackToSubcategories = () => {
    setSelectedSubcategoryId("");
    setCurrentView('subcategories');
    setProducts([]);
  };

  const getCurrentCategoryName = () => {
    const category = categories.find(cat => cat.id === selectedCategoryId);
    return category?.name || "";
  };

  const getCurrentSubcategoryName = () => {
    const category = categories.find(cat => cat.id === selectedCategoryId);
    const subcategory = category?.subcategories.find(sub => sub.id === selectedSubcategoryId);
    return subcategory?.name || "";
  };

  useEffect(() => {
    fetchCategoriesAndSubcategories();
  }, []);

  return {
    categories,
    products,
    loading,
    currentView,
    selectedCategoryId,
    selectedSubcategoryId,
    handleSubcategorySelect,
    handleBackToCategories,
    handleBackToSubcategories,
    getCurrentCategoryName,
    getCurrentSubcategoryName,
  };
};
