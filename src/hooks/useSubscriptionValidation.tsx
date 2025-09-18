// ===== MIDDLEWARE DE VALIDAÇÃO DE ASSINATURA EM TEMPO REAL =====

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { useSubscription } from './useSubscription';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';
import { cacheManager } from '@/utils/cacheManager';
import { securityLogger } from '@/utils/securityLogger';

interface ValidationResult {
  isValid: boolean;
  shouldBlock: boolean;
  reason?: string;
  expiresAt?: string;
}

interface HeartbeatConfig {
  interval: number; // ms
  enabled: boolean;
  onExpired?: () => void;
  onInvalid?: (reason: string) => void;
}

export const useSubscriptionValidation = (config?: Partial<HeartbeatConfig>) => {
  const { user } = useAuth();
  const { subscription } = useSubscription();
  const { toast } = useToast();
  
  const [isValidating, setIsValidating] = useState(false);
  const [lastValidation, setLastValidation] = useState<Date | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult>({
    isValid: false,
    shouldBlock: false
  });

  const defaultConfig: HeartbeatConfig = {
    interval: 5 * 60 * 1000, // 5 minutos
    enabled: true,
    onExpired: () => {
      toast({
        title: "Assinatura Expirada",
        description: "Sua assinatura expirou. Renove para continuar usando o sistema.",
        variant: "destructive",
      });
    },
    onInvalid: (reason: string) => {
      toast({
        title: "Acesso Negado",
        description: reason,
        variant: "destructive",
      });
    }
  };

  const finalConfig = { ...defaultConfig, ...config };

  // ===== VALIDAÇÃO EM TEMPO REAL =====
  const validateSubscription = useCallback(async (forceCheck = false): Promise<ValidationResult> => {
    if (!user || !subscription) {
      return { isValid: false, shouldBlock: true, reason: 'Usuário não autenticado' };
    }

    // Cache para evitar chamadas excessivas
    const cacheKey = `subscription_validation_${user.id}`;
    if (!forceCheck) {
      const cached = cacheManager.get<ValidationResult>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    setIsValidating(true);

    try {
      // Verificação local primeiro (mais rápida)
      const localValidation = validateLocalSubscription();
      if (!localValidation.isValid) {
        await securityLogger.logEvent({
          action: 'SUBSCRIPTION_VALIDATION_FAILED',
          details: {
            reason: localValidation.reason,
            userId: user.id,
            subscriptionStatus: subscription.status
          },
          severity: 'high'
        });
        
        cacheManager.set(cacheKey, localValidation, 30 * 1000, 'high'); // Cache por 30s
        return localValidation;
      }

      // Verificação remota para confirmar
      const { data, error } = await supabase.functions.invoke('validate-subscription-realtime', {
        body: { userId: user.id, currentStatus: subscription.status },
        headers: { Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}` }
      });

      if (error) throw error;

      const result: ValidationResult = {
        isValid: data.isValid,
        shouldBlock: !data.isValid,
        reason: data.reason,
        expiresAt: data.expiresAt
      };

      // Log de segurança
      await securityLogger.logEvent({
        action: 'SUBSCRIPTION_VALIDATION_SUCCESS',
        details: {
          result,
          userId: user.id,
          validationType: 'realtime'
        },
        severity: 'low'
      });

      // Cache por tempo baseado no status
      const ttl = result.isValid ? 5 * 60 * 1000 : 30 * 1000; // 5min se válido, 30s se inválido
      cacheManager.set(cacheKey, result, ttl, 'critical');

      setValidationResult(result);
      setLastValidation(new Date());
      
      return result;

    } catch (error: any) {
      console.error('Erro na validação de assinatura:', error);
      
      await securityLogger.logEvent({
        action: 'SUBSCRIPTION_VALIDATION_ERROR',
        details: {
          error: error.message,
          userId: user.id
        },
        severity: 'medium'
      });

      const fallbackResult: ValidationResult = {
        isValid: false,
        shouldBlock: true,
        reason: 'Erro na validação. Tente novamente.'
      };

      return fallbackResult;
    } finally {
      setIsValidating(false);
    }
  }, [user, subscription, toast]);

  // ===== VALIDAÇÃO LOCAL (RÁPIDA) =====
  const validateLocalSubscription = useCallback((): ValidationResult => {
    if (!subscription.subscribed) {
      return {
        isValid: false,
        shouldBlock: true,
        reason: 'Assinatura não ativa'
      };
    }

    if (subscription.status !== 'active') {
      return {
        isValid: false,
        shouldBlock: true,
        reason: `Status da assinatura: ${subscription.status}`
      };
    }

    // Verificar expiração
    if (subscription.expires_at) {
      const expirationDate = new Date(subscription.expires_at);
      const now = new Date();
      
      if (expirationDate <= now) {
        return {
          isValid: false,
          shouldBlock: true,
          reason: 'Assinatura expirada',
          expiresAt: subscription.expires_at
        };
      }

      // Aviso se vai expirar em menos de 7 dias
      const daysUntilExpiration = Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (daysUntilExpiration <= 7) {
        toast({
          title: "Assinatura expirando",
          description: `Sua assinatura expira em ${daysUntilExpiration} dias. Renove agora!`,
          variant: "destructive",
        });
      }
    }

    return {
      isValid: true,
      shouldBlock: false,
      expiresAt: subscription.expires_at
    };
  }, [subscription, toast]);

  // ===== HEARTBEAT AUTOMÁTICO =====
  useEffect(() => {
    if (!finalConfig.enabled || !user) return;

    const heartbeat = setInterval(async () => {
      const result = await validateSubscription();
      
      if (!result.isValid) {
        if (result.reason?.includes('expirada') && finalConfig.onExpired) {
          finalConfig.onExpired();
        } else if (finalConfig.onInvalid) {
          finalConfig.onInvalid(result.reason || 'Acesso negado');
        }
      }
    }, finalConfig.interval);

    // Validação inicial
    validateSubscription();

    return () => clearInterval(heartbeat);
  }, [user, finalConfig.enabled, finalConfig.interval, validateSubscription]);

  // ===== BLOQUEIO IMEDIATO =====
  const blockAccess = useCallback(async (reason: string) => {
    await securityLogger.logEvent({
      action: 'ACCESS_BLOCKED',
      details: {
        reason,
        userId: user?.id,
        timestamp: new Date().toISOString()
      },
      severity: 'critical'
    });

    setValidationResult({
      isValid: false,
      shouldBlock: true,
      reason
    });

    toast({
      title: "Acesso Bloqueado",
      description: reason,
      variant: "destructive",
    });
  }, [user?.id, toast]);

  // ===== MIDDLEWARE PARA ROTAS PROTEGIDAS =====
  const requireValidSubscription = useCallback(async (): Promise<boolean> => {
    const result = await validateSubscription();
    
    if (result.shouldBlock) {
      if (finalConfig.onInvalid) {
        finalConfig.onInvalid(result.reason || 'Acesso negado');
      }
      return false;
    }
    
    return true;
  }, [validateSubscription, finalConfig]);

  return {
    // Estado
    isValidating,
    lastValidation,
    validationResult,
    
    // Métodos
    validateSubscription,
    validateLocalSubscription,
    blockAccess,
    requireValidSubscription,
    
    // Utilitários
    isValid: validationResult.isValid,
    shouldBlock: validationResult.shouldBlock,
    expiresAt: validationResult.expiresAt
  };
};