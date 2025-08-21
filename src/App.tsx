import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/config/queryClient";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Menu from "./pages/Menu";
import Product from "./pages/Product";
import Cart from "./pages/Cart";
import Orders from "./pages/Orders";
import Account from "./pages/Account";
import OrderReview from "./pages/OrderReview";
import Checkout from "./pages/Checkout";
import Payment from "./pages/Payment";
import OrderConfirmation from "./pages/OrderConfirmation";
import OrderStatus from "./pages/OrderStatus";
import Loading from "./pages/Loading";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentFailure from "./pages/PaymentFailure";
import Admin from "./pages/Admin";
import Analytics from "./pages/Analytics";
import AttendantDashboard from "./pages/AttendantDashboard";
import AdminSettings from "./pages/AdminSettings";
import NotFound from "./pages/NotFound";

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
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/menu" element={
                <ProtectedRoute requireAuth={true} requireSubscription={true}>
                  <Menu />
                </ProtectedRoute>
              } />
              <Route path="/produto/:id" element={
                <ProtectedRoute requireAuth={true} requireSubscription={true}>
                  <Product />
                </ProtectedRoute>
              } />
              <Route path="/cart" element={
                <ProtectedRoute requireAuth={true} requireSubscription={true}>
                  <Cart />
                </ProtectedRoute>
              } />
              <Route path="/order-review" element={
                <ProtectedRoute requireAuth={true} requireSubscription={true}>
                  <OrderReview />
                </ProtectedRoute>
              } />
              <Route path="/checkout" element={
                <ProtectedRoute requireAuth={true} requireSubscription={true}>
                  <Checkout />
                </ProtectedRoute>
              } />
              <Route path="/payment/:orderId" element={
                <ProtectedRoute requireAuth={true} requireSubscription={true}>
                  <Payment />
                </ProtectedRoute>
              } />
              <Route path="/order-confirmation/:orderId" element={
                <ProtectedRoute requireAuth={true} requireSubscription={true}>
                  <OrderConfirmation />
                </ProtectedRoute>
              } />
              <Route path="/orders" element={
                <ProtectedRoute requireAuth={true} requireSubscription={true}>
                  <Orders />
                </ProtectedRoute>
              } />
              <Route path="/account" element={
                <ProtectedRoute requireAuth={true}>
                  <Account />
                </ProtectedRoute>
              } />
              <Route path="/order-status/:orderId" element={
                <ProtectedRoute requireAuth={true} requireSubscription={true}>
                  <OrderStatus />
                </ProtectedRoute>
              } />
              <Route path="/admin" element={
                <ProtectedRoute requireAuth={true}>
                  <Admin />
                </ProtectedRoute>
              } />
              <Route path="/analytics" element={
                <ProtectedRoute requireAuth={true}>
                  <Analytics />
                </ProtectedRoute>
              } />
              <Route path="/attendant" element={
                <ProtectedRoute requireAuth={true}>
                  <AttendantDashboard />
                </ProtectedRoute>
              } />
              <Route path="/admin/settings" element={
                <ProtectedRoute requireAuth={true}>
                  <AdminSettings />
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