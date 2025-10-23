# 🔍 RELATÓRIO TÉCNICO DE REESTRUTURAÇÃO
## Pizza Express - Plano Completo de Refatoração

**Data:** 2025-01-XX  
**Versão:** 1.0  
**Status:** Auditoria Completa + Plano de Ação

---

## 📋 SUMÁRIO EXECUTIVO

### Situação Atual
- **35 Edge Functions** implementadas (28% duplicadas ou problemáticas)
- **37 hooks customizados** (43% com responsabilidades sobrepostas)
- **Sistema de assinatura fragmentado** em 4+ implementações paralelas
- **Zero testes automatizados** (0% de cobertura)
- **Vulnerabilidades críticas de segurança** identificadas

### Diagnóstico Crítico
🔴 **CRÍTICO**: Sistema de assinatura com lógica duplicada e inconsistente  
🔴 **CRÍTICO**: Roles armazenados em tabela manipulável pelo usuário  
🟡 **ALTO**: Ausência total de testes automatizados  
🟡 **ALTO**: Webhooks MercadoPago sem validação HMAC completa  

### Recomendação Prioritária
**Refatoração completa do módulo de assinatura** antes de expandir funcionalidades.

---

## 1️⃣ EXTRAÇÃO DETALHADA DOS MÓDULOS CRÍTICOS

### 1.1 Mapa Hierárquico da Arquitetura

```
📦 Pizza Express
├── 🔐 MÓDULO DE AUTENTICAÇÃO [MADURO - 85%]
│   ├── Frontend
│   │   ├── hooks/useUnifiedAuth.tsx [520 linhas] ⚠️ GRANDE
│   │   ├── hooks/useRole.tsx [DUPLICADO - 2 versões]
│   │   ├── contexts/UnifiedAuthContext [INTEGRADO no useUnifiedAuth]
│   │   └── routes/UnifiedProtectedRoute.tsx [113 linhas] ✅
│   ├── Backend
│   │   ├── functions/check-subscription [PRECISA REFATORAR]
│   │   └── Supabase Auth [CONFIGURADO]
│   └── Status: MADURO mas ACOPLADO com assinatura
│
├── 💳 MÓDULO DE ASSINATURA [FRAGMENTADO - 35%] 🔴 CRÍTICO
│   ├── Frontend [MÚLTIPLAS IMPLEMENTAÇÕES CONFLITANTES]
│   │   ├── hooks/useSubscriptionCore.ts [302 linhas] - Implementação 1
│   │   ├── hooks/useSubscriptionMiddleware.ts [214 linhas] - Implementação 2
│   │   ├── hooks/useSimpleSubscription.tsx [57 linhas] - Implementação 3
│   │   ├── components/SubscriptionGlobalProvider.tsx [50 linhas] - Implementação 4
│   │   └── components/SubscriptionStatus.tsx [35 linhas] ✅
│   ├── Backend [FUNCIONAL mas DESORGANIZADO]
│   │   ├── functions/check-subscription [239 linhas] - Verifica DB + Stripe
│   │   ├── functions/create-checkout [212 linhas] - Cria sessão Stripe
│   │   ├── functions/reconcile-subscription [219 linhas] - Sincroniza manualmente
│   │   ├── functions/stripe-webhook [448 linhas] - Processa eventos Stripe
│   │   └── functions/debug-subscription [~200 linhas] - Debug only
│   ├── Database
│   │   ├── subscriptions table [20 campos]
│   │   ├── subscription_audit_logs table ✅
│   │   ├── webhook_events table [idempotência] ✅
│   │   └── check_subscription_cache() function [RPC]
│   └── Status: FRAGMENTADO - Precisa REESCRITA COMPLETA
│
├── 🛒 MÓDULO DE PEDIDOS [MADURO - 75%]
│   ├── Frontend
│   │   ├── hooks/useOrderProtection.tsx ✅
│   │   ├── hooks/useOrderItems.tsx ✅
│   │   ├── hooks/usePayment.tsx
│   │   └── utils/idempotency.ts ✅
│   ├── Backend
│   │   ├── functions/create-order-optimized [PRINCIPAL]
│   │   ├── functions/create-order-with-idempotency [DUPLICADO?]
│   │   ├── functions/create-order-with-pix
│   │   ├── functions/create-order-with-card
│   │   └── functions/expire-orders-enhanced
│   ├── Database
│   │   ├── orders table [17 campos]
│   │   ├── order_items table [8 campos]
│   │   ├── order_processing_queue table [19 campos] ✅
│   │   ├── background_jobs table ✅
│   │   └── Multiple SQL functions (atomic operations)
│   └── Status: MADURO mas com duplicações menores
│
├── 💰 MÓDULO DE PAGAMENTOS [FRAGMENTADO - 50%]
│   ├── Stripe Integration
│   │   ├── functions/stripe-webhook [448 linhas] ✅ BEM IMPLEMENTADO
│   │   ├── functions/process-card-payment
│   │   └── Status: PRODUÇÃO-READY
│   ├── MercadoPago Integration
│   │   ├── functions/mercadopago-webhook [452 linhas] ⚠️ HMAC INCOMPLETO
│   │   ├── functions/create-mercadopago-preference
│   │   ├── functions/create-pix-payment [DUPLICADO?]
│   │   ├── hooks/useMercadoPago.tsx
│   │   └── Status: FUNCIONAL mas INSEGURO
│   ├── Database
│   │   ├── pix_transactions table
│   │   ├── card_transactions table
│   │   └── payment_reconciliation table
│   └── Status: FRAGMENTADO - Precisa consolidação e segurança
│
├── 🏪 MÓDULO ADMIN [MADURO - 70%]
│   ├── Frontend
│   │   ├── pages/AdminDashboard.tsx ✅
│   │   ├── pages/AdminProducts.tsx ✅
│   │   ├── pages/AdminOrders.tsx ✅
│   │   ├── hooks/useUnifiedAdminData.tsx ⚠️ MUITO GRANDE (500+ linhas)
│   │   └── hooks/useAdminOrdersOptimized.tsx
│   ├── Database
│   │   ├── admin_stats_view [materialized view]
│   │   ├── admin_action_logs table
│   │   └── Multiple RLS policies
│   └── Status: MADURO mas precisa modularização
│
├── 📦 MÓDULO DE PRODUTOS/CATÁLOGO [MADURO - 80%]
│   ├── Frontend
│   │   ├── hooks/useAdminCatalog.tsx ✅
│   │   ├── hooks/useMenuOptimized.tsx ✅
│   │   └── Multiple admin components
│   ├── Database
│   │   ├── products table
│   │   ├── categories table
│   │   ├── subcategories table
│   │   ├── product_extras table
│   │   └── product_crusts table
│   └── Status: MADURO e ESTÁVEL
│
├── 📊 MÓDULO DE ESTOQUE [BOM - 75%]
│   ├── Frontend
│   │   ├── hooks/useAtomicStock.tsx ✅
│   │   └── pages/AdminStock.tsx
│   ├── Database
│   │   ├── product_stock table
│   │   ├── stock_reservations table ✅
│   │   ├── stock_audit_logs table ✅
│   │   └── atomic_reserve_stock() function ✅
│   └── Status: BEM PROJETADO
│
└── 🔧 MÓDULOS AUXILIARES
    ├── Realtime [DUPLICADO - 2 serviços] 🔴
    │   ├── services/realtime.ts
    │   └── services/realtimeManager.ts
    ├── Monitoring/Analytics [FUNCIONAL]
    ├── Integrações (ERP, Delivery, etc.) [PARCIAL]
    └── PWA/Service Worker [IMPLEMENTADO]
```

### 1.2 Matriz de Maturidade dos Módulos

| Módulo | Maturidade | Cobertura Testes | Segurança | Refatorar? | Prioridade |
|--------|-----------|------------------|-----------|------------|------------|
| **Autenticação** | 85% ✅ | 0% 🔴 | 60% ⚠️ | Parcial | ALTA |
| **Assinatura** | 35% 🔴 | 0% 🔴 | 40% 🔴 | **TOTAL** | **CRÍTICA** |
| **Pedidos** | 75% ✅ | 0% 🔴 | 70% ⚠️ | Leve | MÉDIA |
| **Pagamentos** | 50% ⚠️ | 0% 🔴 | 55% ⚠️ | Moderada | ALTA |
| **Admin** | 70% ✅ | 0% 🔴 | 75% ✅ | Modularizar | MÉDIA |
| **Produtos** | 80% ✅ | 0% 🔴 | 80% ✅ | Não | BAIXA |
| **Estoque** | 75% ✅ | 0% 🔴 | 85% ✅ | Não | BAIXA |

### 1.3 Dependências e Acoplamento

```mermaid
graph TD
    A[useUnifiedAuth] -->|FORTEMENTE ACOPLADO| B[Subscription Logic]
    A -->|USA| C[useRole]
    A -->|CHAMA| D[check-subscription Edge Fn]
    
    B -->|IMPLEMENTAÇÃO 1| E[useSubscriptionCore]
    B -->|IMPLEMENTAÇÃO 2| F[useSubscriptionMiddleware]
    B -->|IMPLEMENTAÇÃO 3| G[useSimpleSubscription]
    B -->|IMPLEMENTAÇÃO 4| H[SubscriptionGlobalProvider]
    
    E -->|CHAMA| D
    F -->|CHAMA| D
    G -->|CONSULTA DIRETO| I[(subscriptions table)]
    
    D -->|VERIFICA| I
    D -->|SINCRONIZA| J[Stripe API]
    
    K[stripe-webhook] -->|ATUALIZA| I
    L[reconcile-subscription] -->|SINCRONIZA| I
    L -->|CONSULTA| J
    
    M[UnifiedProtectedRoute] -->|USA| A
    M -->|VALIDA| B
    
    N[Admin Pages] -->|USA| A
    N -->|VERIFICA| B
    
    O[Order Creation] -->|REQUER| A
    O -->|VALIDA| P[Payment]
    
    style B fill:#ff6b6b
    style E fill:#ffd93d
    style F fill:#ffd93d
    style G fill:#ffd93d
    style H fill:#ffd93d
```

**Problemas Identificados:**
1. ❌ **Acoplamento Crítico**: `useUnifiedAuth` mistura autenticação + assinatura (520 linhas)
2. ❌ **Múltiplas Fontes de Verdade**: 4 implementações paralelas de subscription check
3. ❌ **Inconsistência**: Hooks diferentes retornam formatos diferentes
4. ❌ **Cache Desorganizado**: React Query + localStorage sem coordenação

---

## 2️⃣ REPLANEJAR O BACKEND

### 2.1 Nova Arquitetura de Edge Functions

```
📁 supabase/functions/
├── 🔐 auth/
│   ├── check-session/              [NOVO - Verificar sessão pura]
│   └── refresh-session/            [NOVO - Refresh token]
│
├── 💳 subscription/                [CONSOLIDADO - Tudo relacionado a assinatura]
│   ├── check/                      [REFATORADO - Apenas verificação]
│   │   └── index.ts
│   ├── create-checkout/            [MANTÉM - Já bom]
│   │   └── index.ts
│   ├── reconcile/                  [REFATORADO - Simplificar]
│   │   └── index.ts
│   ├── webhook-stripe/             [RENOMEADO - Específico]
│   │   └── index.ts
│   └── _shared/                    [NOVO - Código compartilhado]
│       ├── stripe-client.ts
│       ├── subscription-mapper.ts
│       └── validation.ts
│
├── 🛒 orders/
│   ├── create/                     [CONSOLIDADO - Único ponto de entrada]
│   ├── process-queue/              [MANTÉM]
│   ├── expire/                     [CONSOLIDADO - Remover duplicate]
│   └── _shared/
│       ├── idempotency.ts
│       └── validation.ts
│
├── 💰 payments/
│   ├── mercadopago/
│   │   ├── create-preference/
│   │   ├── create-pix/             [CONSOLIDAR com preference?]
│   │   └── webhook/                [REFATORAR - Adicionar HMAC completo]
│   ├── stripe/
│   │   └── process-card/
│   └── _shared/
│       ├── payment-validation.ts
│       └── reconciliation.ts
│
└── 🔧 admin/
    ├── role-update/                [MANTÉM]
    └── stats/                      [NOVO - Separar lógica pesada]
```

### 2.2 Funções a REMOVER (Dead Code)

```typescript
// ❌ REMOVER
supabase/functions/debug-subscription/         // Debug tool - não prod
supabase/functions/subscription-reconciler/    // Duplicado de reconcile-subscription
supabase/functions/create-order-with-pix/      // Consolidar em create-order
supabase/functions/create-order-with-card/     // Consolidar em create-order
supabase/functions/expire-orders/              // Duplicado - usar expire-orders-enhanced
```

### 2.3 Nova Estrutura de Hooks (Frontend)

```
📁 src/hooks/
├── auth/
│   ├── useAuth.tsx                 [NOVO - Auth puro, SEM subscription]
│   ├── useSession.tsx              [NOVO - Session management]
│   └── useRole.tsx                 [REFATORADO - Unificar duplicatas]
│
├── subscription/
│   ├── useSubscription.tsx         [NOVO - Interface unificada]
│   ├── _internal/
│   │   ├── useSubscriptionFetch.ts [Lógica de fetch]
│   │   ├── useSubscriptionCache.ts [React Query setup]
│   │   └── useSubscriptionSync.ts  [Sync com Stripe]
│   └── useSubscriptionGuard.tsx    [NOVO - Guard HOC]
│
├── orders/
│   ├── useOrders.tsx
│   ├── useOrderItems.tsx           [MANTÉM]
│   ├── useOrderProtection.tsx      [MANTÉM]
│   └── useIdempotency.tsx          [EXTRAIR de utils]
│
├── payments/
│   ├── usePayment.tsx              [REFATORAR]
│   ├── useMercadoPago.tsx          [MANTÉM]
│   └── useStripe.tsx               [NOVO - Se necessário]
│
└── admin/
    ├── useAdminData.tsx            [REFATORADO - Modular]
    ├── useAdminOrders.tsx          [MANTÉM]
    └── useAdminCatalog.tsx         [MANTÉM]
```

### 2.4 Redesign das Funções Críticas

#### 2.4.1 **check-subscription** [REFATORADO]

**Problemas Atuais:**
- 239 linhas
- Mistura verificação DB + Stripe
- Cria registros falsos em alguns casos
- Sem rate limiting

**Nova Implementação:**

```typescript
// supabase/functions/subscription/check/index.ts
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "@supabase/supabase-js";
import { SubscriptionChecker } from "../_shared/subscription-checker.ts";
import { RateLimiter } from "../_shared/rate-limiter.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return Response.json(
        { error: "Missing authorization", subscribed: false },
        { status: 401, headers: corsHeaders }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return Response.json(
        { error: "Unauthorized", subscribed: false },
        { status: 401, headers: corsHeaders }
      );
    }

    // 2. Rate limiting (5 req/min per user)
    const rateLimiter = new RateLimiter(supabase);
    const allowed = await rateLimiter.check(user.id, 5, 60);
    if (!allowed) {
      return Response.json(
        { error: "Rate limit exceeded", subscribed: false },
        { status: 429, headers: corsHeaders }
      );
    }

    // 3. Check subscription using unified checker
    const checker = new SubscriptionChecker(supabase);
    const result = await checker.check(user.id);

    return Response.json(result, { headers: corsHeaders });

  } catch (error) {
    console.error("[CHECK-SUBSCRIPTION] Error:", error);
    return Response.json(
      { error: "Internal error", subscribed: false },
      { status: 500, headers: corsHeaders }
    );
  }
});
```

**Código Compartilhado:**

```typescript
// supabase/functions/subscription/_shared/subscription-checker.ts
export class SubscriptionChecker {
  constructor(private supabase: SupabaseClient) {}

  async check(userId: string): Promise<SubscriptionStatus> {
    // 1. Check cache first (5 min TTL)
    const cached = await this.checkCache(userId);
    if (cached && !cached.needsRefresh) {
      return cached.data;
    }

    // 2. Check database
    const dbSub = await this.checkDatabase(userId);
    if (dbSub && dbSub.status === 'active' && !this.isExpired(dbSub)) {
      return this.formatResult(dbSub);
    }

    // 3. Check Stripe (only if DB check failed or is stale)
    const stripeSub = await this.checkStripe(userId);
    
    // 4. Update DB if Stripe has different data
    if (stripeSub && stripeSub.isActive) {
      await this.syncToDatabase(userId, stripeSub);
    }

    return stripeSub 
      ? this.formatResult(stripeSub) 
      : this.formatInactive();
  }

  private async checkCache(userId: string) {
    const { data } = await this.supabase.rpc('check_subscription_cache', {
      p_user_id: userId,
      p_ttl_minutes: 5
    });
    return data;
  }

  private async checkDatabase(userId: string) {
    const { data, error } = await this.supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();
    
    return error ? null : data;
  }

  private async checkStripe(userId: string) {
    // Implementation details...
  }

  private isExpired(subscription: any): boolean {
    if (!subscription.expires_at) return false;
    return new Date(subscription.expires_at) < new Date();
  }

  private formatResult(data: any): SubscriptionStatus {
    return {
      subscribed: data.status === 'active',
      status: data.status,
      plan_name: data.plan_name,
      plan_price: data.plan_price,
      expires_at: data.expires_at,
      checked_at: new Date().toISOString()
    };
  }

  private formatInactive(): SubscriptionStatus {
    return {
      subscribed: false,
      status: 'inactive',
      plan_name: 'Nenhum',
      plan_price: 0,
      expires_at: null,
      checked_at: new Date().toISOString()
    };
  }
}

interface SubscriptionStatus {
  subscribed: boolean;
  status: string;
  plan_name: string;
  plan_price: number;
  expires_at: string | null;
  checked_at: string;
}
```

#### 2.4.2 **reconcile-subscription** [SIMPLIFICADO]

**Nova Implementação:**

```typescript
// supabase/functions/subscription/reconcile/index.ts
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "@supabase/supabase-js";
import { SubscriptionReconciler } from "../_shared/reconciler.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth
    const supabase = createClient(/*...*/);
    const { user } = await authenticateRequest(req, supabase);

    // Only allow user to reconcile their own subscription
    const reconciler = new SubscriptionReconciler(supabase);
    const result = await reconciler.reconcile(user.id);

    return Response.json({
      success: true,
      changes: result.changes,
      subscription: result.subscription
    }, { headers: corsHeaders });

  } catch (error) {
    return Response.json(
      { success: false, error: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
});
```

#### 2.4.3 **stripe-webhook** [JÁ BOM - Manter com melhorias menores]

**Melhorias Sugeridas:**
- ✅ Já tem idempotência
- ✅ Já valida assinatura
- ✅ Já atualiza DB corretamente
- ⚠️ Adicionar rate limiting por IP
- ⚠️ Adicionar alertas de segurança mais granulares

#### 2.4.4 **mercadopago-webhook** [CRÍTICO - Completar HMAC]

**Problema Atual:**
```typescript
// INCOMPLETO - Função validateWebhookSignature existe mas...
const isValidSignature = await validateWebhookSignature(payload, signature, webhookSecret);
if (!isValidSignature) {
  // ... bloqueia
}
```

**Completar Implementação HMAC:**

```typescript
// supabase/functions/payments/mercadopago/webhook/index.ts
import { crypto } from "https://deno.land/std@0.190.0/crypto/mod.ts";

async function validateWebhookSignature(
  payload: string,
  signature: string | null,
  secret: string
): Promise<boolean> {
  if (!signature || !secret) return false;

  try {
    // MercadoPago signature format: "ts=<timestamp>,v1=<hash>"
    const parts = signature.split(',').reduce((acc, part) => {
      const [key, value] = part.split('=');
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);

    const timestamp = parts.ts;
    const hash = parts.v1;

    if (!timestamp || !hash) return false;

    // Validate timestamp (prevent replay attacks - max 5 min old)
    const now = Math.floor(Date.now() / 1000);
    const ts = parseInt(timestamp);
    if (Math.abs(now - ts) > 300) {
      console.log('[SECURITY] Timestamp too old or in future', { ts, now, diff: now - ts });
      return false;
    }

    // Generate expected signature
    const signaturePayload = `${timestamp}.${payload}`;
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const messageData = encoder.encode(signaturePayload);

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signatureBytes = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
    const expectedHash = Array.from(new Uint8Array(signatureBytes))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Constant-time comparison (prevent timing attacks)
    const isValid = constantTimeCompare(expectedHash, hash);

    if (!isValid) {
      console.log('[SECURITY] HMAC validation failed', {
        expected: expectedHash.substring(0, 10) + '...',
        received: hash.substring(0, 10) + '...'
      });
    }

    return isValid;
  } catch (error) {
    console.error('[SECURITY] HMAC validation error:', error);
    return false;
  }
}

function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
```

---

## 3️⃣ PLANEJAR A REIMPLEMENTAÇÃO NO LOVABLE

### 3.1 Prompt Técnico para Lovable

```markdown
# PROMPT: Refatoração Completa do Sistema de Assinatura

## Contexto
O projeto Pizza Express possui um sistema de assinatura fragmentado em 4 implementações paralelas e inconsistentes. Esta refatoração visa criar uma única fonte de verdade.

## Objetivos
1. ✅ Consolidar toda lógica de assinatura em hooks e functions únicos
2. ✅ Desacoplar autenticação de assinatura
3. ✅ Implementar cache coordenado (React Query + RPC)
4. ✅ Garantir segurança e rate limiting
5. ✅ Manter compatibilidade com código existente durante migração

## Fase 1: Preparação (Não modifique código ainda)
Execute auditoria e confirme compreensão da estrutura atual.

## Fase 2: Backend - Refatorar Edge Functions

### Passo 2.1: Criar estrutura _shared
📁 supabase/functions/subscription/_shared/
├── subscription-checker.ts     [Classe unificada de verificação]
├── reconciler.ts               [Classe de reconciliação]
├── stripe-client.ts            [Cliente Stripe configurado]
├── rate-limiter.ts             [Rate limiting genérico]
└── types.ts                    [Tipos compartilhados]

### Passo 2.2: Refatorar check-subscription
- Implementar usando SubscriptionChecker
- Adicionar rate limiting (5 req/min por usuário)
- Remover lógica de criação de registros falsos
- Cache inteligente (5 min TTL, fallback para Stripe)

### Passo 2.3: Simplificar reconcile-subscription
- Usar SubscriptionReconciler
- Apenas reconciliar assinatura do usuário autenticado
- Retornar mudanças aplicadas

### Passo 2.4: Completar mercadopago-webhook
- Implementar HMAC validation completo
- Adicionar constant-time comparison
- Validação de timestamp (prevenir replay attacks)

## Fase 3: Frontend - Consolidar Hooks

### Passo 3.1: Separar Autenticação de Assinatura

**ANTES (useUnifiedAuth.tsx - 520 linhas):**
```typescript
// Mistura auth + subscription
export const useUnifiedAuth = () => {
  const [user, setUser] = useState();
  const [subscription, setSubscription] = useState();
  // ... 500+ linhas
}
```

**DEPOIS:**

**src/hooks/auth/useAuth.tsx** [NOVO - ~150 linhas]:
```typescript
export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Auth state management (SEM subscription)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  // ... outras funções de auth puras

  return {
    user,
    session,
    loading,
    signIn,
    signOut,
    isAuthenticated: () => !!user && !!session,
  };
};
```

**src/hooks/subscription/useSubscription.tsx** [NOVO - ~200 linhas]:
```typescript
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/auth/useAuth';
import { supabase } from '@/integrations/supabase/client';

export const useSubscription = () => {
  const { user, session } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: async () => {
      if (!user || !session) return null;

      const { data, error } = await supabase.functions.invoke(
        'subscription/check',
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (error) throw error;
      return data;
    },
    enabled: !!user && !!session,
    staleTime: 5 * 60 * 1000, // 5 min
    retry: 2,
  });

  const refresh = async () => {
    await refetch();
  };

  const reconcile = async () => {
    await supabase.functions.invoke('subscription/reconcile', {
      headers: {
        Authorization: `Bearer ${session?.access_token}`,
      },
    });
    await refresh();
  };

  const isActive = () => {
    return data?.subscribed === true && data?.status === 'active';
  };

  return {
    subscription: data,
    isLoading,
    error,
    isActive: isActive(),
    refresh,
    reconcile,
  };
};
```

### Passo 3.2: Remover implementações antigas

**ARQUIVOS A DELETAR:**
- ❌ src/hooks/useSubscriptionCore.ts
- ❌ src/hooks/useSubscriptionMiddleware.ts
- ❌ src/hooks/useSimpleSubscription.tsx
- ❌ src/components/SubscriptionGlobalProvider.tsx

**ARQUIVOS A MANTER:**
- ✅ src/components/SubscriptionStatus.tsx (atualizar para usar novo hook)
- ✅ src/routes/UnifiedProtectedRoute.tsx (atualizar imports)

### Passo 3.3: Criar hook de compatibilidade temporária

**src/hooks/useUnifiedAuth.tsx** [REFATORADO - ~100 linhas]:
```typescript
// Wrapper de compatibilidade - usar useAuth + useSubscription
export const useUnifiedAuth = () => {
  const auth = useAuth();
  const sub = useSubscription();

  return {
    // Auth
    user: auth.user,
    session: auth.session,
    loading: auth.loading,
    signIn: auth.signIn,
    signOut: auth.signOut,
    isAuthenticated: auth.isAuthenticated,
    
    // Subscription (formato antigo para compatibilidade)
    subscription: {
      subscribed: sub.isActive,
      status: sub.subscription?.status || 'inactive',
      plan_name: sub.subscription?.plan_name || 'Nenhum',
      plan_price: sub.subscription?.plan_price || 0,
      expires_at: sub.subscription?.expires_at,
      loading: sub.isLoading,
      hasSubscriptionHistory: !!sub.subscription,
    },
    refreshSubscription: sub.refresh,
    hasValidSubscription: () => sub.isActive,
  };
};
```

## Fase 4: Database - Ajustes Finais

### Passo 4.1: Otimizar check_subscription_cache function
```sql
CREATE OR REPLACE FUNCTION check_subscription_cache(
  p_user_id UUID,
  p_ttl_minutes INTEGER DEFAULT 5
)
RETURNS TABLE(
  is_active BOOLEAN,
  status TEXT,
  plan_name TEXT,
  plan_price NUMERIC,
  expires_at TIMESTAMPTZ,
  needs_refresh BOOLEAN
) AS $$
DECLARE
  v_subscription RECORD;
  v_age_minutes INTEGER;
BEGIN
  SELECT * INTO v_subscription
  FROM subscriptions
  WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 'inactive'::TEXT, 'Nenhum'::TEXT, 0::NUMERIC, NULL::TIMESTAMPTZ, TRUE;
    RETURN;
  END IF;

  -- Calculate cache age
  v_age_minutes := EXTRACT(EPOCH FROM (now() - v_subscription.last_synced_at)) / 60;

  -- Check if needs refresh
  IF v_age_minutes > p_ttl_minutes OR 
     v_subscription.expires_at < now() OR
     v_subscription.status != 'active' THEN
    RETURN QUERY SELECT 
      FALSE, 
      v_subscription.status, 
      v_subscription.plan_name, 
      v_subscription.plan_price, 
      v_subscription.expires_at,
      TRUE;
  ELSE
    RETURN QUERY SELECT
      TRUE,
      v_subscription.status,
      v_subscription.plan_name,
      v_subscription.plan_price,
      v_subscription.expires_at,
      FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Passo 4.2: Adicionar índices de performance
```sql
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status 
ON subscriptions(user_id, status) 
WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_subscriptions_expires 
ON subscriptions(expires_at) 
WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_webhook_events_event_id 
ON webhook_events(event_id);
```

## Fase 5: Testing & Validação

### Testes Essenciais (criar depois da refatoração)
1. ✅ Teste de autenticação isolada
2. ✅ Teste de verificação de assinatura
3. ✅ Teste de cache TTL
4. ✅ Teste de reconciliação
5. ✅ Teste de webhooks (idempotência)
6. ✅ Teste de rate limiting

## Regras Críticas de Implementação

1. 🚫 **NÃO APAGUE CÓDIGO ANTIGO AINDA**
   - Primeiro implemente novo código em paralelo
   - Teste extensivamente
   - Migre gradualmente

2. ✅ **MANTENHA COMPATIBILIDADE**
   - Hook `useUnifiedAuth` deve continuar funcionando
   - Apenas internamente use novo código

3. ⚠️ **VALIDE CADA FASE**
   - Após cada fase, confirme que sistema funciona
   - Não avance se houver erros

4. 📊 **MONITORE PERFORMANCE**
   - Compare tempo de resposta antes/depois
   - Verifique queries do React Query DevTools

## Entregáveis Esperados

### Backend
- ✅ 4 edge functions refatoradas (check, create-checkout, reconcile, webhook)
- ✅ 1 pasta _shared com código reutilizável
- ✅ Validação HMAC completa em MercadoPago

### Frontend
- ✅ 2 hooks principais (useAuth, useSubscription)
- ✅ 1 hook de compatibilidade (useUnifiedAuth)
- ✅ 0 hooks legados (deletados)

### Database
- ✅ Function check_subscription_cache otimizada
- ✅ 3 índices de performance adicionados

### Documentação
- ✅ README.md atualizado com nova arquitetura
- ✅ Migration guide para desenvolvedores
```

### 3.2 Checklist de Migração

#### Fase 1: Preparação ✅
- [ ] Backup completo do código atual
- [ ] Criar branch `refactor/subscription-system`
- [ ] Documentar todos os pontos de uso atual
- [ ] Confirmar testes manuais funcionando

#### Fase 2: Backend (Edge Functions)
- [ ] Criar estrutura `_shared`
- [ ] Implementar `SubscriptionChecker`
- [ ] Refatorar `check-subscription`
- [ ] Simplificar `reconcile-subscription`
- [ ] Completar HMAC em `mercadopago-webhook`
- [ ] Testar cada função isoladamente

#### Fase 3: Frontend (Hooks)
- [ ] Criar `useAuth` separado
- [ ] Criar `useSubscription` separado
- [ ] Atualizar `useUnifiedAuth` como wrapper
- [ ] Atualizar `SubscriptionStatus` component
- [ ] Atualizar `UnifiedProtectedRoute`
- [ ] Testar fluxo completo de login

#### Fase 4: Database
- [ ] Otimizar `check_subscription_cache()`
- [ ] Adicionar índices de performance
- [ ] Validar queries com EXPLAIN ANALYZE

#### Fase 5: Limpeza
- [ ] Remover hooks antigos
- [ ] Remover edge functions duplicadas
- [ ] Atualizar documentação
- [ ] Code review completo

#### Fase 6: Deploy
- [ ] Deploy em ambiente de staging
- [ ] Testes E2E completos
- [ ] Monitorar métricas por 24h
- [ ] Deploy em produção
- [ ] Monitorar erros/logs

### 3.3 Código Base Pronto para Colar

#### useAuth.tsx [NOVO]

```typescript
// src/hooks/auth/useAuth.tsx
import { useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;
        
        console.log('[AUTH] State changed:', event);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (event === 'SIGNED_OUT') {
          // Clear caches
          try {
            const keysToRemove: string[] = [];
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key && (
                key.startsWith('subscription_') ||
                key.startsWith('auth_')
              )) {
                keysToRemove.push(key);
              }
            }
            keysToRemove.forEach(key => localStorage.removeItem(key));
          } catch (e) {
            console.warn('[AUTH] Failed to clear cache:', e);
          }
        }
        
        if (mounted) setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!mounted) return;
      if (error) console.error('[AUTH] Session error:', error);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Redirect based on role
      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .maybeSingle();

        const role = profile?.role || 'customer';
        
        setTimeout(() => {
          switch (role) {
            case 'admin':
              window.location.href = '/admin';
              break;
            case 'attendant':
              window.location.href = '/attendant';
              break;
            default:
              window.location.href = '/dashboard';
              break;
          }
        }, 300);
      }

      toast({
        title: "Login realizado!",
        description: "Bem-vindo de volta!",
      });

      return data;
    } catch (error: any) {
      console.error('[AUTH] Sign in error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const signOut = useCallback(async () => {
    try {
      console.log('[AUTH] Signing out');
      
      // Clear state immediately
      setSession(null);
      setUser(null);
      
      // Clear caches
      try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (
            key.startsWith('subscription_') ||
            key.startsWith('auth_')
          )) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
      } catch (e) {
        console.warn('[AUTH] Cache clear failed:', e);
      }
      
      // Perform logout
      await supabase.auth.signOut();
      
      toast({
        title: "Logout realizado!",
        description: "Até a próxima!",
      });
    } catch (error: any) {
      console.error('[AUTH] Sign out error:', error);
      throw error;
    }
  }, [toast]);

  const isAuthenticated = useCallback(() => {
    return !!user && !!session;
  }, [user, session]);

  return {
    user,
    session,
    loading,
    signIn,
    signOut,
    isAuthenticated,
  };
};
```

#### useSubscription.tsx [NOVO]

```typescript
// src/hooks/subscription/useSubscription.tsx
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/auth/useAuth';

export interface SubscriptionData {
  subscribed: boolean;
  status: string;
  plan_name: string;
  plan_price: number;
  expires_at: string | null;
  checked_at: string;
}

export const SUBSCRIPTION_KEYS = {
  subscription: (userId: string) => ['subscription', userId],
};

export const useSubscription = () => {
  const { user, session } = useAuth();
  const queryClient = useQueryClient();

  const fetchSubscription = useCallback(async (): Promise<SubscriptionData | null> => {
    if (!user || !session) {
      console.log('[SUBSCRIPTION] No user or session');
      return null;
    }

    console.log('[SUBSCRIPTION] Fetching for user:', user.id);

    const { data, error } = await supabase.functions.invoke(
      'subscription/check',
      {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      }
    );

    if (error) {
      console.error('[SUBSCRIPTION] Fetch error:', error);
      throw error;
    }

    return data;
  }, [user, session]);

  const query = useQuery({
    queryKey: SUBSCRIPTION_KEYS.subscription(user?.id || ''),
    queryFn: fetchSubscription,
    enabled: !!user && !!session,
    staleTime: 5 * 60 * 1000, // 5 min
    refetchInterval: false,
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const isActive = useMemo(() => {
    return query.data?.subscribed === true && query.data?.status === 'active';
  }, [query.data]);

  const refresh = useCallback(async () => {
    console.log('[SUBSCRIPTION] Refreshing');
    await query.refetch();
  }, [query]);

  const reconcile = useCallback(async () => {
    if (!session) {
      throw new Error('No session for reconciliation');
    }

    console.log('[SUBSCRIPTION] Reconciling');
    
    const { error } = await supabase.functions.invoke(
      'subscription/reconcile',
      {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      }
    );

    if (error) {
      console.error('[SUBSCRIPTION] Reconcile error:', error);
      throw error;
    }

    await refresh();
  }, [session, refresh]);

  const invalidate = useCallback(() => {
    if (!user) return;
    console.log('[SUBSCRIPTION] Invalidating cache');
    queryClient.invalidateQueries({
      queryKey: SUBSCRIPTION_KEYS.subscription(user.id),
    });
  }, [user, queryClient]);

  return {
    subscription: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    isActive,
    refresh,
    reconcile,
    invalidate,
  };
};
```

---

## 4️⃣ CRONOGRAMA DE IMPLEMENTAÇÃO

### Sprint 1: Backend Core (5-7 dias)
- Dia 1-2: Criar estrutura _shared + SubscriptionChecker
- Dia 3-4: Refatorar check-subscription + reconcile
- Dia 5: Completar HMAC MercadoPago
- Dia 6-7: Testes + ajustes

### Sprint 2: Frontend Core (3-5 dias)
- Dia 1-2: Separar useAuth + useSubscription
- Dia 3: Atualizar componentes (SubscriptionStatus, UnifiedProtectedRoute)
- Dia 4-5: Testes + ajustes

### Sprint 3: Limpeza & Deploy (2-3 dias)
- Dia 1: Remover código legado
- Dia 2: Database optimization
- Dia 3: Deploy staging + monitoramento

### Sprint 4: Produção (1-2 dias)
- Dia 1: Deploy produção
- Dia 2: Monitoramento 24h + hotfixes

**Total Estimado: 11-17 dias úteis**

---

## 5️⃣ RISCOS E MITIGAÇÕES

| Risco | Impacto | Probabilidade | Mitigação |
|-------|---------|---------------|-----------|
| Quebrar fluxo de login existente | Alto | Média | Manter useUnifiedAuth como wrapper |
| Perder assinaturas ativas | Crítico | Baixa | Backup DB + reconciliação antes de deploy |
| Rate limiting bloquear usuários | Alto | Média | Configurar limites generosos (5 req/min) |
| Cache desatualizado | Médio | Média | TTL curto (5 min) + invalidação manual |
| Webhooks duplicados | Médio | Baixa | Idempotência já implementada |

---

## 6️⃣ MÉTRICAS DE SUCESSO

### Performance
- ✅ Tempo de verificação de assinatura < 500ms (P95)
- ✅ Cache hit rate > 80%
- ✅ Redução de 60% em calls desnecessários ao Stripe

### Código
- ✅ Redução de 40% em linhas de código relacionadas a subscription
- ✅ Eliminar 4 implementações paralelas
- ✅ Cobertura de testes > 70% (após implementação de testes)

### Segurança
- ✅ 100% de webhooks com validação HMAC
- ✅ Rate limiting em todas as edge functions críticas
- ✅ Zero registros falsos criados no DB

---

## 📚 REFERÊNCIAS TÉCNICAS

### Documentação
- [Stripe Subscriptions Best Practices](https://stripe.com/docs/billing/subscriptions/overview)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [React Query Best Practices](https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults)

### Padrões de Arquitetura
- Single Source of Truth (SSOT)
- Separation of Concerns (SoC)
- Dependency Injection
- Repository Pattern (para edge functions)

---

## ✅ CONCLUSÃO

Este plano de reestruturação visa transformar o sistema de assinatura de **fragmentado e inseguro** para **consolidado e confiável**.

**Próximos Passos Imediatos:**
1. Aprovar este plano técnico
2. Criar branch de refatoração
3. Iniciar Sprint 1 (Backend Core)

**Benefícios Esperados:**
- 🚀 Performance: 60% menos chamadas API
- 🔒 Segurança: 100% de webhooks validados
- 🧹 Código: 40% menos linhas, zero duplicação
- 🧪 Testes: De 0% para 70% de cobertura

---

**Documento preparado por:** Sistema de Auditoria Técnica  
**Última atualização:** 2025-01-XX  
**Status:** ✅ Pronto para implementação
