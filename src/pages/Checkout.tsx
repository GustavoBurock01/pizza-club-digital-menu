import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ShoppingCart, 
  MapPin, 
  Plus, 
  Trash2, 
  Tag, 
  X,
  ArrowLeft,
  CreditCard,
  Truck,
  Store,
  AlertCircle,
  Check
} from 'lucide-react';
import { useUnifiedStore } from '@/stores/simpleStore';
import { useAddresses } from '@/hooks/useAddresses';
import { useCoupon } from '@/hooks/useCoupon';
import { useProfile } from '@/hooks/useUnifiedProfile';
import { formatCurrency } from '@/utils/formatting';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { CheckoutValidation } from '@/components/CheckoutValidation';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function Checkout() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Store do carrinho
  const { 
    items, 
    deliveryFee,
    deliveryMethod,
    setDeliveryMethod,
    setDeliveryFee,
    getSubtotal,
    getTotal 
  } = useUnifiedStore();
  
  const subtotal = getSubtotal();
  const total = getTotal();
  
  // Hooks
  const { profile } = useProfile();
  const { addresses, loading: loadingAddresses, addAddress, calculateDeliveryFee } = useAddresses();
  const { appliedCoupon, validateAndApplyCoupon, removeCoupon, loading: loadingCoupon } = useCoupon();
  
  // Estados locais
  const [selectedAddress, setSelectedAddress] = useState<any>(null);
  const [couponCode, setCouponCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [isCheckoutBlocked, setIsCheckoutBlocked] = useState(false);
  const [showAddressDialog, setShowAddressDialog] = useState(false);
  const [newAddress, setNewAddress] = useState({
    street: '',
    number: '',
    neighborhood: '',
    city: 'Sua Cidade',
    state: 'SP',
    zip_code: '',
    complement: '',
    reference_point: '',
    is_default: false,
  });

  // Carregar endereço padrão
  useEffect(() => {
    if (addresses.length > 0 && !selectedAddress) {
      const defaultAddr = addresses.find(a => a.is_default) || addresses[0];
      setSelectedAddress(defaultAddr);
      
      // Calcular taxa de entrega
      if (deliveryMethod === 'delivery' && defaultAddr) {
        const fee = calculateDeliveryFee(defaultAddr.neighborhood);
        setDeliveryFee(fee);
      }
    }
  }, [addresses, deliveryMethod]);

  // Redirecionar se carrinho vazio
  useEffect(() => {
    if (items.length === 0) {
      toast({
        title: "Carrinho vazio",
        description: "Adicione itens antes de finalizar o pedido",
        variant: "destructive",
      });
      navigate('/menu');
    }
  }, [items.length]);

  // Atualizar taxa de entrega quando mudar endereço ou método
  useEffect(() => {
    if (deliveryMethod === 'delivery' && selectedAddress) {
      const fee = calculateDeliveryFee(selectedAddress.neighborhood);
      setDeliveryFee(fee);
    } else if (deliveryMethod === 'pickup') {
      setDeliveryFee(0);
    }
  }, [selectedAddress, deliveryMethod]);

  const handleApplyCoupon = async () => {
    const result = await validateAndApplyCoupon(couponCode, subtotal);
    if (result) {
      setDiscountAmount(result.discountAmount);
    }
  };

  const handleRemoveCoupon = () => {
    removeCoupon();
    setDiscountAmount(0);
    setCouponCode('');
  };

  const handleSelectAddress = (address: any) => {
    setSelectedAddress(address);
  };

  const handleAddNewAddress = async () => {
    try {
      const added = await addAddress(newAddress);
      if (added) {
        setSelectedAddress(added);
        setShowAddressDialog(false);
        
        // Resetar formulário
        setNewAddress({
          street: '',
          number: '',
          neighborhood: '',
          city: 'Sua Cidade',
          state: 'SP',
          zip_code: '',
          complement: '',
          reference_point: '',
          is_default: false,
        });
      }
    } catch (error) {
      console.error('Error adding address:', error);
    }
  };

  const handleProceedToPayment = () => {
    // Validar dados obrigatórios
    if (isCheckoutBlocked) {
      toast({
        title: "Dados incompletos",
        description: "Complete seu perfil antes de continuar",
        variant: "destructive",
      });
      return;
    }

    if (deliveryMethod === 'delivery' && !selectedAddress) {
      toast({
        title: "Endereço não selecionado",
        description: "Selecione um endereço de entrega",
        variant: "destructive",
      });
      return;
    }

    // Preparar dados do pedido
    const orderData = {
      items: items.map(item => ({
        product_id: item.id,
        name: item.name,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity,
        customizations: item.customizations || null,
      })),
      customer_name: profile?.full_name || '',
      customer_phone: profile?.phone || '',
      delivery_method: deliveryMethod,
      address_id: deliveryMethod === 'delivery' ? selectedAddress?.id : null,
      delivery_address_snapshot: deliveryMethod === 'delivery' ? selectedAddress : null,
      subtotal,
      delivery_fee: deliveryFee,
      discount_amount: discountAmount,
      total_amount: subtotal + deliveryFee - discountAmount,
      coupon_code: appliedCoupon?.code || null,
      coupon_id: appliedCoupon?.id || null,
      notes: '',
    };

    // Salvar no localStorage e navegar
    localStorage.setItem('pendingOrder', JSON.stringify(orderData));
    navigate('/payment?type=pix', { state: { orderData } });
  };

  const finalTotal = subtotal + deliveryFee - discountAmount;

  if (loadingAddresses) {
    return (
      <div className="container mx-auto px-4 py-8">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/menu')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar ao Menu
        </Button>
        
        <h1 className="text-3xl font-bold">Finalizar Pedido</h1>
        <p className="text-muted-foreground">Confira seus itens e complete os dados</p>
      </div>

      {/* Validação de perfil */}
      <CheckoutValidation
        deliveryMethod={deliveryMethod}
        onNavigateToProfile={() => navigate('/account')}
        onBlockCheckout={setIsCheckoutBlocked}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Coluna Principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1️⃣ Resumo do Pedido */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Itens do Pedido
                <Badge variant="secondary" className="ml-auto">
                  {items.length} {items.length === 1 ? 'item' : 'itens'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex items-start gap-4 pb-4 border-b last:border-0">
                    <div className="flex-1">
                      <h4 className="font-medium">{item.name}</h4>
                      {item.customizations && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {JSON.stringify(item.customizations)}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-sm text-muted-foreground">
                          Qtd: {item.quantity}
                        </span>
                        <span className="text-sm">×</span>
                        <span className="text-sm">{formatCurrency(item.price)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(item.price * item.quantity)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 🏷️ Cupom de Desconto */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Cupom de Desconto
              </CardTitle>
            </CardHeader>
            <CardContent>
              {appliedCoupon ? (
                <Alert className="bg-green-50 border-green-200">
                  <Check className="h-4 w-4 text-green-600" />
                  <AlertDescription className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-green-800">Cupom aplicado: {appliedCoupon.code}</p>
                      <p className="text-sm text-green-600">
                        Desconto: {formatCurrency(discountAmount)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveCoupon}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="flex gap-2">
                  <Input
                    placeholder="Digite o código do cupom"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    disabled={loadingCoupon}
                  />
                  <Button
                    onClick={handleApplyCoupon}
                    disabled={loadingCoupon || !couponCode.trim()}
                  >
                    {loadingCoupon ? 'Validando...' : 'Aplicar'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 2️⃣ Método de Entrega */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Método de Entrega
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup value={deliveryMethod} onValueChange={(value: any) => setDeliveryMethod(value)}>
                <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-accent cursor-pointer">
                  <RadioGroupItem value="delivery" id="delivery" />
                  <Label htmlFor="delivery" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4" />
                      <span className="font-medium">Entrega</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Receba em casa</p>
                  </Label>
                  {deliveryMethod === 'delivery' && (
                    <span className="font-medium text-primary">
                      + {formatCurrency(deliveryFee)}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-accent cursor-pointer">
                  <RadioGroupItem value="pickup" id="pickup" />
                  <Label htmlFor="pickup" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Store className="h-4 w-4" />
                      <span className="font-medium">Retirada</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Retire no local</p>
                  </Label>
                  <span className="font-medium text-green-600">Grátis</span>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* 3️⃣ Endereço (se delivery) */}
          {deliveryMethod === 'delivery' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Endereço de Entrega
                  </div>
                  <Dialog open={showAddressDialog} onOpenChange={setShowAddressDialog}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Novo Endereço
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Adicionar Endereço</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="col-span-2">
                            <Label>Rua</Label>
                            <Input
                              value={newAddress.street}
                              onChange={(e) => setNewAddress({...newAddress, street: e.target.value})}
                            />
                          </div>
                          <div>
                            <Label>Número</Label>
                            <Input
                              value={newAddress.number}
                              onChange={(e) => setNewAddress({...newAddress, number: e.target.value})}
                            />
                          </div>
                          <div>
                            <Label>Bairro</Label>
                            <Input
                              value={newAddress.neighborhood}
                              onChange={(e) => setNewAddress({...newAddress, neighborhood: e.target.value})}
                            />
                          </div>
                          <div>
                            <Label>CEP</Label>
                            <Input
                              value={newAddress.zip_code}
                              onChange={(e) => setNewAddress({...newAddress, zip_code: e.target.value})}
                              placeholder="00000-000"
                            />
                          </div>
                          <div>
                            <Label>Complemento</Label>
                            <Input
                              value={newAddress.complement}
                              onChange={(e) => setNewAddress({...newAddress, complement: e.target.value})}
                            />
                          </div>
                          <div className="col-span-2">
                            <Label>Ponto de Referência</Label>
                            <Input
                              value={newAddress.reference_point}
                              onChange={(e) => setNewAddress({...newAddress, reference_point: e.target.value})}
                            />
                          </div>
                        </div>
                        <Button onClick={handleAddNewAddress} className="w-full">
                          Adicionar
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {addresses.length === 0 ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Você ainda não tem endereços cadastrados. Adicione um novo endereço para continuar.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <RadioGroup value={selectedAddress?.id} onValueChange={(id) => {
                    const addr = addresses.find(a => a.id === id);
                    setSelectedAddress(addr);
                  }}>
                    <div className="space-y-3">
                      {addresses.map((address) => (
                        <div
                          key={address.id}
                          className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-accent cursor-pointer"
                        >
                          <RadioGroupItem value={address.id} id={address.id} />
                          <Label htmlFor={address.id} className="flex-1 cursor-pointer">
                            <div className="font-medium">
                              {address.street}, {address.number}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {address.neighborhood} - {address.city}/{address.state}
                            </div>
                            {address.complement && (
                              <div className="text-sm text-muted-foreground">
                                {address.complement}
                              </div>
                            )}
                            {address.is_default && (
                              <Badge variant="secondary" className="mt-2">Padrão</Badge>
                            )}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Resumo Lateral */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Resumo do Pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                
                {deliveryMethod === 'delivery' && (
                  <div className="flex justify-between text-sm">
                    <span>Taxa de Entrega</span>
                    <span>{formatCurrency(deliveryFee)}</span>
                  </div>
                )}
                
                {discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Desconto</span>
                    <span>- {formatCurrency(discountAmount)}</span>
                  </div>
                )}
                
                <Separator />
                
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>{formatCurrency(finalTotal)}</span>
                </div>
              </div>

              <Button
                onClick={handleProceedToPayment}
                disabled={isCheckoutBlocked || (deliveryMethod === 'delivery' && !selectedAddress)}
                className="w-full gradient-pizza"
                size="lg"
              >
                <CreditCard className="h-5 w-5 mr-2" />
                Ir para Pagamento
              </Button>

              {deliveryMethod === 'delivery' && selectedAddress && (
                <div className="text-xs text-muted-foreground text-center">
                  Entrega em: {selectedAddress.neighborhood}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
