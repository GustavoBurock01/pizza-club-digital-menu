// ===== AUTH HOOK - REFATORADO (FASE 2.1) =====
// Este hook agora compõe 2 hooks menores para melhor manutenibilidade
// Benefícios da refatoração:
// - Estado separado de ações
// - Facilita testes unitários
// - Código mais limpo e legível

import { useAuthState } from './useAuthState';
import { useAuthActions } from './useAuthActions';

/**
 * Hook unificado de autenticação
 * Mantém a mesma API pública para compatibilidade
 * 
 * @example
 * const { user, loading, signIn, signOut } = useAuth();
 */
export const useAuth = () => {
  // 1. State hook - gerencia sessão e estado
  const state = useAuthState();
  
  // 2. Actions hook - gerencia ações de autenticação
  const actions = useAuthActions();

  // Retornar API unificada (mesma interface pública)
  return {
    // State
    user: state.user,
    session: state.session,
    loading: state.loading,
    
    // Actions
    signIn: actions.signIn,
    signUp: actions.signUp,
    signOut: actions.signOut,
    updateProfile: actions.updateProfile,
    redirecting: actions.redirecting,
    
    // Computed
    isAuthenticated: !!state.user,
  };
};
