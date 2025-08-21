import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { LoadingSpinner } from '@/components/LoadingSpinner';

interface AttendantRouteProps {
  children: React.ReactNode;
}

export const AttendantRoute = ({ children }: AttendantRouteProps) => {
  const { user, loading: authLoading } = useAuth();
  const { hasAnyRole, loading: roleLoading } = useRole();
  const location = useLocation();

  // Show loading while checking
  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-4">Verificando permissões de atendente...</p>
        </div>
      </div>
    );
  }

  // Redirect to auth if not logged in
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Only allow admin and attendant access
  if (!hasAnyRole(['admin', 'attendant'])) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};