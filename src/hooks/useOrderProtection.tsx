// ===== HOOK DE PROTEÇÃO CONTRA DUPLICAÇÃO DE PEDIDOS =====

import { useState, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/useDebounce';
import { rateLimiter, RATE_LIMITS } from '@/utils/rateLimiting';

interface OrderProtectionState {
  isProcessing: boolean;
  lastOrderId: string | null;
  processingStartTime: number | null;
}

export const useOrderProtection = () => {
  const [state, setState] = useState<OrderProtectionState>({
    isProcessing: false,
    lastOrderId: null,
    processingStartTime: null
  });
  
  const { toast } = useToast();
  const processingRef = useRef<Set<string>>(new Set());
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Gerar chave única para idempotência baseada nos dados do pedido
  const generateOrderKey = useCallback((orderData: any) => {
    const keyData = {
      user_id: orderData.user_id,
      items: orderData.items?.map((item: any) => ({
        product_id: item.product_id,
        quantity: item.quantity,
        customizations: item.customizations
      })),
      total_amount: orderData.total_amount,
      payment_method: orderData.payment_method,
      timestamp: Math.floor(Date.now() / 30000) // Window de 30 segundos
    };
    
    return btoa(JSON.stringify(keyData));
  }, []);

  // Verificar se o pedido já está sendo processado
  const isOrderBeingProcessed = useCallback((orderKey: string) => {
    return processingRef.current.has(orderKey);
  }, []);

  // Marcar pedido como em processamento
  const markOrderAsProcessing = useCallback((orderKey: string) => {
    processingRef.current.add(orderKey);
    
    // Auto-limpeza após 2 minutos
    setTimeout(() => {
      processingRef.current.delete(orderKey);
    }, 2 * 60 * 1000);
  }, []);

  // Verificar rate limiting
  const checkRateLimit = useCallback((userId: string): boolean => {
    if (!rateLimiter.isAllowed(`order:${userId}`, RATE_LIMITS.ORDERS_PER_HOUR, 60 * 60 * 1000)) {
      const remainingTime = rateLimiter.getRemainingTime(`order:${userId}`);
      const minutes = Math.ceil(remainingTime / (60 * 1000));
      
      toast({
        title: "Muitos pedidos",
        description: `Aguarde ${minutes} minutos antes de fazer outro pedido.`,
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
    } = { userId: '', timeoutMs: 30000, enableIdempotency: true }
  ): Promise<any> => {
    const { userId, timeoutMs = 30000, enableIdempotency = true } = options;

    // 1. Verificar se já está processando
    if (state.isProcessing) {
      throw new Error('Já existe um pedido sendo processado. Aguarde a conclusão.');
    }

    // 2. Verificar rate limiting
    if (!checkRateLimit(userId)) {
      throw new Error('Limite de pedidos excedido.');
    }

    // 3. Verificar idempotência (se habilitada)
    let orderKey = '';
    if (enableIdempotency) {
      orderKey = generateOrderKey(orderData);
      
      if (isOrderBeingProcessed(orderKey)) {
        throw new Error('Este pedido já está sendo processado.');
      }
    }

    // 4. Marcar como processando
    setState(prev => ({
      ...prev,
      isProcessing: true,
      processingStartTime: Date.now()
    }));

    if (enableIdempotency) {
      markOrderAsProcessing(orderKey);
    }

    // 5. Configurar timeout
    timeoutRef.current = setTimeout(() => {
      setState(prev => ({
        ...prev,
        isProcessing: false,
        processingStartTime: null
      }));
      
      if (enableIdempotency) {
        processingRef.current.delete(orderKey);
      }
      
      toast({
        title: "Timeout do pedido",
        description: "O processamento demorou muito. Tente novamente.",
        variant: "destructive"
      });
    }, timeoutMs);

    try {
      // 6. Executar função de criação
      const result = await createOrderFn();
      
      // 7. Sucesso - limpar estado
      setState(prev => ({
        ...prev,
        isProcessing: false,
        lastOrderId: (result as any)?.id || null,
        processingStartTime: null
      }));

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      if (enableIdempotency) {
        processingRef.current.delete(orderKey);
      }

      return result;
      
    } catch (error) {
      // 8. Erro - limpar estado
      setState(prev => ({
        ...prev,
        isProcessing: false,
        processingStartTime: null
      }));

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      if (enableIdempotency) {
        processingRef.current.delete(orderKey);
      }

      throw error;
    }
  }, [state.isProcessing, checkRateLimit, generateOrderKey, isOrderBeingProcessed, markOrderAsProcessing, toast]);

  // Hook para debounce de botões críticos
  const createProtectedAction = useCallback((
    action: () => Promise<void>,
    debounceMs: number = 1000
  ) => {
    const [isDebouncing, setIsDebouncing] = useState(false);

    const executeAction = useCallback(async () => {
      if (isDebouncing || state.isProcessing) return;

      setIsDebouncing(true);
      try {
        await action();
      } finally {
        setTimeout(() => setIsDebouncing(false), debounceMs);
      }
    }, [isDebouncing]);

    return {
      executeAction,
      isDisabled: isDebouncing || state.isProcessing
    };
  }, [state.isProcessing]);

  // Cleanup no unmount
  const cleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
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
    generateOrderKey,
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