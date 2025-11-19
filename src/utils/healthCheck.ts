import { supabase } from '@/integrations/supabase/client';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: {
    supabase: boolean;
    localStorage: boolean;
    serviceWorker: boolean;
    environment: boolean;
  };
  timestamp: string;
  errors: string[];
}

class HealthChecker {
  private static instance: HealthChecker;

  private constructor() {}

  static getInstance(): HealthChecker {
    if (!HealthChecker.instance) {
      HealthChecker.instance = new HealthChecker();
    }
    return HealthChecker.instance;
  }

  async runHealthCheck(): Promise<HealthStatus> {
    const checks = {
      supabase: false,
      localStorage: false,
      serviceWorker: false,
      environment: false,
    };
    const errors: string[] = [];

    // 1. Verificar Supabase
    try {
      const { error } = await supabase.from('profiles').select('count').limit(1).single();
      checks.supabase = !error || error.code === 'PGRST116'; // PGRST116 = no rows (ok)
      if (!checks.supabase) {
        errors.push(`Supabase connection failed: ${error?.message}`);
      }
    } catch (e) {
      errors.push(`Supabase health check error: ${(e as Error).message}`);
    }

    // 2. Verificar localStorage
    try {
      const testKey = '__health_check__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      checks.localStorage = true;
    } catch (e) {
      checks.localStorage = false;
      errors.push('localStorage is not available');
    }

    // 3. Verificar Service Worker
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        checks.serviceWorker = !!registration;
      } catch (e) {
        checks.serviceWorker = false;
        errors.push('Service Worker check failed');
      }
    }

    // 4. Verificar variáveis de ambiente críticas
    const requiredEnvVars = [
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_ANON_KEY',
    ];

    checks.environment = requiredEnvVars.every(varName => {
      const value = import.meta.env[varName];
      if (!value) {
        errors.push(`Missing environment variable: ${varName}`);
        return false;
      }
      return true;
    });

    // Determinar status geral
    const healthyCount = Object.values(checks).filter(Boolean).length;
    const totalChecks = Object.keys(checks).length;

    let status: HealthStatus['status'];
    if (healthyCount === totalChecks) {
      status = 'healthy';
    } else if (healthyCount >= totalChecks / 2) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }

    return {
      status,
      checks,
      timestamp: new Date().toISOString(),
      errors,
    };
  }

  async logHealthStatus() {
    const health = await this.runHealthCheck();
    
    const icon = health.status === 'healthy' ? '✅' : 
                 health.status === 'degraded' ? '⚠️' : '❌';
    
    console.group(`${icon} Health Check - ${health.status.toUpperCase()}`);
    console.table(health.checks);
    
    if (health.errors.length > 0) {
      console.error('Errors detected:');
      health.errors.forEach(error => console.error(`  - ${error}`));
    }
    
    console.log('Timestamp:', health.timestamp);
    console.groupEnd();

    return health;
  }
}

export const healthChecker = HealthChecker.getInstance();

// Executar health check no boot (apenas em desenvolvimento)
if (import.meta.env.DEV) {
  healthChecker.logHealthStatus();
}
