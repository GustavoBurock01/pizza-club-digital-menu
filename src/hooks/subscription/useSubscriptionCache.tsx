// ===== SUBSCRIPTION CACHE MANAGEMENT (EXTRAÍDO) =====

import { SubscriptionData } from './types';

const CACHE_KEY = 'subscription_cache';
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 horas

export const getLocalCache = (userId: string): SubscriptionData | null => {
  try {
    const cached = localStorage.getItem(`${CACHE_KEY}_${userId}`);
    if (!cached) return null;

    const { data, timestamp } = JSON.parse(cached);
    const now = Date.now();

    if (now - timestamp < CACHE_DURATION_MS) {
      return data;
    }

    localStorage.removeItem(`${CACHE_KEY}_${userId}`);
    return null;
  } catch {
    return null;
  }
};

export const setLocalCache = (userId: string, data: SubscriptionData) => {
  try {
    localStorage.setItem(
      `${CACHE_KEY}_${userId}`,
      JSON.stringify({ data, timestamp: Date.now() })
    );
  } catch {
    // Silently fail
  }
};

export const clearLocalCache = (userId: string) => {
  try {
    localStorage.removeItem(`${CACHE_KEY}_${userId}`);
  } catch {
    // Silently fail
  }
};

export { CACHE_DURATION_MS };
