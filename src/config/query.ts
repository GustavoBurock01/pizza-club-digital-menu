// ===== CONFIGURAÇÃO UNIFICADA DE CACHE E QUERY KEYS =====

import { QueryClient } from '@tanstack/react-query';

// ===== CACHE STRATEGIES BY DOMAIN =====
export const CACHE_STRATEGIES = {
  // Static data: categories, product templates (24h cache)
  STATIC: {
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    gcTime: 7 * 24 * 60 * 60 * 1000, // 7 days
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  },
  
  // Dynamic data: products, menu items (1h cache) 
  DYNAMIC: {
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 6 * 60 * 60 * 1000, // 6 hours
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: true,
  },
  
  // Real-time data: orders, payments, admin stats (30s cache)
  REALTIME: {
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
  },
} as const;

// ===== STANDARDIZED QUERY KEYS =====
export const QUERY_KEYS = {
  // Menu system
  CATEGORIES: ['menu', 'categories'] as const,
  PRODUCTS: (subcategoryId?: string) => ['menu', 'products', subcategoryId] as const,
  PRODUCT_DETAIL: (productId: string) => ['menu', 'product', productId] as const,
  
  // Orders system  
  ORDERS: ['orders'] as const,
  ORDER_DETAIL: (orderId: string) => ['orders', orderId] as const,
  RECENT_ORDERS: ['orders', 'recent'] as const,
  
  // Admin system
  ADMIN_STATS: ['admin', 'stats'] as const,
  ADMIN_ORDERS: ['admin', 'orders'] as const,
  ADMIN_CUSTOMERS: ['admin', 'customers'] as const,
  ADMIN_PRODUCTS: ['admin', 'products'] as const,
  
  // User system
  USER_PROFILE: ['user', 'profile'] as const,
  USER_ADDRESSES: ['user', 'addresses'] as const,
  USER_SUBSCRIPTION: ['user', 'subscription'] as const,
} as const;

// ===== OPTIMIZED QUERY CLIENT =====
export const createOptimizedQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes default
      gcTime: 30 * 60 * 1000, // 30 minutes default
      networkMode: 'offlineFirst',
    },
    mutations: {
      retry: false,
      networkMode: 'online',
    },
  },
});

// ===== TARGETED INVALIDATION FUNCTIONS =====
export const invalidateQueries = {
  // Specific invalidation by domain
  menu: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CATEGORIES });
    queryClient.removeQueries({ queryKey: ['menu', 'products'], exact: false });
  },
  
  orders: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ORDERS });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.RECENT_ORDERS });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ADMIN_STATS });
  },
  
  adminStats: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ADMIN_STATS });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ADMIN_ORDERS });
  },
  
  user: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USER_PROFILE });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USER_ADDRESSES });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USER_SUBSCRIPTION });
  },
  
  // Emergency invalidation
  all: (queryClient: QueryClient) => {
    queryClient.invalidateQueries();
  },
} as const;