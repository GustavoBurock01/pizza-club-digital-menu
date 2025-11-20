-- ===================================================================
-- MIGRATION: Performance Indexes para Queries Otimizadas
-- Data: 2025-11-19
-- Descrição: Adiciona índices para melhorar performance das queries
--            mais utilizadas no dashboard admin e relatórios
-- ===================================================================

-- 1. Otimizar queries do admin dashboard (orders)
CREATE INDEX IF NOT EXISTS idx_orders_created_at_desc 
  ON orders(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_user_status 
  ON orders(user_id, status) 
  WHERE status != 'cancelled';

CREATE INDEX IF NOT EXISTS idx_orders_payment_status 
  ON orders(payment_status) 
  WHERE payment_status = 'pending_payment';

-- 2. Otimizar busca de produtos no menu
CREATE INDEX IF NOT EXISTS idx_products_category_active 
  ON products(category_id, is_available) 
  WHERE is_available = true;

CREATE INDEX IF NOT EXISTS idx_products_name_search 
  ON products USING gin(to_tsvector('portuguese', name));

-- 3. Otimizar queries de relatórios
CREATE INDEX IF NOT EXISTS idx_order_items_product_created 
  ON order_items(product_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id 
  ON order_items(order_id);

-- 4. Otimizar realtime subscriptions
CREATE INDEX IF NOT EXISTS idx_orders_updated_at 
  ON orders(updated_at DESC);

-- 5. Otimizar queries de estoque
CREATE INDEX IF NOT EXISTS idx_product_stock_product_id 
  ON product_stock(product_id) 
  WHERE available_quantity > 0;

-- 6. Otimizar queries de endereços
CREATE INDEX IF NOT EXISTS idx_addresses_user_default 
  ON addresses(user_id, is_default);

-- 7. Otimizar queries de cupons
CREATE INDEX IF NOT EXISTS idx_coupons_code_active 
  ON coupons(code) 
  WHERE is_active = true;

-- 8. Otimizar queries de assinaturas (removido 'trialing' que não existe no enum)
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status 
  ON subscriptions(user_id, status) 
  WHERE status = 'active';

-- 9. Estatísticas para query planner
ANALYZE orders;
ANALYZE order_items;
ANALYZE products;
ANALYZE product_stock;

-- ===================================================================
-- Verificação de Performance
-- Execute estas queries para confirmar que os índices estão sendo usados
-- ===================================================================

-- Query 1: Dashboard orders (deve usar idx_orders_created_at_desc)
-- EXPLAIN ANALYZE 
-- SELECT * FROM orders 
-- WHERE created_at > NOW() - INTERVAL '24 hours' 
-- ORDER BY created_at DESC 
-- LIMIT 50;

-- Query 2: Products by category (deve usar idx_products_category_active)
-- EXPLAIN ANALYZE 
-- SELECT * FROM products 
-- WHERE category_id = 'xxx' AND is_available = true;

-- Query 3: Order items report (deve usar idx_order_items_product_created)
-- EXPLAIN ANALYZE 
-- SELECT product_id, COUNT(*), SUM(quantity) 
-- FROM order_items 
-- WHERE created_at > NOW() - INTERVAL '7 days' 
-- GROUP BY product_id;