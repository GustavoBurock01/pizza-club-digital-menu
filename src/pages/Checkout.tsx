
import { useState } from 'react';
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AddressSelector } from '@/components/AddressSelector';
import { useAddresses } from '@/hooks/useAddresses';

interface CustomerData {
  street: string;
  number: string;
  neighborhood: string;
  complement: string;
}

const Checkout = () => {
  const { items, getSubtotal, getTotal } = useCart();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { addresses } = useAddresses();
  
  const [customerData, setCustomerData] = useState<CustomerData>({
    street: '',
    number: '',
    neighborhood: '',
    complement: ''
  });
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
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
    if (selectedAddressId) {
      return true;
    }
    
    return customerData.street && 
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
      let addressId = selectedAddressId;

      // Create new address if not using existing one
      if (!selectedAddressId) {
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
          address_id: addressId,
          total_amount: getTotal(),
          delivery_fee: 0,
          status: 'pending',
          payment_status: 'pending'
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
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <SidebarInset>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
              <SidebarTrigger className="-ml-1" />
              <div className="ml-auto">
                <h1 className="text-xl font-semibold">Checkout</h1>
              </div>
            </header>
            <div className="flex-1 p-6">
              <div className="flex items-center gap-4 mb-6">
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
            <div className="ml-auto">
              <h1 className="text-xl font-semibold">Checkout</h1>
            </div>
          </header>
          <div className="flex-1 p-6 pb-32">
            <div className="flex items-center gap-4 mb-6">
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
                        <span className="text-muted-foreground">Quantidade: {item.quantity}</span>
                        <span className="font-medium">{formatPrice(item.price * item.quantity)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Address Selector */}
            <AddressSelector 
              customerData={customerData}
              onCustomerDataChange={handleInputChange}
              selectedAddressId={selectedAddressId}
              onAddressSelect={setSelectedAddressId}
            />

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
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Checkout;
