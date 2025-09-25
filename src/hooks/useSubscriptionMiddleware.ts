import React, { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SubscriptionCheck {
  subscribed: boolean;
  status: string;
  plan_name: string;
  plan_price: number;
  expires_at: string | null;
  needs_refresh?: boolean;
}

interface MiddlewareConfig {
  ttlMinutes?: number;
  strictMode?: boolean;
  gracePeriodHours?: number;
}

const DEFAULT_CONFIG: MiddlewareConfig = {
  ttlMinutes: 5,
  strictMode: true,
  gracePeriodHours: 0
};

export const useSubscriptionMiddleware = (config: MiddlewareConfig = {}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  const checkSubscription = useCallback(async (userId?: string): Promise<SubscriptionCheck | null> => {
    if (!userId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      userId = user.id;
    }

    setLoading(true);
    setError(null);

    try {
      // Step 1: Check local cache with TTL
      const { data: cacheResult, error: dbError } = await supabase.rpc(
        'check_subscription_cache', 
        { 
          p_user_id: userId, 
          p_ttl_minutes: mergedConfig.ttlMinutes 
        }
      ).single();

      if (dbError) {
        console.warn('[SUBSCRIPTION-MIDDLEWARE] Database cache check failed:', dbError);
      }

      // If cache is valid and fresh, return it
      if (cacheResult && !cacheResult.needs_refresh) {
        return {
          subscribed: cacheResult.is_active,
          status: cacheResult.status,
          plan_name: cacheResult.plan_name,
          plan_price: cacheResult.plan_price,
          expires_at: cacheResult.expires_at,
          needs_refresh: false
        };
      }

      // Step 2: Fallback to Stripe via edge function
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.access_token) {
        throw new Error('No valid session');
      }

      const { data: stripeResult, error: stripeError } = await supabase.functions.invoke(
        'check-subscription', 
        {
          headers: {
            Authorization: `Bearer ${session.session.access_token}`
          }
        }
      );

      if (stripeError) {
        console.error('[SUBSCRIPTION-MIDDLEWARE] Stripe check failed:', stripeError);
        
        // Handle strict vs permissive mode
        if (mergedConfig.strictMode) {
          throw new Error('Subscription verification failed');
        } else {
          // Grace period logic - allow access if recent cache exists
          if (cacheResult && mergedConfig.gracePeriodHours! > 0) {
            const cacheAge = new Date().getTime() - new Date(cacheResult.expires_at!).getTime();
            const gracePeriodMs = mergedConfig.gracePeriodHours! * 60 * 60 * 1000;
            
            if (cacheAge < gracePeriodMs) {
              console.warn('[SUBSCRIPTION-MIDDLEWARE] Using grace period access');
              return {
                subscribed: cacheResult.is_active,
                status: cacheResult.status,
                plan_name: cacheResult.plan_name,
                plan_price: cacheResult.plan_price,
                expires_at: cacheResult.expires_at,
                needs_refresh: true
              };
            }
          }
          
          // Default to no access
          return {
            subscribed: false,
            status: 'error',
            plan_name: 'Erro',
            plan_price: 0,
            expires_at: null
          };
        }
      }

      return {
        subscribed: stripeResult.subscribed,
        status: stripeResult.status,
        plan_name: stripeResult.plan_name,
        plan_price: stripeResult.plan_price,
        expires_at: stripeResult.expires_at
      };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('[SUBSCRIPTION-MIDDLEWARE] Error:', errorMessage);
      
      if (mergedConfig.strictMode) {
        return null;
      } else {
        // In permissive mode, return a safe default
        return {
          subscribed: false,
          status: 'error',
          plan_name: 'Erro',
          plan_price: 0,
          expires_at: null
        };
      }
    } finally {
      setLoading(false);
    }
  }, [mergedConfig]);

  const requireSubscription = useCallback(async (userId?: string): Promise<boolean> => {
    const result = await checkSubscription(userId);
    return result ? result.subscribed : false;
  }, [checkSubscription]);

  const middleware = useCallback(async (req: any, res: any, next: any) => {
    try {
      const userId = req.user?.id; // Assume user is attached to request
      const hasValidSubscription = await requireSubscription(userId);
      
      if (hasValidSubscription) {
        next();
      } else {
        res.status(403).json({
          error: 'Active subscription required',
          code: 'SUBSCRIPTION_REQUIRED'
        });
      }
    } catch (error) {
      res.status(500).json({
        error: 'Subscription verification failed',
        code: 'SUBSCRIPTION_ERROR'
      });
    }
  }, [requireSubscription]);

  return {
    checkSubscription,
    requireSubscription,
    middleware,
    loading,
    error
  };
};

// Example usage in React components
export const withSubscriptionGuard = (WrappedComponent: React.ComponentType) => {
  return function SubscriptionGuardedComponent(props: any) {
    const { checkSubscription, loading } = useSubscriptionMiddleware({
      strictMode: true,
      ttlMinutes: 5
    });

    const [hasAccess, setHasAccess] = useState(false);
    const [checking, setChecking] = useState(true);

    useEffect(() => {
      const verifyAccess = async () => {
        const result = await checkSubscription();
        setHasAccess(result?.subscribed || false);
        setChecking(false);
      };
      
      verifyAccess();
    }, [checkSubscription]);

    if (checking || loading) {
      return React.createElement('div', null, 'Verificando assinatura...');
    }

    if (!hasAccess) {
      return React.createElement('div', null, 'Assinatura ativa necessária para acessar este conteúdo.');
    }

    return React.createElement(WrappedComponent, props);
  };
};