-- ===== FASE URGENTE: Remover Security Definer View =====
-- Corrige ERROR 3 do linter: Security Definer View

-- 1. Dropar qualquer view que ainda referencie admin_stats_view
DROP VIEW IF EXISTS public.admin_stats_secure CASCADE;
DROP VIEW IF EXISTS public.admin_dashboard_stats CASCADE;

-- 2. Garantir que admin_stats_view foi removida
DROP MATERIALIZED VIEW IF EXISTS public.admin_stats_view CASCADE;

-- 3. Remover função antiga de refresh se ainda existir
DROP FUNCTION IF EXISTS public.refresh_admin_stats();

-- 4. Confirmar que get_admin_stats() é a única função de estatísticas
-- (A função já existe e está segura com SECURITY DEFINER + has_role check)

COMMENT ON FUNCTION public.get_admin_stats() IS 
'Função segura para obter estatísticas administrativas. 
Usa SECURITY DEFINER mas valida role admin antes de retornar dados.
Substitui a antiga admin_stats_view que tinha vulnerabilidade de segurança.';