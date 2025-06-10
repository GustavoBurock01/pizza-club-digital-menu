
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireSubscription?: boolean;
}

export const ProtectedRoute = ({ 
  children, 
  requireAuth = true, 
  requireSubscription = false 
}: ProtectedRouteProps) => {
  const { user, loading: authLoading } = useAuth();
  const { subscription } = useSubscription();

  if (authLoading || (requireSubscription && subscription.loading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-pizza-red" />
      </div>
    );
  }

  if (requireAuth && !user) {
    return <Navigate to="/auth" replace />;
  }

  if (!requireAuth && user) {
    return <Navigate to="/dashboard" replace />;
  }

  if (requireSubscription && !subscription.subscribed) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
