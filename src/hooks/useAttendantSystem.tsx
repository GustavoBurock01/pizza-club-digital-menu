// ===== SISTEMA UNIFICADO DE ATENDENTE OTIMIZADO =====

import { useCallback } from 'react';
import { useAttendantStats } from './useAttendantStats';
import { useAttendantOrders } from './useAttendantOrders';
import { attendantOptimizer } from '@/utils/attendantOptimizer';
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
  refreshData: () => void;
  
  // Quick Actions
  confirmOrder: (orderId: string) => Promise<void>;
  startPreparation: (orderId: string) => Promise<void>;
  markReady: (orderId: string) => Promise<void>;
  markDelivered: (orderId: string) => Promise<void>;
  cancelOrder: (orderId: string) => Promise<void>;
}

export const useAttendantSystem = (): AttendantSystemState => {
  const { stats, loading: statsLoading, refetch: refetchStats } = useAttendantStats();
  const { orders, loading: ordersLoading, updateOrderStatus, isUpdating: isUpdatingOrder, refetch: refetchOrders } = useAttendantOrders();

  const refreshData = useCallback(() => {
    attendantOptimizer.clearCache();
    refetchStats();
    refetchOrders();
    toast.success("Dados atualizados!");
  }, [refetchStats, refetchOrders]);

  // Quick action methods for common operations
  const confirmOrder = useCallback(async (orderId: string) => {
    try {
      await updateOrderStatus(orderId, 'confirmed');
      toast.success("Pedido confirmado!");
    } catch (error) {
      toast.error("Erro ao confirmar pedido");
    }
  }, [updateOrderStatus]);

  const startPreparation = useCallback(async (orderId: string) => {
    try {
      await updateOrderStatus(orderId, 'preparing');
      toast.success("Preparo iniciado!");
    } catch (error) {
      toast.error("Erro ao iniciar preparo");
    }
  }, [updateOrderStatus]);

  const markReady = useCallback(async (orderId: string) => {
    try {
      await updateOrderStatus(orderId, 'ready');
      toast.success("Pedido pronto!");
    } catch (error) {
      toast.error("Erro ao marcar como pronto");
    }
  }, [updateOrderStatus]);

  const markDelivered = useCallback(async (orderId: string) => {
    try {
      await updateOrderStatus(orderId, 'delivered');
      toast.success("Pedido entregue!");
    } catch (error) {
      toast.error("Erro ao marcar como entregue");
    }
  }, [updateOrderStatus]);

  const cancelOrder = useCallback(async (orderId: string) => {
    try {
      await updateOrderStatus(orderId, 'cancelled');
      toast.success("Pedido cancelado!");
    } catch (error) {
      toast.error("Erro ao cancelar pedido");
    }
  }, [updateOrderStatus]);

  return {
    stats,
    orders,
    statsLoading,
    ordersLoading,
    isUpdatingOrder,
    updateOrderStatus,
    refreshData,
    confirmOrder,
    startPreparation,
    markReady,
    markDelivered,
    cancelOrder
  };
};