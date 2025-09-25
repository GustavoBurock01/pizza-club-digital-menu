// ===== HOOK UNIFICADO DE PERFIL E ROLES =====

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedAuth } from '@/hooks/useUnifiedAuth';
import { useDebounce } from '@/hooks/useDebounce';

interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  cpf?: string;
  avatar_url?: string;
  role: 'customer' | 'admin' | 'seller' | 'attendant';
  created_at: string;
  updated_at: string;
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const profileCache = new Map<string, { data: Profile; timestamp: number }>();

export const useUnifiedProfile = () => {
  const { user } = useUnifiedAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Debounce user changes to prevent excessive calls
  const debouncedUser = useDebounce(user, 300);

  // Memoized role computations
  const roleInfo = useMemo(() => {
    if (!profile?.role) {
      return {
        role: null,
        isAdmin: false,
        isAttendant: false,
        isCustomer: false,
        isSeller: false,
        loading
      };
    }

    return {
      role: profile.role,
      isAdmin: profile.role === 'admin',
      isAttendant: profile.role === 'attendant',
      isCustomer: profile.role === 'customer',
      isSeller: profile.role === 'seller',
      loading: false
    };
  }, [profile?.role, loading]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!debouncedUser?.id) {
        setProfile(null);
        setLoading(false);
        profileCache.clear(); // Clear cache when no user
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Check cache first
        const cacheKey = debouncedUser.id;
        const cached = profileCache.get(cacheKey);
        const now = Date.now();

        if (cached && (now - cached.timestamp) < CACHE_TTL) {
          setProfile(cached.data);
          setLoading(false);
          return;
        }

        console.log('[PROFILE] Fetching profile for user:', debouncedUser.id);

        const { data, error: fetchError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', debouncedUser.id)
          .single();

        if (fetchError) {
          console.error('Error fetching profile:', fetchError);
          setError(fetchError.message);
          setProfile(null);
          profileCache.delete(cacheKey);
        } else {
          setProfile(data);
          // Cache the result
          profileCache.set(cacheKey, { data, timestamp: now });
          
          // Clean old cache entries
          profileCache.forEach((value, key) => {
            if (key !== cacheKey && (now - value.timestamp) > CACHE_TTL) {
              profileCache.delete(key);
            }
          });
        }
      } catch (err: any) {
        console.error('Profile fetch error:', err);
        setError(err.message);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [debouncedUser?.id]);

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!debouncedUser?.id) throw new Error('Usuário não autenticado');

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', debouncedUser.id)
        .select()
        .single();

      if (error) throw error;

      setProfile(data);
      
      // Update cache
      profileCache.set(debouncedUser.id, { data, timestamp: Date.now() });
      
      return data;
    } catch (err: any) {
      console.error('Error updating profile:', err);
      throw err;
    }
  };

  // Clear cache on user change
  useEffect(() => {
    return () => {
      if (!debouncedUser) {
        profileCache.clear();
      }
    };
  }, [debouncedUser]);

  return {
    // Profile data
    profile,
    loading,
    error,
    updateProfile,
    hasRequiredData: !!(profile?.full_name && profile?.phone && profile?.cpf),
    isProfileComplete: !!(profile?.full_name && profile?.phone),
    
    // Role data (unified from useRole)
    ...roleInfo
  };
};

// Backward compatibility exports
export const useProfile = useUnifiedProfile;
export const useRole = useUnifiedProfile;