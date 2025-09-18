// ===== CHECKOUT EXPRESS - UMA PÁGINA =====

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUnifiedStore } from '@/stores/simpleStore';
import { useAuth } from '@/hooks/useAuth';
import { useAddresses } from '@/hooks/useAddresses';
import { useToast } from '@/hooks/use-toast';
import { useProfile } from '@/hooks/useProfile';
import { CheckoutValidation } from '@/components/CheckoutValidation';
import { supabase } from '@/integrations/supabase/client';
import { CheckoutButton } from '@/components/ProtectedButton';
import { useOrderProtection } from '@/hooks/useOrderProtection';
import { checkCheckoutRateLimit } from '@/utils/rateLimiting';
import { idempotencyManager } from '@/utils/idempotency';

import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, CreditCard, Smartphone, MapPin, Clock, Check, Banknote, Wallet, Trash2 } from 'lucide-react';
import { PaymentCategory, PaymentMethod } from '@/types';

interface CustomerData {
  street: string;
  number: string;
  neighborhood: string;
  complement: string;
}

const ExpressCheckout = () => {
  const { items, getSubtotal, getTotal, clearCart, removeItem } = useUnifiedStore();
  const { user } = useAuth();
  const { addresses } = useAddresses();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { profile, isProfileComplete } = useProfile();
  const { protectOrderCreation } = useOrderProtection();

  const [step, setStep] = useState<'review' | 'address' | 'payment' | 'processing'>('review');
  const [deliveryMethod, setDeliveryMethod] = useState<'delivery' | 'pickup'>('delivery');
  const [paymentCategory, setPaymentCategory] = useState<PaymentCategory>('online');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [needsChange, setNeedsChange] = useState(false);
  const [changeAmount, setChangeAmount] = useState('');
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [isGuest, setIsGuest] = useState(!user);
  const [loading, setLoading] = useState(false);

  const [customerData, setCustomerData] = useState<CustomerData>({
    street: '',
    number: '',
    neighborhood: '',
    complement: ''
  });

  // ===== MEMOIZED CALCULATIONS =====
  const subtotal = useMemo(() => getSubtotal(), [items]);
  const deliveryFee = useMemo(() => deliveryMethod === 'delivery' ? 5 : 0, [deliveryMethod]);
  const total = useMemo(() => subtotal + deliveryFee, [subtotal, deliveryFee]);

  const formatPrice = (price: number) => {
    return price.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  // ===== PAYMENT LOGIC =====
  const isOnlinePayment = () => {
    return ['pix', 'credit_card_online', 'debit_card_online'].includes(paymentMethod);
  };

  // ===== VALIDATION =====
  const isStepValid = useMemo(() => {
    switch (step) {
      case 'review':
        return items.length > 0;
      case 'address':
        if (deliveryMethod === 'pickup') return true;
        if (!isGuest && selectedAddressId) return true;
        return customerData.street && customerData.number && customerData.neighborhood;
      case 'payment':
        // Verificar se dados obrigatórios estão completos
        if (!profile?.full_name) return false;
        if (deliveryMethod === 'delivery' && !profile?.phone) return false;
        
        if (paymentMethod === 'cash' && needsChange) {
          return changeAmount && parseFloat(changeAmount) > total;
        }
        return !!paymentMethod;
      default:
        return false;
    }
  }, [step, items, deliveryMethod, isGuest, selectedAddressId, customerData, paymentMethod, needsChange, changeAmount, total, profile]);

  // ===== HANDLERS =====
  const handleNext = () => {
    if (!isStepValid) return;

    switch (step) {
      case 'review':
        setStep('address');
        break;
      case 'address':
        setStep('payment');
        break;
      case 'payment':
        handleCreateOrder();
        break;
    }
  };

  const handleBack = () => {
    switch (step) {
      case 'address':
        setStep('review');
        break;
      case 'payment':
        setStep('address');
        break;
      case 'review':
      default:
        navigate('/menu');
        break;
    }
  };

  const getBackButtonText = () => {
    switch (step) {
      case 'address':
        return 'Revisar';
      case 'payment':
        return 'Entrega';
      case 'review':
      default:
        return 'Menu';
    }
  };

  const handleCreateOrder = async () => {
    if (loading) return; // Proteção básica contra duplo clique
    
    // Verificar rate limiting
    if (!user?.id || !checkCheckoutRateLimit(user.id)) {
      toast({
        title: "Muitas tentativas",
        description: "Aguarde um momento antes de tentar novamente.",
        variant: "destructive"
      });
      return;
    }
    
    setStep('processing');
    setLoading(true);

    try {
      console.log('[CHECKOUT] Payment method:', paymentMethod, 'Category:', paymentCategory);
      console.log('[CHECKOUT] Is online payment:', isOnlinePayment());
      
      if (isOnlinePayment()) {
        // Para pagamentos online (PIX, cartões online), salvar dados e aguardar pagamento
        console.log('[CHECKOUT] Redirecting to online payment flow');
        await handleOnlinePayment();
      } else {
        // Para pagamentos presenciais (dinheiro, cartões presenciais), criar pedido imediatamente
        console.log('[CHECKOUT] Processing in-person payment');
        await handlePresencialPaymentProtected();
      }
    } catch (error: any) {
      setStep('payment');
      toast({
        title: "Erro ao processar pedido",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOnlinePayment = async () => {
    // Obter dados do perfil do usuário
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user?.id)
      .single();

    // Validar dados obrigatórios ANTES de enviar
    const customerName = profile?.full_name || user?.email || 'Cliente';
    const customerPhone = profile?.phone || '';

    console.log('[CHECKOUT] Customer data:', {
      name: customerName,
      phone: customerPhone,
      delivery_method: deliveryMethod
    });

    // Validação crítica: telefone obrigatório para entrega
    if (deliveryMethod === 'delivery' && !customerPhone) {
      throw new Error('Para entregas, é necessário cadastrar um telefone. Vá para "Minha Conta" e complete seu perfil.');
    }

    // Preparar dados do pedido para pagamento online
    const orderData = {
      user_id: user?.id,
      delivery_method: deliveryMethod,
      total_amount: total,
      delivery_fee: deliveryFee,
      payment_method: paymentMethod,
      customer_name: customerName,
      customer_phone: customerPhone,
      notes: undefined as string | undefined,
      items: items.map(item => ({
        product_id: item.productId,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity,
        customizations: item.customizations
      })),
      addressData: null as any
    };

    // Preparar endereço se necessário
    if (deliveryMethod === 'delivery') {
      if (selectedAddressId) {
        orderData.addressData = { id: selectedAddressId };
      } else {
        orderData.addressData = {
          street: customerData.street,
          number: customerData.number,
          neighborhood: customerData.neighborhood,
          complement: customerData.complement,
          city: 'Sua Cidade',
          state: 'SP',
          zip_code: '00000-000'
        };
      }
    }

    // Preparar notas (sem sobrescrever customer_name)
    let notes = deliveryMethod === 'pickup' ? 'Retirada no balcão' : undefined;
    if (paymentMethod === 'cash' && needsChange) {
      notes = `${notes ? notes + '. ' : ''}Troco para ${formatPrice(parseFloat(changeAmount))}`;
    }
    
    // Adicionar notas sem sobrescrever o nome do cliente
    if (notes) {
      orderData.notes = notes;
    }

    // Salvar no localStorage e navegar para pagamento
    localStorage.setItem('pendingOrder', JSON.stringify(orderData));
    // NÃO limpar o carrinho até o pagamento ser aprovado
    // clearCart(); // Movido para depois da confirmação do pagamento

    if (paymentMethod === 'pix') {
      navigate('/payment/pix');
    } else if (paymentMethod === 'credit_card_online' || paymentMethod === 'debit_card_online') {
      navigate('/payment/card');
    }

    toast({
      title: "Redirecionando para pagamento",
      description: "Complete o pagamento para confirmar seu pedido.",
    });
  };

  const handlePresencialPaymentProtected = async () => {
    await protectOrderCreation(
      {
        user_id: user?.id,
        items: items.map(item => ({
          product_id: item.productId,
          quantity: item.quantity,
          unit_price: item.price,
          total_price: item.price * item.quantity,
          customizations: item.customizations
        })),
        total_amount: total,
        delivery_method: deliveryMethod,
        payment_method: paymentMethod
      },
      handlePresencialPayment,
      { userId: user?.id || '' }
    );
  };

  const handlePresencialPayment = async () => {
    // Obter dados do perfil do usuário
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user?.id)
      .single();

    const customerName = profile?.full_name || user?.email || 'Cliente';
    const customerPhone = profile?.phone || '';

    // Validação crítica: telefone obrigatório para entrega
    if (deliveryMethod === 'delivery' && !customerPhone) {
      throw new Error('Para entregas, é necessário cadastrar um telefone. Vá para "Minha Conta" e complete seu perfil.');
    }

    let addressId = selectedAddressId;

    // Create address if needed
    if (deliveryMethod === 'delivery' && !selectedAddressId) {
      const { data: addressData, error: addressError } = await supabase
        .from('addresses')
        .insert({
          user_id: user?.id,
          street: customerData.street,
          number: customerData.number,
          neighborhood: customerData.neighborhood,
          complement: customerData.complement,
          city: 'Sua Cidade',
          state: 'SP',
          zip_code: '00000-000'
        })
        .select()
        .single();

      if (addressError) throw addressError;
      addressId = addressData.id;
    }

    // Create order
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: user?.id,
        address_id: deliveryMethod === 'delivery' ? addressId : null,
        total_amount: total,
        delivery_fee: deliveryFee,
        delivery_method: deliveryMethod,
        status: 'pending',
        payment_status: 'pending',
        customer_name: customerName,
        customer_phone: customerPhone,
        payment_method: paymentMethod,
        notes: deliveryMethod === 'pickup' ? 'Retirada no balcão' : undefined
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // Create order items
    const orderItems = items.map(item => ({
      order_id: orderData.id,
      product_id: item.productId,
      quantity: item.quantity,
      unit_price: item.price,
      total_price: item.price * item.quantity,
      customizations: item.customizations ? JSON.parse(JSON.stringify(item.customizations)) : null
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) throw itemsError;

    // Update order with notes if needed
    if (paymentMethod === 'cash' && needsChange) {
      const orderNotes = `${deliveryMethod === 'pickup' ? 'Retirada no balcão. ' : ''}Troco para ${formatPrice(parseFloat(changeAmount))}`;
      await supabase
        .from('orders')
        .update({ notes: orderNotes })
        .eq('id', orderData.id);
    }

    // Clear cart and navigate
    clearCart();
    navigate(`/order-status/${orderData.id}`);

    toast({
      title: "Pedido criado!",
      description: "Acompanhe o status do seu pedido.",
    });
  };

  if (items.length === 0) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <SidebarInset>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
              <SidebarTrigger className="-ml-1" />
              <h1 className="text-xl font-semibold">Checkout Express</h1>
            </header>
            <div className="flex-1 p-6">
              <div className="max-w-2xl mx-auto text-center py-12">
                <div className="text-6xl mb-4">🛒</div>
                <h2 className="text-2xl font-bold mb-2">Carrinho vazio</h2>
                <p className="text-muted-foreground mb-6">
                  Adicione produtos para continuar
                </p>
                <Button 
                  onClick={() => navigate('/menu')}
                  className="gradient-pizza text-white"
                >
                  Ver Cardápio
                </Button>
              </div>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                {getBackButtonText()}
              </Button>
              <h1 className="text-xl font-semibold">Checkout Express</h1>
            </div>
          </header>

          <div className="flex-1 p-6 pb-32">
            <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* MAIN CONTENT */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* STEP INDICATOR */}
                <div className="flex items-center justify-center space-x-4 mb-8">
                  {[
                    { key: 'review', label: 'Revisar', icon: '📋' },
                    { key: 'address', label: 'Entrega', icon: '📍' },
                    { key: 'payment', label: 'Pagamento', icon: '💳' }
                  ].map((s, index) => (
                    <div key={s.key} className="flex items-center">
                      <div className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-medium ${
                        step === s.key ? 'bg-primary text-primary-foreground' :
                        ['review', 'address', 'payment'].indexOf(step) > index ? 'bg-green-500 text-white' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {['review', 'address', 'payment'].indexOf(step) > index ? <Check className="h-4 w-4" /> : s.icon}
                      </div>
                      <span className="ml-2 text-sm font-medium">{s.label}</span>
                      {index < 2 && <div className="w-8 h-px bg-border mx-4" />}
                    </div>
                  ))}
                </div>

                {/* STEP: REVIEW */}
                {step === 'review' && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Seus Itens ({items.length})</CardTitle>
                    </CardHeader>
                     <CardContent className="space-y-4">
                      {items.map((item) => (
                        <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg">
                          <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg flex items-center justify-center">
                            {item.image ? (
                              <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-lg" />
                            ) : (
                              <span className="text-2xl">🍕</span>
                            )}
                          </div>
                          
                          <div className="flex-1">
                            <h3 className="font-medium">{item.name}</h3>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-sm text-muted-foreground">Qtd: {item.quantity}</span>
                              <span className="font-medium">{formatPrice(item.price * item.quantity)}</span>
                            </div>
                          </div>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(item.id)}
                            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* STEP: ADDRESS */}
                {step === 'address' && (
                  <div className="space-y-6">
                    {/* Delivery Method */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Método de Entrega</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <RadioGroup value={deliveryMethod} onValueChange={(value: 'delivery' | 'pickup') => setDeliveryMethod(value)}>
                          <div className="flex items-center space-x-2 p-4 border rounded-lg">
                            <RadioGroupItem value="delivery" id="delivery" />
                            <Label htmlFor="delivery" className="flex-1 cursor-pointer">
                              <div className="flex items-center gap-3">
                                <MapPin className="h-5 w-5 text-primary" />
                                <div>
                                  <div className="font-medium">Entrega</div>
                                  <div className="text-sm text-muted-foreground">Entregamos em sua casa</div>
                                </div>
                              </div>
                            </Label>
                            <span className="text-sm font-medium">{formatPrice(5)}</span>
                          </div>
                          
                          <div className="flex items-center space-x-2 p-4 border rounded-lg">
                            <RadioGroupItem value="pickup" id="pickup" />
                            <Label htmlFor="pickup" className="flex-1 cursor-pointer">
                              <div className="flex items-center gap-3">
                                <Clock className="h-5 w-5 text-primary" />
                                <div>
                                  <div className="font-medium">Retirada</div>
                                  <div className="text-sm text-muted-foreground">Retire no balcão</div>
                                </div>
                              </div>
                            </Label>
                            <span className="text-sm font-medium text-green-600">Grátis</span>
                          </div>
                        </RadioGroup>
                      </CardContent>
                    </Card>

                    {/* Address Form */}
                    {deliveryMethod === 'delivery' && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Endereço de Entrega</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {!isGuest && addresses.length > 0 && (
                            <div>
                              <Label>Endereços Salvos</Label>
                              <Select value={selectedAddressId} onValueChange={setSelectedAddressId}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione um endereço" />
                                </SelectTrigger>
                                <SelectContent>
                                  {addresses.map((address) => (
                                    <SelectItem key={address.id} value={address.id}>
                                      {address.street}, {address.number} - {address.neighborhood}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}

                          {(isGuest || !selectedAddressId) && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="street">Rua *</Label>
                                <Input
                                  id="street"
                                  value={customerData.street}
                                  onChange={(e) => setCustomerData(prev => ({ ...prev, street: e.target.value }))}
                                  placeholder="Nome da rua"
                                />
                              </div>
                              <div>
                                <Label htmlFor="number">Número *</Label>
                                <Input
                                  id="number"
                                  value={customerData.number}
                                  onChange={(e) => setCustomerData(prev => ({ ...prev, number: e.target.value }))}
                                  placeholder="123"
                                />
                              </div>
                              <div>
                                <Label htmlFor="neighborhood">Bairro *</Label>
                                <Input
                                  id="neighborhood"
                                  value={customerData.neighborhood}
                                  onChange={(e) => setCustomerData(prev => ({ ...prev, neighborhood: e.target.value }))}
                                  placeholder="Nome do bairro"
                                />
                              </div>
                              <div>
                                <Label htmlFor="complement">Complemento</Label>
                                <Input
                                  id="complement"
                                  value={customerData.complement}
                                  onChange={(e) => setCustomerData(prev => ({ ...prev, complement: e.target.value }))}
                                  placeholder="Apto, bloco, etc."
                                />
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}

                {/* STEP: PAYMENT */}
                {step === 'payment' && (
                  <div className="space-y-6">
                    {/* Validação de dados obrigatórios */}
                    <CheckoutValidation 
                      deliveryMethod={deliveryMethod}
                      onNavigateToProfile={() => navigate('/account')}
                    />
                    
                    {/* Payment Category Selection */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Forma de Pagamento</CardTitle>
                        <p className="text-sm text-muted-foreground">Escolha quando deseja pagar</p>
                      </CardHeader>
                      <CardContent>
                        <RadioGroup value={paymentCategory} onValueChange={(value: PaymentCategory) => {
                          setPaymentCategory(value);
                          // Reset payment method when category changes
                          setPaymentMethod(value === 'online' ? 'pix' : 'cash');
                          setNeedsChange(false);
                          setChangeAmount('');
                        }}>
                          <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                            <RadioGroupItem value="online" id="online" />
                            <Label htmlFor="online" className="flex-1 cursor-pointer">
                              <div className="flex items-center gap-3">
                                <Smartphone className="h-5 w-5 text-blue-600" />
                                <div>
                                  <div className="font-medium">Pagamento Online</div>
                                  <div className="text-sm text-muted-foreground">PIX ou Cartão via MercadoPago</div>
                                </div>
                              </div>
                            </Label>
                          </div>
                          
                           <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                             <RadioGroupItem value="on_delivery" id="on_delivery" />
                             <Label htmlFor="on_delivery" className="flex-1 cursor-pointer">
                               <div className="flex items-center gap-3">
                                 <Wallet className="h-5 w-5 text-green-600" />
                                 <div>
                                   <div className="font-medium">{deliveryMethod === 'pickup' ? 'Pagamento no Balcão' : 'Pagamento na Entrega'}</div>
                                   <div className="text-sm text-muted-foreground">
                                     {deliveryMethod === 'pickup' ? 'Cartão ou Dinheiro no balcão' : 'Cartão ou Dinheiro na entrega'}
                                   </div>
                                 </div>
                               </div>
                             </Label>
                           </div>
                        </RadioGroup>
                      </CardContent>
                    </Card>

                    {/* Payment Method Selection */}
                    <Card>
                      <CardHeader>
                         <CardTitle>
                           {paymentCategory === 'online' ? 'Método de Pagamento Online' : 
                            (deliveryMethod === 'pickup' ? 'Método de Pagamento no Balcão' : 'Método de Pagamento na Entrega')}
                         </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <RadioGroup value={paymentMethod} onValueChange={(value: PaymentMethod) => {
                          setPaymentMethod(value);
                          if (value !== 'cash') {
                            setNeedsChange(false);
                            setChangeAmount('');
                          }
                        }}>
                          
                          {paymentCategory === 'online' && (
                            <>
                              <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg mb-4">
                                <p className="text-sm text-blue-700 dark:text-blue-300">
                                  ℹ️ Pagamentos online requerem confirmação antes da criação do pedido
                                </p>
                              </div>
                              
                              <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                                <RadioGroupItem value="pix" id="pix" />
                                <Label htmlFor="pix" className="flex-1 cursor-pointer">
                                  <div className="flex items-center gap-3">
                                    <Smartphone className="h-5 w-5 text-green-600" />
                                    <div>
                                      <div className="font-medium">PIX</div>
                                      <div className="text-sm text-muted-foreground">Aprovação instantânea</div>
                                    </div>
                                  </div>
                                </Label>
                              </div>

                              <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                                <RadioGroupItem value="credit_card_online" id="credit_card_online" />
                                <Label htmlFor="credit_card_online" className="flex-1 cursor-pointer">
                                  <div className="flex items-center gap-3">
                                    <CreditCard className="h-5 w-5 text-blue-600" />
                                    <div>
                                      <div className="font-medium">Cartão de Crédito</div>
                                      <div className="text-sm text-muted-foreground">Parcelamento até 12x</div>
                                    </div>
                                  </div>
                                </Label>
                              </div>

                              <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                                <RadioGroupItem value="debit_card_online" id="debit_card_online" />
                                <Label htmlFor="debit_card_online" className="flex-1 cursor-pointer">
                                  <div className="flex items-center gap-3">
                                    <CreditCard className="h-5 w-5 text-purple-600" />
                                    <div>
                                      <div className="font-medium">Cartão de Débito</div>
                                      <div className="text-sm text-muted-foreground">Débito online</div>
                                    </div>
                                  </div>
                                </Label>
                              </div>
                            </>
                          )}

                          {paymentCategory === 'on_delivery' && (
                            <>
                              <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                                <RadioGroupItem value="credit_card_delivery" id="credit_card_delivery" />
                                <Label htmlFor="credit_card_delivery" className="flex-1 cursor-pointer">
                                  <div className="flex items-center gap-3">
                                    <CreditCard className="h-5 w-5 text-blue-600" />
                                    <div>
                                      <div className="font-medium">Cartão de Crédito</div>
                                      <div className="text-sm text-muted-foreground">Máquina na entrega</div>
                                    </div>
                                  </div>
                                </Label>
                              </div>

                              <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                                <RadioGroupItem value="debit_card_delivery" id="debit_card_delivery" />
                                <Label htmlFor="debit_card_delivery" className="flex-1 cursor-pointer">
                                  <div className="flex items-center gap-3">
                                    <CreditCard className="h-5 w-5 text-purple-600" />
                                    <div>
                                      <div className="font-medium">Cartão de Débito</div>
                                      <div className="text-sm text-muted-foreground">Máquina na entrega</div>
                                    </div>
                                  </div>
                                </Label>
                              </div>

                              <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                                <RadioGroupItem value="cash" id="cash" />
                                <Label htmlFor="cash" className="flex-1 cursor-pointer">
                                  <div className="flex items-center gap-3">
                                    <Banknote className="h-5 w-5 text-green-700" />
                                    <div>
                                      <div className="font-medium">Dinheiro</div>
                                      <div className="text-sm text-muted-foreground">Pagamento em espécie</div>
                                    </div>
                                  </div>
                                </Label>
                              </div>
                            </>
                          )}
                        </RadioGroup>

                        {/* Cash Change Options */}
                        {paymentMethod === 'cash' && (
                          <div className="mt-6 p-4 bg-muted/30 rounded-lg space-y-4">
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id="needsChange"
                                checked={needsChange}
                                onChange={(e) => {
                                  setNeedsChange(e.target.checked);
                                  if (!e.target.checked) setChangeAmount('');
                                }}
                                className="rounded"
                              />
                              <Label htmlFor="needsChange" className="cursor-pointer">
                                Preciso de troco
                              </Label>
                            </div>

                            {needsChange && (
                              <div>
                                <Label htmlFor="changeAmount">Troco para quanto?</Label>
                                <Input
                                  id="changeAmount"
                                  type="number"
                                  value={changeAmount}
                                  onChange={(e) => setChangeAmount(e.target.value)}
                                  placeholder="50.00"
                                  min={total + 0.01}
                                  step="0.01"
                                  className="mt-1"
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                  Total do pedido: {formatPrice(total)}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* PROCESSING */}
                {step === 'processing' && (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                      <h3 className="text-lg font-medium mb-2">Processando seu pedido...</h3>
                      <p className="text-muted-foreground">Aguarde enquanto criamos seu pedido</p>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* SIDEBAR - ORDER SUMMARY */}
              <div className="lg:col-span-1">
                <Card className="sticky top-6">
                  <CardHeader>
                    <CardTitle>Resumo do Pedido</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span>{formatPrice(subtotal)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Taxa de entrega</span>
                        <span className={deliveryFee > 0 ? '' : 'text-green-600'}>
                          {deliveryFee > 0 ? formatPrice(deliveryFee) : 'Grátis'}
                        </span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total</span>
                        <span className="text-primary">{formatPrice(total)}</span>
                      </div>
                    </div>

                    {step !== 'processing' && step !== 'payment' && (
                      <Button 
                        onClick={handleNext}
                        disabled={!isStepValid || loading}
                        className="w-full gradient-pizza text-white h-12"
                      >
                        {step === 'review' && 'Continuar'}
                        {step === 'address' && 'Escolher Pagamento'}
                      </Button>
                    )}

                    {step === 'payment' && (
                      <CheckoutButton 
                        onClick={async () => await handleCreateOrder()}
                        disabled={!isStepValid}
                        className="text-white h-12"
                      >
                        Finalizar • {formatPrice(total)}
                      </CheckoutButton>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default ExpressCheckout;