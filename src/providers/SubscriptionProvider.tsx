// ===== PROVIDER GLOBAL DE ASSINATURA =====
// ✅ PONTO ÚNICO DE ACESSO À SUBSCRIPTION (FASE 2.3)
//
// Use apenas via:
//   const { isActive, status, planName, ... } = useSubscriptionContext()
//
// ❌ NÃO use diretamente:
//   - useSubscription(userId) (DEPRECATED - será removido)
//   - useUnifiedAuth().subscription (DEPRECATED - use useSubscriptionContext)
//
// Benefícios:
//   - Cache compartilhado entre todos os componentes
//   - Zero requests duplicados ao Supabase
//   - Um único canal realtime para sincronização
//   - Facilidade de debugging

import { createContext, useContext, ReactNode } from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { useAuth } from '@/hooks/auth/useAuth';

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

export const SubscriptionProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const subscription = useSubscription(user?.id);

  const value: SubscriptionContextType = {
    isActive: subscription.isActive,
    status: subscription.status,
    planName: subscription.planName,
    planPrice: subscription.planPrice,
    expiresAt: subscription.expiresAt || null,
    isLoading: subscription.isLoading,
    isError: subscription.isError,
    refresh: subscription.refresh,
    clearCache: subscription.clearCache,
    reconcile: subscription.reconcile,
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
