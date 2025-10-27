// ===== ROUTE GUARD ÚNICO E OTIMIZADO =====

import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/auth/useAuth';
import { useRole } from '@/hooks/useUnifiedProfile';
import { useSubscriptionContext } from '@/providers/SubscriptionProvider';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { SubscriptionReconciling } from '@/components/SubscriptionReconciling';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAuth?: boolean;
  requireSubscription?: boolean;
  requireRole?: 'customer' | 'admin' | 'attendant';
}

export const ProtectedRoute = ({
  children,
  requireAuth = false,
  requireSubscription = false,
  requireRole,
}: ProtectedRouteProps) => {
  const { user, loading: authLoading } = useAuth();
  const { role, isAdmin, isAttendant, isCustomer, loading: roleLoading } = useRole();
  const { isActive: hasSubscription, isLoading: subLoading } = useSubscriptionContext();
  const location = useLocation();

  // ===== LOADING STATE =====
  // Não bloquear apenas por subscription loading (reconciliação em background)
  const isLoading = authLoading || (requireRole && roleLoading);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <LoadingSpinner />
          <p className="text-muted-foreground">
            {requireRole === 'admin' ? 'Verificando permissões...' :
             requireRole === 'attendant' ? 'Verificando acesso...' :
             'Carregando...'}
          </p>
        </div>
      </div>
    );
  }

  // ===== AUTH CHECK =====
  if (requireAuth && !user) {
    console.log('[ROUTE-GUARD] Redirecting to auth - no user');
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // ===== REDIRECT AUTHENTICATED USERS FROM /auth =====
  if (!requireAuth && user && location.pathname === '/auth') {
    console.log('[ROUTE-GUARD] Redirecting authenticated user from /auth');
    if (isAdmin) return <Navigate to="/admin" replace />;
    if (isAttendant) return <Navigate to="/attendant" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  // ===== ROLE CHECK =====
  if (user && requireRole && role) {
    if (requireRole === 'admin' && !isAdmin) {
      console.log('[ROUTE-GUARD] Access denied - not admin');
      if (isAttendant) return <Navigate to="/attendant" replace />;
      return <Navigate to="/dashboard" replace />;
    }

    if (requireRole === 'attendant' && !isAttendant) {
      console.log('[ROUTE-GUARD] Access denied - not attendant');
      if (isAdmin) return <Navigate to="/admin" replace />;
      return <Navigate to="/dashboard" replace />;
    }

    if (requireRole === 'customer' && !isCustomer) {
      console.log('[ROUTE-GUARD] Access denied - not customer');
      if (isAdmin) return <Navigate to="/admin" replace />;
      if (isAttendant) return <Navigate to="/attendant" replace />;
      return <Navigate to="/dashboard" replace />;
    }
  }

  // ===== SUBSCRIPTION CHECK =====
  if (requireSubscription && user && !hasSubscription) {
    const hasReconciled = user ? sessionStorage.getItem(`reconciled_${user.id}`) === 'true' : false;
    if (subLoading || !hasReconciled) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-full max-w-md px-6">
            <SubscriptionReconciling />
          </div>
        </div>
      );
    }
    console.log('[ROUTE-GUARD] Redirecting to plans - no active subscription after reconciliation');
    return <Navigate to="/plans" replace />;
  }

  // ===== ACCESS GRANTED =====
  return <>{children}</>;
};
