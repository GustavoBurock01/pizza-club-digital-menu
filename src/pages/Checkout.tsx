
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, MapPin, CreditCard } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { useAddresses } from '@/hooks/useAddresses';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const Checkout = () => {
  const navigate = useNavigate();
  const { items, getSubtotal, getTotal, deliveryFee, setDeliveryFee, clearCart } = useCart();
  const { addresses, loading: addressLoading, calculateDeliveryFee } = useAddresses();
  const { user } = useAuth();
  const { toast } = useToast();

  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (items.length === 0) {
      navigate('/menu');
      return;
    }

    if (addresses.length > 0 && !selectedAddress) {
      const defaultAddr = addresses.find(addr => addr.is_default) || addresses[0];
      setSelectedAddress(defaultAddr.id);
      const fee = calculateDeliveryFee(defaultAddr.neighborhood);
      setDeliveryFee(fee);
    }
  }, [addresses, items.length, navigate, selectedAddress, calculateDeliveryFee, setDeliveryFee]);

  const handleAddressChange = (addressId: string) => {
    setSelectedAddress(addressId);
    const address = addresses.find(addr => addr.id === addressId);
    if (address) {
      const fee = calculateDeliveryFee(address.neighborhood);
      setDeliveryFee(fee);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress || !paymentMethod) {
      toast({
        title: "Dados incompletos",
        description: "Selecione um endereço e forma de pagamento.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const selectedAddr = addresses.find(addr => addr.id === selectedAddress);
      
      const orderData = {
        user_id: user?.id,
        address_id: selectedAddress,
        status: 'pending' as const,
        total_amount: getTotal(),
        delivery_fee: deliveryFee,
        payment_method: paymentMethod as any,
        notes: orderNotes || null,
        estimated_delivery_time: 45,
      };

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([orderData])
        .select()
        .single();

      if (orderError) throw orderError;

      // Insert order items
      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.productId,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity,
        customizations: item.customizations || null,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      clearCart();
      
      toast({
        title: "Pedido realizado!",
        description: "Seu pedido foi enviado com sucesso. Você receberá atualizações em breve.",
      });

      navigate(`/order-status/${order.id}`);

    } catch (error: any) {
      console.error('Erro ao processar pedido:', error);
      toast({
        title: "Erro ao processar pedido",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  const formatAddress = (address: any) => {
    return `${address.street}, ${address.number} - ${address.neighborhood}, ${address.city}/${address.state}`;
  };

  if (addressLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pizza-red mx-auto mb-4"></div>
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/menu')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao Menu
          </Button>
          <h1 className="text-2xl font-bold">Finalizar Pedido</h1>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Address Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Endereço de Entrega
                </CardTitle>
              </CardHeader>
              <CardContent>
                {addresses.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground mb-4">
                      Você ainda não tem endereços cadastrados.
                    </p>
                    <Button onClick={() => navigate('/account')}>
                      Cadastrar Endereço
                    </Button>
                  </div>
                ) : (
                  <RadioGroup value={selectedAddress} onValueChange={handleAddressChange}>
                    {addresses.map((address) => (
                      <div key={address.id} className="flex items-start space-x-2 p-3 border rounded-lg">
                        <RadioGroupItem value={address.id} id={address.id} className="mt-1" />
                        <Label htmlFor={address.id} className="flex-1 cursor-pointer">
                          <div className="font-medium">{formatAddress(address)}</div>
                          {address.complement && (
                            <div className="text-sm text-muted-foreground">{address.complement}</div>
                          )}
                          {address.reference_point && (
                            <div className="text-sm text-muted-foreground">Ref: {address.reference_point}</div>
                          )}
                          {address.is_default && (
                            <div className="text-xs text-pizza-red font-medium">Endereço padrão</div>
                          )}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Forma de Pagamento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="credit_card" id="credit_card" />
                    <Label htmlFor="credit_card">Cartão de Crédito</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="debit_card" id="debit_card" />
                    <Label htmlFor="debit_card">Cartão de Débito</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="pix" id="pix" />
                    <Label htmlFor="pix">PIX</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="cash" id="cash" />
                    <Label htmlFor="cash">Dinheiro</Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Order Notes */}
            <Card>
              <CardHeader>
                <CardTitle>Observações do Pedido</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Alguma observação especial para seu pedido..."
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  rows={3}
                />
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div>
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>Resumo do Pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{item.name}</h4>
                      <p className="text-xs text-muted-foreground">
                        Qtd: {item.quantity}
                      </p>
                      {item.customizations && (
                        <div className="text-xs text-muted-foreground">
                          {item.customizations.halfAndHalf && (
                            <div>Meio a meio: {item.customizations.halfAndHalf.firstHalf} / {item.customizations.halfAndHalf.secondHalf}</div>
                          )}
                          {item.customizations.crust && item.customizations.crust !== 'tradicional' && (
                            <div>Borda: {item.customizations.crust}</div>
                          )}
                          {item.customizations.extras && item.customizations.extras.length > 0 && (
                            <div>Extras: {item.customizations.extras.join(', ')}</div>
                          )}
                        </div>
                      )}
                    </div>
                    <span className="text-sm font-medium">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                ))}

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatPrice(getSubtotal())}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Taxa de entrega:</span>
                    <span>{formatPrice(deliveryFee)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total:</span>
                    <span>{formatPrice(getTotal())}</span>
                  </div>
                </div>

                <Button
                  onClick={handlePlaceOrder}
                  disabled={isProcessing || !selectedAddress || !paymentMethod}
                  className="w-full gradient-pizza"
                >
                  {isProcessing ? 'Processando...' : 'Confirmar Pedido'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
