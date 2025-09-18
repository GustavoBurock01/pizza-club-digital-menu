// ===== SISTEMA DE ROTAS PROTEGIDAS OTIMIZADO =====

import { useEffect, useState, useCallback, useMemo } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useUnifiedAuth } from '@/hooks/useUnifiedAuth';
import { useRole } from '@/hooks/useRole';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { performanceOptimizer } from '@/utils/performanceOptimizer';

interface OptimizedProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireSubscription?: boolean;
  requireRole?: 'customer' | 'admin' | 'attendant';
  fallbackPath?: string;
  loadingComponent?: React.ReactNode;
  preloadRoutes?: string[];
}

interface RouteCache {
  timestamp: number;
  result: {
    shouldRedirect: boolean;
    redirectPath?: string;
    canAccess: boolean;
  };
}

const routeCache = new Map<string, RouteCache>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const OptimizedProtectedRoute = ({ 
  children, 
  requireAuth = false, 
  requireSubscription = false,
  requireRole,
  fallbackPath = '/auth',
  loadingComponent,
  preloadRoutes = []
}: OptimizedProtectedRouteProps) => {
  const { user, loading: authLoading, subscription, hasValidSubscription, canAccessFeature } = useUnifiedAuth();
  const { isAdmin, loading: roleLoading } = useRole();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  const [routeResult, setRouteResult] = useState<RouteCache['result'] | null>(null);

  // Memoized cache key for current route state
  const cacheKey = useMemo(() => {
    return `${location.pathname}_${user?.id || 'anonymous'}_${requireAuth}_${requireSubscription}_${requireRole}_${subscription.status}`;
  }, [location.pathname, user?.id, requireAuth, requireSubscription, requireRole, subscription.status]);

  // Optimized route validation with caching
  const validateRouteAccess = useCallback(() => {
    // Check cache first
    const cached = routeCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log('[OPTIMIZED-ROUTE] Using cached result for:', location.pathname);
      setRouteResult(cached.result);
      setIsChecking(false);
      return;
    }

    console.log('[OPTIMIZED-ROUTE] Computing access for:', location.pathname);

    const result = {
      shouldRedirect: false,
      redirectPath: undefined as string | undefined,
      canAccess: true
    };

    // Auth check
    if (requireAuth && !user) {
      result.shouldRedirect = true;
      result.redirectPath = fallbackPath;
      result.canAccess = false;
    }
    // Redirect authenticated users away from auth page
    else if (!requireAuth && user && location.pathname === '/auth') {
      result.shouldRedirect = true;
      result.redirectPath = '/dashboard';
      result.canAccess = false;
    }
    // Role-based checks
    else if (user && requireRole) {
      if (requireRole === 'admin' && !isAdmin) {
        result.shouldRedirect = true;
        result.redirectPath = '/dashboard';
        result.canAccess = false;
      } else if (requireRole === 'attendant' && !isAdmin) {
        // For now, only admins can access attendant panel
        result.shouldRedirect = true;
        result.redirectPath = '/dashboard';
        result.canAccess = false;
      } else if (requireRole === 'customer' && isAdmin) {
        result.shouldRedirect = true;
        result.redirectPath = '/admin';
        result.canAccess = false;
      }
    }
    // Subscription check - only redirect for routes that explicitly require subscription
    else if (requireSubscription && user && !subscription.loading && !hasValidSubscription()) {
      result.shouldRedirect = true;
      result.redirectPath = '/plans';
      result.canAccess = false;
    }

    // Cache the result
    routeCache.set(cacheKey, {
      timestamp: Date.now(),
      result
    });

    setRouteResult(result);
    setIsChecking(false);
  }, [cacheKey, requireAuth, requireSubscription, requireRole, user, isAdmin, subscription.loading, hasValidSubscription, location.pathname, fallbackPath]);

  // Debounced validation to prevent excessive checks
  const debouncedValidation = useMemo(
    () => performanceOptimizer.debounce(validateRouteAccess, 100),
    [validateRouteAccess]
  );

  // Effect to trigger validation
  useEffect(() => {
    if (!authLoading && !(requireRole && roleLoading)) {
      debouncedValidation();
    }
  }, [authLoading, roleLoading, requireRole, debouncedValidation]);

  // Preload routes for better UX
  useEffect(() => {
    if (preloadRoutes.length > 0) {
      performanceOptimizer.preloadRoutes(preloadRoutes);
    }
  }, [preloadRoutes]);

  // Cache cleanup effect
  useEffect(() => {
    const cleanup = () => {
      const now = Date.now();
      for (const [key, cached] of routeCache.entries()) {
        if (now - cached.timestamp > CACHE_TTL) {
          routeCache.delete(key);
        }
      }
    };

    const interval = setInterval(cleanup, CACHE_TTL);
    return () => clearInterval(interval);
  }, []);

  // Show loading while checking
  if (isChecking || authLoading || (requireRole && roleLoading) || !routeResult) {
    const LoadingComponent = loadingComponent || (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-4 text-muted-foreground">
            {requireRole === 'admin' 
              ? 'Verificando permissões de administrador...' 
              : 'Carregando...'}
          </p>
        </div>
      </div>
    );

    return <>{LoadingComponent}</>;
  }

  // Handle redirects
  if (routeResult.shouldRedirect && routeResult.redirectPath) {
    console.log('[OPTIMIZED-ROUTE] Redirecting to:', routeResult.redirectPath);
    
    // Clear cache for current path since we're redirecting
    routeCache.delete(cacheKey);
    
    return <Navigate to={routeResult.redirectPath} state={{ from: location }} replace />;
  }

  // Allow access
  if (routeResult.canAccess) {
    return <>{children}</>;
  }

  // Fallback - should not reach here normally
  console.warn('[OPTIMIZED-ROUTE] Unexpected state, denying access');
  return <Navigate to={fallbackPath} state={{ from: location }} replace />;
};

// Enhanced hook for programmatic route validation
export const useRouteValidation = () => {
  const { user, hasValidSubscription, canAccessFeature } = useUnifiedAuth();
  const { isAdmin } = useRole();

  const validateAccess = useCallback((requirements: {
    requireAuth?: boolean;
    requireSubscription?: boolean;
    requireRole?: 'admin' | 'attendant' | 'customer';
    feature?: string;
  }) => {
    if (requirements.requireAuth && !user) {
      return { canAccess: false, reason: 'authentication_required' };
    }

    if (requirements.requireRole) {
      if (requirements.requireRole === 'admin' && !isAdmin) {
        return { canAccess: false, reason: 'insufficient_permissions' };
      }
      if (requirements.requireRole === 'attendant' && !isAdmin) {
        return { canAccess: false, reason: 'insufficient_permissions' };
      }
    }

    if (requirements.requireSubscription && !hasValidSubscription()) {
      return { canAccess: false, reason: 'subscription_required' };
    }

    if (requirements.feature && !canAccessFeature(requirements.feature)) {
      return { canAccess: false, reason: 'feature_not_available' };
    }

    return { canAccess: true, reason: null };
  }, [user, isAdmin, hasValidSubscription, canAccessFeature]);

  return { validateAccess };
};

// Backward compatibility
export const UnifiedProtectedRoute = OptimizedProtectedRoute;