
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartCustomization {
  halfAndHalf?: {
    firstHalf: string;
    secondHalf: string;
  };
  crust?: string;
  extras?: string[];
}

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  customizations?: CartCustomization;
  notes?: string;
}

interface CartState {
  items: CartItem[];
  deliveryFee: number;
  deliveryMethod: 'delivery' | 'pickup';
  addItem: (product: any, customizations?: CartCustomization, notes?: string, quantity?: number) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  getSubtotal: () => number;
  getTotal: () => number;
  getItemCount: () => number;
  setDeliveryFee: (fee: number) => void;
  setDeliveryMethod: (method: 'delivery' | 'pickup') => void;
}

export const useCart = create<CartState>()(
  persist(
  (set, get) => ({
    items: [],
    deliveryFee: 0,
    deliveryMethod: 'delivery' as 'delivery' | 'pickup',

      addItem: (product, customizations, notes, quantity = 1) => {
        // Check if item already exists with same product and customizations
        const existingItemIndex = get().items.findIndex(item => 
          item.productId === product.id &&
          JSON.stringify(item.customizations) === JSON.stringify(customizations) &&
          item.notes === notes
        );

        if (existingItemIndex >= 0) {
          // Update quantity of existing item
          const items = [...get().items];
          items[existingItemIndex].quantity += quantity;
          set({ items });
        } else {
          // Create new item
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

          set((state) => ({
            items: [...state.items, newItem],
          }));
        }
      },

      removeItem: (itemId) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== itemId),
        }));
      },

      updateQuantity: (itemId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(itemId);
          return;
        }

        set((state) => ({
          items: state.items.map((item) =>
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
          
          // Add extras price
          if (item.customizations?.extras) {
            itemPrice += item.customizations.extras.length * 3; // R$ 3 per extra
          }
          
          // Add crust price
          if (item.customizations?.crust && item.customizations.crust !== 'tradicional') {
            itemPrice += 5; // R$ 5 for special crust
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
      
      setDeliveryMethod: (method: 'delivery' | 'pickup') => {
        set({ deliveryMethod: method });
      },
    }),
    {
      name: 'pizza-cart',
    }
  )
);
