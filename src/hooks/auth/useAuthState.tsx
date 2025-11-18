// ===== AUTH STATE HOOK - GERENCIA SESSÃO E ESTADO =====

import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

export const useAuthState = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        console.log('[AUTH STATE] Auth state changed:', event);
        setSession(session);
        setUser(session?.user ?? null);
        
        // Handle initial session redirect
        if (event === 'INITIAL_SESSION' && session?.user) {
          const currentPath = window.location.pathname;
          
          if (currentPath === '/auth' || currentPath === '/') {
            setTimeout(async () => {
              const { data } = await supabase
                .from('user_roles')
                .select('role')
                .eq('user_id', session.user.id)
                .limit(1)
                .maybeSingle();
              
              const role = data?.role || 'customer';
              console.log('[AUTH STATE] Initial redirect for role:', role);
              
              switch (role) {
                case 'admin':
                  navigate('/admin');
                  break;
                case 'attendant':
                  navigate('/attendant');
                  break;
                default:
                  navigate('/dashboard');
              }
            }, 0);
          }
        }
        
        // Clear caches on sign out
        if (event === 'SIGNED_OUT') {
          console.log('[AUTH STATE] SIGNED_OUT - clearing caches');
          try {
            const keysToRemove: string[] = [];
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key && (
                key.startsWith('subscription_') ||
                key.startsWith('auth_') ||
                key.startsWith('login_block')
              )) {
                keysToRemove.push(key);
              }
            }
            keysToRemove.forEach(key => localStorage.removeItem(key));
            console.log('[AUTH STATE] Cleared caches:', keysToRemove.length);
          } catch (e) {
            console.warn('[AUTH STATE] Failed to clear cache:', e);
          }
        }
        
        if (event === 'TOKEN_REFRESHED') {
          console.log('[AUTH STATE] Token refreshed successfully');
        }
        
        if (mounted) setLoading(false);
      }
    );

    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!mounted) return;
      if (error) console.error('[AUTH STATE] Session error:', error);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  return {
    user,
    session,
    loading,
    setUser,
    setSession,
    setLoading,
  };
};
