import { useState } from 'react';
import { supabase } from '@/services/supabase';
import { useToast } from '@/hooks/use-toast';
import { useUnifiedAuth } from '@/hooks/useUnifiedAuth';

interface Coupon {
  id: string;
  code: string;
  discount_type: 'percent' | 'fixed';
  discount_value: number;
  min_order_value?: number;
  max_discount_amount?: number;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
  usage_limit?: number;
  used_count: number;
}

interface CouponUse {
  id: string;
  coupon_id: string;
  user_id: string;
  used_at: string;
}

export const useCoupon = () => {
  const [loading, setLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const { toast } = useToast();
  const { user } = useUnifiedAuth();

  const validateAndApplyCoupon = async (code: string, orderTotal: number) => {
    if (!code.trim()) {
      toast({
        title: "Cupom inválido",
        description: "Digite um código de cupom",
        variant: "destructive",
      });
      return null;
    }

    setLoading(true);
    try {
      // Buscar cupom no banco
      const { data: coupon, error: couponError } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', code.toUpperCase())
        .eq('is_active', true)
        .maybeSingle();

      if (couponError || !coupon) {
        toast({
          title: "Cupom não encontrado",
          description: "O código digitado não é válido",
          variant: "destructive",
        });
        return null;
      }
      
      // Type assertion para o tipo correto
      const typedCoupon = coupon as Coupon;

      // Validar período de validade
      const now = new Date();
      const validFrom = new Date(typedCoupon.valid_from);
      const validUntil = new Date(typedCoupon.valid_until);

      if (now < validFrom) {
        toast({
          title: "Cupom ainda não válido",
          description: `Este cupom será válido a partir de ${validFrom.toLocaleDateString()}`,
          variant: "destructive",
        });
        return null;
      }

      if (now > validUntil) {
        toast({
          title: "Cupom expirado",
          description: "Este cupom não está mais válido",
          variant: "destructive",
        });
        return null;
      }

      // Validar valor mínimo do pedido
      if (typedCoupon.min_order_value && orderTotal < typedCoupon.min_order_value) {
        toast({
          title: "Valor mínimo não atingido",
          description: `Pedido mínimo de R$ ${typedCoupon.min_order_value.toFixed(2)} para usar este cupom`,
          variant: "destructive",
        });
        return null;
      }

      // Validar limite de uso
      if (typedCoupon.usage_limit && typedCoupon.used_count >= typedCoupon.usage_limit) {
        toast({
          title: "Cupom esgotado",
          description: "Este cupom atingiu o limite de uso",
          variant: "destructive",
        });
        return null;
      }

      // Verificar se usuário já usou este cupom (se logado)
      if (user) {
        const { data: previousUse } = await supabase
          .from('coupon_uses' as any)
          .select('*')
          .eq('coupon_id', typedCoupon.id)
          .eq('user_id', user.id)
          .maybeSingle();

        if (previousUse) {
          toast({
            title: "Cupom já utilizado",
            description: "Você já usou este cupom anteriormente",
            variant: "destructive",
          });
          return null;
        }
      }

      // Calcular desconto
      let discountAmount = 0;
      if (typedCoupon.discount_type === 'percent') {
        discountAmount = (orderTotal * typedCoupon.discount_value) / 100;
        
        // Aplicar limite máximo de desconto se houver
        if (typedCoupon.max_discount_amount && discountAmount > typedCoupon.max_discount_amount) {
          discountAmount = typedCoupon.max_discount_amount;
        }
      } else {
        discountAmount = typedCoupon.discount_value;
      }

      // Garantir que o desconto não seja maior que o total
      discountAmount = Math.min(discountAmount, orderTotal);

      setAppliedCoupon(typedCoupon);
      
      toast({
        title: "Cupom aplicado!",
        description: `Você ganhou R$ ${discountAmount.toFixed(2)} de desconto`,
      });

      return {
        coupon: typedCoupon,
        discountAmount,
      };
    } catch (error: any) {
      console.error('Error validating coupon:', error);
      toast({
        title: "Erro ao validar cupom",
        description: "Tente novamente mais tarde",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    toast({
      title: "Cupom removido",
      description: "O desconto foi removido do pedido",
    });
  };

  const registerCouponUse = async (couponId: string, userId: string) => {
    try {
      // Registrar uso do cupom
      await supabase
        .from('coupon_uses' as any)
        .insert([{
          coupon_id: couponId,
          user_id: userId,
          used_at: new Date().toISOString(),
        }]);

      // Incrementar contador de uso
      await supabase.rpc('increment_coupon_usage' as any, { coupon_id: couponId });
    } catch (error) {
      console.error('Error registering coupon use:', error);
    }
  };

  return {
    loading,
    appliedCoupon,
    validateAndApplyCoupon,
    removeCoupon,
    registerCouponUse,
  };
};
