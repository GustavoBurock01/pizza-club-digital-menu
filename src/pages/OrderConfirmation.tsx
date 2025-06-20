
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Clock, Home, Utensils } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Order {
  id: string;
  total_amount: number;
  status: string;
  payment_status: string;
  created_at: string;
  notes: string;
}

const OrderConfirmation = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'text-green-600';
      case 'preparing': return 'text-yellow-600';
      case 'delivered': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Confirmado';
      case 'preparing': return 'Preparando';
      case 'out_for_delivery': return 'Saiu para entrega';
      case 'delivered': return 'Entregue';
      default: return 'Pendente';
    }
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
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 p-6">
          <div className="max-w-md mx-auto space-y-6">
            {/* Success Message */}
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-green-600 mb-2">
                Pedido Confirmado!
              </h1>
              <p className="text-muted-foreground">
                Pagamento aprovado com sucesso
              </p>
            </div>

            {/* Order Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Utensils className="h-5 w-5 text-pizza-red" />
                  Pedido #{order.id.slice(-8)}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Status do Pedido</span>
                  <span className={`font-medium ${getStatusColor(order.status)}`}>
                    {getStatusText(order.status)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span>Valor Total</span>
                  <span className="font-bold text-pizza-red">
                    {formatPrice(order.total_amount)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span>Pagamento</span>
                  <span className="text-green-600 font-medium">
                    ✓ Aprovado
                  </span>
                </div>
                
                {order.notes && (
                  <div className="pt-2 border-t">
                    <span className="text-sm text-muted-foreground">
                      {order.notes}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Delivery Info */}
            <Card>
              <CardContent className="p-4 text-center">
                <Clock className="h-8 w-8 text-pizza-red mx-auto mb-2" />
                <h3 className="font-semibold mb-1">Tempo estimado</h3>
                <p className="text-2xl font-bold text-pizza-red mb-1">45 min</p>
                <p className="text-sm text-muted-foreground">
                  Seu pedido chegará em breve!
                </p>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button 
                onClick={() => navigate(`/order-status/${order.id}`)}
                className="w-full gradient-pizza text-white"
              >
                Acompanhar Pedido
              </Button>
              
              <Button 
                onClick={() => navigate('/menu')}
                variant="outline"
                className="w-full"
              >
                <Utensils className="h-4 w-4 mr-2" />
                Fazer Novo Pedido
              </Button>
              
              <Button 
                onClick={() => navigate('/dashboard')}
                variant="ghost"
                className="w-full"
              >
                <Home className="h-4 w-4 mr-2" />
                Voltar ao Início
              </Button>
            </div>

            {/* Thank You Message */}
            <div className="text-center pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Obrigado por escolher nossa pizzaria! 🍕
              </p>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default OrderConfirmation;
