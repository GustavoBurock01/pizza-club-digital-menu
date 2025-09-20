
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Clock, CheckCircle, Truck, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedAuth } from '@/hooks/useUnifiedAuth';
import { useToast } from '@/hooks/use-toast';

const OrderStatus = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [order, setOrder] = useState<any>(null);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderId && user) {
      fetchOrder();
      setupRealtimeSubscription();
    }
  }, [orderId, user]);

  const fetchOrder = async () => {
    try {
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          addresses (*)
        `)
        .eq('id', orderId)
        .eq('user_id', user?.id)
        .single();

      if (orderError) throw orderError;

      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select(`
          *,
          products (name, image_url)
        `)
        .eq('order_id', orderId);

      if (itemsError) throw itemsError;

      setOrder(orderData);
      setOrderItems(itemsData || []);
    } catch (error: any) {
      console.error('Erro ao carregar pedido:', error);
      toast({
        title: "Erro ao carregar pedido",
        description: error.message,
        variant: "destructive",
      });
      navigate('/orders');
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('order-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          console.log('Order update received:', payload);
          setOrder(payload.new);
          
          // Show toast notification for status change
          const statusMessages = {
            pending: 'Pedido recebido',
            confirmed: 'Pedido confirmado!',
            preparing: 'Preparando seu pedido...',
            out_for_delivery: 'Saiu para entrega!',
            delivered: 'Pedido entregue!'
          };
          
          const message = statusMessages[payload.new.status as keyof typeof statusMessages];
          if (message) {
            toast({
              title: "Status atualizado",
              description: message,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const getStatusInfo = (status: string) => {
    const statusConfig = {
      pending: {
        label: 'Pedido Recebido',
        color: 'bg-yellow-500',
        icon: Clock,
        description: 'Aguardando confirmação'
      },
      confirmed: {
        label: 'Confirmado',
        color: 'bg-blue-500',
        icon: CheckCircle,
        description: 'Pedido confirmado pela pizzaria'
      },
      preparing: {
        label: 'Preparando',
        color: 'bg-orange-500',
        icon: Clock,
        description: 'Sua pizza está sendo preparada'
      },
      out_for_delivery: {
        label: 'Saiu para Entrega',
        color: 'bg-purple-500',
        icon: Truck,
        description: 'Em rota de entrega'
      },
      delivered: {
        label: 'Entregue',
        color: 'bg-green-500',
        icon: CheckCircle,
        description: 'Pedido entregue com sucesso'
      }
    };

    return statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  const formatAddress = (address: any) => {
    if (!address) return '';
    return `${address.street}, ${address.number} - ${address.neighborhood}, ${address.city}/${address.state}`;
  };

  const getStatusSteps = () => {
    const steps = [
      { key: 'pending', label: 'Recebido' },
      { key: 'confirmed', label: 'Confirmado' },
      { key: 'preparing', label: 'Preparando' },
      { key: 'out_for_delivery', label: 'Em Entrega' },
      { key: 'delivered', label: 'Entregue' }
    ];

    const currentIndex = steps.findIndex(step => step.key === order?.status);
    
    return steps.map((step, index) => ({
      ...step,
      completed: index <= currentIndex,
      current: index === currentIndex
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pizza-red mx-auto mb-4"></div>
          <p>Carregando pedido...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Pedido não encontrado</p>
          <Button onClick={() => navigate('/orders')}>
            Ver Meus Pedidos
          </Button>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(order.status);
  const StatusIcon = statusInfo.icon;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <div className="ml-auto">
              <h1 className="text-xl font-semibold">Status do Pedido</h1>
            </div>
          </header>
          <div className="flex-1 bg-gray-50 p-6">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center gap-4 mb-6">
                <Button
                  variant="ghost"
                  onClick={() => navigate('/orders')}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Voltar aos Pedidos
                </Button>
                <h1 className="text-2xl font-bold">Acompanhar Pedido</h1>
              </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Order Status */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${statusInfo.color} text-white`}>
                    <StatusIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xl">{statusInfo.label}</div>
                    <div className="text-sm text-muted-foreground font-normal">
                      {statusInfo.description}
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Progress Steps */}
                <div className="space-y-4">
                  {getStatusSteps().map((step, index) => (
                    <div key={step.key} className="flex items-center gap-3">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          step.completed
                            ? 'bg-pizza-red'
                            : 'bg-gray-300'
                        }`}
                      />
                      <span
                        className={`${
                          step.current
                            ? 'font-medium text-pizza-red'
                            : step.completed
                            ? 'text-gray-900'
                            : 'text-gray-500'
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                  ))}
                </div>

                {order.estimated_delivery_time && order.status !== 'delivered' && (
                  <div className="mt-6 p-4 bg-pizza-cream rounded-lg">
                    <div className="flex items-center gap-2 text-pizza-dark">
                      <Clock className="h-4 w-4" />
                      <span className="font-medium">
                        Tempo estimado: {order.estimated_delivery_time} minutos
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Delivery Address */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Endereço de Entrega
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">{formatAddress(order.addresses)}</p>
                {order.addresses?.complement && (
                  <p className="text-muted-foreground">{order.addresses.complement}</p>
                )}
                {order.addresses?.reference_point && (
                  <p className="text-muted-foreground">Ref: {order.addresses.reference_point}</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Order Details */}
          <div>
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>Detalhes do Pedido</CardTitle>
                <div className="text-sm text-muted-foreground">
                  Pedido #{order.id.slice(-8)}
                </div>
                <div className="text-sm text-muted-foreground">
                  {new Date(order.created_at).toLocaleString('pt-BR')}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Order Items */}
                <div className="space-y-3">
                  {orderItems.map((item) => (
                    <div key={item.id} className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{item.products?.name}</h4>
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
                        {formatPrice(item.total_price)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatPrice(order.total_amount - order.delivery_fee)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Taxa de entrega:</span>
                    <span>{formatPrice(order.delivery_fee)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total:</span>
                    <span>{formatPrice(order.total_amount)}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-sm">
                    <strong>Pagamento:</strong> {order.payment_method === 'credit_card' ? 'Cartão de Crédito' : 
                                                  order.payment_method === 'debit_card' ? 'Cartão de Débito' : 
                                                  order.payment_method === 'pix' ? 'PIX' : 'Dinheiro'}
                  </div>
                  {order.notes && (
                    <div className="text-sm">
                      <strong>Observações:</strong> {order.notes}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
        </div>
            </div>
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default OrderStatus;
