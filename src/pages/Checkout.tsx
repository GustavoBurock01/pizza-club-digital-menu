import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { 
  ShoppingCart, 
  MapPin, 
  Plus, 
  Trash2, 
  Tag, 
  X,
  ArrowLeft,
  ArrowRight,
  CreditCard,
  Truck,
  Store,
  AlertCircle,
  Check,
  QrCode,
  Wallet,
  Banknote,
  ChevronRight
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

type CheckoutStep = 1 | 2 | 3;
type PaymentLocation = 'app' | 'delivery';
type PaymentMethodType = 'pix' | 'card' | 'cash';

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
    getTotal,
    removeItem,
    updateQuantity
  } = useUnifiedStore();
  
  const subtotal = getSubtotal();
  
  // Hooks
  const { profile } = useProfile();
  const { addresses, loading: loadingAddresses, addAddress, calculateDeliveryFee } = useAddresses();
  const { appliedCoupon, validateAndApplyCoupon, removeCoupon, loading: loadingCoupon } = useCoupon();
  
  // Estados de controle das etapas
  const [currentStep, setCurrentStep] = useState<CheckoutStep>(1);
  const [selectedAddress, setSelectedAddress] = useState<any>(null);
  const [couponCode, setCouponCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [isCheckoutBlocked, setIsCheckoutBlocked] = useState(false);
  const [showAddressDialog, setShowAddressDialog] = useState(false);
  const [orderNotes, setOrderNotes] = useState('');
  
  // Estados da Etapa 3 - Pagamento
  const [paymentLocation, setPaymentLocation] = useState<PaymentLocation>('app');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('pix');
  const [needsChange, setNeedsChange] = useState(false);
  const [changeAmount, setChangeAmount] = useState('');
  
  // Estado do formulário de novo endereço
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

  const handleRemoveItem = (itemId: string) => {
    removeItem(itemId);
    toast({
      title: "Item removido",
      description: "Item removido do carrinho",
    });
  };

  const validateStep1 = () => {
    if (items.length === 0) {
      toast({
        title: "Carrinho vazio",
        description: "Adicione itens antes de continuar",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (isCheckoutBlocked) {
      toast({
        title: "Dados incompletos",
        description: "Complete seu perfil antes de continuar",
        variant: "destructive",
      });
      return false;
    }

    if (deliveryMethod === 'delivery' && !selectedAddress) {
      toast({
        title: "Endereço não selecionado",
        description: "Selecione um endereço de entrega",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleNextStep = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    } else if (currentStep === 2 && validateStep2()) {
      setCurrentStep(3);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as CheckoutStep);
    }
  };

  const handleFinishOrder = () => {
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
      total_amount: finalTotal,
      coupon_code: appliedCoupon?.code || null,
      coupon_id: appliedCoupon?.id || null,
      notes: orderNotes,
      payment_location: paymentLocation,
      needs_change: needsChange,
      change_for: needsChange ? parseFloat(changeAmount) : null,
    };

    // Salvar no localStorage
    localStorage.setItem('pendingOrder', JSON.stringify(orderData));

    // Redirecionar baseado no método de pagamento
    if (paymentLocation === 'app') {
      // Pagamento online (PIX ou Cartão)
      navigate(`/payment?type=${paymentMethod}`, { state: { orderData } });
    } else {
      // Pagamento na entrega (criar pedido direto)
      navigate('/payment?type=cash', { state: { orderData } });
    }
  };

  const finalTotal = subtotal + deliveryFee - discountAmount;
  const progressPercentage = (currentStep / 3) * 100;

  if (loadingAddresses) {
    return (
      <div className="container mx-auto px-4 py-8">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32 lg:pb-8">
      <div className="container mx-auto px-4 py-4 lg:py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => currentStep === 1 ? navigate('/menu') : handlePreviousStep()}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {currentStep === 1 ? 'Voltar ao Menu' : 'Voltar'}
          </Button>
          
          <h1 className="text-2xl lg:text-3xl font-bold">Finalizar Pedido</h1>
          <p className="text-muted-foreground">
            {currentStep === 1 && 'Revise seus itens'}
            {currentStep === 2 && 'Defina a entrega'}
            {currentStep === 3 && 'Escolha o pagamento'}
          </p>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Etapa {currentStep} de 3</span>
              <span className="text-sm text-muted-foreground">{Math.round(progressPercentage)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        </div>

        {/* Validação de perfil */}
        {currentStep === 2 && (
          <CheckoutValidation
            deliveryMethod={deliveryMethod}
            onNavigateToProfile={() => navigate('/account')}
            onBlockCheckout={setIsCheckoutBlocked}
          />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* Coluna Principal */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* ETAPA 1: REVISÃO */}
            {currentStep === 1 && (
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
                        <div className="text-right flex flex-col items-end gap-2">
                          <p className="font-semibold">{formatCurrency(item.price * item.quantity)}</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveItem(item.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ETAPA 2: ENTREGA */}
            {currentStep === 2 && (
              <>
                {/* Método de Entrega */}
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

                {/* Endereço (se delivery) */}
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
                                  {address.reference_point && (
                                    <div className="text-sm text-muted-foreground mt-1">
                                      Ref: {address.reference_point}
                                    </div>
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

                {/* Observações */}
                <Card>
                  <CardHeader>
                    <CardTitle>Observações (opcional)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      placeholder="Ex: Sem cebola, capricha no queijo..."
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      rows={3}
                    />
                  </CardContent>
                </Card>
              </>
            )}

            {/* ETAPA 3: PAGAMENTO */}
            {currentStep === 3 && (
              <>
                {/* Cupom de Desconto */}
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

                {/* Forma de Pagamento */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Wallet className="h-5 w-5" />
                      Forma de Pagamento
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Escolher onde pagar */}
                    <RadioGroup value={paymentLocation} onValueChange={(value: any) => setPaymentLocation(value)}>
                      {/* Pagar pelo App */}
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-3">
                          <RadioGroupItem value="app" id="app" />
                          <Label htmlFor="app" className="font-semibold cursor-pointer">
                            Pagar pelo Aplicativo
                          </Label>
                        </div>
                        
                        {paymentLocation === 'app' && (
                          <div className="ml-6 space-y-2">
                            <div 
                              onClick={() => setPaymentMethod('pix')}
                              className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-accent ${paymentMethod === 'pix' && paymentLocation === 'app' ? 'bg-accent border-primary' : ''}`}
                            >
                              <QrCode className="h-5 w-5 text-green-600" />
                              <div className="flex-1">
                                <div className="font-medium">PIX</div>
                                <div className="text-sm text-muted-foreground">Aprovação instantânea</div>
                              </div>
                              {paymentMethod === 'pix' && paymentLocation === 'app' && <Check className="h-5 w-5 text-primary" />}
                            </div>
                            
                            <div 
                              onClick={() => setPaymentMethod('card')}
                              className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-accent ${paymentMethod === 'card' && paymentLocation === 'app' ? 'bg-accent border-primary' : ''}`}
                            >
                              <CreditCard className="h-5 w-5 text-blue-600" />
                              <div className="flex-1">
                                <div className="font-medium">Cartão de Crédito/Débito</div>
                                <div className="text-sm text-muted-foreground">Parcelamento disponível</div>
                              </div>
                              {paymentMethod === 'card' && paymentLocation === 'app' && <Check className="h-5 w-5 text-primary" />}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Pagar na Entrega */}
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-3">
                          <RadioGroupItem value="delivery" id="delivery-payment" />
                          <Label htmlFor="delivery-payment" className="font-semibold cursor-pointer">
                            Pagar na Entrega
                          </Label>
                        </div>
                        
                        {paymentLocation === 'delivery' && (
                          <div className="ml-6 space-y-2">
                            <div 
                              onClick={() => setPaymentMethod('cash')}
                              className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-accent ${paymentMethod === 'cash' && paymentLocation === 'delivery' ? 'bg-accent border-primary' : ''}`}
                            >
                              <Banknote className="h-5 w-5 text-green-700" />
                              <div className="flex-1">
                                <div className="font-medium">Dinheiro</div>
                                <div className="text-sm text-muted-foreground">Pagamento em espécie</div>
                              </div>
                              {paymentMethod === 'cash' && paymentLocation === 'delivery' && <Check className="h-5 w-5 text-primary" />}
                            </div>
                            
                            {/* Campo de troco */}
                            {paymentMethod === 'cash' && paymentLocation === 'delivery' && (
                              <div className="ml-3 mt-3 space-y-3 p-3 bg-muted/50 rounded-lg">
                                <div className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    id="needs-change"
                                    checked={needsChange}
                                    onChange={(e) => setNeedsChange(e.target.checked)}
                                    className="rounded"
                                  />
                                  <Label htmlFor="needs-change" className="cursor-pointer">
                                    Precisa de troco?
                                  </Label>
                                </div>
                                
                                {needsChange && (
                                  <div>
                                    <Label>Troco para quanto?</Label>
                                    <Input
                                      type="number"
                                      placeholder="Ex: 100.00"
                                      value={changeAmount}
                                      onChange={(e) => setChangeAmount(e.target.value)}
                                      className="mt-1"
                                    />
                                    {changeAmount && parseFloat(changeAmount) >= finalTotal && (
                                      <p className="text-sm text-muted-foreground mt-1">
                                        Troco: {formatCurrency(parseFloat(changeAmount) - finalTotal)}
                                      </p>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                            
                            <div 
                              onClick={() => setPaymentMethod('card')}
                              className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-accent ${paymentMethod === 'card' && paymentLocation === 'delivery' ? 'bg-accent border-primary' : ''}`}
                            >
                              <CreditCard className="h-5 w-5 text-blue-600" />
                              <div className="flex-1">
                                <div className="font-medium">Cartão na Entrega</div>
                                <div className="text-sm text-muted-foreground">Crédito ou débito</div>
                              </div>
                              {paymentMethod === 'card' && paymentLocation === 'delivery' && <Check className="h-5 w-5 text-primary" />}
                            </div>
                          </div>
                        )}
                      </div>
                    </RadioGroup>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {/* Sidebar - Resumo do Pedido (fixo no desktop, sticky no mobile) */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Resumo do Pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Items count */}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Itens ({items.length})</span>
                  <span className="font-medium">{formatCurrency(subtotal)}</span>
                </div>
                
                {/* Delivery fee */}
                {deliveryMethod === 'delivery' && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Taxa de entrega</span>
                    <span className="font-medium">{formatCurrency(deliveryFee)}</span>
                  </div>
                )}
                
                {/* Discount */}
                {discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Desconto</span>
                    <span className="font-medium">- {formatCurrency(discountAmount)}</span>
                  </div>
                )}
                
                <Separator />
                
                {/* Total */}
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold">Total</span>
                  <span className="text-2xl font-bold text-primary">
                    {formatCurrency(finalTotal)}
                  </span>
                </div>

                {/* Action Buttons - Desktop */}
                <div className="hidden lg:flex flex-col gap-2 pt-4">
                  {currentStep < 3 ? (
                    <Button 
                      onClick={handleNextStep}
                      size="lg"
                      className="w-full"
                      disabled={
                        (currentStep === 2 && deliveryMethod === 'delivery' && !selectedAddress) ||
                        isCheckoutBlocked
                      }
                    >
                      Continuar
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  ) : (
                    <Button 
                      onClick={handleFinishOrder}
                      size="lg"
                      className="w-full gradient-pizza"
                    >
                      {paymentLocation === 'app' ? 'Ir para Pagamento' : 'Confirmar Pedido'}
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  )}
                  
                  {currentStep > 1 && (
                    <Button 
                      variant="outline"
                      onClick={handlePreviousStep}
                      className="w-full"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Voltar
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Footer */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-background border-t p-4 shadow-lg z-50">
        <div className="container mx-auto max-w-md space-y-3">
          {/* Total */}
          <div className="flex justify-between items-center">
            <span className="font-semibold">Total</span>
            <span className="text-xl font-bold text-primary">
              {formatCurrency(finalTotal)}
            </span>
          </div>
          
          {/* Buttons */}
          {currentStep < 3 ? (
            <Button 
              onClick={handleNextStep}
              size="lg"
              className="w-full"
              disabled={
                (currentStep === 2 && deliveryMethod === 'delivery' && !selectedAddress) ||
                isCheckoutBlocked
              }
            >
              Continuar
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button 
              onClick={handleFinishOrder}
              size="lg"
              className="w-full gradient-pizza"
            >
              {paymentLocation === 'app' ? 'Ir para Pagamento' : 'Confirmar Pedido'}
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
