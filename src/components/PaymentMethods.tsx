import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { CreditCard, Smartphone, Banknote, Loader2 } from 'lucide-react';
import { PixPayment } from './PixPayment';
import { CardPayment } from './CardPayment';
import { useNavigate } from 'react-router-dom';

interface PaymentMethodsProps {
  orderId: string;
  totalAmount: number;
}

type PaymentMethod = 'pix' | 'credit_card' | 'cash';

export const PaymentMethods = ({ orderId, totalAmount }: PaymentMethodsProps) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('pix');
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const navigate = useNavigate();

  const handlePaymentMethodSelect = () => {
    if (selectedMethod === 'cash') {
      navigate(`/order-confirmation/${orderId}`);
      return;
    }
    
    setShowPaymentForm(true);
  };

  const handlePaymentSuccess = () => {
    navigate(`/order-confirmation/${orderId}`);
  };

  if (showPaymentForm) {
    if (selectedMethod === 'pix') {
      return (
        <PixPayment 
          orderId={orderId}
          totalAmount={totalAmount}
          onPaymentSuccess={handlePaymentSuccess}
        />
      );
    }
    
    if (selectedMethod === 'credit_card') {
      return (
        <CardPayment 
          orderId={orderId}
          totalAmount={totalAmount}
          onPaymentSuccess={handlePaymentSuccess}
        />
      );
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Método de Pagamento</CardTitle>
        <CardDescription>
          Total: {formatPrice(totalAmount)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <RadioGroup 
          value={selectedMethod} 
          onValueChange={(value) => setSelectedMethod(value as PaymentMethod)}
        >
          <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
            <RadioGroupItem value="pix" id="pix" />
            <Label htmlFor="pix" className="flex-1 flex items-center space-x-3 cursor-pointer">
              <Smartphone className="w-5 h-5 text-green-600" />
              <div>
                <div className="font-medium">PIX</div>
                <div className="text-sm text-muted-foreground">Aprovação instantânea</div>
              </div>
            </Label>
          </div>
          
          <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
            <RadioGroupItem value="credit_card" id="credit_card" />
            <Label htmlFor="credit_card" className="flex-1 flex items-center space-x-3 cursor-pointer">
              <CreditCard className="w-5 h-5 text-blue-600" />
              <div>
                <div className="font-medium">Cartão de Crédito</div>
                <div className="text-sm text-muted-foreground">Parcelamento até 12x</div>
              </div>
            </Label>
          </div>

          <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
            <RadioGroupItem value="cash" id="cash" />
            <Label htmlFor="cash" className="flex-1 flex items-center space-x-3 cursor-pointer">
              <Banknote className="w-5 h-5 text-green-700" />
              <div>
                <div className="font-medium">Dinheiro</div>
                <div className="text-sm text-muted-foreground">Pagamento na entrega</div>
              </div>
            </Label>
          </div>

        </RadioGroup>

        <Button 
          onClick={handlePaymentMethodSelect}
          className="w-full gradient-pizza"
          size="lg"
        >
          {selectedMethod === 'cash' ? 'Confirmar Pedido' : `Pagar ${formatPrice(totalAmount)}`}
        </Button>
      </CardContent>
    </Card>
  );
};