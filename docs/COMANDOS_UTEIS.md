# 🛠️ Comandos Úteis - Pizza Prime

Referência rápida de comandos para desenvolvimento, testes e deploy.

---

## 🧪 Testes

### E2E (Playwright)

```bash
# Rodar todos os testes E2E
npm run test:e2e

# Rodar em modo headless
npx playwright test

# Rodar suite específica
npx playwright test auth
npx playwright test menu
npx playwright test navigation

# Modo debug (UI interativa)
npx playwright test --ui

# Rodar em browser específico
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit

# Ver relatório de testes
npx playwright show-report
```

### Unit Tests (Vitest)

```bash
# Rodar todos os testes
npm run test

# Watch mode
npm run test:watch

# Com coverage
npm run test:coverage

# UI interativa
npm run test:ui

# Arquivo específico
npm run test src/utils/formatting.test.ts
```

---

## 📊 Performance

### Lighthouse Audit

```bash
# Instalar dependências (primeira vez)
npm install -D lighthouse chrome-launcher

# Rodar audit completo
node scripts/lighthouse-audit.js

# Audit em URL específica
AUDIT_URL=https://staging.com node scripts/lighthouse-audit.js

# Ver relatórios
open lighthouse-reports/summary.json
open lighthouse-reports/home.html
```

### Bundle Analysis

```bash
# Build com análise
npm run build

# Preview do build
npm run preview

# Analisar tamanho
du -sh dist/
ls -lh dist/assets/

# Análise detalhada (requer plugin)
npm run build -- --analyze
```

---

## 🧹 Manutenção

### Cleanup de Código

```bash
# Rodar análise completa
bash scripts/cleanup.sh

# Verificar dependências não usadas
npx depcheck

# Código não importado
npx unimported

# Código duplicado
npx jscpd src/

# TypeScript unused exports
npx ts-prune
```

### Limpeza de Database

```bash
# Limpar rate limits antigos (via function)
# No psql ou SQL editor:
SELECT cleanup_rate_limits();

# Limpar monitoring data antigo
SELECT cleanup_monitoring_data();

# Limpar queue items antigos
SELECT cleanup_old_queue_items();

# Limpar webhook signatures
SELECT cleanup_old_webhook_signatures();

# Limpar reservas de estoque expiradas
SELECT cleanup_expired_stock_reservations();
```

---

## 🗄️ Database

### Queries Úteis

```sql
-- Ver orders recentes
SELECT * FROM orders 
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- Ver stats do admin
SELECT * FROM admin_dashboard_stats;

-- Ver subscriptions ativas
SELECT * FROM subscriptions 
WHERE status = 'active';

-- Health stats de orders
SELECT * FROM get_order_health_stats();

-- Revenue chart (última semana)
SELECT * FROM get_revenue_chart_data('week', 7);

-- Verificar índices
SELECT schemaname, tablename, indexname 
FROM pg_indexes 
WHERE schemaname = 'public' 
ORDER BY tablename, indexname;

-- Tamanho das tabelas
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Migrations

```bash
# Ver status
supabase db diff

# Aplicar migration
supabase db push

# Rollback (com cuidado!)
supabase db reset

# Gerar types
supabase gen types typescript --local > src/integrations/supabase/types.ts
```

---

## 🚀 Deploy

### Edge Functions

```bash
# Deploy todas as functions
supabase functions deploy --no-verify-jwt

# Deploy function específica
supabase functions deploy create-order-optimized --no-verify-jwt

# Ver logs
supabase functions logs create-order-optimized

# Testar localmente
supabase functions serve
```

### Frontend (Lovable)

```bash
# Build de produção
npm run build

# Preview local
npm run preview

# Deploy (via git push)
git add .
git commit -m "feat: nova feature"
git push origin main
```

---

## 🔧 Debug

### Console Logs

```bash
# Ver logs do browser
# DevTools > Console

# Filtrar por tipo
console:error
console:warning
```

### Network Requests

```bash
# DevTools > Network

# Filtrar por tipo
XHR
WS  # WebSocket (Realtime)
JS
```

### Supabase Logs

```bash
# Edge functions
supabase functions logs [nome-function]

# Database logs
# Supabase Dashboard > Database > Logs

# Realtime
# Supabase Dashboard > Realtime > Inspector
```

---

## 🔄 Rollback

### Rollback Completo

```bash
# Executar script de rollback
bash scripts/rollback.sh

# Ou especificar versão
bash scripts/rollback.sh HEAD~2
```

### Rollback Manual

```bash
# Frontend
git revert HEAD
git push origin main

# Edge functions
git checkout HEAD~1 supabase/functions/
supabase functions deploy

# Database (CUIDADO!)
supabase db reset --db-url postgresql://...
```

---

## 📈 Monitoramento

### Performance Metrics

```bash
# Core Web Vitals (browser)
# DevTools > Lighthouse

# Real User Monitoring
# Verificar em:
SELECT * FROM rum_metrics 
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;
```

### Error Monitoring

```bash
# Ver error reports
SELECT * FROM error_reports 
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

# Ver security logs
SELECT * FROM security_logs 
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

---

## 🔐 Segurança

### Verificar Permissions

```sql
-- Ver role do usuário
SELECT * FROM user_roles WHERE user_id = 'xxx';

-- Verificar RLS policies
SELECT tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public';

-- Testar se usuário tem role
SELECT has_role('admin');
SELECT has_any_role(ARRAY['admin', 'attendant']);
```

### Audit Logs

```sql
-- Ver ações admin recentes
SELECT * FROM admin_action_logs 
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- Ver subscription changes
SELECT * FROM subscription_audit_logs 
ORDER BY created_at DESC 
LIMIT 20;
```

---

## 🎨 Development

### Dev Server

```bash
# Iniciar dev server
npm run dev

# Build sem minify (debug)
npm run build -- --mode development

# Type check
npx tsc --noEmit
```

### Linting

```bash
# Lint de código
npm run lint

# Fix automático
npm run lint -- --fix
```

---

## 📦 Dependencies

### Adicionar Dependência

```bash
npm install [package]
```

### Atualizar Dependências

```bash
# Ver outdated
npm outdated

# Atualizar todas (cuidado!)
npm update

# Atualizar específica
npm update [package]
```

### Verificar Vulnerabilidades

```bash
# Audit de segurança
npm audit

# Fix automático
npm audit fix

# Detalhado
npm audit --production
```

---

## 🎯 Atalhos Úteis

### Git

```bash
# Status
git status

# Diff
git diff

# Commit rápido
git add . && git commit -m "msg" && git push

# Ver histórico
git log --oneline -10

# Desfazer último commit (mantém changes)
git reset --soft HEAD~1
```

### Supabase CLI

```bash
# Login
supabase login

# Link projeto
supabase link --project-ref xpgsfovrxguphlvncgwn

# Status
supabase status

# Logs em tempo real
supabase functions logs --tail
```

---

## 📞 Suporte

**Erros críticos:** Verificar `docs/TROUBLESHOOTING.md`  
**Deploy issues:** Consultar `docs/DEPLOY_PRODUCTION.md`  
**Bugs:** Documentar em `docs/BUGS_ENCONTRADOS.md`

---

**Última atualização:** 19/11/2025
