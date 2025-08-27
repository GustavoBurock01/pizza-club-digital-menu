// ===== HOOK GLOBAL DE DADOS =====

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useGlobalStore } from '@/stores/globalStore';
import { useRealtimeManager } from '@/services/realtimeManager';
import { useEffect } from 'react';
import { QUERY_KEYS } from '@/services/supabase';
import { CACHE_STRATEGIES } from '@/config/queryClient';

// ===== FETCH FUNCTIONS =====
const fetchCategoriesWithSubcategories = async () => {
  const { data: categories, error } = await supabase
    .from('categories')
    .select(`
      *,
      subcategories (
        *,
        products (count)
      )
    `)
    .order('created_at');

  if (error) throw error;
  return categories;
};

const fetchProductsBySubcategory = async (subcategoryId: string) => {
  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .eq('subcategory_id', subcategoryId)
    .eq('available', true)
    .order('name');

  if (error) throw error;
  return products;
};

const fetchAdminStats = async () => {
  // Consolidate all admin queries into one
  const [ordersResponse, statsResponse] = await Promise.all([
    supabase
      .from('orders')
      .select('*, order_items(*)')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
    
    supabase.rpc('get_admin_stats')
  ]);

  if (ordersResponse.error) throw ordersResponse.error;
  if (statsResponse.error) throw statsResponse.error;

  const orders = ordersResponse.data;
  const stats = statsResponse.data;

  // Calculate real-time metrics
  const todayOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const completedOrders = orders.filter(o => o.status === 'delivered').length;
  const todayRevenue = orders.reduce((sum, order) => sum + order.total_amount, 0);

  return {
    totalOrders: stats[0]?.total_orders || 0,
    totalRevenue: stats[0]?.total_revenue || 0,
    totalProducts: stats[0]?.total_products || 0,
    totalUsers: stats[0]?.total_users || 0,
    averageOrderValue: stats[0]?.avg_order_value || 0,
    revenueGrowth: 0,
    todayOrders,
    pendingOrders,
    completedOrders,
    todayRevenue,
    topSellingProducts: []
  };
};

// ===== MAIN HOOK =====
export const useGlobalData = () => {
  const {
    categories,
    subcategories,
    products,
    selectedCategoryId,
    selectedSubcategoryId,
    currentView,
    stats,
    setCategories,
    setSubcategories,
    setProducts,
    setStats,
    setLoading,
    setAdminLoading
  } = useGlobalStore();

  const { connect, disconnect } = useRealtimeManager();

  // ===== CATEGORIES QUERY =====
  const {
    data: categoriesData,
    isLoading: categoriesLoading,
    refetch: refetchCategories
  } = useQuery({
    queryKey: QUERY_KEYS.CATEGORIES,
    queryFn: fetchCategoriesWithSubcategories,
    ...CACHE_STRATEGIES.STATIC,
    staleTime: 1000 * 60 * 30 // 30 minutes
  });

  // ===== PRODUCTS QUERY =====
  const {
    data: productsData,
    isLoading: productsLoading,
    refetch: refetchProducts
  } = useQuery({
    queryKey: [...QUERY_KEYS.PRODUCTS, selectedSubcategoryId],
    queryFn: () => selectedSubcategoryId ? fetchProductsBySubcategory(selectedSubcategoryId) : Promise.resolve([]),
    ...CACHE_STRATEGIES.SEMI_STATIC,
    enabled: !!selectedSubcategoryId,
    staleTime: 1000 * 60 * 10 // 10 minutes
  });

  // ===== ADMIN STATS QUERY =====
  const {
    data: adminStatsData,
    isLoading: adminLoading,
    refetch: refetchStats
  } = useQuery({
    queryKey: QUERY_KEYS.ADMIN_STATS,
    queryFn: fetchAdminStats,
    ...CACHE_STRATEGIES.DYNAMIC,
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchInterval: 1000 * 60 * 5 // Refetch every 5 minutes instead of 30s
  });

  // ===== EFFECTS =====
  useEffect(() => {
    connect();
    return () => disconnect();
  }, []);

  useEffect(() => {
    if (categoriesData) {
      const categories = categoriesData.map(cat => ({
        ...cat,
        subcategories: cat.subcategories?.map(sub => ({
          ...sub,
          product_count: sub.products?.[0]?.count || 0
        })) || []
      }));
      setCategories(categories);
      
      const allSubcategories = categories.flatMap(cat => cat.subcategories || []);
      setSubcategories(allSubcategories);
    }
  }, [categoriesData, setCategories, setSubcategories]);

  useEffect(() => {
    if (productsData) {
      setProducts(productsData);
    }
  }, [productsData, setProducts]);

  useEffect(() => {
    if (adminStatsData) {
      setStats(adminStatsData);
    }
  }, [adminStatsData, setStats]);

  useEffect(() => {
    setLoading(categoriesLoading || productsLoading);
  }, [categoriesLoading, productsLoading, setLoading]);

  useEffect(() => {
    setAdminLoading(adminLoading);
  }, [adminLoading, setAdminLoading]);

  // ===== RETURN =====
  return {
    // Data
    categories,
    subcategories,
    products,
    stats,
    
    // Loading states
    isLoading: categoriesLoading || productsLoading,
    isAdminLoading: adminLoading,
    
    // Refresh functions
    refreshMenu: () => {
      refetchCategories();
      if (selectedSubcategoryId) {
        refetchProducts();
      }
    },
    refreshStats: refetchStats,
    
    // Current state
    currentView,
    selectedCategoryId,
    selectedSubcategoryId
  };
};