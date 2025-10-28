// ===== CHECKOUT EXPRESS - UMA PÁGINA =====

import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUnifiedStore } from '@/stores/simpleStore';
import { useUnifiedAuth } from '@/hooks/useUnifiedAuth';
import { useAddresses } from '@/hooks/useAddresses';
import { useToast } from '@/hooks/use-toast';
import { useProfile } from '@/hooks/useUnifiedProfile';
import { CheckoutValidation } from '@/components/CheckoutValidation';
import { CheckoutProfileAlert } from '@/components/CheckoutProfileAlert';
import { supabase } from '@/integrations/supabase/client';
import { CheckoutButton } from '@/components/ProtectedButton';
import { useOrderProtection } from '@/hooks/useOrderProtection';
import { checkCheckoutRateLimit } from '@/utils/rateLimiting';
import { idempotencyManager } from '@/utils/idempotency';
import { validatePhone } from '@/utils/validation';
import { validateOnlinePaymentEligibility } from '@/utils/paymentConfig';
import { validateOrderData, validateAddress, validateCustomerInfo } from '@/utils/checkoutValidation';
import { useCoupon } from '@/hooks/useCoupon';
import { useDeliveryZones } from '@/hooks/useDeliveryZones';
import { useCartProducts } from '@/hooks/useCartProducts';
import { NeighborhoodSelector } from '@/components/NeighborhoodSelector';

import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, CreditCard, Smartphone, MapPin, Clock, Check, Banknote, Wallet, Trash2, Plus, Minus } from 'lucide-react';
import { PaymentCategory, PaymentMethod } from '@/types';

interface CustomerData {
  street: string;
  number: string;
  neighborhood: string;
  complement: string;
}

const ExpressCheckout = () => {
  const { items, getSubtotal, getTotal, clearCart, removeItem, setDeliveryFee, updateQuantity } = useUnifiedStore();
  const { user } = useUnifiedAuth();
  const { addresses } = useAddresses();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { profile, isProfileComplete } = useProfile();
  const { protectOrderCreation } = useOrderProtection();
  const { productsInfo, getProductInfo } = useCartProducts(items);
  const { appliedCoupon, applyCoupon, removeCoupon, calculateDiscount, registerCouponUse, isApplying } = useCoupon(user?.id);
  const { zones, getDeliveryFee, isNeighborhoodAvailable } = useDeliveryZones();

  const [step, setStep] = useState<'review' | 'address' | 'payment' | 'processing'>('review');
  const [deliveryMethod, setDeliveryMethod] = useState<'delivery' | 'pickup'>('delivery');
  const [paymentCategory, setPaymentCategory] = useState<PaymentCategory>('online');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [needsChange, setNeedsChange] = useState(false);
  const [changeAmount, setChangeAmount] = useState('');
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState('');
  const [isGuest, setIsGuest] = useState(!user);
  const [loading, setLoading] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    street: '',
    number: '',
    neighborhood: '',
    complement: '',
    reference_point: ''
  });

  const [customerData, setCustomerData] = useState<CustomerData>({
    street: '',
    number: '',
    neighborhood: '',
    complement: ''
  });

  // ===== MEMOIZED CALCULATIONS =====
  const subtotal = useMemo(() => getSubtotal(), [items, getSubtotal]);
  const calculatedDeliveryFee = useMemo(() => {
    // Só calcular taxa após a etapa de revisão
    if (step === 'review') return 0;
    if (deliveryMethod === 'pickup') return 0;
    if (selectedNeighborhood) {
      return getDeliveryFee(selectedNeighborhood);
    }
    return 0;
  }, [step, deliveryMethod, selectedNeighborhood, getDeliveryFee]);
  
  // Update delivery fee in store when it changes
  useEffect(() => {
    setDeliveryFee(calculatedDeliveryFee);
  }, [calculatedDeliveryFee, setDeliveryFee]);
  
  const discount = useMemo(() => calculateDiscount(subtotal), [appliedCoupon, subtotal, calculateDiscount]);
  const total = useMemo(() => subtotal + calculatedDeliveryFee - discount, [subtotal, calculatedDeliveryFee, discount]);

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
        if (deliveryMethod === 'delivery') {
          // Se tem endereço salvo selecionado com bairro, válido
          if (selectedAddressId && selectedNeighborhood) return true;
          // Se está preenchendo novo endereço
          if (showAddressForm) {
            return newAddress.street && newAddress.number && newAddress.neighborhood;
          }
          return false;
        }
        return false;
      case 'payment':
        // Validar apenas o método de pagamento
        // Perfil será validado no momento de criar o pedido
        if (paymentMethod === 'cash' && needsChange) {
          return changeAmount && parseFloat(changeAmount) > total;
        }
        return !!paymentMethod;
      default:
        return false;
    }
  }, [step, items, deliveryMethod, selectedAddressId, selectedNeighborhood, showAddressForm, newAddress, paymentMethod, needsChange, changeAmount, total]);

  const handleNext = () => {
    if (!isStepValid) {
      console.warn('[CHECKOUT] Cannot proceed - step validation failed', {
        step,
        isStepValid,
        items: items.length,
        deliveryMethod,
        selectedAddressId,
        customerData
      });
      
      toast({
        title: "Dados incompletos",
        description: "Preencha todos os campos obrigatórios para continuar",
        variant: "destructive"
      });
      return;
    }

    console.log('[CHECKOUT] Proceeding to next step from:', step);

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
    if (loading) return;
    
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
        console.log('[CHECKOUT] Redirecting to online payment flow');
        await handleOnlinePayment();
      } else {
        console.log('[CHECKOUT] Processing in-person payment');
        await handlePresencialPaymentProtected();
      }
    } catch (error: any) {
      console.error('[CHECKOUT] Error:', error);
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
    // VALIDAÇÃO 1: Verificar se o sistema de pagamento está configurado
    console.log('[CHECKOUT] Validating online payment eligibility');
    const eligibility = await validateOnlinePaymentEligibility();
    
    if (!eligibility.canProceed) {
      console.error('[CHECKOUT] Online payment not available:', eligibility.errors);
      throw new Error(eligibility.errors[0] || 'Pagamento online indisponível');
    }
    
    console.log('[CHECKOUT] ✅ Online payment eligibility validated');

    // VALIDAÇÃO 2: Obter dados do perfil do usuário com fallback seguro
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user?.id)
      .maybeSingle();

    // Se não houver perfil, criar um básico
    if (profileError || !userProfile) {
      console.warn('[CHECKOUT] Profile not found, creating basic profile');
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: user?.id,
          email: user?.email || '',
          full_name: user?.email?.split('@')[0] || 'Cliente'
        })
        .select()
        .single();
      
      if (createError) throw new Error('Erro ao criar perfil. Tente novamente.');
    }

    // VALIDAÇÃO 3: Validar informações do cliente com Zod
    const customerName = userProfile?.full_name || user?.email?.split('@')[0] || 'Cliente';
    const customerPhone = userProfile?.phone || '';

    const customerValidation = validateCustomerInfo({
      full_name: customerName,
      phone: customerPhone,
      email: user?.email
    });

    if (!customerValidation.success) {
      console.error('[CHECKOUT] Customer validation failed:', customerValidation.errors);
      throw new Error(customerValidation.errors?.[0] || 'Complete seu perfil antes de continuar. Vá para "Minha Conta".');
    }

    console.log('[CHECKOUT] ✅ Customer data validated:', {
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
      delivery_fee: calculatedDeliveryFee,
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

    // Preparar e validar endereço se necessário
    if (deliveryMethod === 'delivery') {
      if (selectedAddressId) {
        orderData.addressData = { id: selectedAddressId };
      } else {
        // Validar dados do novo endereço antes de criar
        const addressValidation = validateAddress({
          street: customerData.street,
          number: customerData.number,
          neighborhood: customerData.neighborhood,
          complement: customerData.complement,
          city: 'Sua Cidade',
          state: 'SP',
          zip_code: '00000-000'
        });

        if (!addressValidation.success) {
          console.error('[CHECKOUT] Address validation failed:', addressValidation.errors);
          throw new Error(addressValidation.errors?.[0] || 'Dados de endereço inválidos');
        }

        orderData.addressData = addressValidation.data;
        console.log('[CHECKOUT] ✅ Address validated');
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

    // VALIDAÇÃO 4: Validar dados completos do pedido
    const orderValidation = validateOrderData({
      user_id: orderData.user_id,
      delivery_method: orderData.delivery_method,
      total_amount: orderData.total_amount,
      delivery_fee: orderData.delivery_fee,
      payment_method: orderData.payment_method,
      customer_name: orderData.customer_name,
      customer_phone: orderData.customer_phone,
      notes: orderData.notes,
      items: orderData.items
    });

    if (!orderValidation.success) {
      console.error('[CHECKOUT] Order validation failed:', orderValidation.errors);
      throw new Error(orderValidation.errors?.[0] || 'Dados do pedido inválidos');
    }

    console.log('[CHECKOUT] ✅ Order data validated and prepared');
    console.log('[CHECKOUT] Order data:', {
      user_id: orderData.user_id,
      total_amount: orderData.total_amount,
      payment_method: orderData.payment_method,
      delivery_method: orderData.delivery_method,
      has_address: !!orderData.addressData,
      customer_name: orderData.customer_name,
      customer_phone: orderData.customer_phone
    });

    // Salvar no localStorage e navegar para pagamento
    localStorage.setItem('pendingOrder', JSON.stringify(orderData));
    // NÃO limpar o carrinho até o pagamento ser aprovado
    // clearCart(); // Movido para depois da confirmação do pagamento

    if (paymentMethod === 'pix') {
      console.log('[CHECKOUT] Navigating to PIX payment page');
      navigate('/payment/pix');
    } else if (paymentMethod === 'credit_card_online' || paymentMethod === 'debit_card_online') {
      console.log('[CHECKOUT] Navigating to card payment page');
      navigate('/payment/card');
    }

    toast({
      title: "Redirecionando para pagamento",
      description: "Complete o pagamento para confirmar seu pedido.",
    });
  };

  const handlePresencialPaymentProtected = async () => {
    console.log('[CHECKOUT] Processing in-person payment');
    
    try {
      // ⚠️ CRÍTICO: Pagamentos presenciais NÃO usam fila - criar direto
      await protectOrderCreation(
        {
          items: items.map(i => ({ product_id: i.productId, quantity: i.quantity })),
          total: total,
          delivery: deliveryMethod,
          paymentMethod
        },
        handlePresencialPayment,
        {
          userId: user?.id || '',
          enableIdempotency: true,
          useQueue: false // Não usar fila para pagamentos presenciais!
        }
      );
    } catch (error) {
      console.error('[CHECKOUT] Error creating order:', error);
      toast({
        title: "Erro ao criar pedido",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive"
      });
      setLoading(false);
    }
  };

  const handlePresencialPayment = async () => {
    // Obter dados do perfil do usuário com fallback seguro
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user?.id)
      .maybeSingle();

    // Se não houver perfil, criar um básico
    if (profileError || !userProfile) {
      console.warn('[CHECKOUT] Profile not found, creating basic profile');
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: user?.id,
          email: user?.email || '',
          full_name: user?.email?.split('@')[0] || 'Cliente'
        })
        .select()
        .single();
      
      if (createError) throw new Error('Erro ao criar perfil. Tente novamente.');
    }

    const customerName = userProfile?.full_name || user?.email?.split('@')[0] || 'Cliente';
    const customerPhone = userProfile?.phone || '';

    // Validar informações do cliente
    const customerValidation = validateCustomerInfo({
      full_name: customerName,
      phone: customerPhone,
      email: user?.email
    });

    if (!customerValidation.success) {
      console.error('[CHECKOUT] Customer validation failed:', customerValidation.errors);
      throw new Error(customerValidation.errors?.[0] || 'Complete seu perfil antes de continuar. Vá para "Minha Conta".');
    }

    // Validação crítica: telefone obrigatório para entrega
    if (deliveryMethod === 'delivery' && !customerPhone) {
      throw new Error('Para entregas, é necessário cadastrar um telefone. Vá para "Minha Conta" e complete seu perfil.');
    }

    let addressId = selectedAddressId;

    // Validar e criar endereço se necessário
    if (deliveryMethod === 'delivery' && !selectedAddressId && showAddressForm) {
      // Validar dados do endereço antes de inserir
      const addressValidation = validateAddress({
        street: newAddress.street,
        number: newAddress.number,
        neighborhood: newAddress.neighborhood,
        complement: newAddress.complement,
        reference_point: newAddress.reference_point,
        city: 'Sua Cidade',
        state: 'SP',
        zip_code: '00000-000'
      });

      if (!addressValidation.success) {
        console.error('[CHECKOUT] Address validation failed:', addressValidation.errors);
        throw new Error(addressValidation.errors?.[0] || 'Dados de endereço inválidos');
      }

      const { data: addressData, error: addressError } = await supabase
        .from('addresses')
        .insert({
          user_id: user?.id,
          ...addressValidation.data
        })
        .select()
        .single();

      if (addressError) throw addressError;
      addressId = addressData.id;
      console.log('[CHECKOUT] ✅ Address validated and created');
    }

    // Preparar snapshot do endereço
    let deliveryAddressSnapshot = null;
    if (deliveryMethod === 'delivery') {
      if (addressId) {
        const { data: addr } = await supabase
          .from('addresses')
          .select('*')
          .eq('id', addressId)
          .single();
        
        if (addr) {
          deliveryAddressSnapshot = {
            street: addr.street,
            number: addr.number,
            neighborhood: addr.neighborhood,
            city: addr.city,
            state: addr.state,
            zip_code: addr.zip_code,
            complement: addr.complement,
            reference_point: addr.reference_point
          };
        }
      } else {
        deliveryAddressSnapshot = {
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

    // Create order
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: user?.id,
        address_id: deliveryMethod === 'delivery' ? addressId : null,
        delivery_address_snapshot: deliveryAddressSnapshot,
        total_amount: total,
        delivery_fee: calculatedDeliveryFee,
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

    // Register coupon use if applicable
    if (appliedCoupon) {
      await registerCouponUse(orderData.id);
      
      // Update order with coupon info (types will be updated after migration)
      await supabase
        .from('orders')
        .update({
          coupon_id: appliedCoupon.id,
          coupon_code: appliedCoupon.code,
          discount_amount: discount
        } as any)
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
                      {items.map((item) => {
                        const productInfo = getProductInfo(item.productId);
                        const categoryLabel = productInfo 
                          ? `${productInfo.category_name}${productInfo.subcategory_name ? ' - ' + productInfo.subcategory_name : ''}`
                          : '';
                        
                        return (
                          <div key={item.id} className="flex items-start gap-4 p-4 border rounded-lg">
                            <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg flex items-center justify-center shrink-0">
                              {item.image ? (
                                <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-lg" />
                              ) : (
                                <span className="text-2xl">🍕</span>
                              )}
                            </div>
                            
                            <div className="flex-1 space-y-2">
                              {/* Category - Subcategory */}
                              {categoryLabel && (
                                <p className="text-xs text-muted-foreground uppercase font-medium">
                                  {categoryLabel}
                                </p>
                              )}
                              
                              {/* Product Name */}
                              <h3 className="font-medium">{item.name}</h3>
                              
                              {/* Customizations */}
                              {item.customizations && (
                                <div className="space-y-1 text-sm text-muted-foreground">
                                  {item.customizations.crust && (
                                    <p className="flex items-center gap-1">
                                      <span className="font-medium">Borda:</span> {item.customizations.crust}
                                    </p>
                                  )}
                                  {item.customizations.extras && item.customizations.extras.length > 0 && (
                                    <p className="flex items-center gap-1">
                                      <span className="font-medium">Extras:</span> {item.customizations.extras.join(', ')}
                                    </p>
                                  )}
                                  {item.customizations.halfAndHalf && (
                                    <p className="flex items-center gap-1">
                                      <span className="font-medium">Meio a meio:</span> 
                                      {item.customizations.halfAndHalf.firstHalf} / {item.customizations.halfAndHalf.secondHalf}
                                    </p>
                                  )}
                                </div>
                              )}
                              
                              {/* Notes */}
                              {item.notes && (
                                <p className="text-sm text-muted-foreground italic">
                                  Obs: {item.notes}
                                </p>
                              )}
                              
                              {/* Price and Quantity Controls */}
                              <div className="flex items-center justify-between mt-2 pt-2 border-t">
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => {
                                      const newQuantity = Math.max(1, item.quantity - 1);
                                      updateQuantity(item.id, newQuantity);
                                    }}
                                  >
                                    -
                                  </Button>
                                  <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => {
                                      const newQuantity = item.quantity + 1;
                                      updateQuantity(item.id, newQuantity);
                                    }}
                                  >
                                    +
                                  </Button>
                                </div>
                                <span className="font-medium">{formatPrice(item.price * item.quantity)}</span>
                              </div>
                            </div>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeItem(item.id)}
                              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        );
                      })}
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
                        <RadioGroup value={deliveryMethod} onValueChange={(value: 'delivery' | 'pickup') => {
                          setDeliveryMethod(value);
                          if (value === 'pickup') {
                            setSelectedNeighborhood('');
                            setSelectedAddressId('');
                            setShowAddressForm(false);
                          }
                        }}>
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

                    {/* Address Selection for Delivery */}
                    {deliveryMethod === 'delivery' && (
                      <>
                        {/* Saved Addresses */}
                        {addresses.length > 0 && !showAddressForm && (
                          <Card>
                            <CardHeader>
                              <CardTitle>Endereços Salvos</CardTitle>
                              <p className="text-sm text-muted-foreground">
                                Selecione um endereço ou adicione um novo
                              </p>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              {addresses.map((addr) => (
                                <div
                                  key={addr.id}
                                  onClick={() => {
                                    setSelectedAddressId(addr.id);
                                    if (addr.neighborhood) {
                                      setSelectedNeighborhood(addr.neighborhood);
                                    }
                                  }}
                                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                                    selectedAddressId === addr.id
                                      ? 'border-primary bg-primary/5'
                                      : 'hover:border-primary/50'
                                  }`}
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <p className="font-medium">
                                        {addr.street}, {addr.number}
                                      </p>
                                      <p className="text-sm text-muted-foreground">
                                        {addr.neighborhood} - {addr.city}/{addr.state}
                                      </p>
                                      {addr.complement && (
                                        <p className="text-sm text-muted-foreground">
                                          {addr.complement}
                                        </p>
                                      )}
                                      {addr.reference_point && (
                                        <p className="text-sm text-muted-foreground">
                                          Ref: {addr.reference_point}
                                        </p>
                                      )}
                                      {!addr.neighborhood && (
                                        <p className="text-sm text-amber-600 mt-2">
                                          ⚠️ Bairro não definido - Clique para atualizar
                                        </p>
                                      )}
                                    </div>
                                    {selectedAddressId === addr.id && (
                                      <Check className="h-5 w-5 text-primary shrink-0 ml-2" />
                                    )}
                                  </div>
                                </div>
                              ))}
                              
                              <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => {
                                  setShowAddressForm(true);
                                  setSelectedAddressId('');
                                  setSelectedNeighborhood('');
                                }}
                              >
                                + Adicionar Novo Endereço
                              </Button>
                            </CardContent>
                          </Card>
                        )}

                        {/* New Address Form */}
                        {(addresses.length === 0 || showAddressForm) && (
                          <Card>
                            <CardHeader>
                              <CardTitle>Novo Endereço</CardTitle>
                              <p className="text-sm text-muted-foreground">
                                Preencha os dados do endereço de entrega
                              </p>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                  <Label htmlFor="street">Rua *</Label>
                                  <Input
                                    id="street"
                                    value={newAddress.street}
                                    onChange={(e) => setNewAddress(prev => ({ ...prev, street: e.target.value }))}
                                    placeholder="Nome da rua"
                                  />
                                </div>
                                
                                <div>
                                  <Label htmlFor="number">Número *</Label>
                                  <Input
                                    id="number"
                                    value={newAddress.number}
                                    onChange={(e) => setNewAddress(prev => ({ ...prev, number: e.target.value }))}
                                    placeholder="123"
                                  />
                                </div>
                                
                                <div>
                                  <Label htmlFor="neighborhood">Bairro *</Label>
                                  <NeighborhoodSelector
                                    selectedNeighborhood={newAddress.neighborhood}
                                    onSelect={(neighborhood) => {
                                      setNewAddress(prev => ({ ...prev, neighborhood }));
                                      setSelectedNeighborhood(neighborhood);
                                    }}
                                  />
                                </div>
                                
                                <div className="md:col-span-2">
                                  <Label htmlFor="complement">Complemento</Label>
                                  <Input
                                    id="complement"
                                    value={newAddress.complement}
                                    onChange={(e) => setNewAddress(prev => ({ ...prev, complement: e.target.value }))}
                                    placeholder="Apto, bloco, etc."
                                  />
                                </div>
                                
                                <div className="md:col-span-2">
                                  <Label htmlFor="reference">Ponto de Referência</Label>
                                  <Input
                                    id="reference"
                                    value={newAddress.reference_point}
                                    onChange={(e) => setNewAddress(prev => ({ ...prev, reference_point: e.target.value }))}
                                    placeholder="Próximo ao mercado..."
                                  />
                                </div>
                              </div>

                              {addresses.length > 0 && (
                                <Button
                                  variant="ghost"
                                  className="w-full"
                                  onClick={() => {
                                    setShowAddressForm(false);
                                    setNewAddress({
                                      street: '',
                                      number: '',
                                      neighborhood: '',
                                      complement: '',
                                      reference_point: ''
                                    });
                                  }}
                                >
                                  ← Voltar para endereços salvos
                                </Button>
                              )}
                            </CardContent>
                          </Card>
                        )}

                        {/* Selected Neighborhood Summary */}
                        {selectedNeighborhood && (
                          <div className="p-4 bg-muted rounded-lg">
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="font-medium">{selectedNeighborhood}</p>
                                <p className="text-sm text-muted-foreground">
                                  Entrega em ~{zones.find(z => z.neighborhood === selectedNeighborhood)?.estimated_time || 45} minutos
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-muted-foreground">Taxa de entrega</p>
                                <p className="font-medium text-primary">
                                  {formatPrice(getDeliveryFee(selectedNeighborhood))}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* STEP: PAYMENT */}
                {step === 'payment' && (
                  <div className="space-y-6">
                    {/* Alerta de perfil incompleto */}
                    {(!profile?.full_name || (deliveryMethod === 'delivery' && !profile?.phone)) && (
                      <CheckoutProfileAlert deliveryMethod={deliveryMethod} />
                    )}
                    
                    {/* Cupom de Desconto */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Cupom de Desconto</CardTitle>
                        <p className="text-sm text-muted-foreground">Possui um cupom? Digite abaixo</p>
                      </CardHeader>
                      <CardContent>
                        {appliedCoupon ? (
                          <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                            <div>
                              <p className="font-medium text-green-700 dark:text-green-300">
                                Cupom aplicado: {appliedCoupon.code}
                              </p>
                              <p className="text-sm text-green-600 dark:text-green-400">
                                Desconto de {formatPrice(discount)}
                              </p>
                            </div>
                            <Button variant="ghost" size="sm" onClick={removeCoupon}>
                              Remover
                            </Button>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <Input
                              placeholder="Digite o código do cupom"
                              value={couponCode}
                              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                              className="flex-1"
                            />
                            <Button
                              onClick={() => applyCoupon(couponCode, subtotal)}
                              disabled={isApplying || !couponCode}
                            >
                              {isApplying ? 'Aplicando...' : 'Aplicar'}
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                    
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
                      {step !== 'review' && (
                        <div className="flex justify-between">
                          <span>Taxa de entrega</span>
                          <span className={calculatedDeliveryFee > 0 ? '' : 'text-green-600'}>
                            {calculatedDeliveryFee > 0 ? formatPrice(calculatedDeliveryFee) : 'Grátis'}
                          </span>
                        </div>
                      )}
                      {discount > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Desconto</span>
                          <span>-{formatPrice(discount)}</span>
                        </div>
                      )}
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