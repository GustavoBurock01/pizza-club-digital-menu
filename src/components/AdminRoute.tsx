import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { LoadingSpinner } from '@/components/LoadingSpinner';

interface AdminRouteProps {
  children: React.ReactNode;
}

export const AdminRoute = ({ children }: AdminRouteProps) => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useRole();
  const location = useLocation();

  // Show loading while checking authentication and admin status
  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-4">Verificando permissões de administrador...</p>
        </div>
      </div>
    );
  }

  // Redirect to auth if not logged in
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Redirect to dashboard if not admin
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};