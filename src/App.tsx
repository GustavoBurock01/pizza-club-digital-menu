import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/config/queryClient";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminRoute } from "@/components/AdminRoute";
import { UserRoute } from "@/components/UserRoute";
import { CustomerRoute } from "@/components/routes/CustomerRoute";
import { AttendantRoute } from "@/components/routes/AttendantRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { lazy, Suspense, useEffect } from "react";
import { OptimizedLoadingSpinner } from "@/components/OptimizedLoadingSpinner";
import { smartPreload } from "@/utils/routePreloader";

// Core pages - não lazy loaded para evitar flash de loading na navegação principal
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

// Lazy loaded pages - code splitting para otimização
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Menu = lazy(() => import("./pages/Menu"));
const Cart = lazy(() => import("./pages/Cart"));
const Orders = lazy(() => import("./pages/Orders"));
const Account = lazy(() => import("./pages/Account"));
const ExpressCheckout = lazy(() => import("./pages/ExpressCheckout"));
const Payment = lazy(() => import("./pages/Payment"));
const OrderStatus = lazy(() => import("./pages/OrderStatus"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));

// Admin pages - bundle separado
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminOrders = lazy(() => import("./pages/AdminOrders"));
const AdminCustomers = lazy(() => import("./pages/AdminCustomers"));
const AdminProducts = lazy(() => import("./pages/AdminProducts"));
const Analytics = lazy(() => import("./pages/Analytics"));
const AttendantDashboard = lazy(() => import("./pages/AttendantDashboard"));
const AdminSettings = lazy(() => import("./pages/AdminSettings"));

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
              <Route path="/payment-success" element={
                <ProtectedRoute requireAuth={true}>
                  <PaymentSuccess />
                </ProtectedRoute>
              } />
              <Route path="/payment-pending" element={
                <ProtectedRoute requireAuth={true}>
                  <PaymentSuccess />
                </ProtectedRoute>
              } />
              {/* Customer Routes - Only for regular users (not admins/attendants) */}
              <Route path="/dashboard" element={
                <CustomerRoute>
                  <Suspense fallback={<OptimizedLoadingSpinner variant="minimal" />}>
                    <Dashboard />
                  </Suspense>
                </CustomerRoute>
              } />
              <Route path="/menu" element={
                <CustomerRoute>
                  <ProtectedRoute requireSubscription={true}>
                    <Suspense fallback={<OptimizedLoadingSpinner variant="minimal" />}>
                      <Menu />
                    </Suspense>
                  </ProtectedRoute>
                </CustomerRoute>
              } />
              <Route path="/cart" element={
                <CustomerRoute>
                  <ProtectedRoute requireSubscription={true}>
                    <Suspense fallback={<OptimizedLoadingSpinner variant="minimal" />}>
                      <Cart />
                    </Suspense>
                  </ProtectedRoute>
                </CustomerRoute>
              } />
              <Route path="/express-checkout" element={
                <CustomerRoute>
                  <ProtectedRoute requireSubscription={true}>
                    <Suspense fallback={<OptimizedLoadingSpinner variant="minimal" />}>
                      <ExpressCheckout />
                    </Suspense>
                  </ProtectedRoute>
                </CustomerRoute>
              } />
              <Route path="/payment/:orderId" element={
                <CustomerRoute>
                  <ProtectedRoute requireSubscription={true}>
                    <Suspense fallback={<OptimizedLoadingSpinner variant="minimal" />}>
                      <Payment />
                    </Suspense>
                  </ProtectedRoute>
                </CustomerRoute>
              } />
              <Route path="/orders" element={
                <CustomerRoute>
                  <ProtectedRoute requireSubscription={true}>
                    <Suspense fallback={<OptimizedLoadingSpinner variant="minimal" />}>
                      <Orders />
                    </Suspense>
                  </ProtectedRoute>
                </CustomerRoute>
              } />
              <Route path="/account" element={
                <CustomerRoute>
                  <Suspense fallback={<OptimizedLoadingSpinner variant="minimal" />}>
                    <Account />
                  </Suspense>
                </CustomerRoute>
              } />
              <Route path="/order-status/:orderId" element={
                <CustomerRoute>
                  <ProtectedRoute requireSubscription={true}>
                    <Suspense fallback={<OptimizedLoadingSpinner variant="minimal" />}>
                      <OrderStatus />
                    </Suspense>
                  </ProtectedRoute>
                </CustomerRoute>
              } />
              
              {/* Attendant Routes - Only for attendants and admins */}
              <Route path="/attendant" element={
                <AttendantRoute>
                  <Suspense fallback={<OptimizedLoadingSpinner variant="minimal" />}>
                    <AttendantDashboard />
                  </Suspense>
                </AttendantRoute>
              } />
              
              {/* Admin Routes - Only for admin users */}
              <Route path="/admin" element={
                <AdminRoute>
                  <Suspense fallback={<OptimizedLoadingSpinner variant="minimal" />}>
                    <AdminDashboard />
                  </Suspense>
                </AdminRoute>
              } />
              <Route path="/admin/orders" element={
                <AdminRoute>
                  <Suspense fallback={<OptimizedLoadingSpinner variant="minimal" />}>
                    <AdminOrders />
                  </Suspense>
                </AdminRoute>
              } />
              <Route path="/admin/customers" element={
                <AdminRoute>
                  <Suspense fallback={<OptimizedLoadingSpinner variant="minimal" />}>
                    <AdminCustomers />
                  </Suspense>
                </AdminRoute>
              } />
              <Route path="/admin/products" element={
                <AdminRoute>
                  <Suspense fallback={<OptimizedLoadingSpinner variant="minimal" />}>
                    <AdminProducts />
                  </Suspense>
                </AdminRoute>
              } />
              <Route path="/admin/analytics" element={
                <AdminRoute>
                  <Suspense fallback={<OptimizedLoadingSpinner variant="minimal" />}>
                    <Analytics />
                  </Suspense>
                </AdminRoute>
              } />
              <Route path="/admin/settings" element={
                <AdminRoute>
                  <Suspense fallback={<OptimizedLoadingSpinner variant="minimal" />}>
                    <AdminSettings />
                  </Suspense>
                </AdminRoute>
              } />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
  );
};

export default App;