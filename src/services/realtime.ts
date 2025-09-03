// ===== REAL-TIME SERVICE UNIFICADO - UM ÚNICO CANAL =====

import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

type EventCallback = (payload: any) => void;
type EventType = 'orders' | 'payments' | 'products' | 'connection';

class UnifiedRealtimeService {
  private static instance: UnifiedRealtimeService;
  private channel: RealtimeChannel | null = null;
  private isConnected: boolean = false;
  private subscribers: Map<EventType, EventCallback[]> = new Map();
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();

  static getInstance(): UnifiedRealtimeService {
    if (!UnifiedRealtimeService.instance) {
      UnifiedRealtimeService.instance = new UnifiedRealtimeService();
    }
    return UnifiedRealtimeService.instance;
  }

  // ===== CONNECTION MANAGEMENT =====
  connect() {
    if (this.isConnected) return;

    this.channel = supabase
      .channel('app-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => this.handleEvent('orders', payload)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'order_items' },
        (payload) => this.handleEvent('orders', payload) // Order items affect orders
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        (payload) => this.handleEvent('products', payload)
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          this.isConnected = true;
          console.log('🔗 Real-time conectado (canal único)');
          this.dispatch('connection', { status: 'connected' });
        } else if (status === 'CHANNEL_ERROR') {
          this.isConnected = false;
          this.dispatch('connection', { status: 'error' });
        }
      });
  }

  disconnect() {
    if (this.channel) {
      supabase.removeChannel(this.channel);
      this.channel = null;
      this.isConnected = false;
      this.dispatch('connection', { status: 'disconnected' });
      console.log('🔌 Real-time desconectado');
    }
  }

  // ===== EVENT HANDLING WITH DEBOUNCE =====
  private handleEvent(eventType: EventType, payload: any) {
    const debounceKey = `${eventType}-${payload.eventType}`;
    
    // Clear existing timer
    const existingTimer = this.debounceTimers.get(debounceKey);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }
    
    // Set new debounced dispatch
    const timer = setTimeout(() => {
      this.dispatch(eventType, payload);
      this.debounceTimers.delete(debounceKey);
    }, 300); // 300ms debounce
    
    this.debounceTimers.set(debounceKey, timer);
  }

  private dispatch(eventType: EventType, payload: any) {
    const callbacks = this.subscribers.get(eventType) || [];
    callbacks.forEach(callback => {
      try {
        callback(payload);
      } catch (error) {
        console.error(`Error in realtime callback for ${eventType}:`, error);
      }
    });
  }

  // ===== SUBSCRIPTION MANAGEMENT =====
  subscribe(eventType: EventType, callback: EventCallback) {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, []);
    }
    this.subscribers.get(eventType)!.push(callback);

    // Auto-connect if not connected
    if (!this.isConnected) {
      this.connect();
    }

    // Return unsubscribe function
    return () => {
      const callbacks = this.subscribers.get(eventType);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
        
        // Disconnect if no more subscribers
        if (this.getTotalSubscribers() === 0) {
          this.disconnect();
        }
      }
    };
  }

  // ===== UTILITY METHODS =====
  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  getTotalSubscribers(): number {
    let total = 0;
    this.subscribers.forEach(callbacks => {
      total += callbacks.length;
    });
    return total;
  }
}

// ===== SINGLETON INSTANCE =====
export const realtimeService = UnifiedRealtimeService.getInstance();

// ===== SPECIFIC SUBSCRIPTION FUNCTIONS =====
export const subscribeToOrders = (callback: EventCallback) => 
  realtimeService.subscribe('orders', callback);

export const subscribeToPayments = (callback: EventCallback) => 
  realtimeService.subscribe('payments', callback);

export const subscribeToProducts = (callback: EventCallback) => 
  realtimeService.subscribe('products', callback);

export const subscribeToConnection = (callback: EventCallback) => 
  realtimeService.subscribe('connection', callback);