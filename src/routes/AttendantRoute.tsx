// ===== ROTA PROTEGIDA PARA ATENDENTES =====

import { Navigate } from 'react-router-dom';
import { useUnifiedAuth } from '@/hooks/useUnifiedAuth';
import { useRole } from '@/hooks/useRole';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { AttendantProvider } from '@/providers/AttendantProvider';

interface AttendantRouteProps {
  children: React.ReactNode;
}

export const AttendantRoute = ({ children }: AttendantRouteProps) => {
  const { user, loading: authLoading } = useUnifiedAuth();
  const { role, loading: roleLoading } = useRole();

  const isLoading = authLoading || roleLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (role !== 'attendant' && role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <AttendantProvider>
      {children}
    </AttendantProvider>
  );
};