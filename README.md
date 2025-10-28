# 🍕 Pizza Club - Cardápio Digital com Sistema de Assinaturas

> Sistema completo de cardápio digital com gestão de pedidos, pagamentos e assinaturas.

## 📋 Sobre o Projeto

Sistema de cardápio digital B2B que permite restaurantes e pizzarias criarem seus próprios apps de delivery. Inclui:

- 📱 **Cardápio Digital** - Menu interativo com categorias e subcategorias
- 🛒 **Carrinho Inteligente** - Sistema de pedidos com customização
- 💳 **Pagamentos Integrados** - PIX, Cartão (Stripe) e Mercado Pago
- 👥 **Multi-perfis** - Cliente, Atendente, Admin
- 📊 **Dashboard Admin** - Gestão completa de pedidos e produtos
- 💎 **Sistema de Assinaturas** - Planos via Stripe
- 🔄 **Real-time** - Atualização instantânea de pedidos
- 🎨 **Totalmente Responsivo** - Mobile-first design

## 🚀 Stack Tecnológica

### Frontend
- **React 18** - UI Library
- **TypeScript** - Type Safety
- **Vite** - Build Tool
- **TailwindCSS** - Styling
- **Shadcn/UI** - Component Library
- **React Query** - Data Fetching & Caching
- **Zustand** - State Management
- **React Router** - Routing

### Backend
- **Supabase** - Backend as a Service
  - PostgreSQL Database
  - Real-time subscriptions
  - Authentication
  - Edge Functions
  - Storage

### Testes
- **Vitest** - Unit Testing
- **Testing Library** - Component Testing

### Integrações
- **Stripe** - Pagamentos e Assinaturas
- **Mercado Pago** - Pagamentos alternativos
- **PIX** - Pagamentos instantâneos

## 🏗️ Arquitetura

```
src/
├── components/          # Componentes React
│   ├── ui/             # Componentes base (shadcn)
│   └── __tests__/      # Testes de componentes
├── hooks/              # Custom Hooks
│   ├── auth/           # Auth hooks (modular)
│   ├── subscription/   # Subscription hooks (modular)
│   └── __tests__/      # Testes de hooks
├── pages/              # Páginas da aplicação
│   └── admin/          # Painel administrativo
├── utils/              # Utilitários
│   └── __tests__/      # Testes de utils
├── stores/             # State management (Zustand)
├── services/           # Serviços externos
└── integrations/       # Integrações (Supabase, etc)

supabase/
├── functions/          # Edge Functions
│   └── _shared/        # Código compartilhado
└── migrations/         # Database migrations
```

## 📦 Instalação

### Pré-requisitos
- Node.js 18+ ([install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating))
- npm ou yarn

### Setup

```bash
# 1. Clone o repositório
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
# (as credenciais do Supabase já estão configuradas)

# 4. Inicie o servidor de desenvolvimento
npm run dev
```

O app estará rodando em `http://localhost:8080`

## 🧪 Testes

```bash
# Rodar todos os testes
npm run test

# Rodar com watch mode
npm run test:watch

# Rodar com UI (recomendado)
npm run test:ui

# Gerar relatório de cobertura
npm run test:coverage
```

Ver [TESTING.md](./TESTING.md) para mais detalhes.

## 🛠️ Comandos Disponíveis

```bash
npm run dev          # Desenvolvimento
npm run build        # Build de produção
npm run build:dev    # Build de desenvolvimento
npm run preview      # Preview do build
npm run lint         # Lint do código
npm run test         # Rodar testes
npm run test:ui      # Testes com UI
npm run test:coverage # Coverage report
```

## 📱 Perfis de Usuário

### Cliente
- Visualizar cardápio
- Fazer pedidos
- Acompanhar status
- Gerenciar endereços
- Ver histórico

### Atendente
- Visualizar pedidos em tempo real
- Atualizar status de pedidos
- Chat com clientes
- Dashboard simplificado

### Admin
- Gestão completa de produtos
- Gestão de categorias
- Gestão de pedidos
- Relatórios e analytics
- Configurações do sistema
- Gestão de usuários

## 🔐 Autenticação

Sistema de autenticação multi-camadas:
- Email/Password
- OAuth (Google) - Configurável
- Session management via Supabase
- RLS (Row Level Security) policies
- Rate limiting

## 💳 Pagamentos

### PIX
- Geração automática de QR Code
- Verificação de status em tempo real
- Timeout configurável

### Cartão (Stripe)
- Checkout seguro
- Webhooks para confirmação
- Suporte a salvamento de cartões

### Mercado Pago
- Integração completa
- Link de pagamento
- Notificações via webhook

## 🔄 Real-time Features

- Atualização de pedidos em tempo real
- Notificações de novos pedidos
- Chat entre cliente e atendente
- Sincronização automática de estoque

## 📊 Performance

### Métricas Atuais
- **Bundle Size**: ~520KB (gzipped)
- **First Load**: <2s
- **Lighthouse Score**: 90+
- **Test Coverage**: ~40%

### Otimizações Implementadas
- ✅ Code splitting por rota
- ✅ Lazy loading de componentes
- ✅ Image optimization (WebP)
- ✅ Virtualization para listas grandes
- ✅ React Query caching
- ✅ Memoization de componentes pesados

## 📚 Documentação

- [Auth Hooks](./src/hooks/auth/README.md)
- [Subscription Hooks](./src/hooks/subscription/README.md)
- [Utils](./src/utils/README.md)
- [Testing Guide](./TESTING.md)
- [Implementation Plan](./PLANO_IMPLEMENTACAO.md)

## 🚢 Deploy

### Via Lovable
1. Abra o projeto no [Lovable](https://lovable.dev/projects/048805a3-fc90-49cc-9d16-75619e7cc491)
2. Clique em Share → Publish
3. Seu app estará online!

### Via Vercel/Netlify
```bash
npm run build
# Deploy a pasta dist/
```

### Domínio Customizado
Configure em Project > Settings > Domains no Lovable.

## 🔒 Segurança

- ✅ RLS Policies em todas as tabelas
- ✅ Rate limiting em edge functions
- ✅ Validação de entrada server-side
- ✅ CSRF protection
- ✅ Sanitização de dados
- ✅ Tokens JWT seguros

## 🐛 Troubleshooting

### Build Errors
```bash
# Limpar cache
rm -rf node_modules dist .vite
npm install
npm run build
```

### Problemas de Auth
- Verifique as variáveis de ambiente
- Confirme RLS policies no Supabase
- Check console logs

### Testes Falhando
```bash
# Atualizar snapshots
npm run test -- -u

# Limpar cache do Vitest
npm run test -- --clearCache
```

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/amazing-feature`)
3. Commit suas mudanças (`git commit -m 'Add amazing feature'`)
4. Push para a branch (`git push origin feature/amazing-feature`)
5. Abra um Pull Request

## 📝 License

Este projeto está sob a licença MIT.

## 🔗 Links Úteis

- [Lovable Project](https://lovable.dev/projects/048805a3-fc90-49cc-9d16-75619e7cc491)
- [Supabase Dashboard](https://supabase.com/dashboard/project/xpgsfovrxguphlvncgwn)
- [Stripe Dashboard](https://dashboard.stripe.com/)

---

**Desenvolvido com ❤️ usando Lovable**
