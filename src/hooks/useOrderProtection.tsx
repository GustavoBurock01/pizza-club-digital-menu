// ===== HOOK DE PROTEÇÃO CONTRA DUPLICAÇÃO DE PEDIDOS =====

import { useState, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { rateLimiter, checkOrderRateLimit, checkCheckoutRateLimit, checkConcurrentOrderLimit } from '@/utils/rateLimiting';
import { checkProductAvailability, reserveProductsTemporarily, releaseProductReservation, confirmProductOrder } from '@/utils/stockControl';
import { idempotencyManager } from '@/utils/idempotency';

interface OrderProtectionState {
  isProcessing: boolean;
  lastOrderId: string | null;
  processingStartTime: number | null;
}

class OrderProtectionManager {
  private isProcessing: boolean = false;
  private lastOrderId: string | null = null;

  // Gerar chave única para idempotência baseada nos dados do pedido
  generateOrderKey(orderData: any): string {
    return idempotencyManager.generateKey(orderData);
  }

  // Verificar se o pedido já está sendo processado
  isOrderBeingProcessed(orderKey: string): boolean {
    return idempotencyManager.isProcessing(orderKey);
  }

  // Marcar pedido como em processamento
  markOrderAsProcessing(orderKey: string): void {
    idempotencyManager.markAsProcessing(orderKey);
  }

  // Verificar rate limiting e limites de concorrência
  checkRateLimit(userId: string, isVip: boolean = false): boolean {
    if (!checkOrderRateLimit(userId, isVip)) {
      console.warn('[ORDER_PROTECTION] Rate limit exceeded for user:', userId);
      return false;
    }
    
    if (!checkConcurrentOrderLimit(userId)) {
      console.warn('[ORDER_PROTECTION] Concurrent order limit exceeded for user:', userId);
      return false;
    }
    
    return true;
  }

  // Verificar disponibilidade de produtos
  async checkProductStock(orderData: any): Promise<boolean> {
    if (!orderData.items || !Array.isArray(orderData.items)) {
      return true; // Se não há itens, deixa passar
    }

    const stockItems = orderData.items.map((item: any) => ({
      product_id: item.product_id,
      quantity: item.quantity
    }));

    const availability = await checkProductAvailability(stockItems);
    const unavailableProducts = availability.filter(item => !item.is_available);
    
    if (unavailableProducts.length > 0) {
      console.warn('[ORDER_PROTECTION] Products unavailable:', unavailableProducts);
      return false;
    }

    return true;
  }

  // Função principal para proteger criação de pedidos com controle de estoque
  async protectOrderCreation(
    orderData: any,
    createOrderFn: () => Promise<any>,
    options: {
      userId: string;
      timeoutMs?: number;
      enableIdempotency?: boolean;
      isVip?: boolean;
    }
  ): Promise<any> {
    const { userId, timeoutMs = 60000, enableIdempotency = true, isVip = false } = options;
    let stockReserved = false;
    let idempotentKey: string | null = null;
    const stockItems = orderData.items?.map((item: any) => ({
      product_id: item.product_id,
      quantity: item.quantity
    })) || [];

    try {
      // 1. Verificar se já está processando
      if (this.isProcessing) {
        throw new Error('Aguarde, outro pedido está sendo processado');
      }

      // 2. Verificar rate limits
      if (!this.checkRateLimit(userId, isVip)) {
        throw new Error('Muitos pedidos recentes. Aguarde um pouco antes de tentar novamente.');
      }

      // 3. Verificar disponibilidade de produtos
      if (!(await this.checkProductStock(orderData))) {
        throw new Error('Alguns produtos não estão mais disponíveis. Atualize seu carrinho.');
      }

      // 4. Reservar produtos temporariamente
      if (stockItems.length > 0) {
        stockReserved = reserveProductsTemporarily(stockItems, userId);
        if (!stockReserved) {
          throw new Error('Não foi possível reservar os produtos. Tente novamente.');
        }
      }

      // 5. Verificar idempotência se habilitada
      if (enableIdempotency) {
        idempotentKey = this.generateOrderKey(orderData);
        
        // Verificar se já está sendo processado
        if (idempotencyManager.isProcessing(idempotentKey)) {
          if (stockReserved) {
            releaseProductReservation(stockItems, userId);
          }
          throw new Error('Pedido já está sendo processado');
        }

        // Verificar se já foi completado
        const existingResult = idempotencyManager.getResult(idempotentKey);
        if (existingResult) {
          if (stockReserved) {
            releaseProductReservation(stockItems, userId);
          }
          console.log('[ORDER_PROTECTION] Returning cached result');
          return existingResult;
        }

        // Marcar como processando
        idempotencyManager.markAsProcessing(idempotentKey);
      }

      // 6. Marcar como processando
      this.isProcessing = true;

      // 7. Configurar timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Timeout na criação do pedido'));
        }, timeoutMs);
      });

      // 8. Executar função com timeout
      const result = await Promise.race([
        createOrderFn(),
        timeoutPromise
      ]) as any;

      // 9. Confirmar pedido no controle de estoque
      if (stockReserved && result?.order?.id) {
        confirmProductOrder(stockItems, userId);
      }

      // 10. Marcar idempotência como completada
      if (idempotentKey) {
        idempotencyManager.markAsCompleted(idempotentKey, result);
      }

      // 11. Atualizar último ID do pedido
      if (result?.order?.id) {
        this.lastOrderId = result.order.id;
      }

      console.log('[ORDER_PROTECTION] Order created successfully:', result?.order?.id);
      return result;

    } catch (error) {
      console.error('[ORDER_PROTECTION] Error creating order:', error);
      
      // Liberar reserva de estoque em caso de erro
      if (stockReserved) {
        releaseProductReservation(stockItems, userId);
      }
      
      // Marcar idempotência como falhada
      if (idempotentKey) {
        idempotencyManager.markAsFailed(idempotentKey);
      }
      
      throw error;
    } finally {
      // Sempre limpar o estado de processamento
      this.isProcessing = false;
    }
  }

  // Criar ação protegida com debounce
  createProtectedAction(action: () => Promise<void>, debounceMs: number = 1000): { executeAction: () => Promise<void>; isDisabled: boolean; } {
    let isDebouncing = false;

    const executeAction = async () => {
      if (isDebouncing || this.isProcessing) return;

      isDebouncing = true;
      try {
        await action();
      } finally {
        setTimeout(() => { isDebouncing = false; }, debounceMs);
      }
    };

    return {
      executeAction,
      isDisabled: isDebouncing || this.isProcessing
    };
  }

  // Cleanup
  cleanup(): void {
    this.isProcessing = false;
    this.lastOrderId = null;
  }
}

// Instância global
const orderProtectionManager = new OrderProtectionManager();

export const useOrderProtection = () => {
  const [state, setState] = useState<OrderProtectionState>({
    isProcessing: false,
    lastOrderId: null,
    processingStartTime: null
  });
  
  const { toast } = useToast();

  // Verificar rate limiting com feedback visual
  const checkRateLimit = useCallback((userId: string, isVip: boolean = false): boolean => {
    if (!orderProtectionManager.checkRateLimit(userId, isVip)) {
      toast({
        title: "Muitos pedidos",
        description: "Aguarde um pouco antes de fazer outro pedido.",
        variant: "destructive"
      });
      return false;
    }
    return true;
  }, [toast]);

  // Proteger execução de função de criação de pedido
  const protectOrderCreation = useCallback(async (
    orderData: any,
    createOrderFn: () => Promise<any>,
    options: {
      userId: string;
      timeoutMs?: number;
      enableIdempotency?: boolean;
      isVip?: boolean;
    } = { userId: '', timeoutMs: 30000, enableIdempotency: true, isVip: false }
  ): Promise<any> => {
    setState(prev => ({ ...prev, isProcessing: true, processingStartTime: Date.now() }));
    
    try {
      const result = await orderProtectionManager.protectOrderCreation(orderData, createOrderFn, options);
      setState(prev => ({ 
        ...prev, 
        isProcessing: false, 
        lastOrderId: result?.order?.id || null,
        processingStartTime: null 
      }));
      return result;
    } catch (error) {
      setState(prev => ({ ...prev, isProcessing: false, processingStartTime: null }));
      throw error;
    }
  }, []);

  // Hook para debounce de botões críticos
  const createProtectedAction = useCallback((
    action: () => Promise<void>,
    debounceMs: number = 1000
  ) => {
    return orderProtectionManager.createProtectedAction(action, debounceMs);
  }, []);

  // Cleanup no unmount
  const cleanup = useCallback(() => {
    orderProtectionManager.cleanup();
    setState({
      isProcessing: false,
      lastOrderId: null,
      processingStartTime: null
    });
  }, []);

  return {
    // Estado
    isProcessing: state.isProcessing,
    lastOrderId: state.lastOrderId,
    processingTime: state.processingStartTime ? Date.now() - state.processingStartTime : 0,
    
    // Funções principais
    protectOrderCreation,
    createProtectedAction,
    cleanup,
    
    // Utilidades
    generateOrderKey: orderProtectionManager.generateOrderKey.bind(orderProtectionManager),
    checkRateLimit
  };
};

// Hook para debounce de botões específicos
export const useProtectedButton = (
  action: () => Promise<void>,
  options: {
    debounceMs?: number;
    enableWhileProcessing?: boolean;
  } = {}
) => {
  const { debounceMs = 1000, enableWhileProcessing = false } = options;
  const [isLocalLoading, setIsLocalLoading] = useState(false);
  const { isProcessing } = useOrderProtection();

  const executeAction = useCallback(async () => {
    if (isLocalLoading || (!enableWhileProcessing && isProcessing)) {
      return;
    }

    setIsLocalLoading(true);
    try {
      await action();
    } finally {
      setTimeout(() => setIsLocalLoading(false), debounceMs);
    }
  }, [action, isLocalLoading, isProcessing, enableWhileProcessing, debounceMs]);

  return {
    executeAction,
    isDisabled: isLocalLoading || (!enableWhileProcessing && isProcessing),
    isLoading: isLocalLoading
  };
};