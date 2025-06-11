
import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireSubscription?: boolean;
}

export const ProtectedRoute = ({ 
  children, 
  requireAuth = false, 
  requireSubscription = false 
}: ProtectedRouteProps) => {
  const { user, loading: authLoading } = useAuth();
  const { subscription } = useSubscription();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      setIsChecking(false);
    }
  }, [authLoading]);

  // Show loading while checking authentication
  if (isChecking || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pizza-red mx-auto mb-4"></div>
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  // Redirect to auth if authentication is required but user is not logged in
  if (requireAuth && !user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Redirect authenticated users away from auth page
  if (!requireAuth && user && location.pathname === '/auth') {
    return <Navigate to="/dashboard" replace />;
  }

  // Redirect to index if on auth page but already authenticated
  if (user && location.pathname === '/auth') {
    return <Navigate to="/" replace />;
  }

  // Check subscription requirement
  if (requireSubscription && user && !subscription.loading && !subscription.subscribed) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
