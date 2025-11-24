import React, { createContext, useContext, ReactNode } from 'react';
import { useAttendantOrders, AttendantOrder, AttendantStats } from '@/hooks/admin/useAttendantOrders';
import { useAttendantActions } from '@/hooks/admin/useAttendantActions';
import { useAttendantRealtime } from '@/hooks/admin/useAttendantRealtime';
import { useAutoPrint } from '@/hooks/useAutoPrint';

// Re-export types
export type { AttendantOrder, AttendantStats } from '@/hooks/admin/useAttendantOrders';

interface AttendantContextType {
  orders: AttendantOrder[];
  stats: AttendantStats;
  loading: boolean;
  isConnected: boolean;
  isUpdating: boolean;
  refreshData: () => void;
  updateOrderStatus: (orderId: string, newStatus: string, deliveryMethod?: string) => Promise<void>;
  confirmOrder: (orderId: string) => Promise<void>;
  startPreparation: (orderId: string) => Promise<void>;
  markReady: (orderId: string, deliveryMethod?: string) => Promise<void>;
  markPickedUp: (orderId: string) => Promise<void>;
  markInDelivery: (orderId: string) => Promise<void>;
  markDelivered: (orderId: string) => Promise<void>;
  cancelOrder: (orderId: string, reason?: string) => Promise<void>;
  updatePaymentStatus: (orderId: string, status: string) => Promise<void>;
  autoPrintEnabled: boolean;
}

const AttendantContext = createContext<AttendantContextType | undefined>(undefined);

export const AttendantProvider = ({ children }: { children: ReactNode }) => {
  // Compose specialized hooks with error handling
  let orders: AttendantOrder[] = [];
  let stats: AttendantStats = { 
    total_orders: 0,
    pending_orders: 0, 
    preparing_orders: 0, 
    ready_orders: 0,
    completed_orders: 0,
    total_revenue: 0,
    avg_preparation_time: 0,
    pending_payments: 0,
    presencial_orders: 0,
    to_collect_orders: 0
  };
  let isLoading = true;
  let refetch = () => {};
  let actions: ReturnType<typeof useAttendantActions>;
  let isConnected = false;
  let isAutoPrintEnabled = false;

  try {
    const ordersData = useAttendantOrders();
    orders = ordersData.orders;
    stats = ordersData.stats;
    isLoading = ordersData.isLoading;
    refetch = ordersData.refetch;

    actions = useAttendantActions();
    
    const realtimeData = useAttendantRealtime();
    isConnected = realtimeData.isConnected;

    const autoPrintData = useAutoPrint();
    isAutoPrintEnabled = autoPrintData.isEnabled;
  } catch (error) {
    console.error('[ATTENDANT PROVIDER] Error initializing hooks:', error);
    // Fallback to safe defaults
    actions = {
      updateOrderStatus: async () => {},
      confirmOrder: async () => {},
      startPreparation: async () => {},
      markReady: async () => {},
      markPickedUp: async () => {},
      markInDelivery: async () => {},
      markDelivered: async () => {},
      cancelOrder: async () => {},
      updatePaymentStatus: async () => {},
      isUpdating: false,
    } as any;
  }

  // Wrappers to match interface signatures (convert Promise<boolean> to Promise<void>)
  const handleUpdateOrderStatus = async (orderId: string, newStatus: string, deliveryMethod?: string): Promise<void> => {
    try {
      await actions.updateOrderStatus(orderId, newStatus as any, {});
    } catch (error) {
      console.error('[ATTENDANT] Error updating order status:', error);
    }
  };

  const handleConfirmOrder = async (orderId: string): Promise<void> => {
    try {
      await actions.confirmOrder(orderId);
    } catch (error) {
      console.error('[ATTENDANT] Error confirming order:', error);
    }
  };

  const handleStartPreparation = async (orderId: string): Promise<void> => {
    try {
      await actions.startPreparation(orderId);
    } catch (error) {
      console.error('[ATTENDANT] Error starting preparation:', error);
    }
  };

  const handleMarkReady = async (orderId: string, deliveryMethod?: string): Promise<void> => {
    try {
      await actions.markReady(orderId, deliveryMethod);
    } catch (error) {
      console.error('[ATTENDANT] Error marking ready:', error);
    }
  };

  const handleMarkPickedUp = async (orderId: string): Promise<void> => {
    try {
      await actions.markPickedUp(orderId);
    } catch (error) {
      console.error('[ATTENDANT] Error marking picked up:', error);
    }
  };

  const handleMarkInDelivery = async (orderId: string): Promise<void> => {
    try {
      await actions.markInDelivery(orderId);
    } catch (error) {
      console.error('[ATTENDANT] Error marking in delivery:', error);
    }
  };

  const handleMarkDelivered = async (orderId: string): Promise<void> => {
    try {
      await actions.markDelivered(orderId);
    } catch (error) {
      console.error('[ATTENDANT] Error marking delivered:', error);
    }
  };

  const handleCancelOrder = async (orderId: string, reason?: string): Promise<void> => {
    try {
      await actions.cancelOrder(orderId, reason);
    } catch (error) {
      console.error('[ATTENDANT] Error cancelling order:', error);
    }
  };

  const handleUpdatePaymentStatus = async (orderId: string, status: string): Promise<void> => {
    try {
      await actions.updatePaymentStatus(orderId, status);
    } catch (error) {
      console.error('[ATTENDANT] Error updating payment status:', error);
    }
  };

  const value = {
    orders,
    stats,
    loading: isLoading,
    isConnected,
    isUpdating: actions.isUpdating,
    refreshData: refetch,
    updateOrderStatus: handleUpdateOrderStatus,
    confirmOrder: handleConfirmOrder,
    startPreparation: handleStartPreparation,
    markReady: handleMarkReady,
    markPickedUp: handleMarkPickedUp,
    markInDelivery: handleMarkInDelivery,
    markDelivered: handleMarkDelivered,
    cancelOrder: handleCancelOrder,
    updatePaymentStatus: handleUpdatePaymentStatus,
    autoPrintEnabled: isAutoPrintEnabled,
  };

  return (
    <AttendantContext.Provider value={value}>
      {children}
    </AttendantContext.Provider>
  );
};

export const useAttendant = () => {
  const context = useContext(AttendantContext);
  if (context === undefined) {
    throw new Error('useAttendant must be used within AttendantProvider');
  }
  return context;
};
