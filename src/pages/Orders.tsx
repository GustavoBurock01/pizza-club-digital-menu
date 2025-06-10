
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Clock, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

const Orders = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          addresses (*),
          order_items (
            *,
            products (name, image_url)
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar pedidos:', error);
      toast({
        title: "Erro ao carregar pedidos",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status: string) => {
    const statusConfig = {
      pending: { label: 'Pendente', color: 'bg-yellow-500' },
      confirmed: { label: 'Confirmado', color: 'bg-blue-500' },
      preparing: { label: 'Preparando', color: 'bg-orange-500' },
      out_for_delivery: { label: 'Em Entrega', color: 'bg-purple-500' },
      delivered: { label: 'Entregue', color: 'bg-green-500' },
      cancelled: { label: 'Cancelado', color: 'bg-red-500' }
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
    return `${address.neighborhood}, ${address.city}`;
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.addresses?.neighborhood?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pizza-red mx-auto mb-4"></div>
          <p>Carregando pedidos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Meus Pedidos</h1>
          <p className="text-muted-foreground">
            Acompanhe o status e histórico dos seus pedidos
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar por número do pedido ou bairro..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="confirmed">Confirmado</SelectItem>
                  <SelectItem value="preparing">Preparando</SelectItem>
                  <SelectItem value="out_for_delivery">Em Entrega</SelectItem>
                  <SelectItem value="delivered">Entregue</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {orders.length === 0 ? 'Nenhum pedido encontrado' : 'Nenhum pedido encontrado com esses filtros'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {orders.length === 0 
                  ? 'Que tal fazer seu primeiro pedido?' 
                  : 'Tente ajustar os filtros de busca'
                }
              </p>
              {orders.length === 0 && (
                <Button onClick={() => navigate('/menu')} className="gradient-pizza">
                  Ver Menu
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const statusInfo = getStatusInfo(order.status);
              
              return (
                <Card key={order.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <h3 className="font-medium">
                            Pedido #{order.id.slice(-8)}
                          </h3>
                          <Badge className={`${statusInfo.color} text-white`}>
                            {statusInfo.label}
                          </Badge>
                        </div>
                        
                        <div className="text-sm text-muted-foreground">
                          <div>📅 {new Date(order.created_at).toLocaleString('pt-BR')}</div>
                          <div>📍 {formatAddress(order.addresses)}</div>
                          <div>🍕 {order.order_items?.length || 0} {order.order_items?.length === 1 ? 'item' : 'itens'}</div>
                        </div>
                        
                        {/* Preview of items */}
                        <div className="text-sm">
                          <span className="font-medium">Itens: </span>
                          {order.order_items?.slice(0, 2).map((item: any, index: number) => (
                            <span key={item.id}>
                              {item.products?.name}
                              {item.quantity > 1 && ` (${item.quantity}x)`}
                              {index < Math.min(order.order_items.length - 1, 1) && ', '}
                            </span>
                          ))}
                          {order.order_items?.length > 2 && (
                            <span className="text-muted-foreground">
                              {' '}e mais {order.order_items.length - 2} {order.order_items.length - 2 === 1 ? 'item' : 'itens'}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                        <div className="text-right">
                          <div className="text-2xl font-bold text-pizza-red">
                            {formatPrice(order.total_amount)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {order.payment_method === 'credit_card' ? 'Cartão de Crédito' : 
                             order.payment_method === 'debit_card' ? 'Cartão de Débito' : 
                             order.payment_method === 'pix' ? 'PIX' : 'Dinheiro'}
                          </div>
                        </div>
                        
                        <Button
                          onClick={() => navigate(`/order-status/${order.id}`)}
                          variant="outline"
                          className="flex items-center gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          Ver Detalhes
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
