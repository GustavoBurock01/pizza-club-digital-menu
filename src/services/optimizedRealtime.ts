// ===== REALTIME MANAGER OTIMIZADO =====

import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';
import { debounce } from '@/utils/performance';

type EventCallback = (payload: any) => void;

class OptimizedRealtimeManager {
  private channel: any = null;
  private isConnected = false;
  private subscribers = new Map<string, EventCallback[]>();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  // Debounce para 100ms
  private debouncedEvents = debounce((events: any[]) => {
    events.forEach(event => this.processEvent(event));
  }, 100);

  connect() {
    if (this.channel) return;

    this.channel = supabase.channel('app-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, 
          (payload) => this.handleEvent('orders', payload))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items' }, 
          (payload) => this.handleEvent('order_items', payload))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, 
          (payload) => this.handleEvent('products', payload))
      .subscribe((status: string) => {
        this.isConnected = status === 'SUBSCRIBED';
        if (status === 'CLOSED') this.handleDisconnect();
      });
  }

  disconnect() {
    if (this.channel) {
      supabase.removeChannel(this.channel);
      this.channel = null;
    }
    this.isConnected = false;
  }

  subscribe(eventType: string, callback: EventCallback) {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, []);
    }
    this.subscribers.get(eventType)!.push(callback);

    if (!this.isConnected) this.connect();

    return () => {
      const callbacks = this.subscribers.get(eventType) || [];
      const index = callbacks.indexOf(callback);
      if (index > -1) callbacks.splice(index, 1);
    };
  }

  private handleEvent(eventType: string, payload: any) {
    this.debouncedEvents([{ eventType, payload }]);
  }

  private processEvent({ eventType, payload }: { eventType: string, payload: any }) {
    const callbacks = this.subscribers.get(eventType) || [];
    callbacks.forEach(callback => {
      try {
        callback(payload);
      } catch (error) {
        console.warn(`Error in realtime callback for ${eventType}:`, error);
      }
    });
  }

  private handleDisconnect() {
    this.isConnected = false;
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      setTimeout(() => {
        this.reconnectAttempts++;
        this.connect();
      }, Math.pow(2, this.reconnectAttempts) * 1000);
    }
  }

  getConnectionStatus() {
    return this.isConnected;
  }
}

export const realtimeManager = new OptimizedRealtimeManager();

// Hook simplificado
export const useOptimizedRealtime = () => {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsConnected(realtimeManager.getConnectionStatus());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return {
    isConnected,
    subscribe: realtimeManager.subscribe.bind(realtimeManager),
    connect: realtimeManager.connect.bind(realtimeManager),
    disconnect: realtimeManager.disconnect.bind(realtimeManager)
  };
};

// Hooks específicos otimizados
export const useOrdersRealtime = (callback: EventCallback) => {
  useEffect(() => {
    return realtimeManager.subscribe('orders', callback);
  }, [callback]);
};

export const useProductsRealtime = (callback: EventCallback) => {
  useEffect(() => {
    return realtimeManager.subscribe('products', callback);
  }, [callback]);
};