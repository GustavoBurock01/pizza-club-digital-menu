import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Copy, Clock, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/services/supabase';

interface PixPaymentProps {
  orderId: string;
  totalAmount: number;
  onPaymentSuccess: () => void;
}

interface PixData {
  transactionId: string;
  brCode: string;
  qrCodeUrl: string;
  amount: string;
  expiresAt: string;
}

export const PixPayment = ({ orderId, totalAmount, onPaymentSuccess }: PixPaymentProps) => {
  const [pixData, setPixData] = useState<PixData | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'checking' | 'success' | 'expired' | 'error'>('pending');
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const { toast } = useToast();

  useEffect(() => {
    createPixPayment();
  }, [orderId]);

  useEffect(() => {
    if (pixData && paymentStatus === 'pending') {
      const interval = setInterval(checkPaymentStatus, 5000);
      return () => clearInterval(interval);
    }
  }, [pixData, paymentStatus]);

  useEffect(() => {
    if (pixData) {
      const expiresAt = new Date(pixData.expiresAt).getTime();
      const updateTimer = () => {
        const now = Date.now();
        const remaining = Math.max(0, expiresAt - now);
        setTimeLeft(remaining);
        
        if (remaining === 0 && paymentStatus === 'pending') {
          setPaymentStatus('expired');
        }
      };
      
      updateTimer();
      const timer = setInterval(updateTimer, 1000);
      return () => clearInterval(timer);
    }
  }, [pixData, paymentStatus]);

  const createPixPayment = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('create-pix-payment', {
        body: { orderId }
      });

      if (error) throw error;

      setPixData(data);
      toast({
        title: "PIX gerado com sucesso!",
        description: "Escaneie o QR Code ou copie o código PIX.",
      });
    } catch (error: any) {
      console.error('Error creating PIX payment:', error);
      setPaymentStatus('error');
      toast({
        title: "Erro ao gerar PIX",
        description: error.message || "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const checkPaymentStatus = async () => {
    if (!pixData || paymentStatus !== 'pending') return;

    try {
      setPaymentStatus('checking');
      
      const { data, error } = await supabase.functions.invoke('check-pix-status', {
        body: { transactionId: pixData.transactionId }
      });

      if (error) throw error;

      if (data.status === 'paid') {
        setPaymentStatus('success');
        toast({
          title: "Pagamento confirmado!",
          description: "Seu pedido foi aprovado com sucesso.",
        });
        onPaymentSuccess();
      } else if (data.status === 'expired') {
        setPaymentStatus('expired');
      } else {
        setPaymentStatus('pending');
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
      setPaymentStatus('pending');
    }
  };

  const copyToClipboard = async () => {
    if (!pixData) return;
    
    try {
      await navigator.clipboard.writeText(pixData.brCode);
      toast({
        title: "Código PIX copiado!",
        description: "Cole no seu banco para efetuar o pagamento.",
      });
    } catch (error) {
      toast({
        title: "Erro ao copiar",
        description: "Tente selecionar e copiar manualmente.",
        variant: "destructive",
      });
    }
  };

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getStatusBadge = () => {
    switch (paymentStatus) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
          <Clock className="w-3 h-3 mr-1" />
          Aguardando pagamento
        </Badge>;
      case 'checking':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
          Verificando...
        </Badge>;
      case 'success':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <CheckCircle className="w-3 h-3 mr-1" />
          Pagamento aprovado
        </Badge>;
      case 'expired':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
          <XCircle className="w-3 h-3 mr-1" />
          Expirado
        </Badge>;
      case 'error':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
          <XCircle className="w-3 h-3 mr-1" />
          Erro
        </Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="w-6 h-6 animate-spin mr-2" />
            <span>Gerando PIX...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!pixData || paymentStatus === 'error') {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Erro ao gerar PIX</h3>
          <p className="text-muted-foreground mb-4">
            Não foi possível gerar o código PIX. Tente novamente.
          </p>
          <Button onClick={createPixPayment}>
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">Pagamento PIX</CardTitle>
          {getStatusBadge()}
        </div>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Valor: {pixData.amount}</span>
          {timeLeft > 0 && paymentStatus === 'pending' && (
            <span className="flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              Expira em: {formatTime(timeLeft)}
            </span>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {paymentStatus !== 'success' && paymentStatus !== 'expired' && (
          <>
            {/* QR Code */}
            <div className="text-center">
              <div className="bg-white p-4 rounded-lg inline-block border">
                <img 
                  src={pixData.qrCodeUrl} 
                  alt="QR Code PIX" 
                  className="w-48 h-48 mx-auto"
                />
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Escaneie o QR Code com o app do seu banco
              </p>
            </div>

            <Separator />

            {/* Código PIX Copia e Cola */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Ou copie o código PIX:
              </label>
              <div className="flex gap-2">
                <div className="flex-1 p-3 bg-muted rounded-lg text-sm font-mono break-all">
                  {pixData.brCode}
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={copyToClipboard}
                  className="shrink-0"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Após o pagamento, a confirmação pode levar alguns segundos.
              </p>
            </div>
          </>
        )}

        {paymentStatus === 'success' && (
          <div className="text-center py-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-green-700 mb-2">
              Pagamento confirmado!
            </h3>
            <p className="text-muted-foreground">
              Seu pedido foi aprovado e será preparado em breve.
            </p>
          </div>
        )}

        {paymentStatus === 'expired' && (
          <div className="text-center py-8">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-red-700 mb-2">
              PIX Expirado
            </h3>
            <p className="text-muted-foreground mb-4">
              O código PIX expirou. Gere um novo código para continuar.
            </p>
            <Button onClick={createPixPayment}>
              Gerar novo PIX
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};