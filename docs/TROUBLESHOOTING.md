# 🔧 Guia de Troubleshooting - Pizza Prime

## Índice

1. [Problemas de Pedidos](#problemas-de-pedidos)
2. [Problemas de Pagamento](#problemas-de-pagamento)
3. [Problemas de Admin/Atendente](#problemas-de-adminatendente)
4. [Problemas de Performance](#problemas-de-performance)
5. [Problemas de Autenticação](#problemas-de-autenticação)
6. [Problemas de Integração](#problemas-de-integração)

---

## Problemas de Pedidos

### Cliente não recebe confirmação de pedido

**Sintomas:**
- Pedido criado com sucesso
- Cliente não recebe email de confirmação

**Diagnóstico:**
1. Verificar logs da edge function `send-notification-email`:
   ```bash
   # No painel Supabase > Functions > send-notification-email > Logs
   ```
2. Checar se webhook do Mercado Pago foi disparado

**Soluções:**

**Causa 1:** Email está no spam
```
Solução: Orientar cliente a verificar pasta de spam
```

**Causa 2:** Edge function falhou
```
Solução:
1. Ir em /admin/sistema/logs
2. Localizar erro da edge function
3. Re-enviar email manualmente:
   - Copiar order_id
   - Executar edge function manualmente com payload
```

**Causa 3:** Configuração de webhook incorreta
```
Solução:
1. Verificar webhook URL no Mercado Pago
2. Confirmar que aponta para: 
   https://xpgsfovrxguphlvncgwn.supabase.co/functions/v1/mercadopago-webhook
3. Re-processar webhook em /admin/sistema/webhooks
```

---

### Admin não vê pedidos novos

**Sintomas:**
- Cliente fez pedido
- Pedido não aparece no painel do admin/atendente

**Diagnóstico:**
1. Verificar se pedido foi realmente criado:
   ```sql
   SELECT * FROM orders 
   WHERE created_at > NOW() - INTERVAL '1 hour'
   ORDER BY created_at DESC;
   ```

2. Verificar conexão Realtime:
   - Abrir DevTools > Network > WS
   - Procurar por conexões WebSocket ativas

**Soluções:**

**Causa 1:** Realtime desconectado
```
Solução:
1. Recarregar página (F5 ou Cmd+R)
2. Limpar cache do navegador
3. Verificar status do Supabase Realtime
```

**Causa 2:** RLS Policy bloqueando
```
Solução:
1. Verificar role do usuário:
   SELECT * FROM user_roles WHERE user_id = 'xxx';
   
2. Confirmar RLS policies:
   - attendant_read_orders deve permitir leitura
   - Verificar em Supabase > Database > Policies
```

**Causa 3:** Filtro de data ativo
```
Solução:
1. Verificar filtros no painel do atendente
2. Confirmar que range de data inclui "hoje"
3. Resetar filtros
```

---

## Problemas de Pagamento

### Pagamento falhou mas pedido foi criado

**Sintomas:**
- Pedido aparece no sistema
- Payment_status = 'pending_payment'
- Cliente relata que pagamento foi debitado

**Diagnóstico:**
1. Verificar status real no Mercado Pago:
   ```
   - Acessar dashboard do Mercado Pago
   - Buscar payment_id na tabela card_transactions ou pix_transactions
   - Verificar status real
   ```

**Soluções:**

**Causa 1:** Timeout na resposta do gateway
```
Solução:
1. Verificar status real do pagamento
2. Se pago: reconciliar manualmente
   - Atualizar payment_status para 'paid'
   - Atualizar status para 'confirmed'
   - Notificar cliente manualmente
```

**Causa 2:** Webhook ainda não processado
```
Solução:
1. Aguardar até 5 minutos
2. Se não atualizar, re-processar webhook:
   - /admin/sistema/webhooks
   - Localizar webhook do payment_id
   - Clicar em "Reprocessar"
```

**Causa 3:** Pagamento realmente falhou
```
Solução:
1. Confirmar falha no Mercado Pago
2. Orientar cliente a tentar novamente
3. Se necessário, cancelar pedido
```

---

### PIX não gera QR Code

**Sintomas:**
- Cliente seleciona PIX
- QR Code não é exibido
- Loading infinito

**Diagnóstico:**
1. Abrir DevTools > Console
2. Procurar erros relacionados a `create-mercadopago-preference`

**Soluções:**

**Causa 1:** Edge function falhou
```
Solução:
1. Verificar logs da edge function
2. Verificar se MERCADOPAGO_ACCESS_TOKEN está configurado
3. Re-tentar pagamento
```

**Causa 2:** Produto sem preço
```
Solução:
1. Verificar se todos os produtos no carrinho têm price > 0
2. Atualizar produtos com preço incorreto
```

---

## Problemas de Admin/Atendente

### Dashboard carrega lento

**Sintomas:**
- Dashboard demora > 5s para carregar
- Queries lentas

**Diagnóstico:**
1. Abrir DevTools > Network
2. Identificar requests lentos
3. Verificar queries do Supabase

**Soluções:**

**Causa 1:** Muitos pedidos sem paginação
```
Solução:
1. Implementar paginação no frontend
2. Limitar query inicial a últimos 50 pedidos
3. Lazy load pedidos mais antigos
```

**Causa 2:** Índices faltando no banco
```
Solução:
1. Executar migration de performance:
   supabase/migrations/xxx_performance_indexes.sql
2. Verificar explain plan das queries lentas
```

**Causa 3:** Realtime subscriptions demais
```
Solução:
1. Consolidar subscriptions
2. Usar useUnifiedRealtime hook
3. Limitar escopo de subscriptions (filter por data)
```

---

### Não consegue atualizar status de pedido

**Sintomas:**
- Botão de atualizar status não funciona
- Erro de permissão

**Diagnóstico:**
1. Verificar role do usuário no console:
   ```javascript
   console.log(useUnifiedAuth().role);
   ```

**Soluções:**

**Causa 1:** Role incorreto
```
Solução:
1. Verificar em /admin/configuracoes/usuarios
2. Atualizar role para 'attendant' ou 'admin'
3. Re-login
```

**Causa 2:** RLS Policy bloqueando
```
Solução:
1. Verificar policy attendant_update_orders
2. Confirmar que permite UPDATE para attendants
3. Se necessário, atualizar policy
```

---

## Problemas de Performance

### Página com tela branca

**Sintomas:**
- Página não carrega
- Tela branca
- Nenhum erro visível

**Diagnóstico:**
1. Abrir DevTools > Console
2. Procurar erros de chunk loading
3. Verificar Network tab para requests falhando

**Soluções:**

**Causa 1:** Erro de chunk loading
```
Solução:
1. Forçar reload (Ctrl+Shift+R ou Cmd+Shift+R)
2. Limpar cache do navegador
3. Se persistir, reportar bug
```

**Causa 2:** JavaScript desabilitado
```
Solução:
1. Verificar se JavaScript está habilitado
2. Desabilitar extensões do navegador (AdBlock, etc)
3. Testar em modo anônimo
```

**Causa 3:** Versão antiga em cache
```
Solução:
1. Hard refresh (Ctrl+F5)
2. Limpar cache do service worker:
   - DevTools > Application > Storage > Clear site data
3. Recarregar página
```

---

### Imagens não carregam

**Sintomas:**
- Produtos sem imagem
- Imagens quebradas

**Diagnóstico:**
1. Inspecionar elemento da imagem
2. Verificar URL da imagem
3. Testar URL diretamente no navegador

**Soluções:**

**Causa 1:** URL inválida
```
Solução:
1. Atualizar URL da imagem no produto
2. Fazer upload de nova imagem no Supabase Storage
```

**Causa 2:** Bucket permissions
```
Solução:
1. Verificar policies do bucket no Supabase
2. Confirmar que bucket é público
3. Atualizar RLS policies se necessário
```

---

## Problemas de Autenticação

### Não consegue fazer login

**Sintomas:**
- Email e senha corretos
- Erro de autenticação

**Diagnóstico:**
1. Verificar mensagem de erro específica
2. Testar reset de senha

**Soluções:**

**Causa 1:** Senha incorreta
```
Solução:
1. Usar "Esqueci minha senha"
2. Verificar email de reset
3. Criar nova senha
```

**Causa 2:** Email não verificado
```
Solução:
1. Verificar se email foi confirmado
2. Re-enviar email de confirmação
3. Verificar na tabela auth.users
```

**Causa 3:** Conta bloqueada
```
Solução:
1. Verificar no Supabase > Auth > Users
2. Desbloquear conta se necessário
3. Notificar usuário
```

---

## Problemas de Integração

### Mercado Pago não está funcionando

**Sintomas:**
- Pagamentos falhando
- Erro de integração

**Diagnóstico:**
1. Verificar credenciais do Mercado Pago
2. Testar conexão com API

**Soluções:**

**Causa 1:** Credenciais expiradas
```
Solução:
1. Renovar Access Token no Mercado Pago
2. Atualizar secret MERCADOPAGO_ACCESS_TOKEN
3. Re-deploy edge functions
```

**Causa 2:** Webhook desconfigurado
```
Solução:
1. Verificar URL do webhook
2. Re-configurar em Mercado Pago
3. Testar com webhook de teste
```

---

## Logs e Ferramentas

### Acessar Logs

**Edge Functions:**
```
Supabase > Functions > [nome da função] > Logs
```

**Database Queries:**
```
Supabase > Database > Query Performance
```

**Realtime:**
```
Supabase > Realtime > Inspector
```

### Ferramentas de Debug

**Frontend:**
- DevTools Console
- React Developer Tools
- Network Tab

**Backend:**
- Supabase Dashboard
- PostgREST Logs
- Edge Function Logs

---

## Contatos de Suporte

**Urgência:** [Slack #emergencias]
**Bugs:** [GitHub Issues]
**Dúvidas:** [Slack #suporte]

---

**Última atualização:** 19/11/2025
