
import { useState } from 'react';
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Minus, Plus, X } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface CustomerData {
  name: string;
  phone: string;
  street: string;
  number: string;
  neighborhood: string;
  complement: string;
}

const Checkout = () => {
  const { items, updateQuantity, removeItem, getSubtotal, getTotal } = useCart();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [customerData, setCustomerData] = useState<CustomerData>({
    name: '',
    phone: '',
    street: '',
    number: '',
    neighborhood: '',
    complement: ''
  });
  const [loading, setLoading] = useState(false);

  const formatPrice = (price: number) => {
    return price.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  const handleInputChange = (field: keyof CustomerData, value: string) => {
    setCustomerData(prev => ({ ...prev, [field]: value }));
  };

  const isFormValid = () => {
    return customerData.name && 
           customerData.phone && 
           customerData.street && 
           customerData.number && 
           customerData.neighborhood;
  };

  const handleCreateOrder = async () => {
    if (!isFormValid()) {
      toast({
        title: "Dados incompletos",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Create address
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

      // Create order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user?.id,
          address_id: addressData.id,
          total_amount: getTotal(),
          delivery_fee: 0,
          status: 'pending',
          payment_status: 'pending',
          notes: `Cliente: ${customerData.name}, Telefone: ${customerData.phone}`
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items with proper Json casting
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

      // Navigate to payment
      navigate(`/payment/${orderData.id}`);

    } catch (error: any) {
      toast({
        title: "Erro ao criar pedido",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <main className="flex-1 p-6">
            <div className="flex items-center gap-4 mb-6">
              <SidebarTrigger className="md:hidden" />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/menu')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
            </div>

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
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 p-6 pb-32">
          <div className="flex items-center gap-4 mb-6">
            <SidebarTrigger className="md:hidden" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/cart')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
            <h1 className="text-2xl font-bold">Finalizar Pedido</h1>
          </div>

          <div className="max-w-2xl mx-auto space-y-6">
            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle>Seus Itens ({items.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg">
                    <div className="w-16 h-16 bg-gradient-to-br from-pizza-cream to-pizza-orange/20 rounded-lg flex items-center justify-center">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        <span className="text-2xl">🍕</span>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="font-medium">{item.name}</h3>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="h-8 w-8 p-0"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="h-8 w-8 p-0"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{formatPrice(item.price * item.quantity)}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(item.id)}
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Customer Data */}
            <Card>
              <CardHeader>
                <CardTitle>Dados para Entrega</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nome Completo *</Label>
                    <Input
                      id="name"
                      value={customerData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Seu nome completo"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Telefone *</Label>
                    <Input
                      id="phone"
                      value={customerData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="street">Rua *</Label>
                    <Input
                      id="street"
                      value={customerData.street}
                      onChange={(e) => handleInputChange('street', e.target.value)}
                      placeholder="Nome da rua"
                    />
                  </div>
                  <div>
                    <Label htmlFor="number">Número *</Label>
                    <Input
                      id="number"
                      value={customerData.number}
                      onChange={(e) => handleInputChange('number', e.target.value)}
                      placeholder="123"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="neighborhood">Bairro *</Label>
                    <Input
                      id="neighborhood"
                      value={customerData.neighborhood}
                      onChange={(e) => handleInputChange('neighborhood', e.target.value)}
                      placeholder="Nome do bairro"
                    />
                  </div>
                  <div>
                    <Label htmlFor="complement">Complemento</Label>
                    <Input
                      id="complement"
                      value={customerData.complement}
                      onChange={(e) => handleInputChange('complement', e.target.value)}
                      placeholder="Apto, casa, etc."
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Summary */}
            <Card>
              <CardContent className="p-4 space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatPrice(getSubtotal())}</span>
                </div>
                <div className="flex justify-between">
                  <span>Taxa de entrega</span>
                  <span className="text-green-600">Grátis</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-pizza-red">{formatPrice(getTotal())}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Fixed Bottom Button */}
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 md:left-64">
            <div className="max-w-2xl mx-auto">
              <Button 
                onClick={handleCreateOrder}
                disabled={!isFormValid() || loading}
                className="w-full gradient-pizza text-white h-12"
              >
                {loading ? "Criando pedido..." : `Continuar para Pagamento • ${formatPrice(getTotal())}`}
              </Button>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Checkout;
