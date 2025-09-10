// ===== ROUTE GUARD UNIFICADO OTIMIZADO =====

import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { useRole } from '@/hooks/useRole';
import { LoadingSpinner } from '@/components/LoadingSpinner';

interface UnifiedProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireSubscription?: boolean;
  requireRole?: 'customer' | 'admin' | 'attendant';
}

export const UnifiedProtectedRoute = ({ 
  children, 
  requireAuth = false, 
  requireSubscription = false,
  requireRole
}: UnifiedProtectedRouteProps) => {
  const { user, loading: authLoading } = useAuth();
  const { subscription } = useSubscription();
  const { isAdmin, loading: roleLoading } = useRole();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (!authLoading && !roleLoading) {
      setIsChecking(false);
    }
  }, [authLoading, roleLoading]);

  // Show loading while checking
  if (isChecking || authLoading || (requireRole && roleLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-4">
            {requireRole === 'admin' ? 'Verificando permissões de administrador...' : 'Carregando...'}
          </p>
        </div>
      </div>
    );
  }

  // Auth check - redirect to auth if required but not logged in
  if (requireAuth && !user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Redirect authenticated users away from auth page
  if (!requireAuth && user && location.pathname === '/auth') {
    return <Navigate to="/dashboard" replace />;
  }

  // Role-based checks
  if (user && requireRole) {
    if (requireRole === 'admin' && !isAdmin) {
      return <Navigate to="/dashboard" replace />;
    }
    
    if (requireRole === 'attendant' && !isAdmin) {
      // For now, only admins can access attendant panel (we'll add proper attendant role later)
      return <Navigate to="/dashboard" replace />;
    }
    
    if (requireRole === 'customer' && isAdmin) {
      return <Navigate to="/admin" replace />;
    }
  }

  // Subscription check
  if (requireSubscription && user && !subscription.loading && !subscription.subscribed) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};