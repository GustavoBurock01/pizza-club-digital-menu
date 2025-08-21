import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useMercadoPago, PaymentMethod } from '@/hooks/useMercadoPago';
import { CreditCard, Smartphone, Banknote, Loader2 } from 'lucide-react';

interface PaymentMethodsProps {
  orderId: string;
  totalAmount: number;
}

export const PaymentMethods = ({ orderId, totalAmount }: PaymentMethodsProps) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('pix');
  const { createPayment, isLoading } = useMercadoPago();

  const handlePayment = async () => {
    try {
      if (selectedMethod === 'cash') {
        // For cash payment, just redirect to success page
        window.location.href = `/payment-success?order_id=${orderId}`;
        return;
      }
      await createPayment(orderId, selectedMethod);
    } catch (error) {
      console.error('Payment failed:', error);
    }
  };

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

          <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
            <RadioGroupItem value="any" id="any" />
            <Label htmlFor="any" className="flex-1 flex items-center space-x-3 cursor-pointer">
              <div className="w-5 h-5 bg-gradient-to-r from-blue-600 to-green-600 rounded" />
              <div>
                <div className="font-medium">Qualquer método online</div>
                <div className="text-sm text-muted-foreground">PIX, cartão ou outros</div>
              </div>
            </Label>
          </div>
        </RadioGroup>

        <Button 
          onClick={handlePayment}
          disabled={isLoading}
          className="w-full"
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processando...
            </>
          ) : selectedMethod === 'cash' ? (
            'Confirmar Pedido (Dinheiro)'
          ) : (
            'Pagar com MercadoPago'
          )}
        </Button>
      </CardContent>
    </Card>
  );
};