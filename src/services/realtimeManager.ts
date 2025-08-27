// ===== MANAGER REAL-TIME UNIFICADO =====

import { supabase } from '@/integrations/supabase/client';
// Manager real-time simples - não usa store global
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
    // Log para debugging
    console.log('Order update:', payload);
  }

  private handleOrderItemUpdate(payload: any) {
    // Log para debugging  
    console.log('Order item update:', payload);
  }

  private handleProductUpdate(payload: any) {
    // Log para debugging
    console.log('Product update:', payload);
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