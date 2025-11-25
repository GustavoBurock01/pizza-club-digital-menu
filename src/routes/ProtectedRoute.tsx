// ===== ROUTE GUARD ÚNICO E OTIMIZADO =====

import { ReactNode, useState, useEffect } from 'react';
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

  // ===== SAFETY TIMEOUT =====
  // ✅ Prevenir loading infinito com timeout de 10 segundos
  const [safetyTimeout, setSafetyTimeout] = useState(false);

  // ===== LOADING STATE =====
  // ✅ CORREÇÃO: Sempre esperar role carregar para decisões de redirecionamento corretas
  const isLoading = authLoading || roleLoading;

  useEffect(() => {
    if (!isLoading) return;
    
    const timer = setTimeout(() => {
      console.warn('[ROUTE-GUARD] ⚠️ Loading timeout após 10s - forçando render');
      setSafetyTimeout(true);
    }, 10000);
    
    return () => clearTimeout(timer);
  }, [isLoading]);

  if (isLoading && !safetyTimeout) {
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
  // ✅ CORREÇÃO: Atendentes e admins não precisam de subscription
  if (requireSubscription && user && !hasSubscription && !isAdmin && !isAttendant) {
    const lastRecon = user ? Number(sessionStorage.getItem(`reconciled_${user.id}`) || '0') : 0;
    const reconciledRecently = lastRecon && (Date.now() - lastRecon < 60_000);
    if (subLoading || !reconciledRecently) {
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
