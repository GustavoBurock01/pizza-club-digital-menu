// ===== QUERY CACHE STRATEGIES MAPPING =====
// Mapeamento centralizado de domínios para estratégias de cache
// Garante aplicação consistente de cache em toda a aplicação

import { CACHE_STRATEGIES } from './queryClient';

/**
 * Mapeamento de domínios para suas estratégias de cache
 * Permite aplicação consistente em todos os hooks
 */
export const DOMAIN_CACHE_STRATEGY = {
  // Static data (24h cache) - Raramente muda
  categories: CACHE_STRATEGIES.STATIC,
  productTemplates: CACHE_STRATEGIES.STATIC,
  systemConfig: CACHE_STRATEGIES.STATIC,
  
  // Semi-static data (1h cache) - Muda ocasionalmente
  userProfile: CACHE_STRATEGIES.SEMI_STATIC,
  subscription: CACHE_STRATEGIES.SEMI_STATIC,
  addresses: CACHE_STRATEGIES.SEMI_STATIC,
  loyaltyTiers: CACHE_STRATEGIES.SEMI_STATIC,
  
  // Dynamic data (5min cache) - Muda com frequência moderada
  products: CACHE_STRATEGIES.DYNAMIC,
  menu: CACHE_STRATEGIES.DYNAMIC,
  cartProducts: CACHE_STRATEGIES.DYNAMIC,
  
  // Critical data (30s cache) - Precisa estar sempre atualizado
  stock: CACHE_STRATEGIES.CRITICAL,
  prices: CACHE_STRATEGIES.CRITICAL,
  adminOrders: CACHE_STRATEGIES.CRITICAL,
  
  // Realtime data (30s cache + refetch agressivo) - Dados em tempo real
  orders: CACHE_STRATEGIES.REALTIME,
  customers: CACHE_STRATEGIES.REALTIME,
  campaigns: CACHE_STRATEGIES.REALTIME,
  coupons: CACHE_STRATEGIES.REALTIME,
  promotions: CACHE_STRATEGIES.REALTIME,
  banners: CACHE_STRATEGIES.REALTIME,
  deliveryDrivers: CACHE_STRATEGIES.REALTIME,
  deliveryZones: CACHE_STRATEGIES.REALTIME,
  integrations: CACHE_STRATEGIES.REALTIME,
  customerSegments: CACHE_STRATEGIES.REALTIME,
  loyaltyRewards: CACHE_STRATEGIES.REALTIME,
  loyaltyRedemptions: CACHE_STRATEGIES.REALTIME,
} as const;

/**
 * Helper function para aplicar strategy de cache
 * 
 * @example
 * ```typescript
 * const { data } = useQuery({
 *   queryKey: ['products'],
 *   queryFn: fetchProducts,
 *   ...applyStrategy('products'), // ✅ Aplicação automática
 * });
 * ```
 */
export const applyStrategy = (domain: keyof typeof DOMAIN_CACHE_STRATEGY) => {
  return DOMAIN_CACHE_STRATEGY[domain];
};
