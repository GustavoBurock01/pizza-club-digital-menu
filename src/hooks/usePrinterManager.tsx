import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/services/supabase';
import { toast } from 'sonner';
import { PrinterConfig } from '@/components/printing/PrinterCard';

export function usePrinterManager() {
  const [printers, setPrinters] = useState<PrinterConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all printers
  const fetchPrinters = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('printer_configs')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setPrinters((data || []) as PrinterConfig[]);
    } catch (err: any) {
      console.error('[PRINTER-MANAGER] Error fetching printers:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Add new printer
  const addPrinter = useCallback(async (printerData: Partial<PrinterConfig>) => {
    try {
      // If setting as default, unset other defaults first
      if (printerData.is_default) {
        await supabase
          .from('printer_configs')
          .update({ is_default: false })
          .eq('is_default', true);
      }

      const { data, error } = await supabase
        .from('printer_configs')
        .insert({
          name: printerData.name,
          connection_type: printerData.connection_type,
          ip_address: printerData.ip_address || null,
          port: printerData.port || 9100,
          bluetooth_address: printerData.bluetooth_address || null,
          paper_width: printerData.paper_width || 58,
          is_default: printerData.is_default || false,
          is_enabled: printerData.is_enabled ?? true,
          last_status: 'unknown',
        })
        .select()
        .single();

      if (error) throw error;

      setPrinters((prev) => [data as PrinterConfig, ...prev]);
      toast.success('Impressora adicionada com sucesso!');
      
      return data as PrinterConfig;
    } catch (err: any) {
      console.error('[PRINTER-MANAGER] Error adding printer:', err);
      toast.error('Erro ao adicionar impressora');
      throw err;
    }
  }, []);

  // Update printer
  const updatePrinter = useCallback(async (
    printerId: string,
    updates: Partial<PrinterConfig>
  ) => {
    try {
      // If setting as default, unset other defaults first
      if (updates.is_default) {
        await supabase
          .from('printer_configs')
          .update({ is_default: false })
          .neq('id', printerId);
      }

      const { data, error } = await supabase
        .from('printer_configs')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', printerId)
        .select()
        .single();

      if (error) throw error;

      setPrinters((prev) =>
        prev.map((p) => (p.id === printerId ? (data as PrinterConfig) : p))
      );

      toast.success('Impressora atualizada!');
      return data as PrinterConfig;
    } catch (err: any) {
      console.error('[PRINTER-MANAGER] Error updating printer:', err);
      toast.error('Erro ao atualizar impressora');
      throw err;
    }
  }, []);

  // Delete printer
  const deletePrinter = useCallback(async (printerId: string) => {
    try {
      const { error } = await supabase
        .from('printer_configs')
        .delete()
        .eq('id', printerId);

      if (error) throw error;

      setPrinters((prev) => prev.filter((p) => p.id !== printerId));
      toast.success('Impressora removida!');
    } catch (err: any) {
      console.error('[PRINTER-MANAGER] Error deleting printer:', err);
      toast.error('Erro ao remover impressora');
      throw err;
    }
  }, []);

  // Toggle printer enabled
  const togglePrinterEnabled = useCallback(async (
    printerId: string,
    enabled: boolean
  ) => {
    return updatePrinter(printerId, { is_enabled: enabled });
  }, [updatePrinter]);

  // Set default printer
  const setDefaultPrinter = useCallback(async (printerId: string) => {
    return updatePrinter(printerId, { is_default: true });
  }, [updatePrinter]);

  // Update printer status
  const updatePrinterStatus = useCallback(async (
    printerId: string,
    status: PrinterConfig['last_status']
  ) => {
    try {
      await supabase
        .from('printer_configs')
        .update({
          last_status: status,
          last_used_at: status === 'online' ? new Date().toISOString() : undefined,
        })
        .eq('id', printerId);

      setPrinters((prev) =>
        prev.map((p) =>
          p.id === printerId
            ? { ...p, last_status: status }
            : p
        )
      );
    } catch (err) {
      console.error('[PRINTER-MANAGER] Error updating status:', err);
    }
  }, []);

  // Test printer
  const testPrinter = useCallback(async (printer: PrinterConfig) => {
    try {
      console.log('[PRINTER-MANAGER] Testing printer:', printer.name);

      const { data, error } = await supabase.functions.invoke('print-thermal', {
        body: {
          orderId: 'test-order',
          printerIP: printer.connection_type === 'network' ? printer.ip_address : undefined,
          copies: 1,
          testMode: true,
          testOrder: {
            id: 'test-' + Date.now(),
            customer_name: 'Teste de Impressão',
            customer_phone: '(00) 00000-0000',
            total_amount: 99.90,
            delivery_fee: 5.00,
            payment_method: 'pix',
            created_at: new Date().toISOString(),
            status: 'confirmed',
            notes: 'Esta é uma impressão de teste',
            items: [
              { quantity: 1, name: 'Produto Teste', unit_price: 94.90, total_price: 94.90 }
            ]
          }
        }
      });

      if (error) throw error;

      if (data?.success) {
        await updatePrinterStatus(printer.id, 'online');
        toast.success('Impressão de teste enviada com sucesso!');
        return true;
      } else {
        await updatePrinterStatus(printer.id, 'error');
        toast.error(data?.message || 'Falha no teste de impressão');
        return false;
      }
    } catch (err: any) {
      console.error('[PRINTER-MANAGER] Test failed:', err);
      await updatePrinterStatus(printer.id, 'offline');
      toast.error('Erro ao testar impressora: ' + err.message);
      return false;
    }
  }, [updatePrinterStatus]);

  // Get default printer
  const getDefaultPrinter = useCallback(() => {
    return printers.find((p) => p.is_default && p.is_enabled);
  }, [printers]);

  // Initial fetch
  useEffect(() => {
    fetchPrinters();
  }, [fetchPrinters]);

  return {
    printers,
    isLoading,
    error,
    fetchPrinters,
    addPrinter,
    updatePrinter,
    deletePrinter,
    togglePrinterEnabled,
    setDefaultPrinter,
    testPrinter,
    getDefaultPrinter,
  };
}
