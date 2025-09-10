// ===== RATE LIMITING E CONTROLE DE FREQUÊNCIA =====

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private storage: Map<string, RateLimitEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Limpeza automática a cada 5 minutos
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.storage.entries()) {
      if (entry.resetTime <= now) {
        this.storage.delete(key);
      }
    }
  }

  public isAllowed(identifier: string, maxRequests: number, windowMs: number): boolean {
    const now = Date.now();
    const entry = this.storage.get(identifier);

    if (!entry || entry.resetTime <= now) {
      // Primeira requisição ou janela expirada
      this.storage.set(identifier, {
        count: 1,
        resetTime: now + windowMs
      });
      return true;
    }

    if (entry.count >= maxRequests) {
      return false;
    }

    entry.count++;
    return true;
  }

  public getRemainingTime(identifier: string): number {
    const entry = this.storage.get(identifier);
    if (!entry) return 0;
    
    const remaining = entry.resetTime - Date.now();
    return Math.max(0, remaining);
  }

  public destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.storage.clear();
  }
}

// Instância global para rate limiting
export const rateLimiter = new RateLimiter();

// Constantes de rate limiting
export const RATE_LIMITS = {
  ORDERS_PER_HOUR: 5,
  REGISTRATION_PER_IP: 3,
  LOGIN_ATTEMPTS: 5,
  PASSWORD_RESET: 3
} as const;

// Utilitários para diferentes tipos de rate limiting
export const checkOrderRateLimit = (userId: string): boolean => {
  return rateLimiter.isAllowed(
    `order:${userId}`, 
    RATE_LIMITS.ORDERS_PER_HOUR, 
    60 * 60 * 1000 // 1 hora
  );
};

export const checkRegistrationRateLimit = (ip: string): boolean => {
  return rateLimiter.isAllowed(
    `register:${ip}`, 
    RATE_LIMITS.REGISTRATION_PER_IP, 
    60 * 60 * 1000 // 1 hora
  );
};

export const checkLoginRateLimit = (identifier: string): boolean => {
  return rateLimiter.isAllowed(
    `login:${identifier}`, 
    RATE_LIMITS.LOGIN_ATTEMPTS, 
    15 * 60 * 1000 // 15 minutos
  );
};