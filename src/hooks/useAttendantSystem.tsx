// ===== SISTEMA UNIFICADO DE ATENDENTE =====

import { useCallback } from 'react';
import { useAttendantStats } from './useAttendantStats';
import { useAttendantOrders } from './useAttendantOrders';
import { toast } from 'sonner';

export interface AttendantSystemState {
  // Statistics
  stats: {
    pendingOrders: number;
    preparingOrders: number;
    avgDeliveryTime: number;
    todayCustomers: number;
  } | undefined;
  
  // Orders
  orders: any[] | undefined;
  
  // Loading states  
  statsLoading: boolean;
  ordersLoading: boolean;
  isUpdatingOrder: boolean;
  
  // Actions
  updateOrderStatus: (orderId: string, status: string) => Promise<void>;
  refreshStats: () => void;
  refreshOrders: () => void;
}

export const useAttendantSystem = (): AttendantSystemState => {
  const { stats, loading: statsLoading } = useAttendantStats();
  const { orders, loading: ordersLoading, updateOrderStatus, isUpdating: isUpdatingOrder } = useAttendantOrders();

  const refreshStats = useCallback(() => {
    // Trigger stats refetch by invalidating queries
    window.dispatchEvent(new CustomEvent('refresh-attendant-stats'));
  }, []);

  const refreshOrders = useCallback(() => {
    // Trigger orders refetch by invalidating queries
    window.dispatchEvent(new CustomEvent('refresh-attendant-orders'));
  }, []);

  return {
    stats,
    orders,
    statsLoading,
    ordersLoading,
    isUpdatingOrder,
    updateOrderStatus,
    refreshStats,
    refreshOrders
  };
};