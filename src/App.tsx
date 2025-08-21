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
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { lazy, Suspense, useEffect } from "react";
import { OptimizedLoadingSpinner } from "@/components/OptimizedLoadingSpinner";
import { smartPreload } from "@/utils/routePreloader";

// Core pages - não lazy loaded para evitar flash de loading na navegação principal
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Loading from "./pages/Loading";
import NotFound from "./pages/NotFound";

// Lazy loaded pages - code splitting para otimização
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Menu = lazy(() => import("./pages/Menu"));
const Product = lazy(() => import("./pages/Product"));
const Cart = lazy(() => import("./pages/Cart"));
const Orders = lazy(() => import("./pages/Orders"));
const Account = lazy(() => import("./pages/Account"));
const OrderReview = lazy(() => import("./pages/OrderReview"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Payment = lazy(() => import("./pages/Payment"));
const OrderConfirmation = lazy(() => import("./pages/OrderConfirmation"));
const OrderStatus = lazy(() => import("./pages/OrderStatus"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));
const PaymentFailure = lazy(() => import("./pages/PaymentFailure"));

// Admin pages - bundle separado
const Admin = lazy(() => import("./pages/Admin"));
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
              <Route path="/" element={
                <ProtectedRoute requireAuth={false}>
                  <Index />
                </ProtectedRoute>
              } />
              <Route path="/auth" element={
                <ProtectedRoute requireAuth={false}>
                  <Auth />
                </ProtectedRoute>
              } />
              <Route path="/loading" element={<Loading />} />
              <Route path="/payment-success" element={
                <ProtectedRoute requireAuth={true}>
                  <PaymentSuccess />
                </ProtectedRoute>
              } />
              <Route path="/payment-failure" element={
                <ProtectedRoute requireAuth={true}>
                  <PaymentFailure />
                </ProtectedRoute>
              } />
              <Route path="/payment-pending" element={
                <ProtectedRoute requireAuth={true}>
                  <PaymentSuccess />
                </ProtectedRoute>
              } />
              {/* User Routes - Only for regular users (not admins) */}
              <Route path="/dashboard" element={
                <UserRoute>
                  <Suspense fallback={<OptimizedLoadingSpinner variant="minimal" />}>
                    <Dashboard />
                  </Suspense>
                </UserRoute>
              } />
              <Route path="/menu" element={
                <UserRoute>
                  <ProtectedRoute requireSubscription={true}>
                    <Suspense fallback={<OptimizedLoadingSpinner variant="minimal" />}>
                      <Menu />
                    </Suspense>
                  </ProtectedRoute>
                </UserRoute>
              } />
              <Route path="/produto/:id" element={
                <UserRoute>
                  <ProtectedRoute requireSubscription={true}>
                    <Suspense fallback={<OptimizedLoadingSpinner variant="minimal" />}>
                      <Product />
                    </Suspense>
                  </ProtectedRoute>
                </UserRoute>
              } />
              <Route path="/cart" element={
                <UserRoute>
                  <ProtectedRoute requireSubscription={true}>
                    <Suspense fallback={<OptimizedLoadingSpinner variant="minimal" />}>
                      <Cart />
                    </Suspense>
                  </ProtectedRoute>
                </UserRoute>
              } />
              <Route path="/order-review" element={
                <UserRoute>
                  <ProtectedRoute requireSubscription={true}>
                    <Suspense fallback={<OptimizedLoadingSpinner variant="minimal" />}>
                      <OrderReview />
                    </Suspense>
                  </ProtectedRoute>
                </UserRoute>
              } />
              <Route path="/checkout" element={
                <UserRoute>
                  <ProtectedRoute requireSubscription={true}>
                    <Suspense fallback={<OptimizedLoadingSpinner variant="minimal" />}>
                      <Checkout />
                    </Suspense>
                  </ProtectedRoute>
                </UserRoute>
              } />
              <Route path="/payment/:orderId" element={
                <UserRoute>
                  <ProtectedRoute requireSubscription={true}>
                    <Suspense fallback={<OptimizedLoadingSpinner variant="minimal" />}>
                      <Payment />
                    </Suspense>
                  </ProtectedRoute>
                </UserRoute>
              } />
              <Route path="/order-confirmation/:orderId" element={
                <UserRoute>
                  <ProtectedRoute requireSubscription={true}>
                    <Suspense fallback={<OptimizedLoadingSpinner variant="minimal" />}>
                      <OrderConfirmation />
                    </Suspense>
                  </ProtectedRoute>
                </UserRoute>
              } />
              <Route path="/orders" element={
                <UserRoute>
                  <ProtectedRoute requireSubscription={true}>
                    <Suspense fallback={<OptimizedLoadingSpinner variant="minimal" />}>
                      <Orders />
                    </Suspense>
                  </ProtectedRoute>
                </UserRoute>
              } />
              <Route path="/account" element={
                <UserRoute>
                  <Suspense fallback={<OptimizedLoadingSpinner variant="minimal" />}>
                    <Account />
                  </Suspense>
                </UserRoute>
              } />
              <Route path="/order-status/:orderId" element={
                <UserRoute>
                  <ProtectedRoute requireSubscription={true}>
                    <Suspense fallback={<OptimizedLoadingSpinner variant="minimal" />}>
                      <OrderStatus />
                    </Suspense>
                  </ProtectedRoute>
                </UserRoute>
              } />
              
              {/* Admin Routes - Only for admin users */}
              <Route path="/admin" element={
                <AdminRoute>
                  <Suspense fallback={<OptimizedLoadingSpinner variant="minimal" />}>
                    <Admin />
                  </Suspense>
                </AdminRoute>
              } />
              <Route path="/analytics" element={
                <AdminRoute>
                  <Suspense fallback={<OptimizedLoadingSpinner variant="minimal" />}>
                    <Analytics />
                  </Suspense>
                </AdminRoute>
              } />
              <Route path="/attendant" element={
                <AdminRoute>
                  <Suspense fallback={<OptimizedLoadingSpinner variant="minimal" />}>
                    <AttendantDashboard />
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