import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/utils/formatting';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { IntegratedCardPayment } from '@/components/IntegratedCardPayment';

const CardPaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [orderData, setOrderData] = useState<any>(null);
  const [paymentStatus, setPaymentStatus] = useState<'form' | 'success' | 'error'>('form');
  const [paymentResult, setPaymentResult] = useState<any>(null);

  useEffect(() => {
    // Verificar se há dados do pedido
    const stateOrderData = location.state?.orderData;
    const pendingOrderData = localStorage.getItem('pendingOrder');
    
    if (stateOrderData) {
      setOrderData(stateOrderData);
    } else if (pendingOrderData) {
      setOrderData(JSON.parse(pendingOrderData));
    } else {
      toast({
        title: "Erro",
        description: "Dados do pedido não encontrados",
        variant: "destructive"
      });
      navigate('/menu');
    }
  }, [location.state, navigate, toast]);

  const handlePaymentSuccess = (result: any) => {
    setPaymentResult(result);
    setPaymentStatus('success');
    
    // Limpar dados pendentes
    localStorage.removeItem('pendingOrder');
    
    // Redirecionar após 3 segundos
    setTimeout(() => {
      navigate(`/order-status/${result.order.id}`);
    }, 3000);
  };

  const handlePaymentError = (error: string) => {
    setPaymentStatus('error');
    toast({
      title: "Erro no pagamento",
      description: error,
      variant: "destructive"
    });
  };

  if (!orderData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (paymentStatus === 'success' && paymentResult) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-20 w-20 mx-auto text-green-500 mb-6" />
            <h2 className="text-2xl font-bold text-green-800 mb-4">Pagamento Aprovado!</h2>
            <p className="text-green-700 mb-6">
              Seu pedido foi confirmado e processado com sucesso.
            </p>
            
            <div className="bg-white rounded-lg p-4 mb-6">
              <div className="space-y-2 text-left">
                <div className="flex justify-between">
                  <span className="font-medium">Pedido:</span>
                  <span>#{paymentResult.order.id.slice(0, 8)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Valor:</span>
                  <span>{formatCurrency(paymentResult.order.total_amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Método:</span>
                  <span>Cartão de Crédito</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Status:</span>
                  <span className="text-green-600 font-medium">Aprovado</span>
                </div>
              </div>
            </div>

            <p className="text-sm text-green-600 mb-4">
              Redirecionando para acompanhamento do pedido...
            </p>
            
            <Button 
              onClick={() => navigate(`/order-status/${paymentResult.order.id}`)}
              className="gradient-pizza"
            >
              Acompanhar Pedido
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (paymentStatus === 'error') {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-8 text-center">
            <XCircle className="h-20 w-20 mx-auto text-red-500 mb-6" />
            <h2 className="text-2xl font-bold text-red-800 mb-4">Pagamento Rejeitado</h2>
            <p className="text-red-700 mb-6">
              Houve um problema ao processar seu pagamento.
            </p>
            
            <div className="space-y-3">
              <Button 
                onClick={() => setPaymentStatus('form')}
                className="w-full"
              >
                Tentar Novamente
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => navigate('/payment/pix')}
                className="w-full"
              >
                Pagar com PIX
              </Button>
              
              <Button 
                variant="ghost"
                onClick={() => navigate('/menu')}
                className="w-full"
              >
                Voltar ao Menu
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/menu')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        
        <h1 className="text-2xl font-bold">Pagamento com Cartão</h1>
        <p className="text-muted-foreground">Complete os dados para finalizar seu pedido</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulário de pagamento */}
        <div className="lg:col-span-2">
          <IntegratedCardPayment
            orderData={orderData}
            onPaymentSuccess={handlePaymentSuccess}
            onPaymentError={handlePaymentError}
          />
        </div>

        {/* Resumo do pedido */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Resumo do Pedido</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Itens */}
                <div className="space-y-2">
                  {orderData.items?.map((item: any, index: number) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{item.quantity}x {item.name || `Item ${index + 1}`}</span>
                      <span>{formatCurrency(item.total_price || (item.unit_price * item.quantity))}</span>
                    </div>
                  ))}
                </div>
                
                <Separator />
                
                {/* Subtotal */}
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatCurrency(orderData.total_amount - (orderData.delivery_fee || 0))}</span>
                </div>
                
                {/* Taxa de entrega */}
                <div className="flex justify-between">
                  <span>Taxa de entrega</span>
                  <span className={orderData.delivery_fee > 0 ? '' : 'text-green-600'}>
                    {orderData.delivery_fee > 0 ? formatCurrency(orderData.delivery_fee) : 'Grátis'}
                  </span>
                </div>
                
                <Separator />
                
                {/* Total */}
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-primary">{formatCurrency(orderData.total_amount)}</span>
                </div>
                
                {/* Método de entrega */}
                <div className="text-xs text-muted-foreground pt-2">
                  {orderData.delivery_method === 'delivery' ? '📍 Entrega' : '🏪 Retirada no balcão'}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CardPaymentPage;