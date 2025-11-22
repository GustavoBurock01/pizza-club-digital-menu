-- ===== CORREÇÃO CRÍTICA: order_status + admin_stats =====

-- 1. Adicionar 'expired' ao enum order_status
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'expired' 
    AND enumtypid = 'order_status'::regtype
  ) THEN
    ALTER TYPE order_status ADD VALUE 'expired';
  END IF;
END $$;

COMMENT ON TYPE order_status IS 'pending, confirmed, preparing, ready, picked_up, in_delivery, delivered, cancelled, expired';

-- 2. Proteger admin_stats_view (SECURITY FIX)
DROP MATERIALIZED VIEW IF EXISTS admin_stats_view CASCADE;

CREATE OR REPLACE FUNCTION get_admin_stats()
RETURNS TABLE(
  total_orders bigint,
  pending_orders bigint,
  completed_orders bigint,
  today_orders bigint,
  total_revenue numeric,
  total_products bigint,
  total_users bigint,
  avg_order_value numeric
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT has_role('admin') THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;

  RETURN QUERY
  SELECT 
    COUNT(*) as total_orders,
    COUNT(*) FILTER (WHERE status = 'pending') as pending_orders,
    COUNT(*) FILTER (WHERE status IN ('delivered', 'picked_up')) as completed_orders,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) as today_orders,
    COALESCE(SUM(total_amount) FILTER (WHERE status != 'cancelled'), 0) as total_revenue,
    (SELECT COUNT(*) FROM products WHERE is_available = true) as total_products,
    (SELECT COUNT(*) FROM profiles) as total_users,
    COALESCE(AVG(total_amount) FILTER (WHERE status != 'cancelled'), 0) as avg_order_value
  FROM orders;
END;
$$;

DROP FUNCTION IF EXISTS refresh_admin_stats();