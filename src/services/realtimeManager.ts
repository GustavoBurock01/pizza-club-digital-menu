// ===== MANAGER REAL-TIME UNIFICADO =====

import { supabase } from '@/integrations/supabase/client';
import { useGlobalStore } from '@/stores/globalStore';
import { RealtimeChannel } from '@supabase/supabase-js';

class RealtimeManager {
  private static instance: RealtimeManager;
  private channel: RealtimeChannel | null = null;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000;

  static getInstance(): RealtimeManager {
    if (!RealtimeManager.instance) {
      RealtimeManager.instance = new RealtimeManager();
    }
    return RealtimeManager.instance;
  }

  connect() {
    if (this.isConnected) return;

    this.channel = supabase
      .channel('unified-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders'
        },
        (payload) => this.handleOrderUpdate(payload)
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'order_items'
        },
        (payload) => this.handleOrderItemUpdate(payload)
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products'
        },
        (payload) => this.handleProductUpdate(payload)
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          this.isConnected = true;
          this.reconnectAttempts = 0;
          console.log('✅ Real-time conectado');
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
      console.log('🔌 Real-time desconectado');
    }
  }

  private handleOrderUpdate(payload: any) {
    const store = useGlobalStore.getState();
    
    switch (payload.eventType) {
      case 'INSERT':
        store.addOrder(payload.new);
        break;
      case 'UPDATE':
        store.updateOrder(payload.new.id, payload.new);
        break;
      case 'DELETE':
        // Handle order deletion if needed
        break;
    }

    // Trigger admin stats refresh if needed
    store.refreshStats();
  }

  private handleOrderItemUpdate(payload: any) {
    // Refresh related order data
    const store = useGlobalStore.getState();
    store.refreshStats();
  }

  private handleProductUpdate(payload: any) {
    const store = useGlobalStore.getState();
    
    switch (payload.eventType) {
      case 'UPDATE':
        // Update product in menu if it's currently loaded
        const products = store.products;
        const updatedProducts = products.map(product => 
          product.id === payload.new.id ? { ...product, ...payload.new } : product
        );
        store.setProducts(updatedProducts);
        break;
    }
  }

  private handleConnectionError() {
    this.isConnected = false;
    
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
    }
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }
}

export const realtimeManager = RealtimeManager.getInstance();

// Hook para usar o real-time manager
export const useRealtimeManager = () => {
  const connect = () => realtimeManager.connect();
  const disconnect = () => realtimeManager.disconnect();
  const isConnected = () => realtimeManager.getConnectionStatus();

  return {
    connect,
    disconnect,
    isConnected
  };
};