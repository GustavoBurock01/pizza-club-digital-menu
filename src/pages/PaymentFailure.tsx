import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { XCircle, RotateCcw, Home } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/services/supabase';

interface Order {
  id: string;
  total_amount: number;
  status: string;
  payment_status: string;
}

const PaymentFailure = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  
  const orderId = searchParams.get('order_id');

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    } else {
      navigate('/menu');
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
      
      // Show failure toast
      toast({
        title: "Pagamento não aprovado",
        description: "Houve um problema com o seu pagamento. Tente novamente.",
        variant: "destructive",
      });
      
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

  const tryAgain = () => {
    if (order) {
      navigate(`/payment/${order.id}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
              <h1 className="text-xl font-semibold">Pagamento Rejeitado</h1>
            </div>
          </header>
          <div className="flex-1 p-6">
            <div className="max-w-2xl mx-auto text-center space-y-6">
              {/* Failure Icon */}
              <div className="flex justify-center">
                <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center">
                  <XCircle className="w-12 h-12 text-red-600" />
                </div>
              </div>

              {/* Failure Message */}
              <div>
                <h1 className="text-3xl font-bold text-red-600 mb-2">
                  Pagamento Rejeitado
                </h1>
                <p className="text-muted-foreground">
                  Não foi possível processar o seu pagamento. Verifique os dados e tente novamente.
                </p>
              </div>

              {/* Order Details */}
              <Card className="max-w-md mx-auto">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 justify-center">
                    <XCircle className="h-5 w-5 text-red-600" />
                    Pedido #{order.id.slice(-8)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary mb-1">
                        {formatPrice(order.total_amount)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Status: <span className="text-red-600 font-medium">{order.payment_status}</span>
                      </div>
                    </div>
                    
                    <div className="border-t pt-4">
                      <p className="text-sm text-muted-foreground text-center">
                        Seu pedido ainda está disponível para pagamento.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  onClick={tryAgain}
                  className="flex items-center gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Tentar Novamente
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => navigate('/menu')}
                  className="flex items-center gap-2"
                >
                  <Home className="h-4 w-4" />
                  Voltar ao Menu
                </Button>
              </div>
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default PaymentFailure;