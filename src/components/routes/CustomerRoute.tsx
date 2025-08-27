import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { LoadingSpinner } from '@/components/LoadingSpinner';

interface CustomerRouteProps {
  children: React.ReactNode;
}

export const CustomerRoute = ({ children }: CustomerRouteProps) => {
  const { user, loading: authLoading } = useAuth();
  const { role, loading: roleLoading } = useRole();
  const location = useLocation();

  // Show loading while checking
  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-4">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  // Redirect to auth if not logged in
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Redirect based on role
  if (role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  if (role === 'attendant') {
    return <Navigate to="/attendant" replace />;
  }

  // Allow access for customers
  return <>{children}</>;
};