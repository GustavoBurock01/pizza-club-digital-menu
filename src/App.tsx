
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/config/queryClient";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { UnifiedProtectedRoute } from "@/routes/UnifiedProtectedRoute";
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

// Lazy load attendant dashboard
const AttendantDashboard = lazy(() => import("./pages/AttendantDashboard"));
const AttendantOrders = lazy(() => import("./pages/AttendantOrders"));
const AttendantKitchen = lazy(() => import("./pages/AttendantKitchen"));
const AttendantDelivery = lazy(() => import("./pages/AttendantDelivery"));
const AttendantReports = lazy(() => import("./pages/AttendantReports"));
const AttendantCustomers = lazy(() => import("./pages/AttendantCustomers"));

// Lazy loaded pages - apenas secundárias (otimizado)
const Dashboard = lazy(() => import("./pages/Dashboard"));
const SubscriptionPlansPage = lazy(() => import("./pages/SubscriptionPlans"));

const Orders = lazy(() => import("./pages/Orders"));
const Account = lazy(() => import("./pages/Account"));

const OrderStatus = lazy(() => import("./pages/OrderStatus"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));
const Payment = lazy(() => import("./pages/Payment"));
const CardPaymentPage = lazy(() => import("./pages/CardPaymentPage"));
const AdminOrders = lazy(() => import("./pages/AdminOrders"));
const AdminCustomers = lazy(() => import("./pages/AdminCustomers"));
const AdminProducts = lazy(() => import("./pages/AdminProducts"));
const AdminStock = lazy(() => import("./pages/AdminStock"));
const Analytics = lazy(() => import("./pages/Analytics"));
const IntegrationsManager = lazy(() => import("./pages/IntegrationsManager"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));

// Configuração do QueryClient movida para @/config/queryClient

const App = () => {
  // Preload de rotas críticas no mount
  useEffect(() => {
    smartPreload.preloadCritical();
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
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
              <Route path="/payment-success" element={
                <UnifiedProtectedRoute requireAuth={true}>
                  <PaymentSuccess />
                </UnifiedProtectedRoute>
              } />
              {/* New Payment Routes */}
              <Route path="/payment/pix" element={
                <UnifiedProtectedRoute requireAuth={true} requireRole="customer" requireSubscription={true}>
                  <Suspense fallback={<OptimizedLoadingSpinner variant="minimal" />}>
                    <Payment />
                  </Suspense>
                </UnifiedProtectedRoute>
              } />
              <Route path="/payment/card" element={
                <UnifiedProtectedRoute requireAuth={true} requireRole="customer" requireSubscription={true}>
                  <Suspense fallback={<OptimizedLoadingSpinner variant="minimal" />}>
                    <CardPaymentPage />
                  </Suspense>
                </UnifiedProtectedRoute>
              } />
              {/* Legacy Payment Route */}
              <Route path="/payment/:orderId" element={
                <UnifiedProtectedRoute requireAuth={true} requireRole="customer" requireSubscription={true}>
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
              <Route path="/menu" element={
                <UnifiedProtectedRoute requireAuth={true} requireRole="customer" requireSubscription={true}>
                  <Menu />
                </UnifiedProtectedRoute>
              } />
              <Route path="/checkout" element={
                <UnifiedProtectedRoute requireAuth={true} requireRole="customer" requireSubscription={true}>
                  <ExpressCheckout />
                </UnifiedProtectedRoute>
              } />
              <Route path="/orders" element={
                <UnifiedProtectedRoute requireAuth={true} requireRole="customer" requireSubscription={true}>
                  <Suspense fallback={<OptimizedLoadingSpinner variant="minimal" />}>
                    <Orders />
                  </Suspense>
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
                <UnifiedProtectedRoute requireAuth={true} requireRole="customer" requireSubscription={true}>
                  <Suspense fallback={<OptimizedLoadingSpinner variant="minimal" />}>
                    <OrderStatus />
                  </Suspense>
                </UnifiedProtectedRoute>
              } />
              
              {/* Admin Routes */}
              <Route path="/admin" element={
                <UnifiedProtectedRoute requireAuth={true} requireRole="admin">
                  <AdminDashboard />
                </UnifiedProtectedRoute>
              } />
              
              {/* Attendant Routes */}
              <Route path="/attendant" element={
                <UnifiedProtectedRoute requireAuth={true} requireRole="attendant">
                  <Suspense fallback={<OptimizedLoadingSpinner variant="minimal" />}>
                    <AttendantDashboard />
                  </Suspense>
                </UnifiedProtectedRoute>
              } />
              <Route path="/attendant/orders" element={
                <UnifiedProtectedRoute requireAuth={true} requireRole="attendant">
                  <Suspense fallback={<OptimizedLoadingSpinner variant="minimal" />}>
                    <AttendantOrders />
                  </Suspense>
                </UnifiedProtectedRoute>
              } />
              <Route path="/attendant/kitchen" element={
                <UnifiedProtectedRoute requireAuth={true} requireRole="attendant">
                  <Suspense fallback={<OptimizedLoadingSpinner variant="minimal" />}>
                    <AttendantKitchen />
                  </Suspense>
                </UnifiedProtectedRoute>
              } />
              <Route path="/attendant/delivery" element={
                <UnifiedProtectedRoute requireAuth={true} requireRole="attendant">
                  <Suspense fallback={<OptimizedLoadingSpinner variant="minimal" />}>
                    <AttendantDelivery />
                  </Suspense>
                </UnifiedProtectedRoute>
              } />
              <Route path="/attendant/reports" element={
                <UnifiedProtectedRoute requireAuth={true} requireRole="attendant">
                  <Suspense fallback={<OptimizedLoadingSpinner variant="minimal" />}>
                    <AttendantReports />
                  </Suspense>
                </UnifiedProtectedRoute>
              } />
              <Route path="/attendant/customers" element={
                <UnifiedProtectedRoute requireAuth={true} requireRole="attendant">
                  <Suspense fallback={<OptimizedLoadingSpinner variant="minimal" />}>
                    <AttendantCustomers />
                  </Suspense>
                </UnifiedProtectedRoute>
              } />
              <Route path="/admin/orders" element={
                <UnifiedProtectedRoute requireAuth={true} requireRole="admin">
                  <Suspense fallback={<OptimizedLoadingSpinner variant="minimal" />}>
                    <AdminOrders />
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
              <Route path="/admin/stock" element={
                <UnifiedProtectedRoute requireAuth={true} requireRole="admin">
                  <Suspense fallback={<OptimizedLoadingSpinner variant="minimal" />}>
                    <AdminStock />
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
            <AnalyticsDebugger />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
  );
};

export default App;
