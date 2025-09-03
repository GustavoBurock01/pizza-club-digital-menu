// ===== REAL-TIME MANAGER INTELIGENTE E UNIFICADO =====

import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

type EventCallback = (payload: any) => void;

class UnifiedRealtimeManager {
  private static instance: UnifiedRealtimeManager;
  private channel: RealtimeChannel | null = null;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000;
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();
  private eventCallbacks: Map<string, EventCallback[]> = new Map();

  static getInstance(): UnifiedRealtimeManager {
    if (!UnifiedRealtimeManager.instance) {
      UnifiedRealtimeManager.instance = new UnifiedRealtimeManager();
    }
    return UnifiedRealtimeManager.instance;
  }

  // ===== CONNECTION MANAGEMENT =====
  connect() {
    if (this.isConnected) return;

    this.channel = supabase
      .channel('unified-realtime-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders'
        },
        (payload) => this.handleEvent('orders', payload)
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'order_items'
        },
        (payload) => this.handleEvent('order_items', payload)
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products'
        },
        (payload) => this.handleEvent('products', payload)
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles'
        },
        (payload) => this.handleEvent('profiles', payload)
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          this.isConnected = true;
          this.reconnectAttempts = 0;
          console.log('🔗 Real-time conectado - Sistema unificado ativo');
          this.handleEvent('connection', { status: 'connected' });
        } else if (status === 'CHANNEL_ERROR') {
          this.handleConnectionError();
        }
      });
  }

  disconnect() {
    if (this.channel) {
      supabase.removeChannel(this.channel);
      this.channel = null;
      this.isConnected = false;
      this.handleEvent('connection', { status: 'disconnected' });
      console.log('🔌 Real-time desconectado');
    }
  }

  // ===== EVENT MANAGEMENT =====
  private handleEvent(eventType: string, payload: any) {
    // Debounce frequent events to prevent spam
    const debounceKey = `${eventType}-${payload.table}`;
    const existingTimer = this.debounceTimers.get(debounceKey);
    
    if (existingTimer) {
      clearTimeout(existingTimer);
    }
    
    const timer = setTimeout(() => {
      const callbacks = this.eventCallbacks.get(eventType) || [];
      callbacks.forEach(callback => {
        try {
          callback(payload);
        } catch (error) {
          console.error(`Error in real-time callback for ${eventType}:`, error);
        }
      });
      this.debounceTimers.delete(debounceKey);
    }, 300); // 300ms debounce
    
    this.debounceTimers.set(debounceKey, timer);
  }

  subscribe(eventType: string, callback: EventCallback) {
    if (!this.eventCallbacks.has(eventType)) {
      this.eventCallbacks.set(eventType, []);
    }
    this.eventCallbacks.get(eventType)!.push(callback);

    // Auto-connect se não estiver conectado
    if (!this.isConnected) {
      this.connect();
    }

    // Return unsubscribe function
    return () => {
      const callbacks = this.eventCallbacks.get(eventType);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  // ===== CONNECTION ERROR HANDLING =====
  private handleConnectionError() {
    this.isConnected = false;
    this.handleEvent('connection', { status: 'error' });
    
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      
      console.log(`🔄 Tentando reconectar em ${delay}ms (tentativa ${this.reconnectAttempts})`);
      
      setTimeout(() => {
        this.disconnect();
        this.connect();
      }, delay);
    } else {
      console.error('❌ Máximo de tentativas de reconexão excedido');
      this.handleEvent('connection', { status: 'failed' });
    }
  }

  // ===== GETTERS =====
  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  getSubscriberCount(): number {
    let total = 0;
    this.eventCallbacks.forEach(callbacks => {
      total += callbacks.length;
    });
    return total;
  }
}

export const realtimeManager = UnifiedRealtimeManager.getInstance();

// ===== HOOK SIMPLIFICADO =====
export const useRealtimeManager = () => {
  const connect = () => realtimeManager.connect();
  const disconnect = () => realtimeManager.disconnect();
  const isConnected = () => realtimeManager.getConnectionStatus();
  const subscribe = (eventType: string, callback: EventCallback) => 
    realtimeManager.subscribe(eventType, callback);

  return {
    connect,
    disconnect,
    isConnected,
    subscribe,
    getStatus: isConnected,
    getSubscriberCount: () => realtimeManager.getSubscriberCount()
  };
};

// ===== HOOK ESPECÍFICO PARA ORDERS =====
export const useOrdersRealtime = (callback: EventCallback) => {
  const { subscribe } = useRealtimeManager();
  return subscribe('orders', callback);
};

// ===== HOOK ESPECÍFICO PARA PRODUCTS =====
export const useProductsRealtime = (callback: EventCallback) => {
  const { subscribe } = useRealtimeManager();
  return subscribe('products', callback);
};