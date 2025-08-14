
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Copy, CheckCircle, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useCart } from '@/hooks/useCart';

interface Order {
  id: string;
  total_amount: number;
  status: string;
  payment_status: string;
}

const Payment = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { clearCart } = useCart();
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  // Simulated PIX code
  const pixCode = `00020126580014BR.GOV.BCB.PIX0136${orderId}5204000053039865802BR5925Pizza Delivery App6009SAO PAULO62140510${orderId}6304`;
  const pixQRCodeURL = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(pixCode)}`;

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (error) throw error;
      setOrder(data);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar pedido",
        description: error.message,
        variant: "destructive",
      });
      navigate('/menu');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  const copyPixCode = () => {
    navigator.clipboard.writeText(pixCode);
    toast({
      title: "Código PIX copiado!",
      description: "Cole no seu app do banco para pagar.",
    });
  };

  const simulatePayment = async () => {
    setPaymentProcessing(true);
    
    // Simulate payment processing
    setTimeout(async () => {
      try {
        const { error } = await supabase
          .from('orders')
          .update({ 
            payment_status: 'paid',
            status: 'confirmed'
          })
          .eq('id', orderId);

        if (error) throw error;

        clearCart();
        navigate(`/order-confirmation/${orderId}`);
      } catch (error: any) {
        toast({
          title: "Erro ao processar pagamento",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setPaymentProcessing(false);
      }
    }, 3000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pizza-red"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Pedido não encontrado</p>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <div className="ml-auto">
              <h1 className="text-xl font-semibold">Pagamento</h1>
            </div>
          </header>
          <div className="flex-1 p-6">
            <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/checkout')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
            <h1 className="text-2xl font-bold">Pagamento PIX</h1>
          </div>

          <div className="max-w-md mx-auto space-y-6">
            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-pizza-red" />
                  Pedido #{order.id.slice(-8)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-pizza-red mb-2">
                    {formatPrice(order.total_amount)}
                  </div>
                  <p className="text-muted-foreground">
                    Pague com PIX para confirmar seu pedido
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* QR Code */}
            <Card>
              <CardContent className="p-6 text-center">
                <div className="bg-white p-4 rounded-lg inline-block mb-4">
                  <img 
                    src={pixQRCodeURL} 
                    alt="QR Code PIX" 
                    className="w-48 h-48"
                  />
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Escaneie o QR Code com seu app do banco
                </p>
                <p className="text-xs text-muted-foreground">
                  Ou copie e cole o código PIX abaixo
                </p>
              </CardContent>
            </Card>

            {/* PIX Code */}
            <Card>
              <CardContent className="p-4">
                <div className="bg-gray-50 p-3 rounded-lg break-all text-sm mb-3">
                  {pixCode}
                </div>
                <Button 
                  onClick={copyPixCode}
                  variant="outline" 
                  className="w-full"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar Código PIX
                </Button>
              </CardContent>
            </Card>

            {/* Payment Status */}
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Aguardando pagamento...</span>
              </div>
              
              {/* Simulate Payment Button (for demo) */}
              <div className="border-t pt-4">
                <p className="text-xs text-muted-foreground mb-2">
                  (Demo - Simular pagamento)
                </p>
                <Button 
                  onClick={simulatePayment}
                  disabled={paymentProcessing}
                  className="gradient-pizza text-white"
                >
                  {paymentProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Simular Pagamento
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Payment;
