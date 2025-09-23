// ===== HOOK PARA IMPRESSÃO TÉRMICA =====

import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useThermalPrinterConfig } from './useThermalPrinterConfig';

interface PrintOptions {
  copies?: number;
  printerIP?: string;
}

interface PrintResponse {
  success: boolean;
  message: string;
  copies_printed: number;
  copies_requested: number;
  order_id: string;
  timestamp: string;
}

export const useThermalPrint = () => {
  const [isPrinting, setIsPrinting] = useState(false);
  const [lastPrintResult, setLastPrintResult] = useState<PrintResponse | null>(null);
  const { config, addTestResult } = useThermalPrinterConfig();

  const printOrder = async (orderId: string, options: PrintOptions = {}) => {
    if (isPrinting) {
      toast.warning('Aguarde... impressão em andamento');
      return;
    }

    // Verificar se impressora está habilitada
    if (!config.enabled) {
      toast.error('Sistema de impressão desabilitado', {
        description: 'Ative nas configurações da impressora'
      });
      return;
    }

    setIsPrinting(true);
    
    try {
      console.log('[THERMAL-PRINT] 🖨️ Iniciando impressão do pedido:', orderId);
      
      // Usar configurações salvas se não especificado
      const printerIP = options.printerIP || 
        (config.connectionType === 'network' ? config.printerIP : undefined);
      
      // Chamar Edge Function de impressão
      const { data, error } = await supabase.functions.invoke('print-thermal', {
        body: {
          orderId,
          printerIP,
          copies: options.copies || 1
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      const result = data as PrintResponse;
      setLastPrintResult(result);

      if (result.success) {
        toast.success(result.message, {
          description: `Pedido #${orderId.slice(-6).toUpperCase()}`,
          duration: 3000
        });
        
        // Log de auditoria local
        console.log('[THERMAL-PRINT] ✅ Impressão concluída:', result);
      } else {
        throw new Error(result.message || 'Falha na impressão');
      }

      return result;

    } catch (error: any) {
      console.error('[THERMAL-PRINT] ❌ Erro na impressão:', error);
      
      toast.error('Erro na impressão', {
        description: error.message || 'Falha ao conectar com a impressora',
        duration: 5000
      });
      
      setLastPrintResult({
        success: false,
        message: error.message,
        copies_printed: 0,
        copies_requested: options.copies || 1,
        order_id: orderId,
        timestamp: new Date().toISOString()
      });

      throw error;
    } finally {
      setIsPrinting(false);
    }
  };

  const printOrderCopies = async (orderId: string, copies: number, printerIP?: string) => {
    return printOrder(orderId, { copies, printerIP });
  };

  const testPrinter = async (printerIP?: string) => {
    setIsPrinting(true);
    
    try {
      console.log('[THERMAL-PRINT] 🧪 Testando impressora...');
      
      // Usar configuração salva se não especificado
      const targetIP = printerIP || 
        (config.connectionType === 'network' ? config.printerIP : undefined);
      
      const testOrderId = 'test-' + Date.now();
      
      // Criar pedido de teste temporário para impressão
      const testOrder = {
        id: testOrderId,
        customer_name: 'TESTE DE IMPRESSORA',
        customer_phone: '(11) 99999-9999',
        total_amount: 25.50,
        delivery_fee: 5.00,
        payment_method: 'dinheiro',
        created_at: new Date().toISOString(),
        status: 'test',
        items: [{
          quantity: 1,
          name: 'Teste de Impressão',
          unit_price: 20.50,
          total_price: 20.50
        }]
      };

      const { data, error } = await supabase.functions.invoke('print-thermal', {
        body: {
          orderId: testOrderId,
          printerIP: targetIP,
          copies: 1,
          testMode: true,
          testOrder
        }
      });

      if (error) throw new Error(error.message);

      const result = data as PrintResponse;
      
      if (result.success) {
        toast.success('Teste de impressão enviado!', {
          description: 'Verifique se a comanda foi impressa',
          duration: 3000
        });
        
        // Salvar resultado positivo
        addTestResult({
          success: true,
          message: result.message
        });
      } else {
        // Salvar resultado de falha
        addTestResult({
          success: false,
          message: result.message
        });
        throw new Error(result.message);
      }

      return result;

    } catch (error: any) {
      console.error('[THERMAL-PRINT] ❌ Erro no teste:', error);
      
      // Salvar resultado de erro
      addTestResult({
        success: false,
        message: error.message || 'Erro desconhecido'
      });
      
      toast.error('Erro no teste de impressão', {
        description: error.message
      });
      throw error;
    } finally {
      setIsPrinting(false);
    }
  };

  return {
    printOrder,
    printOrderCopies,
    testPrinter,
    isPrinting,
    lastPrintResult
  };
};