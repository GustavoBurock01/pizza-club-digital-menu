// ===== CONTROLE DE ESTOQUE EM TEMPO REAL =====

import { supabase } from "@/integrations/supabase/client";

interface StockItem {
  product_id: string;
  quantity: number;
  reserved_until?: Date;
}

interface ProductAvailability {
  product_id: string;
  is_available: boolean;
  stock_quantity?: number;
  reason?: string;
}

class StockController {
  private reservations: Map<string, { quantity: number; expires: number }> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Limpeza de reservas expiradas a cada 30 segundos
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredReservations();
    }, 30 * 1000);
  }

  private cleanupExpiredReservations() {
    const now = Date.now();
    for (const [key, reservation] of this.reservations.entries()) {
      if (reservation.expires <= now) {
        this.reservations.delete(key);
      }
    }
  }

  // Verificar disponibilidade de produtos em lote
  async checkProductsAvailability(items: StockItem[]): Promise<ProductAvailability[]> {
    try {
      const productIds = items.map(item => item.product_id);
      
      // Buscar produtos do banco
      const { data: products, error } = await supabase
        .from('products')
        .select('id, is_available')
        .in('id', productIds);

      if (error) {
        console.error('[STOCK] Error checking product availability:', error);
        return items.map(item => ({
          product_id: item.product_id,
          is_available: false,
          reason: 'Database error'
        }));
      }

      // Verificar cada item
      return items.map(item => {
        const product = products?.find(p => p.id === item.product_id);
        
        if (!product) {
          return {
            product_id: item.product_id,
            is_available: false,
            reason: 'Product not found'
          };
        }

        if (!product.is_available) {
          return {
            product_id: item.product_id,
            is_available: false,
            reason: 'Product unavailable'
          };
        }

        // Verificar reservas temporárias
        const reservationKey = `product:${item.product_id}`;
        const reservation = this.reservations.get(reservationKey);
        
        if (reservation && reservation.quantity >= 10) { // Limite de reservas simultâneas
          return {
            product_id: item.product_id,
            is_available: false,
            reason: 'Temporarily unavailable (high demand)'
          };
        }

        return {
          product_id: item.product_id,
          is_available: true
        };
      });
    } catch (error) {
      console.error('[STOCK] Unexpected error:', error);
      return items.map(item => ({
        product_id: item.product_id,
        is_available: false,
        reason: 'System error'
      }));
    }
  }

  // Reservar produtos temporariamente (5 minutos)
  reserveProducts(items: StockItem[], userId: string): boolean {
    const reservationTime = 5 * 60 * 1000; // 5 minutos
    const expiresAt = Date.now() + reservationTime;
    
    try {
      for (const item of items) {
        const reservationKey = `product:${item.product_id}`;
        const existing = this.reservations.get(reservationKey);
        
        const newQuantity = (existing?.quantity || 0) + item.quantity;
        
        this.reservations.set(reservationKey, {
          quantity: newQuantity,
          expires: expiresAt
        });
      }
      
      console.log(`[STOCK] Reserved products for user ${userId}:`, items);
      return true;
    } catch (error) {
      console.error('[STOCK] Error reserving products:', error);
      return false;
    }
  }

  // Liberar reservas (quando pedido é cancelado/falha)
  releaseReservation(items: StockItem[], userId: string): void {
    try {
      for (const item of items) {
        const reservationKey = `product:${item.product_id}`;
        const existing = this.reservations.get(reservationKey);
        
        if (existing) {
          const newQuantity = Math.max(0, existing.quantity - item.quantity);
          
          if (newQuantity === 0) {
            this.reservations.delete(reservationKey);
          } else {
            this.reservations.set(reservationKey, {
              ...existing,
              quantity: newQuantity
            });
          }
        }
      }
      
      console.log(`[STOCK] Released reservations for user ${userId}:`, items);
    } catch (error) {
      console.error('[STOCK] Error releasing reservation:', error);
    }
  }

  // Confirmar pedido (remove da reserva)
  confirmOrder(items: StockItem[], userId: string): void {
    this.releaseReservation(items, userId);
    console.log(`[STOCK] Confirmed order for user ${userId}`);
  }

  // Obter estatísticas de estoque
  getStockStats() {
    const now = Date.now();
    const activeReservations = Array.from(this.reservations.entries())
      .filter(([_, reservation]) => reservation.expires > now);
    
    return {
      total_reservations: this.reservations.size,
      active_reservations: activeReservations.length,
      expired_pending_cleanup: this.reservations.size - activeReservations.length,
      products_with_reservations: activeReservations.map(([key, reservation]) => ({
        product_key: key,
        reserved_quantity: reservation.quantity,
        expires_in_seconds: Math.max(0, Math.floor((reservation.expires - now) / 1000))
      }))
    };
  }

  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.reservations.clear();
  }
}

// Instância global
export const stockController = new StockController();

// Utilitários para usar em componentes
export const checkProductAvailability = async (items: StockItem[]): Promise<ProductAvailability[]> => {
  return stockController.checkProductsAvailability(items);
};

export const reserveProductsTemporarily = (items: StockItem[], userId: string): boolean => {
  return stockController.reserveProducts(items, userId);
};

export const releaseProductReservation = (items: StockItem[], userId: string): void => {
  stockController.releaseReservation(items, userId);
};

export const confirmProductOrder = (items: StockItem[], userId: string): void => {
  stockController.confirmOrder(items, userId);
};

// Hook para usar controle de estoque em React
export const useStockControl = () => {
  return {
    checkAvailability: checkProductAvailability,
    reserve: reserveProductsTemporarily,
    release: releaseProductReservation,
    confirm: confirmProductOrder,
    getStats: () => stockController.getStockStats()
  };
};