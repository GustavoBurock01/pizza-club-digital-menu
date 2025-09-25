// ===== ROUTE GUARD UNIFICADO OTIMIZADO =====

import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useUnifiedAuth } from '@/hooks/useUnifiedAuth';
import { useRole } from '@/hooks/useUnifiedProfile';
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
  const { user, subscription, loading: authLoading } = useUnifiedAuth();
  const { role, isAdmin, isAttendant, isCustomer, loading: roleLoading } = useRole();
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
            {requireRole === 'admin' ? 'Verificando permissões de administrador...' : 
             requireRole === 'attendant' ? 'Verificando permissões de atendente...' : 
             'Carregando...'}
          </p>
        </div>
      </div>
    );
  }

  // Auth check - redirect to auth if required but not logged in
  if (requireAuth && !user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Redirect authenticated users away from auth page to their appropriate dashboard
  if (!requireAuth && user && location.pathname === '/auth') {
    if (role) {
      switch (role) {
        case 'admin':
          return <Navigate to="/admin" replace />;
        case 'attendant':
          return <Navigate to="/attendant" replace />;
        default:
          return <Navigate to="/dashboard" replace />;
      }
    }
    return <Navigate to="/dashboard" replace />;
  }

  // Role-based checks - only redirect if user has a role and doesn't match required role
  if (user && requireRole && role) {
    // Redirect based on user role mismatch
    if (requireRole === 'admin' && !isAdmin) {
      // Non-admin trying to access admin routes
      if (isAttendant) {
        return <Navigate to="/attendant" replace />;
      }
      return <Navigate to="/dashboard" replace />;
    }
    
    if (requireRole === 'attendant' && !isAttendant) {
      // Non-attendant trying to access attendant routes
      if (isAdmin) {
        return <Navigate to="/admin" replace />;
      }
      return <Navigate to="/dashboard" replace />;
    }
    
    if (requireRole === 'customer' && !isCustomer) {
      // Non-customer trying to access customer routes
      if (isAdmin) {
        return <Navigate to="/admin" replace />;
      }
      if (isAttendant) {
        return <Navigate to="/attendant" replace />;
      }
      return <Navigate to="/dashboard" replace />;
    }
  }

  // Subscription check - only redirect to plans for routes that explicitly require subscription
  if (requireSubscription && user && !subscription.loading && !subscription.subscribed) {
    return <Navigate to="/plans" replace />;
  }

  return <>{children}</>;
};