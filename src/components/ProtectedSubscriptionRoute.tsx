// ===== PROTEÇÃO DE ROTA SIMPLIFICADA PARA ASSINATURAS =====

import { ReactNode, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useUnifiedAuth } from '@/hooks/useUnifiedAuth';
import { LoadingSpinner } from '@/components/LoadingSpinner';

interface ProtectedSubscriptionRouteProps {
  children: ReactNode;
  fallbackPath?: string;
}

export const ProtectedSubscriptionRoute = ({ 
  children, 
  fallbackPath = '/plans'
}: ProtectedSubscriptionRouteProps) => {
  const { user, subscription, loading: authLoading, refreshSubscription } = useUnifiedAuth();
  const location = useLocation();

  // Proactively refresh subscription when user exists and subscription is loading
  useEffect(() => {
    if (user && subscription.loading) {
      refreshSubscription();
    }
  }, [user?.id, subscription.loading, refreshSubscription]);

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-4 text-muted-foreground">Verificando acesso...</p>
        </div>
      </div>
    );
  }

  // Redirect to auth if not authenticated
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Show loading while checking subscription
  if (subscription.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-4 text-muted-foreground">Verificando assinatura...</p>
        </div>
      </div>
    );
  }

  // Redirect to plans if no active subscription
  if (!subscription.subscribed || subscription.status !== 'active') {
    console.log('[PROTECTED-SUBSCRIPTION-ROUTE] No active subscription, redirecting to plans');
    return <Navigate to={fallbackPath} state={{ from: location }} replace />;
  }

  // If user has active subscription, render the protected content
  console.log('[PROTECTED-SUBSCRIPTION-ROUTE] Access granted for user with active subscription');
  return <>{children}</>;
};