-- Criar tabela de uso de cupons
CREATE TABLE IF NOT EXISTS public.coupon_uses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_coupon_uses_coupon_id ON public.coupon_uses(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_uses_user_id ON public.coupon_uses(user_id);
CREATE INDEX IF NOT EXISTS idx_coupon_uses_order_id ON public.coupon_uses(order_id);

-- RLS para coupon_uses
ALTER TABLE public.coupon_uses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own coupon uses"
  ON public.coupon_uses FOR SELECT
  USING (auth.uid() = user_id OR has_role('admin'));

CREATE POLICY "System can insert coupon uses"
  ON public.coupon_uses FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can manage coupon uses"
  ON public.coupon_uses FOR ALL
  USING (has_role('admin'));

-- Função para incrementar uso de cupom
CREATE OR REPLACE FUNCTION public.increment_coupon_usage(p_coupon_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.coupons
  SET used_count = used_count + 1
  WHERE id = p_coupon_id;
END;
$$;

-- Adicionar colunas ao pedido para cupom se não existirem
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'coupon_code') THEN
    ALTER TABLE public.orders ADD COLUMN coupon_code TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'coupon_id') THEN
    ALTER TABLE public.orders ADD COLUMN coupon_id UUID REFERENCES public.coupons(id) ON DELETE SET NULL;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'discount_amount') THEN
    ALTER TABLE public.orders ADD COLUMN discount_amount NUMERIC DEFAULT 0;
  END IF;
END $$;