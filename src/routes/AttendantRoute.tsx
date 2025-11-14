// ===== ROTA PROTEGIDA PARA ATENDENTES =====
// ✅ CORREÇÃO CRÍTICA: Usar useAuth direto para evitar conflitos com subscription

import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/auth/useAuth';
import { useRole } from '@/hooks/useUnifiedProfile';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { AttendantProvider } from '@/providers/AttendantProvider';

interface AttendantRouteProps {
  children: React.ReactNode;
}

export const AttendantRoute = ({ children }: AttendantRouteProps) => {
  // ✅ CORREÇÃO: Usar useAuth DIRETO (não useUnifiedAuth) para evitar trigger de subscription logic
  const { user, loading: authLoading } = useAuth();
  const { role, isAdmin, isAttendant, loading: roleLoading } = useRole();

  const isLoading = authLoading || roleLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    console.log('[ATTENDANT-ROUTE] No user, redirecting to auth');
    return <Navigate to="/auth" replace />;
  }

  // ✅ CORREÇÃO: Verificação mais segura usando os booleans do hook
  if (!isAttendant && !isAdmin) {
    console.log('[ATTENDANT-ROUTE] Access denied - role:', role);
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <AttendantProvider>
      {children}
    </AttendantProvider>
  );
};