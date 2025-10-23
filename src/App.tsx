
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/config/queryClient";
import { Routes, Route, Navigate } from "react-router-dom";
import { UnifiedAuthProvider } from "@/hooks/useUnifiedAuth";
import { SubscriptionGlobalProvider } from "@/components/SubscriptionGlobalProvider";
import { UnifiedProtectedRoute } from "@/routes/UnifiedProtectedRoute";
import { ProtectedSubscriptionRoute } from "@/components/ProtectedSubscriptionRoute";

import { AttendantRoute } from "@/routes/AttendantRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { lazy, Suspense, useEffect } from "react";
import { OptimizedLoadingSpinner } from "@/components/OptimizedLoadingSpinner";
import { smartPreload } from "@/utils/routePreloader";

// ===== PHASE 4: PWA + ANALYTICS COMPONENTS =====
import { PWAInstallPrompt } from './components/PWAInstallPrompt';
import { AnalyticsDebugger } from './components/AnalyticsDebugger';

// ===== BUNDLE OPTIMIZATION - APENAS 5 ROTAS CRÍTICAS =====
// Core pages - loading instantâneo (não lazy loaded)
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Menu from "./pages/Menu";
import ExpressCheckout from "./pages/ExpressCheckout";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";

// Lazy load attendant unified
const AttendantUnified = lazy(() => import("./pages/AttendantUnified"));

// Lazy loaded pages - apenas secundárias (otimizado)
const Dashboard = lazy(() => import("./pages/Dashboard"));
const SubscriptionPlansPage = lazy(() => import("./pages/SubscriptionPlans"));

const Orders = lazy(() => import("./pages/Orders"));
const Account = lazy(() => import("./pages/Account"));

const OrderStatus = lazy(() => import("./pages/OrderStatus"));

const Payment = lazy(() => import("./pages/Payment"));

// NEW ADMIN STRUCTURE - FASE 1 & FASE 3
const NewAdminDashboard = lazy(() => import("@/pages/admin/Dashboard"));
const AdminReceitas = lazy(() => import("@/pages/admin/dashboard/Receitas"));
const AdminAssinaturas = lazy(() => import("@/pages/admin/dashboard/Assinaturas"));

// FASE 3 - Gerenciar App
const GerenciarApp = lazy(() => import("@/pages/admin/gerenciar-app/index"));
const GerenciarAppProdutos = lazy(() => import("@/pages/admin/gerenciar-app/produtos/index"));
const GerenciarAppDelivery = lazy(() => import("@/pages/admin/gerenciar-app/Delivery"));
const GerenciarAppRegrasPagamento = lazy(() => import("@/pages/admin/gerenciar-app/RegrasPagamento"));
const GerenciarAppHorarios = lazy(() => import("@/pages/admin/gerenciar-app/Horarios"));
const GerenciarAppInformacoes = lazy(() => import("@/pages/admin/gerenciar-app/Informacoes"));
const GerenciarAppFidelidade = lazy(() => import("@/pages/admin/gerenciar-app/fidelidade/index"));
const GerenciarAppIntegracoes = lazy(() => import("@/pages/admin/gerenciar-app/Integracoes"));

// FASE 4 - Configurações
const Configuracoes = lazy(() => import("@/pages/admin/configuracoes/index"));
const ConfigImpressao = lazy(() => import("@/pages/admin/configuracoes/Impressao"));
const ConfigUsuarios = lazy(() => import("@/pages/admin/configuracoes/Usuarios"));
const ConfigConta = lazy(() => import("@/pages/admin/configuracoes/Conta"));

// FASE 5 - Sistema
const Sistema = lazy(() => import("@/pages/admin/sistema/index"));
const SistemaLogs = lazy(() => import("@/pages/admin/sistema/Logs"));
const SistemaStatus = lazy(() => import("@/pages/admin/sistema/Status"));
const SistemaPlanos = lazy(() => import("@/pages/admin/sistema/Planos"));
const SistemaBackups = lazy(() => import("@/pages/admin/sistema/Backups"));

// FASE 6 - Relatórios
const Relatorios = lazy(() => import("@/pages/admin/relatorios/index"));
const RelatoriosAnalytics = lazy(() => import("@/pages/admin/relatorios/Analytics"));
const RelatoriosPedidos = lazy(() => import("@/pages/admin/relatorios/Pedidos"));
const RelatoriosVendas = lazy(() => import("@/pages/admin/relatorios/VendasCategoria"));
const RelatoriosClientes = lazy(() => import("@/pages/admin/relatorios/Clientes"));
const RelatoriosDelivery = lazy(() => import("@/pages/admin/relatorios/Delivery"));

// FASE 7 - CRM
const CRM = lazy(() => import("@/pages/admin/crm/index"));
const CRMClientes = lazy(() => import("@/pages/admin/crm/Clientes"));
const CRMSegmentacao = lazy(() => import("@/pages/admin/crm/Segmentacao"));
const CRMComunicacao = lazy(() => import("@/pages/admin/crm/Comunicacao"));
const CRMFidelidade = lazy(() => import("@/pages/admin/crm/Fidelidade"));

// OLD ADMIN PAGES - Keep for now (will be migrated in later phases)
const AdminSettings = lazy(() => import("./pages/AdminSettings"));
const AdminCustomers = lazy(() => import("./pages/AdminCustomers"));
const AdminProducts = lazy(() => import("./pages/AdminProducts"));
const AdminStock = lazy(() => import("./pages/AdminStock"));
const AdminConfig = lazy(() => import("./pages/AdminConfig"));
const AdminCatalog = lazy(() => import("./pages/AdminCatalog"));
const Analytics = lazy(() => import("./pages/Analytics"));
const IntegrationsManager = lazy(() => import("./pages/IntegrationsManager"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Phase2PremiumExperience = lazy(() => import("./components/Phase2PremiumExperience"));

// Configuração do QueryClient movida para @/config/queryClient

const App = () => {
  // Preload de rotas críticas no mount
  useEffect(() => {
    smartPreload.preloadCritical();
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <UnifiedAuthProvider>
          <SubscriptionGlobalProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/reset-password" element={
                <Suspense fallback={<OptimizedLoadingSpinner variant="minimal" />}>
                  <ResetPassword />
                </Suspense>
              } />
              <Route path="/plans" element={
                <UnifiedProtectedRoute requireAuth={true}>
                  <Suspense fallback={<OptimizedLoadingSpinner variant="minimal" />}>
                    <SubscriptionPlansPage />
                  </Suspense>
                </UnifiedProtectedRoute>
              } />
               {/* New Payment Routes with ProtectedSubscriptionRoute */}
                <Route path="/payment/pix" element={
                <UnifiedProtectedRoute requireAuth={true} requireRole="customer">
                  <Suspense fallback={<OptimizedLoadingSpinner variant="minimal" />}>
                    <Payment />
                  </Suspense>
                </UnifiedProtectedRoute>
              } />
              {/* Unified Payment Route */}
              <Route path="/payment" element={
                <UnifiedProtectedRoute requireAuth={true} requireRole="customer">
                  <Suspense fallback={<OptimizedLoadingSpinner variant="minimal" />}>
                    <Payment />
                  </Suspense>
                </UnifiedProtectedRoute>
              } />
              {/* Legacy Payment Route */}
              <Route path="/payment/:orderId" element={
                <UnifiedProtectedRoute requireAuth={true} requireRole="customer">
                  <Suspense fallback={<OptimizedLoadingSpinner variant="minimal" />}>
                    <Payment />
                  </Suspense>
                </UnifiedProtectedRoute>
              } />
              {/* Customer Routes */}
              <Route path="/dashboard" element={
                <UnifiedProtectedRoute requireAuth={true} requireRole="customer">
                  <Suspense fallback={<OptimizedLoadingSpinner variant="minimal" />}>
                    <Dashboard />
                  </Suspense>
                </UnifiedProtectedRoute>
              } />
               <Route path="/phase2-premium" element={<Phase2PremiumExperience />} />
               <Route path="/menu" element={
                <UnifiedProtectedRoute requireAuth={true} requireRole="customer">
                  <ProtectedSubscriptionRoute>
                    <Menu />
                  </ProtectedSubscriptionRoute>
                </UnifiedProtectedRoute>
               } />
              <Route path="/checkout" element={
                <UnifiedProtectedRoute requireAuth={true} requireRole="customer">
                  <ProtectedSubscriptionRoute>
                    <ExpressCheckout />
                  </ProtectedSubscriptionRoute>
                </UnifiedProtectedRoute>
              } />
               <Route path="/orders" element={
                <UnifiedProtectedRoute requireAuth={true} requireRole="customer">
                  <ProtectedSubscriptionRoute>
                    <Suspense fallback={<OptimizedLoadingSpinner variant="minimal" />}>
                      <Orders />
                    </Suspense>
                  </ProtectedSubscriptionRoute>
                </UnifiedProtectedRoute>
              } />
              <Route path="/account" element={
                <UnifiedProtectedRoute requireAuth={true} requireRole="customer">
                  <Suspense fallback={<OptimizedLoadingSpinner variant="minimal" />}>
                    <Account />
                  </Suspense>
                </UnifiedProtectedRoute>
              } />
              <Route path="/order-status/:orderId" element={
                <UnifiedProtectedRoute requireAuth={true} requireRole="customer">
                  <ProtectedSubscriptionRoute>
                    <Suspense fallback={<OptimizedLoadingSpinner variant="minimal" />}>
                      <OrderStatus />
                    </Suspense>
                  </ProtectedSubscriptionRoute>
                </UnifiedProtectedRoute>
              } />
              
              {/* ===== NEW ADMIN ROUTES - FASE 1 & FASE 3 ===== */}
              <Route path="/admin" element={
                <UnifiedProtectedRoute requireAuth={true} requireRole="admin">
                  <Suspense fallback={<OptimizedLoadingSpinner />}>
                    <NewAdminDashboard />
                  </Suspense>
                </UnifiedProtectedRoute>
              } />
              <Route path="/admin/dashboard/receitas" element={
                <UnifiedProtectedRoute requireAuth={true} requireRole="admin">
                  <Suspense fallback={<OptimizedLoadingSpinner />}>
                    <AdminReceitas />
                  </Suspense>
                </UnifiedProtectedRoute>
              } />
              <Route path="/admin/dashboard/assinaturas" element={
                <UnifiedProtectedRoute requireAuth={true} requireRole="admin">
                  <Suspense fallback={<OptimizedLoadingSpinner />}>
                    <AdminAssinaturas />
                  </Suspense>
                </UnifiedProtectedRoute>
              } />

              {/* ===== FASE 3 - GERENCIAR APP ===== */}
              <Route path="/admin/gerenciar-app" element={
                <UnifiedProtectedRoute requireAuth={true} requireRole="admin">
                  <Suspense fallback={<OptimizedLoadingSpinner />}>
                    <GerenciarApp />
                  </Suspense>
                </UnifiedProtectedRoute>
              }>
                <Route path="produtos" element={<GerenciarAppProdutos />} />
                <Route path="delivery" element={<GerenciarAppDelivery />} />
                <Route path="regras-pagamento" element={<GerenciarAppRegrasPagamento />} />
                <Route path="horarios" element={<GerenciarAppHorarios />} />
                <Route path="informacoes" element={<GerenciarAppInformacoes />} />
                <Route path="fidelidade" element={<GerenciarAppFidelidade />} />
                <Route path="integracoes" element={<GerenciarAppIntegracoes />} />
              </Route>
              
              {/* ===== FASE 4 - CONFIGURAÇÕES ===== */}
              <Route path="/admin/configuracoes-new" element={
                <UnifiedProtectedRoute requireAuth={true} requireRole="admin">
                  <Suspense fallback={<OptimizedLoadingSpinner />}>
                    <Configuracoes />
                  </Suspense>
                </UnifiedProtectedRoute>
              }>
                <Route path="impressao" element={<ConfigImpressao />} />
                <Route path="usuarios" element={<ConfigUsuarios />} />
                <Route path="conta" element={<ConfigConta />} />
              </Route>

              {/* ===== FASE 5 - SISTEMA ===== */}
              <Route path="/admin/sistema" element={
                <UnifiedProtectedRoute requireAuth={true} requireRole="admin">
                  <Suspense fallback={<OptimizedLoadingSpinner />}>
                    <Sistema />
                  </Suspense>
                </UnifiedProtectedRoute>
              }>
                <Route path="logs" element={<SistemaLogs />} />
                <Route path="status" element={<SistemaStatus />} />
                <Route path="planos" element={<SistemaPlanos />} />
                <Route path="backups" element={<SistemaBackups />} />
              </Route>

              {/* ===== FASE 6 - RELATÓRIOS ===== */}
              <Route path="/admin/relatorios" element={
                <UnifiedProtectedRoute requireAuth={true} requireRole="admin">
                  <Suspense fallback={<OptimizedLoadingSpinner />}>
                    <Relatorios />
                  </Suspense>
                </UnifiedProtectedRoute>
              }>
                <Route path="analytics" element={<RelatoriosAnalytics />} />
                <Route path="pedidos" element={<RelatoriosPedidos />} />
                <Route path="vendas" element={<RelatoriosVendas />} />
                <Route path="clientes" element={<RelatoriosClientes />} />
                <Route path="delivery" element={<RelatoriosDelivery />} />
              </Route>

              {/* ===== FASE 7 - CRM ===== */}
              <Route path="/admin/crm" element={
                <UnifiedProtectedRoute requireAuth={true} requireRole="admin">
                  <Suspense fallback={<OptimizedLoadingSpinner />}>
                    <CRM />
                  </Suspense>
                </UnifiedProtectedRoute>
              }>
                <Route index element={<CRMClientes />} />
                <Route path="clientes" element={<CRMClientes />} />
                <Route path="segmentacao" element={<CRMSegmentacao />} />
                <Route path="comunicacao" element={<CRMComunicacao />} />
                <Route path="fidelidade" element={<CRMFidelidade />} />
              </Route>
              
              {/* ===== OLD ADMIN ROUTES - Mantidas temporariamente ===== */}
              <Route path="/admin-old" element={
                <UnifiedProtectedRoute requireAuth={true} requireRole="admin">
                  <AdminDashboard />
                </UnifiedProtectedRoute>
              } />
              
              {/* Attendant Routes - Unified */}
              <Route path="/attendant" element={
                <AttendantRoute>
                  <Suspense fallback={<OptimizedLoadingSpinner variant="minimal" />}>
                    <AttendantUnified />
                  </Suspense>
                </AttendantRoute>
              } />
              <Route path="/admin/settings" element={
                <UnifiedProtectedRoute requireAuth={true} requireRole="admin">
                  <Suspense fallback={<OptimizedLoadingSpinner variant="minimal" />}>
                    <AdminSettings />
                  </Suspense>
                </UnifiedProtectedRoute>
              } />
              <Route path="/admin/customers" element={
                <UnifiedProtectedRoute requireAuth={true} requireRole="admin">
                  <Suspense fallback={<OptimizedLoadingSpinner variant="minimal" />}>
                    <AdminCustomers />
                  </Suspense>
                </UnifiedProtectedRoute>
              } />
              <Route path="/admin/products" element={
                <UnifiedProtectedRoute requireAuth={true} requireRole="admin">
                  <Suspense fallback={<OptimizedLoadingSpinner variant="minimal" />}>
                    <AdminProducts />
                  </Suspense>
                </UnifiedProtectedRoute>
              } />
              <Route path="/admin/catalogo" element={
                <UnifiedProtectedRoute requireAuth={true} requireRole="admin">
                  <Suspense fallback={<OptimizedLoadingSpinner variant="minimal" />}>
                    <AdminCatalog />
                  </Suspense>
                </UnifiedProtectedRoute>
              } />
              <Route path="/admin/stock" element={
                <UnifiedProtectedRoute requireAuth={true} requireRole="admin">
                  <Suspense fallback={<OptimizedLoadingSpinner variant="minimal" />}>
                    <AdminStock />
                  </Suspense>
                </UnifiedProtectedRoute>
              } />
              <Route path="/admin/configuracoes" element={
                <UnifiedProtectedRoute requireAuth={true} requireRole="admin">
                  <Suspense fallback={<OptimizedLoadingSpinner variant="minimal" />}>
                    <AdminConfig />
                  </Suspense>
                </UnifiedProtectedRoute>
              } />
              <Route path="/admin/analytics" element={
                <UnifiedProtectedRoute requireAuth={true} requireRole="admin">
                  <Suspense fallback={<OptimizedLoadingSpinner variant="minimal" />}>
                    <Analytics />
                  </Suspense>
                </UnifiedProtectedRoute>
              } />
              
              {/* Integrations Route */}
              <Route path="/admin/integrations" element={
                <UnifiedProtectedRoute requireAuth={true} requireRole="admin">
                  <Suspense fallback={<OptimizedLoadingSpinner variant="minimal" />}>
                    <IntegrationsManager />
                  </Suspense>
                </UnifiedProtectedRoute>
              } />
              <Route path="*" element={<NotFound />} />
            </Routes>
            
            {/* ===== PHASE 4: PWA & ANALYTICS COMPONENTS ===== */}
        <PWAInstallPrompt />
        {import.meta.env.DEV && <AnalyticsDebugger />}
          </TooltipProvider>
        </SubscriptionGlobalProvider>
      </UnifiedAuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
  );
};

export default App;
