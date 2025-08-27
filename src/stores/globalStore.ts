// ===== STORE GLOBAL UNIFICADO =====

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { CartItem, Order, Product, Category, Subcategory, AdminStats } from '@/types';

// ===== CART SLICE =====
interface CartSlice {
  items: CartItem[];
  deliveryFee: number;
  deliveryMethod: 'delivery' | 'pickup';
  addItem: (product: any, customizations?: any, notes?: string, quantity?: number) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  getSubtotal: () => number;
  getTotal: () => number;
  getItemCount: () => number;
  setDeliveryFee: (fee: number) => void;
  setDeliveryMethod: (method: 'delivery' | 'pickup') => void;
}

// ===== MENU SLICE =====
interface MenuSlice {
  categories: Category[];
  subcategories: Subcategory[];
  products: Product[];
  selectedCategoryId: string | null;
  selectedSubcategoryId: string | null;
  currentView: 'categories' | 'subcategories' | 'products';
  searchTerm: string;
  isLoading: boolean;
  setCategories: (categories: Category[]) => void;
  setSubcategories: (subcategories: Subcategory[]) => void;
  setProducts: (products: Product[]) => void;
  setSelectedCategory: (id: string | null) => void;
  setSelectedSubcategory: (id: string | null) => void;
  setCurrentView: (view: 'categories' | 'subcategories' | 'products') => void;
  setSearchTerm: (term: string) => void;
  setLoading: (loading: boolean) => void;
}

// ===== ORDERS SLICE =====
interface OrdersSlice {
  orders: Order[];
  recentOrders: Order[];
  currentOrder: Order | null;
  isLoading: boolean;
  setOrders: (orders: Order[]) => void;
  setRecentOrders: (orders: Order[]) => void;
  setCurrentOrder: (order: Order | null) => void;
  addOrder: (order: Order) => void;
  updateOrder: (orderId: string, updates: Partial<Order>) => void;
  setOrdersLoading: (loading: boolean) => void;
}

// ===== ADMIN SLICE =====
interface AdminSlice {
  stats: AdminStats | null;
  isLoading: boolean;
  lastUpdated: number;
  setStats: (stats: AdminStats) => void;
  setAdminLoading: (loading: boolean) => void;
  refreshStats: () => void;
}

// ===== AUTH SLICE =====
interface AuthSlice {
  user: any | null;
  session: any | null;
  isAuthenticated: boolean;
  setUser: (user: any) => void;
  setSession: (session: any) => void;
  logout: () => void;
}

// ===== GLOBAL STORE =====
type GlobalStore = CartSlice & MenuSlice & OrdersSlice & AdminSlice & AuthSlice;

export const useGlobalStore = create<GlobalStore>()(
  persist(
    (set, get) => ({
      // ===== CART STATE =====
      items: [],
      deliveryFee: 0,
      deliveryMethod: 'delivery',

      addItem: (product, customizations, notes, quantity = 1) => {
        const existingItemIndex = get().items.findIndex(item => 
          item.productId === product.id &&
          JSON.stringify(item.customizations) === JSON.stringify(customizations) &&
          item.notes === notes
        );

        if (existingItemIndex >= 0) {
          const items = [...get().items];
          items[existingItemIndex].quantity += quantity;
          set({ items });
        } else {
          const newItem: CartItem = {
            id: `${product.id}-${Date.now()}`,
            productId: product.id,
            name: product.name,
            price: product.price,
            quantity: quantity,
            image: product.image_url,
            customizations,
            notes,
          };

          set(state => ({
            items: [...state.items, newItem],
          }));
        }
      },

      removeItem: (itemId) => {
        set(state => ({
          items: state.items.filter(item => item.id !== itemId),
        }));
      },

      updateQuantity: (itemId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(itemId);
          return;
        }

        set(state => ({
          items: state.items.map(item =>
            item.id === itemId ? { ...item, quantity } : item
          ),
        }));
      },

      clearCart: () => {
        set({ items: [] });
      },

      getSubtotal: () => {
        return get().items.reduce((total, item) => {
          let itemPrice = item.price;
          
          if (item.customizations?.extras) {
            itemPrice += item.customizations.extras.length * 3;
          }
          
          if (item.customizations?.crust && item.customizations.crust !== 'tradicional') {
            itemPrice += 5;
          }

          return total + (itemPrice * item.quantity);
        }, 0);
      },

      getTotal: () => {
        return get().getSubtotal() + get().deliveryFee;
      },

      getItemCount: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      setDeliveryFee: (fee) => {
        set({ deliveryFee: fee });
      },
      
      setDeliveryMethod: (method) => {
        set({ deliveryMethod: method });
      },

      // ===== MENU STATE =====
      categories: [],
      subcategories: [],
      products: [],
      selectedCategoryId: null,
      selectedSubcategoryId: null,
      currentView: 'categories',
      searchTerm: '',
      isLoading: false,

      setCategories: (categories) => set({ categories }),
      setSubcategories: (subcategories) => set({ subcategories }),
      setProducts: (products) => set({ products }),
      setSelectedCategory: (id) => set({ selectedCategoryId: id }),
      setSelectedSubcategory: (id) => set({ selectedSubcategoryId: id }),
      setCurrentView: (view) => set({ currentView: view }),
      setSearchTerm: (term) => set({ searchTerm: term }),
      setLoading: (loading) => set({ isLoading: loading }),

      // ===== ORDERS STATE =====
      orders: [],
      recentOrders: [],
      currentOrder: null,

      setOrders: (orders) => set({ orders }),
      setRecentOrders: (orders) => set({ recentOrders }),
      setCurrentOrder: (order) => set({ currentOrder: order }),
      addOrder: (order) => set(state => ({ 
        orders: [order, ...state.orders],
        recentOrders: [order, ...state.recentOrders.slice(0, 4)]
      })),
      updateOrder: (orderId, updates) => set(state => ({
        orders: state.orders.map(order => 
          order.id === orderId ? { ...order, ...updates } : order
        ),
        recentOrders: state.recentOrders.map(order => 
          order.id === orderId ? { ...order, ...updates } : order
        ),
        currentOrder: state.currentOrder?.id === orderId 
          ? { ...state.currentOrder, ...updates } 
          : state.currentOrder
      })),
      setOrdersLoading: (loading) => set({ isLoading: loading }),

      // ===== ADMIN STATE =====
      stats: null,
      lastUpdated: 0,

      setStats: (stats) => set({ stats, lastUpdated: Date.now() }),
      setAdminLoading: (loading) => set({ isLoading: loading }),
      refreshStats: () => {
        // Will be handled by real-time manager
        set({ lastUpdated: Date.now() });
      },

      // ===== AUTH STATE =====
      user: null,
      session: null,
      isAuthenticated: false,

      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setSession: (session) => set({ session, user: session?.user || null, isAuthenticated: !!session?.user }),
      logout: () => set({ user: null, session: null, isAuthenticated: false })
    }),
    {
      name: 'pizza-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist cart and basic menu state
        items: state.items,
        deliveryFee: state.deliveryFee,
        deliveryMethod: state.deliveryMethod,
        selectedCategoryId: state.selectedCategoryId,
        selectedSubcategoryId: state.selectedSubcategoryId,
        currentView: state.currentView
      })
    }
  )
);