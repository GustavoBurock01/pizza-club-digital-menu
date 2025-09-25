import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSubscriptionGlobal } from './SubscriptionGlobalProvider';
import { useUnifiedAuth } from '@/hooks/useUnifiedAuth';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

interface ProtectedSubscriptionRouteProps {
  children: ReactNode;
  fallbackPath?: string;
  showError?: boolean;
}

export const ProtectedSubscriptionRoute = ({ 
  children, 
  fallbackPath = '/plans',
  showError = true
}: ProtectedSubscriptionRouteProps) => {
  const { user, loading: authLoading } = useUnifiedAuth();
  const { isActive, isLoading: subscriptionLoading, hasBeenChecked } = useSubscriptionGlobal();
  const location = useLocation();

  // ===== LOADING STATES =====

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <LoadingSpinner />
          <p className="text-muted-foreground">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (subscriptionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <LoadingSpinner />
          <p className="text-muted-foreground">Verificando assinatura...</p>
          <p className="text-sm text-muted-foreground/70">
            Aguarde enquanto confirmamos seu acesso...
          </p>
        </div>
      </div>
    );
  }

  // ===== SUBSCRIPTION CHECK =====

  if (hasBeenChecked && !isActive) {
    console.log('[PROTECTED-ROUTE] Access denied - no active subscription:', {
      user: !!user,
      isActive,
      hasBeenChecked,
      path: location.pathname
    });
    
    return <Navigate to={fallbackPath} state={{ 
      from: location,
      reason: 'subscription_required'
    }} replace />;
  }

  // ===== SUCCESS - RENDER CHILDREN =====

  console.log('[PROTECTED-ROUTE] Access granted:', {
    user: user?.email,
    isActive,
    path: location.pathname
  });

  return <>{children}</>;
};