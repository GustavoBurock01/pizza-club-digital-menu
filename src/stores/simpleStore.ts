// ===== STORE SIMPLES PARA REESTRUTURAÇÃO =====

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ===== CART STORE =====
interface CartState {
  items: any[];
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

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
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
          const newItem = {
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
    }),
    {
      name: 'cart-store-simple',
    }
  )
);

// ===== MENU STORE =====
interface MenuState {
  categories: any[];
  products: any[];
  selectedCategoryId: string | null;
  selectedSubcategoryId: string | null;
  currentView: 'categories' | 'subcategories' | 'products';
  searchTerm: string;
  isLoading: boolean;
  setCategories: (categories: any[]) => void;
  setProducts: (products: any[]) => void;
  setSelectedCategory: (id: string | null) => void;
  setSelectedSubcategory: (id: string | null) => void;
  setCurrentView: (view: 'categories' | 'subcategories' | 'products') => void;
  setSearchTerm: (term: string) => void;
  setLoading: (loading: boolean) => void;
}

export const useMenuStore = create<MenuState>((set) => ({
  categories: [],
  products: [],
  selectedCategoryId: null,
  selectedSubcategoryId: null,
  currentView: 'categories',
  searchTerm: '',
  isLoading: false,

  setCategories: (categories) => set({ categories }),
  setProducts: (products) => set({ products }),
  setSelectedCategory: (id) => set({ selectedCategoryId: id }),
  setSelectedSubcategory: (id) => set({ selectedSubcategoryId: id }),
  setCurrentView: (view) => set({ currentView: view }),
  setSearchTerm: (term) => set({ searchTerm: term }),
  setLoading: (loading) => set({ isLoading: loading }),
}));

// ===== REAL-TIME SIMPLE =====
interface RealtimeState {
  isConnected: boolean;
  setConnected: (connected: boolean) => void;
}

export const useRealtimeStore = create<RealtimeState>((set) => ({
  isConnected: false,
  setConnected: (connected) => set({ isConnected: connected }),
}));