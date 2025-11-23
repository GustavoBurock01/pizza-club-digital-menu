// ===== HOOK ÚNICO DE ASSINATURA - WRAPPER REFATORADO (FASE 2.4) =====
// ⚠️ DEPRECATED (FASE 2.3) - Use useSubscriptionContext() instead
//
// Este hook agora compõe 2 hooks menores para manter a mesma API pública
// Benefícios da refatoração:
// - Query separada de actions
// - Facilita testes unitários
// - Preparado para remoção futura (deprecado)
//
// Migre para: import { useSubscriptionContext } from '@/providers/SubscriptionProvider';

import { useEffect } from 'react';
import { useSubscriptionQuery } from './subscription/useSubscriptionQuery';
import { useSubscriptionActions } from './subscription/useSubscriptionActions';

// Re-export type
export type { SubscriptionData } from './subscription/useSubscriptionQuery';

/**
 * @deprecated Use useSubscriptionContext() instead
 * This hook will be removed in the next major version.
 * 
 * Migration guide:
 * - Old: const { isActive, status } = useSubscription(user?.id);
 * - New: const { isActive, status } = useSubscriptionContext();
 */
export const useSubscription = (userId?: string) => {
  // Log deprecation warning in development (only once per component mount)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        '[DEPRECATED] useSubscription is deprecated. Use useSubscriptionContext() instead.',
        '\nSee docs/MIGRATION_SUBSCRIPTION.md for migration guide.'
      );
    }
  }, []);

  // 1. Query hook - buscar dados
  const query = useSubscriptionQuery(userId);
  
  // 2. Actions hook - ações e realtime
  const actions = useSubscriptionActions(userId);

  // ✅ FASE 2 CLEANUP: Auto-reconcile lógica removida
  // Reconciliação agora é APENAS manual (botão) ou via webhook

  // Retornar API unificada (mesma interface pública)
  return {
    // Data
    subscription: query.subscription,
    isActive: query.isActive,
    status: query.status,
    planName: query.planName,
    planPrice: query.planPrice,
    expiresAt: query.expiresAt,
    
    // Loading states
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    
    // Methods
    refresh: actions.refresh,
    clearCache: actions.clearCache,
    reconcile: actions.reconcile,
  };
};
