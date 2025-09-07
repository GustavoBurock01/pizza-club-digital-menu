import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Clock, QrCode, Copy, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/services/supabase';
import { formatCurrency } from '@/utils/formatting';
import { LoadingSpinner } from '@/components/LoadingSpinner';

interface Order {
  id: string;
  total_amount: number;
  delivery_fee: number;
  payment_method: string;
  status: string;
  payment_status: string;
}

interface PixData {
  transactionId: string;
  brCode: string;
  qrCodeUrl: string;
  qrCodeBase64: string | null;
  amount: string;
  expiresAt: string;
  mercadoPagoId: number;
  ticketUrl?: string;
}

const Payment = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [order, setOrder] = useState<Order | null>(null);
  const [pixData, setPixData] = useState<PixData | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'checking' | 'success' | 'expired' | 'error'>('pending');
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (pixData && paymentStatus === 'pending') {
      // Check payment status every 5 seconds
      interval = setInterval(checkPaymentStatus, 5000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [pixData, paymentStatus]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (pixData && timeLeft > 0 && paymentStatus === 'pending') {
      timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
    } else if (timeLeft === 0 && paymentStatus === 'pending') {
      setPaymentStatus('expired');
    }

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [timeLeft, pixData, paymentStatus]);

  const fetchOrder = async () => {
    try {
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (orderError) throw orderError;
      
      setOrder(orderData);

      if (orderData.payment_method === 'pix') {
        await createPixPayment(orderData);
      }
    } catch (error: any) {
      console.error('Error fetching order:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados do pedido.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createPixPayment = async (orderData: Order) => {
    try {
      setPaymentStatus('pending');
      setPixData(null);
      
      const { data, error } = await supabase.functions.invoke('create-pix-payment', {
        body: { 
          orderId: orderData.id
        }
      });

      if (error) throw error;

      console.log('PIX response:', data);

      if (data.success && data.pixData) {
        setPixData(data.pixData);
        
        // Calculate time left until expiration (30 minutes)
        const expiresAt = new Date(data.pixData.expiresAt);
        const now = new Date();
        const secondsLeft = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000));
        setTimeLeft(secondsLeft);
        
        console.log('PIX data set:', data.pixData);
        console.log('Time left:', secondsLeft);
      } else {
        throw new Error(data.error || 'Erro ao criar pagamento PIX');
      }

    } catch (error: any) {
      console.error('Error creating PIX payment:', error);
      setPaymentStatus('error');
      toast({
        title: "Erro no pagamento",
        description: error.message || "Não foi possível gerar o código PIX.",
        variant: "destructive"
      });
    }
  };

  const checkPaymentStatus = async () => {
    if (!pixData) return;

    try {
      const { data, error } = await supabase.functions.invoke('check-pix-status', {
        body: { transactionId: pixData.transactionId }
      });

      if (error) throw error;

      if (data.status === 'paid') {
        setPaymentStatus('success');
        toast({
          title: "Pagamento aprovado!",
          description: "Seu pedido foi confirmado com sucesso.",
        });
        
        setTimeout(() => {
          navigate(`/order-status/${orderId}`);
        }, 2000);
      } else if (data.status === 'expired') {
        setPaymentStatus('expired');
      }
    } catch (error: any) {
      console.error('Error checking payment status:', error);
    }
  };

  const copyPixCode = () => {
    if (pixData?.brCode) {
      navigator.clipboard.writeText(pixData.brCode);
      toast({
        title: "Código copiado!",
        description: "Cole no seu app de pagamentos.",
      });
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <XCircle className="h-16 w-16 mx-auto text-red-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Pedido não encontrado</h2>
            <p className="text-muted-foreground mb-4">Não foi possível encontrar este pedido.</p>
            <Button onClick={() => navigate('/menu')}>
              Voltar ao Menu
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/orders')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        
        <h1 className="text-2xl font-bold">Pagamento PIX</h1>
        <p className="text-muted-foreground">Pedido #{order.id.slice(0, 8)}</p>
      </div>

      {paymentStatus === 'success' && (
        <Card className="mb-6 border-green-200 bg-green-50">
          <CardContent className="p-6 text-center">
            <CheckCircle className="h-16 w-16 mx-auto text-green-500 mb-4" />
            <h2 className="text-xl font-semibold text-green-800 mb-2">Pagamento Aprovado!</h2>
            <p className="text-green-700">Seu pedido foi confirmado e está sendo preparado.</p>
          </CardContent>
        </Card>
      )}

      {paymentStatus === 'expired' && (
        <Card className="mb-6 border-yellow-200 bg-yellow-50">
          <CardContent className="p-6 text-center">
            <Clock className="h-16 w-16 mx-auto text-yellow-500 mb-4" />
            <h2 className="text-xl font-semibold text-yellow-800 mb-2">Código PIX Expirado</h2>
            <p className="text-yellow-700 mb-4">O tempo para pagamento expirou. Gere um novo código.</p>
            <Button onClick={() => {
              setPaymentStatus('pending');
              createPixPayment(order);
            }}>
              Gerar Novo Código
            </Button>
          </CardContent>
        </Card>
      )}

      {paymentStatus === 'error' && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="p-6 text-center">
            <XCircle className="h-16 w-16 mx-auto text-red-500 mb-4" />
            <h2 className="text-xl font-semibold text-red-800 mb-2">Erro no Pagamento</h2>
            <p className="text-red-700 mb-4">Ocorreu um erro ao gerar o código PIX.</p>
            <Button onClick={() => {
              setPaymentStatus('pending');
              createPixPayment(order);
            }}>
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      )}

      {pixData && (paymentStatus === 'pending' || paymentStatus === 'checking') && (
        <div className="space-y-6">
          {/* QR Code Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                Código PIX
                <Badge variant="outline" className="ml-auto">
                  <Clock className="h-3 w-3 mr-1" />
                  {formatTime(timeLeft)}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              {pixData.qrCodeUrl && (
                <div className="mb-4">
                  <img 
                    src={pixData.qrCodeUrl}
                    alt="QR Code PIX"
                    className="mx-auto mb-4 max-w-64 w-full"
                  />
                </div>
              )}
              
              <div className="bg-muted p-3 rounded-lg mb-4 break-all text-sm font-mono">
                {pixData.brCode}
              </div>
              
              <Button onClick={copyPixCode} className="w-full">
                <Copy className="h-4 w-4 mr-2" />
                Copiar Código PIX
              </Button>
              
              <p className="text-sm text-muted-foreground mt-4">
                Abra seu app de pagamentos, escaneie o QR Code ou cole o código PIX
              </p>
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Resumo do Pedido</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatCurrency(order.total_amount - order.delivery_fee)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Taxa de entrega</span>
                  <span className={order.delivery_fee > 0 ? '' : 'text-green-600'}>
                    {order.delivery_fee > 0 ? formatCurrency(order.delivery_fee) : 'Grátis'}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-primary">{formatCurrency(order.total_amount)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Payment;