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

// Constantes de rate limiting otimizadas para pizzaria
export const RATE_LIMITS = {
  ORDERS_PER_HOUR: 25, // Aumentado para pizzaria com alta demanda
  ORDERS_PER_HOUR_VIP: 50, // Limite maior para usuários VIP/frequentes
  REGISTRATION_PER_IP: 5,
  LOGIN_ATTEMPTS: 10, // Mais tentativas para clientes legítimos
  PASSWORD_RESET: 3,
  PAYMENT_ATTEMPTS: 5, // Mais tentativas para pagamentos
  CHECKOUT_CLICKS: 20, // Mais cliques por minuto para alta demanda
  CONCURRENT_ORDERS: 3 // Máximo de pedidos simultâneos por usuário
} as const;

// Utilitários para diferentes tipos de rate limiting
export const checkOrderRateLimit = (userId: string, isVip: boolean = false): boolean => {
  const limit = isVip ? RATE_LIMITS.ORDERS_PER_HOUR_VIP : RATE_LIMITS.ORDERS_PER_HOUR;
  return rateLimiter.isAllowed(
    `order:${userId}`, 
    limit, 
    60 * 60 * 1000 // 1 hora
  );
};

export const checkConcurrentOrderLimit = (userId: string): boolean => {
  return rateLimiter.isAllowed(
    `concurrent:${userId}`, 
    RATE_LIMITS.CONCURRENT_ORDERS, 
    5 * 60 * 1000 // 5 minutos
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

export const checkPaymentRateLimit = (userId: string): boolean => {
  return rateLimiter.isAllowed(
    `payment:${userId}`, 
    RATE_LIMITS.PAYMENT_ATTEMPTS, 
    15 * 60 * 1000 // 15 minutos
  );
};

export const checkCheckoutRateLimit = (userId: string): boolean => {
  return rateLimiter.isAllowed(
    `checkout:${userId}`, 
    RATE_LIMITS.CHECKOUT_CLICKS, 
    60 * 1000 // 1 minuto
  );
};