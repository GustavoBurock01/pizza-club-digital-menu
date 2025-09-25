import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSubscriptionCore } from '@/hooks/useSubscriptionCore';
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
  const location = useLocation();
  
  const {
    isLoading: subscriptionLoading,
    isError: subscriptionError,
    error: subscriptionErrorObj,
    isActive,
    validation,
    refresh
  } = useSubscriptionCore(user?.id, {
    enabled: !!user,
    staleTime: 30_000, // 30 segundos
  });

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

  // ===== ERROR HANDLING =====

  if (subscriptionError && showError) {
    const errorMessage = subscriptionErrorObj?.message || 'Erro desconhecido';
    
    // Se for erro de autenticação, redirecionar para login
    if (errorMessage.includes('Authentication') || 
        errorMessage.includes('login')) {
      return <Navigate to="/auth" state={{ 
        from: location,
        reason: 'authentication_required',
        message: 'Sua sessão expirou. Faça login novamente.'
      }} replace />;
    }

    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
              <div>
                <h3 className="text-lg font-semibold">Erro na Verificação</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Não foi possível verificar sua assinatura. Tente novamente.
                </p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  {errorMessage}
                </p>
              </div>
              <div className="space-y-2">
                <button 
                  onClick={() => refresh()}
                  className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                >
                  Tentar Novamente
                </button>
                <button 
                  onClick={() => window.location.href = fallbackPath}
                  className="w-full px-4 py-2 border border-border rounded-md hover:bg-accent"
                >
                  Ver Planos de Assinatura
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ===== SUBSCRIPTION CHECK =====

  if (!isActive) {
    console.log('[PROTECTED-ROUTE] Access denied - no active subscription:', {
      user: !!user,
      isActive,
      validation,
      path: location.pathname
    });
    
    return <Navigate to={fallbackPath} state={{ 
      from: location,
      reason: 'subscription_required',
      lastValidation: validation
    }} replace />;
  }

  // ===== SUCCESS - RENDER CHILDREN =====

  console.log('[PROTECTED-ROUTE] Access granted:', {
    user: user.email,
    planName: validation.planName,
    expiresAt: validation.expiresAt,
    path: location.pathname
  });

  return <>{children}</>;
};