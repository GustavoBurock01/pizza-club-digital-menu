import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/services/supabase';
import { useQueryClient } from '@tanstack/react-query';
import { RealtimeChannel } from '@supabase/supabase-js';

interface UseBaseRealtimeOptions {
  channelName: string;
  tables: string[];
  filters?: Record<string, any>;
  onEvent?: (payload: any) => void;
  debounceMs?: number;
  enabled?: boolean;
}

interface RealtimeMetrics {
  activeChannels: number;
  reconnectAttempts: number;
  lastEventTimestamp: Date | null;
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting';
}

export const useBaseRealtime = (options: UseBaseRealtimeOptions) => {
  const {
    channelName,
    tables,
    filters,
    onEvent,
    debounceMs = 300,
    enabled = true
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [metrics, setMetrics] = useState<RealtimeMetrics>({
    activeChannels: 0,
    reconnectAttempts: 0,
    lastEventTimestamp: null,
    connectionStatus: 'disconnected'
  });

  const channelRef = useRef<RealtimeChannel | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const debounceTimerRef = useRef<NodeJS.Timeout>();
  const queryClient = useQueryClient();

  // Debounced event handler
  const handleEventDebounced = (payload: any) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      console.log(`[REALTIME] 📡 Event received on ${channelName}:`, {
        table: payload.table,
        eventType: payload.eventType,
        timestamp: new Date().toISOString()
      });

      setMetrics(prev => ({
        ...prev,
        lastEventTimestamp: new Date()
      }));

      if (onEvent) {
        onEvent(payload);
      }
    }, debounceMs);
  };

  // Reconnect with exponential backoff
  const reconnectWithBackoff = () => {
    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      console.error(`[REALTIME] ❌ Max reconnect attempts reached for ${channelName}`);
      setMetrics(prev => ({ ...prev, connectionStatus: 'disconnected' }));
      return;
    }

    const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
    reconnectAttemptsRef.current += 1;

    console.log(`[REALTIME] 🔄 Reconnecting ${channelName} in ${delay}ms (attempt ${reconnectAttemptsRef.current})`);
    
    setMetrics(prev => ({
      ...prev,
      reconnectAttempts: reconnectAttemptsRef.current,
      connectionStatus: 'reconnecting'
    }));

    setTimeout(() => {
      setupChannel();
    }, delay);
  };

  // Setup realtime channel
  const setupChannel = () => {
    if (!enabled) {
      console.log(`[REALTIME] ⏸️ ${channelName} disabled`);
      return;
    }

    // Cleanup existing channel
    if (channelRef.current) {
      console.log(`[REALTIME] 🧹 Cleaning up existing ${channelName} channel`);
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    console.log(`[REALTIME] 🚀 Setting up ${channelName} channel`);

    const channel = supabase.channel(channelName);

    // Subscribe to tables
    tables.forEach(table => {
      const config: any = {
        event: '*',
        schema: 'public',
        table
      };

      if (filters && filters[table]) {
        config.filter = filters[table];
      }

      channel.on('postgres_changes', config, (payload) => {
        handleEventDebounced(payload);
      });
    });

    // Handle subscription status
    channel
      .on('system', { event: 'SUBSCRIBED' }, () => {
        console.log(`[REALTIME] ✅ ${channelName} connected`);
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;
        setMetrics(prev => ({ ...prev, connectionStatus: 'connected' }));
      })
      .on('system', { event: 'CHANNEL_ERROR' }, (error) => {
        console.error(`[REALTIME] ❌ ${channelName} error:`, error);
        setIsConnected(false);
        reconnectWithBackoff();
      })
      .on('system', { event: 'CLOSED' }, () => {
        console.log(`[REALTIME] 🔌 ${channelName} disconnected`);
        setIsConnected(false);
        setMetrics(prev => ({ ...prev, connectionStatus: 'disconnected' }));
      })
      .subscribe((status) => {
        console.log(`[REALTIME] 📊 ${channelName} status:`, status);
        
        if (status === 'CHANNEL_ERROR') {
          reconnectWithBackoff();
        }
      });

    channelRef.current = channel;
    setMetrics(prev => ({ ...prev, activeChannels: 1 }));
  };

  useEffect(() => {
    setupChannel();

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      if (channelRef.current) {
        console.log(`[REALTIME] 🧹 Cleanup ${channelName}`);
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [channelName, enabled, ...tables]);

  return {
    isConnected,
    metrics,
    forceReconnect: () => {
      reconnectAttemptsRef.current = 0;
      setupChannel();
    }
  };
};
