# 🚀 Guia de Deploy - Pizza Prime

## Pré-requisitos

Antes de iniciar o deploy, verifique:

- [ ] Todos os testes E2E estão passando (100%)
- [ ] Score do Lighthouse > 85 em todas as páginas principais
- [ ] Auditoria de segurança limpa (0 vulnerabilidades críticas)
- [ ] Backup do banco de dados Supabase realizado
- [ ] Variáveis de ambiente de produção configuradas
- [ ] Time de suporte treinado (docs/TROUBLESHOOTING.md)

---

## 1. Build de Produção

### 1.1 Executar Build Local

```bash
# Instalar dependências
npm ci

# Build de produção
npm run build

# Testar build localmente
npm run preview
```

### 1.2 Verificar Tamanho do Bundle

```bash
# Analisar bundle
npm run build -- --analyze

# Verificar tamanho
du -sh dist/
```

**Threshold:** Bundle gzipped deve ser < 500KB

---

## 2. Variáveis de Ambiente

### 2.1 Produção

Configurar no painel da Lovable:

```env
# Supabase
VITE_SUPABASE_URL=https://xpgsfovrxguphlvncgwn.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Mercado Pago (usar credenciais de produção)
VITE_MERCADOPAGO_PUBLIC_KEY=APP_USR-xxxxxxxx

# Environment
VITE_ENVIRONMENT=production
```

### 2.2 Staging

```env
# Usar credenciais de staging
VITE_SUPABASE_URL=https://staging-project.supabase.co
VITE_ENVIRONMENT=staging
```

---

## 3. Deploy Supabase

### 3.1 Migrations

```bash
# Verificar migrations pendentes
supabase db diff

# Aplicar migrations em produção
supabase db push --db-url postgresql://...
```

### 3.2 Edge Functions

```bash
# Deploy de todas as edge functions
supabase functions deploy --no-verify-jwt

# Verificar logs
supabase functions logs
```

### 3.3 Verificar Secrets

Configurar secrets necessários no painel Supabase:

- `MERCADOPAGO_ACCESS_TOKEN`
- `STRIPE_SECRET_KEY` (se aplicável)
- Outros secrets de integração

---

## 4. Deploy Frontend (Lovable)

### 4.1 Deploy via Git

```bash
# Commit final
git add .
git commit -m "chore: production deployment"

# Push para main
git push origin main
```

### 4.2 Publicar no Lovable

1. Acessar projeto no Lovable
2. Clicar em "Publish"
3. Aguardar build completar
4. Testar URL de produção

---

## 5. Verificações Pós-Deploy

### 5.1 Health Check

```bash
# Verificar endpoint de saúde
curl https://seu-dominio.com/

# Verificar API Supabase
curl https://xpgsfovrxguphlvncgwn.supabase.co/rest/v1/
```

### 5.2 Smoke Tests

Executar manualmente:

1. [ ] Criar conta nova
2. [ ] Fazer login
3. [ ] Adicionar produto ao carrinho
4. [ ] Finalizar pedido (PIX ou cartão)
5. [ ] Verificar confirmação de pedido
6. [ ] Admin: visualizar pedido novo
7. [ ] Admin: atualizar status do pedido

### 5.3 Performance

```bash
# Rodar Lighthouse
npm run lighthouse

# Verificar Core Web Vitals
# Google Search Console > Core Web Vitals
```

---

## 6. Monitoramento Pós-Deploy

### 6.1 Primeiras 24h

**Crítico:** Monitorar de perto nas primeiras 24 horas

- [ ] Verificar erros no console do browser (amostragem de usuários)
- [ ] Monitorar logs do Supabase Edge Functions
- [ ] Checar métricas de performance (Lighthouse CI)
- [ ] Revisar feedback de usuários

### 6.2 Métricas a Acompanhar

**Performance:**
- FCP (First Contentful Paint) < 1.2s
- LCP (Largest Contentful Paint) < 2.0s
- TTI (Time to Interactive) < 3.0s
- CLS (Cumulative Layout Shift) < 0.1

**Disponibilidade:**
- Uptime > 99.9%
- Tempo de resposta p95 < 500ms
- Taxa de erro < 0.1%

**Negócio:**
- Taxa de conversão (pedidos / visitas)
- Tempo médio de checkout
- Taxa de abandono de carrinho

---

## 7. Rollback Plan

Em caso de problema crítico em produção:

### 7.1 Rollback Frontend

```bash
# Executar script de rollback
bash scripts/rollback.sh

# OU manualmente:
git revert HEAD
git push origin main
```

### 7.2 Rollback Database

```bash
# Reverter última migration
supabase db reset --db-url postgresql://...

# Restaurar backup
psql $DATABASE_URL < backup.sql
```

### 7.3 Rollback Edge Functions

```bash
# Checkout versão anterior
git checkout HEAD~1 supabase/functions/

# Re-deploy
supabase functions deploy
```

---

## 8. Troubleshooting

Consulte `docs/TROUBLESHOOTING.md` para problemas comuns.

### Quick Fixes

**Problema:** Pedidos não aparecem no painel admin
**Solução:** Verificar Realtime connection + RLS policies

**Problema:** Pagamento falha
**Solução:** Checar logs do Mercado Pago + webhook configuration

**Problema:** Performance degradada
**Solução:** Verificar cache de CDN + bundle size

---

## 9. Checklist Final

Antes de considerar deploy concluído:

- [ ] Smoke tests passando (100%)
- [ ] Monitoramento configurado
- [ ] Alertas configurados (Slack/email)
- [ ] Backup automático ativo
- [ ] DNS configurado (se custom domain)
- [ ] SSL válido
- [ ] Time de suporte notificado
- [ ] Documentação atualizada
- [ ] Changelog publicado

---

## 10. Pós-Deploy (48-72h)

### Iterações Rápidas

**Semana 1:** Correções emergenciais
- Monitoramento intensivo
- Hotfixes para bugs críticos descobertos
- Ajustes de performance baseados em dados reais

**Semana 2:** Otimizações
- Análise de feedback de usuários
- Refinamento de queries lentas
- Ajustes de UX

**Semana 3:** Novas features
- Implementar melhorias baseadas em feedback
- Próxima fase do roadmap

---

## Contatos

**Emergências:** [telefone/slack do time]
**Suporte Técnico:** [email]
**Documentação:** [link para wiki interna]

---

**Última atualização:** 19/11/2025
