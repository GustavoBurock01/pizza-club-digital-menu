import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/services/supabase';
import { PrintLog } from '@/components/printing/PrintLogsTable';

interface UsePrintLogsOptions {
  limit?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function usePrintLogs(options: UsePrintLogsOptions = {}) {
  const { limit = 50, autoRefresh = false, refreshInterval = 30000 } = options;

  const [logs, setLogs] = useState<PrintLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch logs
  const fetchLogs = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('print_logs')
        .select(`
          *,
          printer_configs (name),
          orders (order_number)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (fetchError) throw fetchError;

      const formattedLogs: PrintLog[] = (data || []).map((log: any) => ({
        id: log.id,
        printer_id: log.printer_id,
        printer_name: log.printer_configs?.name,
        order_id: log.order_id,
        order_number: log.orders?.order_number,
        status: log.status,
        copies_requested: log.copies_requested,
        copies_printed: log.copies_printed,
        error_message: log.error_message,
        created_at: log.created_at,
      }));

      setLogs(formattedLogs);
    } catch (err: any) {
      console.error('[PRINT-LOGS] Error fetching logs:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  // Log a print event
  const logPrintEvent = useCallback(async (event: {
    printer_id: string;
    order_id: string;
    status: 'success' | 'failed' | 'pending';
    copies_requested: number;
    copies_printed: number;
    error_message?: string;
  }) => {
    try {
      const { data, error } = await supabase
        .from('print_logs')
        .insert({
          printer_id: event.printer_id,
          order_id: event.order_id,
          status: event.status,
          copies_requested: event.copies_requested,
          copies_printed: event.copies_printed,
          error_message: event.error_message,
        })
        .select()
        .single();

      if (error) throw error;

      // Add to local state
      const newLog: PrintLog = {
        id: data.id,
        printer_id: data.printer_id,
        order_id: data.order_id,
        status: data.status as PrintLog['status'],
        copies_requested: data.copies_requested,
        copies_printed: data.copies_printed,
        error_message: data.error_message,
        created_at: data.created_at,
      };
      setLogs((prev) => [newLog, ...prev].slice(0, limit));

      return data;
    } catch (err: any) {
      console.error('[PRINT-LOGS] Error logging event:', err);
      throw err;
    }
  }, [limit]);

  // Get stats
  const getStats = useCallback(() => {
    const total = logs.length;
    const successful = logs.filter((l) => l.status === 'success').length;
    const failed = logs.filter((l) => l.status === 'failed').length;
    const pending = logs.filter((l) => l.status === 'pending').length;

    return {
      total,
      successful,
      failed,
      pending,
      successRate: total > 0 ? (successful / total) * 100 : 0,
    };
  }, [logs]);

  // Clear old logs (admin function)
  const clearOldLogs = useCallback(async (daysOld: number = 30) => {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const { error } = await supabase
        .from('print_logs')
        .delete()
        .lt('created_at', cutoffDate.toISOString());

      if (error) throw error;

      await fetchLogs();
    } catch (err: any) {
      console.error('[PRINT-LOGS] Error clearing logs:', err);
      throw err;
    }
  }, [fetchLogs]);

  // Initial fetch
  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchLogs, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchLogs]);

  return {
    logs,
    isLoading,
    error,
    fetchLogs,
    logPrintEvent,
    getStats,
    clearOldLogs,
  };
}
