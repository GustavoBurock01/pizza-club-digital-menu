import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ReconciliationAttempt {
  timestamp: number;
  userId: string;
  status: 'success' | 'error' | 'timeout';
  result?: any;
  error?: string;
  duration: number;
}

export interface SessionState {
  token: string;
  expiresAt: number;
  isValid: boolean;
  timeRemaining: string;
}

export interface CacheItem {
  key: string;
  value: any;
  timestamp?: number;
  size: number;
}

export interface GeneralStats {
  totalActiveSubscriptions: number;
  totalReconciliationAttempts: number;
  errorRate: number;
  avgReconciliationTime: number;
}

const RECONCILIATION_HISTORY_KEY = 'subscription_reconciliation_history';
const MAX_HISTORY_ITEMS = 50;

export const useSubscriptionMonitoring = () => {
  const { toast } = useToast();
  const [sessionState, setSessionState] = useState<SessionState | null>(null);
  const [history, setHistory] = useState<ReconciliationAttempt[]>([]);
  const [debugLogs, setDebugLogs] = useState<any[]>([]);
  const [stats, setStats] = useState<GeneralStats | null>(null);
  const [loading, setLoading] = useState(false);

  // ===== SESSION STATE =====
  const getSessionState = useCallback(async (): Promise<SessionState | null> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        return null;
      }

      const expiresAt = session.expires_at ? session.expires_at * 1000 : Date.now();
      const timeRemaining = expiresAt - Date.now();
      const isValid = timeRemaining > 0;

      const state: SessionState = {
        token: session.access_token,
        expiresAt,
        isValid,
        timeRemaining: formatTimeRemaining(timeRemaining),
      };

      setSessionState(state);
      return state;
    } catch (error) {
      console.error('[MONITORING] Error getting session state:', error);
      return null;
    }
  }, []);

  // ===== LOCAL CACHE =====
  const listLocalCaches = useCallback((): CacheItem[] => {
    const caches: CacheItem[] = [];
    const keys = Object.keys(localStorage);

    keys.forEach(key => {
      if (key.includes('subscription') || key.includes('reconcile')) {
        try {
          const rawValue = localStorage.getItem(key);
          if (rawValue) {
            const parsed = JSON.parse(rawValue);
            caches.push({
              key,
              value: parsed,
              timestamp: parsed.timestamp || parsed.lastSyncedAt,
              size: new Blob([rawValue]).size,
            });
          }
        } catch {
          // Se não for JSON, adiciona como string
          const rawValue = localStorage.getItem(key);
          caches.push({
            key,
            value: rawValue,
            size: new Blob([rawValue || '']).size,
          });
        }
      }
    });

    return caches.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  }, []);

  const clearLocalCache = useCallback(() => {
    const keys = Object.keys(localStorage);
    let cleared = 0;

    keys.forEach(key => {
      if (key.includes('subscription') || key.includes('reconcile')) {
        localStorage.removeItem(key);
        cleared++;
      }
    });

    toast({
      title: "Cache limpo",
      description: `${cleared} item(ns) removido(s) do cache local.`,
    });

    return cleared;
  }, [toast]);

  const exportCache = useCallback(() => {
    const caches = listLocalCaches();
    const dataStr = JSON.stringify(caches, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `subscription-cache-${new Date().toISOString()}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();

    toast({
      title: "Cache exportado",
      description: "Download iniciado com sucesso.",
    });
  }, [listLocalCaches, toast]);

  // ===== RECONCILIATION HISTORY =====
  const logReconciliationAttempt = useCallback((attempt: ReconciliationAttempt) => {
    try {
      const stored = sessionStorage.getItem(RECONCILIATION_HISTORY_KEY);
      const history: ReconciliationAttempt[] = stored ? JSON.parse(stored) : [];
      
      history.unshift(attempt);
      
      // Manter apenas últimos N itens
      const trimmed = history.slice(0, MAX_HISTORY_ITEMS);
      sessionStorage.setItem(RECONCILIATION_HISTORY_KEY, JSON.stringify(trimmed));
      
      setHistory(trimmed);
    } catch (error) {
      console.error('[MONITORING] Error logging reconciliation attempt:', error);
    }
  }, []);

  const getReconciliationHistory = useCallback((): ReconciliationAttempt[] => {
    try {
      const stored = sessionStorage.getItem(RECONCILIATION_HISTORY_KEY);
      const parsed = stored ? JSON.parse(stored) : [];
      setHistory(parsed);
      return parsed;
    } catch (error) {
      console.error('[MONITORING] Error getting reconciliation history:', error);
      return [];
    }
  }, []);

  const clearReconciliationHistory = useCallback(() => {
    sessionStorage.removeItem(RECONCILIATION_HISTORY_KEY);
    setHistory([]);
    
    toast({
      title: "Histórico limpo",
      description: "Histórico de reconciliações removido.",
    });
  }, [toast]);

  // ===== DEBUG LOGS FROM DB =====
  const fetchDebugLogs = useCallback(async (targetUserId?: string, limit: number = 20) => {
    setLoading(true);
    try {
      let query = supabase
        .from('subscription_debug_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (targetUserId) {
        query = query.eq('target_user_id', targetUserId);
      }

      const { data, error } = await query;

      if (error) throw error;

      setDebugLogs(data || []);
      return data || [];
    } catch (error) {
      console.error('[MONITORING] Error fetching debug logs:', error);
      toast({
        title: "Erro ao buscar logs",
        description: "Não foi possível carregar os logs de debug.",
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // ===== GENERAL STATS =====
  const getGeneralStats = useCallback(async (): Promise<GeneralStats> => {
    setLoading(true);
    try {
      // Total active subscriptions
      const { count: activeCount } = await supabase
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // Reconciliation attempts (últimas 24h)
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      
      const { data: recentLogs } = await supabase
        .from('subscription_debug_logs')
        .select('action, error, duration_ms')
        .gte('created_at', twentyFourHoursAgo);

      const reconciliationAttempts = recentLogs?.filter(log => 
        log.action === 'reconcile' || log.action === 'force_sync'
      ) || [];

      const errors = reconciliationAttempts.filter(log => log.error);
      const errorRate = reconciliationAttempts.length > 0 
        ? (errors.length / reconciliationAttempts.length) * 100 
        : 0;

      const avgTime = reconciliationAttempts.length > 0
        ? reconciliationAttempts.reduce((sum, log) => sum + (log.duration_ms || 0), 0) / reconciliationAttempts.length
        : 0;

      const stats: GeneralStats = {
        totalActiveSubscriptions: activeCount || 0,
        totalReconciliationAttempts: reconciliationAttempts.length,
        errorRate,
        avgReconciliationTime: avgTime,
      };

      setStats(stats);
      return stats;
    } catch (error) {
      console.error('[MONITORING] Error getting general stats:', error);
      return {
        totalActiveSubscriptions: 0,
        totalReconciliationAttempts: 0,
        errorRate: 0,
        avgReconciliationTime: 0,
      };
    } finally {
      setLoading(false);
    }
  }, []);

  // ===== LOG TO DATABASE =====
  const logToDatabase = useCallback(async (
    action: string,
    targetUserId: string,
    result?: any,
    error?: string,
    durationMs?: number
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('subscription_debug_logs').insert({
        admin_id: user.id,
        target_user_id: targetUserId,
        action,
        result: result ? { data: result } : null,
        error,
        duration_ms: durationMs,
      });
    } catch (error) {
      console.error('[MONITORING] Error logging to database:', error);
    }
  }, []);

  // Carregar histórico no mount
  useEffect(() => {
    getReconciliationHistory();
    getSessionState();
  }, [getReconciliationHistory, getSessionState]);

  return {
    // Session
    sessionState,
    getSessionState,
    
    // Cache
    listLocalCaches,
    clearLocalCache,
    exportCache,
    
    // History
    history,
    logReconciliationAttempt,
    getReconciliationHistory,
    clearReconciliationHistory,
    
    // Debug Logs
    debugLogs,
    fetchDebugLogs,
    
    // Stats
    stats,
    getGeneralStats,
    
    // Database logging
    logToDatabase,
    
    // Loading state
    loading,
  };
};

// ===== HELPER FUNCTIONS =====
function formatTimeRemaining(ms: number): string {
  if (ms <= 0) return 'Expirado';
  
  const minutes = Math.floor(ms / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m`;
  return `${Math.floor(ms / 1000)}s`;
}
