import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { formatCurrency, formatDateTime } from '@/utils/formatting';
import { getOrderStatusText, getOrderStatusColor } from '@/utils/helpers';
import { 
  ShoppingCart, 
  Users, 
  Clock, 
  CheckCircle, 
  Eye,
  Package,
  AlertTriangle,
  Search,
  Plus,
  Minus
} from 'lucide-react';

interface Order {
  id: string;
  total_amount: number;
  status: string;
  payment_status: string;
  created_at: string;
  notes?: string;
  profiles?: {
    full_name: string;
    email: string;
    phone?: string;
  };
  addresses?: {
    street: string;
    number: string;
    neighborhood: string;
  };
  order_items?: Array<{
    quantity: number;
    products: {
      name: string;
    };
  }>;
}

interface Beverage {
  id: string;
  name: string;
  price: number;
  stock_quantity: number;
  min_stock_alert: number;
  is_available: boolean;
}

interface Customer {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  created_at: string;
}

export default function AttendantDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [isAttendant, setIsAttendant] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [beverages, setBeverages] = useState<Beverage[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [orderFilter, setOrderFilter] = useState('all');

  // Verificar se é atendente ou admin
  useEffect(() => {
    const checkRole = async () => {
      if (!user) return;

      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (!profile || !['admin', 'attendant'].includes(profile.role)) {
          toast({
            title: 'Acesso negado',
            description: 'Você não tem permissão para acessar esta página.',
            variant: 'destructive'
          });
          navigate('/dashboard');
          return;
        }

        setIsAttendant(true);
        await loadData();
      } catch (error) {
        console.error('Erro ao verificar permissões:', error);
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    checkRole();
  }, [user, navigate, toast]);

  const loadData = async () => {
    try {
      await Promise.all([
        loadOrders(),
        loadBeverages(),
        loadCustomers()
      ]);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar dados do painel.',
        variant: 'destructive'
      });
    }
  };

  const loadOrders = async () => {
    const { data } = await supabase
      .from('orders')
      .select(`
        *,
        profiles!orders_user_id_fkey(full_name, email, phone),
        addresses(street, number, neighborhood),
        order_items(quantity, products(name))
      `)
      .order('created_at', { ascending: false })
      .limit(50);

    setOrders(data || []);
  };

  const loadBeverages = async () => {
    const { data } = await supabase
      .from('beverages')
      .select('*')
      .order('name');

    setBeverages(data || []);
  };

  const loadCustomers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, email, phone, created_at')
      .order('created_at', { ascending: false })
      .limit(100);

    setCustomers(data || []);
  };

  const updateOrderStatus = async (orderId: string, status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivering' | 'delivered' | 'cancelled') => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: 'Status atualizado',
        description: 'Status do pedido atualizado com sucesso.'
      });

      loadOrders();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar status do pedido.',
        variant: 'destructive'
      });
    }
  };

  const updateBeverageStock = async (beverageId: string, newStock: number) => {
    try {
      const { error } = await supabase
        .from('beverages')
        .update({ 
          stock_quantity: Math.max(0, newStock),
          is_available: newStock > 0
        })
        .eq('id', beverageId);

      if (error) throw error;

      toast({
        title: 'Estoque atualizado',
        description: 'Estoque atualizado com sucesso.'
      });

      loadBeverages();
    } catch (error) {
      console.error('Erro ao atualizar estoque:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar estoque.',
        variant: 'destructive'
      });
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = orderFilter === 'all' || order.status === orderFilter;
    
    return matchesSearch && matchesFilter;
  });

  const stats = {
    pendingOrders: orders.filter(o => ['pending', 'confirmed', 'preparing'].includes(o.status)).length,
    completedToday: orders.filter(o => 
      o.status === 'delivered' && 
      new Date(o.created_at).toDateString() === new Date().toDateString()
    ).length,
    lowStockBeverages: beverages.filter(b => b.stock_quantity <= b.min_stock_alert).length
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!isAttendant) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <div className="ml-auto">
              <h1 className="text-xl font-semibold">Painel do Atendente</h1>
            </div>
          </header>
          
          <div className="flex-1 p-6 space-y-6">
            {/* Estatísticas rápidas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pedidos Pendentes</CardTitle>
                  <Clock className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">{stats.pendingOrders}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Entregues Hoje</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{stats.completedToday}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Estoque Baixo</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{stats.lowStockBeverages}</div>
                </CardContent>
              </Card>
            </div>

            {/* Tabs principais */}
            <Tabs defaultValue="orders" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="orders">Pedidos em Tempo Real</TabsTrigger>
                <TabsTrigger value="beverages">Estoque de Bebidas</TabsTrigger>
                <TabsTrigger value="customers">Clientes</TabsTrigger>
              </TabsList>

              {/* Tab Pedidos */}
              <TabsContent value="orders" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Gerenciar Pedidos</CardTitle>
                    <CardDescription>Visualize e altere o status dos pedidos em tempo real</CardDescription>
                    
                    <div className="flex items-center gap-4">
                      <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Buscar por cliente ou ID..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-8"
                        />
                      </div>
                      
                      <Select value={orderFilter} onValueChange={setOrderFilter}>
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos</SelectItem>
                          <SelectItem value="pending">Pendentes</SelectItem>
                          <SelectItem value="confirmed">Confirmados</SelectItem>
                          <SelectItem value="preparing">Preparando</SelectItem>
                          <SelectItem value="ready">Prontos</SelectItem>
                          <SelectItem value="delivering">Em entrega</SelectItem>
                          <SelectItem value="delivered">Entregues</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Contato</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Hora</TableHead>
                            <TableHead>Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredOrders.map((order) => (
                            <TableRow key={order.id}>
                              <TableCell className="font-mono text-xs">
                                {order.id.slice(0, 8)}
                              </TableCell>
                              <TableCell>
                                <div className="font-medium">{order.profiles?.full_name}</div>
                                <div className="text-sm text-muted-foreground">{order.profiles?.email}</div>
                              </TableCell>
                              <TableCell>
                                {order.profiles?.phone && (
                                  <div className="text-sm">{order.profiles.phone}</div>
                                )}
                              </TableCell>
                              <TableCell className="font-medium">
                                {formatCurrency(order.total_amount)}
                              </TableCell>
                              <TableCell>
                                <Select 
                                  value={order.status} 
                                  onValueChange={(value) => updateOrderStatus(order.id, value as 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivering' | 'delivered' | 'cancelled')}
                                >
                                  <SelectTrigger className="w-32">
                                    <Badge className={getOrderStatusColor(order.status)}>
                                      {getOrderStatusText(order.status)}
                                    </Badge>
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="pending">Pendente</SelectItem>
                                    <SelectItem value="confirmed">Confirmado</SelectItem>
                                    <SelectItem value="preparing">Preparando</SelectItem>
                                    <SelectItem value="ready">Pronto</SelectItem>
                                    <SelectItem value="delivering">Saiu para entrega</SelectItem>
                                    <SelectItem value="delivered">Entregue</SelectItem>
                                    <SelectItem value="cancelled">Cancelado</SelectItem>
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell className="text-sm">
                                {new Date(order.created_at).toLocaleTimeString('pt-BR', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </TableCell>
                              <TableCell>
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={() => setSelectedOrder(order)}
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-2xl">
                                    <DialogHeader>
                                      <DialogTitle>Detalhes do Pedido</DialogTitle>
                                    </DialogHeader>
                                    {selectedOrder && (
                                      <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                          <div>
                                            <Label>Cliente</Label>
                                            <p className="font-medium">{selectedOrder.profiles?.full_name}</p>
                                            <p className="text-sm text-muted-foreground">{selectedOrder.profiles?.email}</p>
                                          </div>
                                          <div>
                                            <Label>Total</Label>
                                            <p className="font-medium">{formatCurrency(selectedOrder.total_amount)}</p>
                                          </div>
                                        </div>
                                        
                                        <div>
                                          <Label>Endereço de Entrega</Label>
                                          <p>{selectedOrder.addresses?.street}, {selectedOrder.addresses?.number} - {selectedOrder.addresses?.neighborhood}</p>
                                        </div>

                                        <div>
                                          <Label>Itens do Pedido</Label>
                                          <div className="space-y-2 mt-2">
                                            {selectedOrder.order_items?.map((item, index) => (
                                              <div key={index} className="flex justify-between items-center p-2 bg-muted rounded">
                                                <span>{item.quantity}x {item.products?.name}</span>
                                              </div>
                                            ))}
                                          </div>
                                        </div>

                                        {selectedOrder.notes && (
                                          <div>
                                            <Label>Observações</Label>
                                            <p className="text-sm mt-1">{selectedOrder.notes}</p>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </DialogContent>
                                </Dialog>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab Bebidas */}
              <TabsContent value="beverages" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Controle de Estoque - Bebidas</CardTitle>
                    <CardDescription>Gerencie o estoque de bebidas em tempo real</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Produto</TableHead>
                            <TableHead>Preço</TableHead>
                            <TableHead>Estoque Atual</TableHead>
                            <TableHead>Estoque Mínimo</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {beverages.map((beverage) => (
                            <TableRow key={beverage.id}>
                              <TableCell className="font-medium">{beverage.name}</TableCell>
                              <TableCell>{formatCurrency(beverage.price)}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => updateBeverageStock(beverage.id, beverage.stock_quantity - 1)}
                                    disabled={beverage.stock_quantity <= 0}
                                  >
                                    <Minus className="h-4 w-4" />
                                  </Button>
                                  <span className="w-12 text-center">{beverage.stock_quantity}</span>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => updateBeverageStock(beverage.id, beverage.stock_quantity + 1)}
                                  >
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                              <TableCell>{beverage.min_stock_alert}</TableCell>
                              <TableCell>
                                {beverage.stock_quantity <= beverage.min_stock_alert ? (
                                  <Badge variant="destructive">Estoque Baixo</Badge>
                                ) : beverage.stock_quantity <= beverage.min_stock_alert * 2 ? (
                                  <Badge variant="outline" className="border-yellow-500 text-yellow-600">Atenção</Badge>
                                ) : (
                                  <Badge variant="outline" className="border-green-500 text-green-600">OK</Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateBeverageStock(beverage.id, beverage.stock_quantity + 10)}
                                >
                                  +10
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab Clientes */}
              <TabsContent value="customers" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Base de Clientes</CardTitle>
                    <CardDescription>Visualize informações dos clientes cadastrados</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Telefone</TableHead>
                            <TableHead>Cadastrado em</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {customers.map((customer) => (
                            <TableRow key={customer.id}>
                              <TableCell className="font-medium">{customer.full_name}</TableCell>
                              <TableCell>{customer.email}</TableCell>
                              <TableCell>{customer.phone || '-'}</TableCell>
                              <TableCell>{formatDateTime(customer.created_at)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}