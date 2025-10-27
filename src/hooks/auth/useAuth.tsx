// ===== AUTH HOOK - REFATORADO (FASE 2) =====

import { useCallback } from 'react';
import { useAuthState } from './useAuthState';
import { useAuthActions } from './useAuthActions';

export const useAuth = () => {
  const { user, session, loading } = useAuthState();
  const { signIn, signUp, signOut, updateProfile } = useAuthActions(user);

  const isAuthenticated = useCallback(() => {
    return !!user && !!session;
  }, [user, session]);

  return {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
    isAuthenticated,
  };
};
