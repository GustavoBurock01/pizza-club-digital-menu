// ===== PROVIDER GLOBAL DE ASSINATURA - SIMPLIFICADO =====
// ✅ PONTO ÚNICO DE ACESSO À SUBSCRIPTION
//
// Use apenas via:
//   const { isActive, status, planName, ... } = useSubscriptionContext()

import { createContext, useContext, ReactNode } from 'react';
import { useSubscriptionQuery } from '@/hooks/subscription/useSubscriptionQuery';
import { useSubscriptionActions } from '@/hooks/subscription/useSubscriptionActions';

interface SubscriptionContextType {
  isActive: boolean;
  status: string;
  planName: string;
  planPrice: number;
  expiresAt: string | null;
  isLoading: boolean;
  isError: boolean;
  refresh: () => Promise<void>;
  clearCache: () => void;
  reconcile: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider = ({ 
  children,
  userId 
}: { 
  children: ReactNode;
  userId?: string;
}) => {
  // ✅ CORREÇÃO DEADLOCK: Receber userId como prop ao invés de usar useAuth interno
  const query = useSubscriptionQuery(userId);
  const actions = useSubscriptionActions(userId);

  const value: SubscriptionContextType = {
    isActive: query.isActive,
    status: query.status,
    planName: query.planName,
    planPrice: query.planPrice,
    expiresAt: query.expiresAt || null,
    isLoading: query.isLoading,
    isError: query.isError,
    refresh: actions.refresh,
    clearCache: actions.clearCache,
    reconcile: actions.reconcile,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscriptionContext = () => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscriptionContext must be used within SubscriptionProvider');
  }
  return context;
};
