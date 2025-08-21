import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/config/queryClient";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { lazy, Suspense } from "react";
import { LoadingSpinner } from "@/components/LoadingSpinner";

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

const App = () => (
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
              <Route path="/dashboard" element={
                <ProtectedRoute requireAuth={true}>
                  <Suspense fallback={<LoadingSpinner />}>
                    <Dashboard />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="/menu" element={
                <ProtectedRoute requireAuth={true} requireSubscription={true}>
                  <Suspense fallback={<LoadingSpinner />}>
                    <Menu />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="/produto/:id" element={
                <ProtectedRoute requireAuth={true} requireSubscription={true}>
                  <Suspense fallback={<LoadingSpinner />}>
                    <Product />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="/cart" element={
                <ProtectedRoute requireAuth={true} requireSubscription={true}>
                  <Suspense fallback={<LoadingSpinner />}>
                    <Cart />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="/order-review" element={
                <ProtectedRoute requireAuth={true} requireSubscription={true}>
                  <Suspense fallback={<LoadingSpinner />}>
                    <OrderReview />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="/checkout" element={
                <ProtectedRoute requireAuth={true} requireSubscription={true}>
                  <Suspense fallback={<LoadingSpinner />}>
                    <Checkout />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="/payment/:orderId" element={
                <ProtectedRoute requireAuth={true} requireSubscription={true}>
                  <Suspense fallback={<LoadingSpinner />}>
                    <Payment />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="/order-confirmation/:orderId" element={
                <ProtectedRoute requireAuth={true} requireSubscription={true}>
                  <Suspense fallback={<LoadingSpinner />}>
                    <OrderConfirmation />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="/orders" element={
                <ProtectedRoute requireAuth={true} requireSubscription={true}>
                  <Suspense fallback={<LoadingSpinner />}>
                    <Orders />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="/account" element={
                <ProtectedRoute requireAuth={true}>
                  <Suspense fallback={<LoadingSpinner />}>
                    <Account />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="/order-status/:orderId" element={
                <ProtectedRoute requireAuth={true} requireSubscription={true}>
                  <Suspense fallback={<LoadingSpinner />}>
                    <OrderStatus />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="/admin" element={
                <ProtectedRoute requireAuth={true}>
                  <Suspense fallback={<LoadingSpinner />}>
                    <Admin />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="/analytics" element={
                <ProtectedRoute requireAuth={true}>
                  <Suspense fallback={<LoadingSpinner />}>
                    <Analytics />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="/attendant" element={
                <ProtectedRoute requireAuth={true}>
                  <Suspense fallback={<LoadingSpinner />}>
                    <AttendantDashboard />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="/admin/settings" element={
                <ProtectedRoute requireAuth={true}>
                  <Suspense fallback={<LoadingSpinner />}>
                    <AdminSettings />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;