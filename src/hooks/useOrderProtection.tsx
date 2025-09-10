// ===== HOOK DE PROTEÇÃO CONTRA DUPLICAÇÃO DE PEDIDOS =====

import { useState, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { rateLimiter, checkOrderRateLimit, checkCheckoutRateLimit, checkConcurrentOrderLimit, checkGlobalProcessingLimit } from '@/utils/rateLimiting';
import { idempotencyManager } from '@/utils/idempotency';
import { 
  checkProductsAvailability, 
  reserveProductsAtomically, 
  releaseStockReservations, 
  confirmStockReservations,
  type StockItem 
} from '@/utils/atomicStockControl';
import { concurrencyManager, acquireOrderProcessingLock, acquireUserOrderSemaphore, acquireGlobalOrderSemaphore } from '@/utils/concurrencyControl';
import { retryOrderOperation } from '@/utils/retryManager';

interface OrderProtectionState {
  isProcessing: boolean;
  lastOrderId: string | null;
  processingStartTime: number | null;
}

class OrderProtectionManager {
  private isProcessing: boolean = false;
  private lastOrderId: string | null = null;
  private processingOrders: Set<string> = new Set();

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

    if (!checkGlobalProcessingLimit()) {
      console.warn('[ORDER_PROTECTION] Global processing limit exceeded');
      return false;
    }
    
    return true;
  }

  // Verificar disponibilidade de produtos com o novo sistema atômico
  async checkProductStock(orderData: any): Promise<{ success: boolean; errors: string[] }> {
    if (!orderData.items || !Array.isArray(orderData.items)) {
      return { success: true, errors: [] }; // Se não há itens, deixa passar
    }

    const stockItems: StockItem[] = orderData.items.map((item: any) => ({
      product_id: item.product_id,
      quantity: item.quantity
    }));

    const result = await checkProductsAvailability(stockItems);
    
    if (!result.success) {
      console.warn('[ORDER_PROTECTION] Products unavailable:', result.unavailableItems);
      return { success: false, errors: result.errors };
    }

    return { success: true, errors: [] };
  }

  // Função principal para proteger criação de pedidos com sistema atômico
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
    let reservationIds: string[] = [];
    let idempotentKey: string | null = null;
    let releaseLock: (() => void) | null = null;
    let releaseUserSemaphore: (() => void) | null = null;
    let releaseGlobalSemaphore: (() => void) | null = null;

    const stockItems: StockItem[] = orderData.items?.map((item: any) => ({
      product_id: item.product_id,
      quantity: item.quantity
    })) || [];

    try {
      // 1. Verificar se já está processando
      if (this.isProcessing) {
        throw new Error('Aguarde, outro pedido está sendo processado');
      }

      // 2. Verificar rate limits e limites globais
      if (!this.checkRateLimit(userId, isVip)) {
        throw new Error('Muitos pedidos recentes. Aguarde um pouco antes de tentar novamente.');
      }

      // 3. Verificar disponibilidade de produtos
      const stockCheck = await this.checkProductStock(orderData);
      if (!stockCheck.success) {
        throw new Error(`Produtos indisponíveis: ${stockCheck.errors.join(', ')}`);
      }

      // 4. Adquirir semáforos e locks para controle de concorrência
      try {
        // Semáforo global
        releaseGlobalSemaphore = await acquireGlobalOrderSemaphore();
        
        // Semáforo por usuário
        releaseUserSemaphore = await acquireUserOrderSemaphore(userId);
        
        // Lock específico do pedido
        if (enableIdempotency) {
          idempotentKey = this.generateOrderKey(orderData);
          releaseLock = await acquireOrderProcessingLock(idempotentKey);
        }
      } catch (error) {
        throw new Error('Sistema em alta demanda. Tente novamente em alguns segundos.');
      }

      // 5. Verificar idempotência se habilitada
      if (enableIdempotency && idempotentKey) {
        // Verificar se já foi completado
        const existingResult = idempotencyManager.getResult(idempotentKey);
        if (existingResult) {
          console.log('[ORDER_PROTECTION] Returning cached result');
          return existingResult;
        }

        // Marcar como processando
        idempotencyManager.markAsProcessing(idempotentKey);
        this.processingOrders.add(idempotentKey);
      }

      // 6. Reservar produtos atomicamente
      if (stockItems.length > 0) {
        const reservationResult = await reserveProductsAtomically(stockItems, userId, idempotentKey);
        
        if (!reservationResult.success) {
          throw new Error(`Falha na reserva de estoque: ${reservationResult.errors.join(', ')}`);
        }
        
        reservationIds = reservationResult.reservations;
        console.log('[ORDER_PROTECTION] Stock reserved successfully:', reservationIds);
      }

      // 7. Marcar como processando
      this.isProcessing = true;

      // 8. Executar função com timeout e retry
      const result = await retryOrderOperation(async () => {
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error('Timeout na criação do pedido'));
          }, timeoutMs);
        });

        return Promise.race([
          createOrderFn(),
          timeoutPromise
        ]);
      }, `order-${idempotentKey || userId}`);

      // 9. Confirmar reservas no sistema atômico
      if (reservationIds.length > 0 && result?.order?.id) {
        const confirmResult = await confirmStockReservations(reservationIds, result.order.id);
        
        if (!confirmResult.success) {
          console.warn('[ORDER_PROTECTION] Failed to confirm some reservations:', confirmResult.errors);
          // Não falhar o pedido por isso, apenas logar
        } else {
          console.log('[ORDER_PROTECTION] Stock reservations confirmed successfully');
        }
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
      
      // Liberar reservas de estoque em caso de erro
      if (reservationIds.length > 0) {
        try {
          await releaseStockReservations(reservationIds, 'Erro na criação do pedido');
          console.log('[ORDER_PROTECTION] Stock reservations released due to error');
        } catch (releaseError) {
          console.error('[ORDER_PROTECTION] Failed to release reservations:', releaseError);
        }
      }
      
      // Marcar idempotência como falhada
      if (idempotentKey) {
        idempotencyManager.markAsFailed(idempotentKey);
      }
      
      throw error;
    } finally {
      // Sempre limpar recursos
      if (releaseLock) releaseLock();
      if (releaseUserSemaphore) releaseUserSemaphore();
      if (releaseGlobalSemaphore) releaseGlobalSemaphore();
      
      if (idempotentKey) {
        this.processingOrders.delete(idempotentKey);
      }
      
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
    this.processingOrders.clear();
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