import { AdminSidebar } from '@/components/AdminSidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { useAdminOrders } from '@/hooks/useAdminOrders';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { RefreshCw, Search, Eye } from 'lucide-react';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { formatCurrency, formatDateTime } from '@/utils/formatting';

const getStatusColor = (status: string) => {
  const colors = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
    preparing: 'bg-orange-100 text-orange-800 border-orange-200',
    ready: 'bg-purple-100 text-purple-800 border-purple-200',
    delivering: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    delivered: 'bg-green-100 text-green-800 border-green-200',
    cancelled: 'bg-red-100 text-red-800 border-red-200'
  };
  return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
};

const getStatusLabel = (status: string) => {
  const labels = {
    pending: 'Pendente',
    confirmed: 'Confirmado',
    preparing: 'Preparando',
    ready: 'Pronto',
    delivering: 'Saiu para entrega',
    delivered: 'Entregue',
    cancelled: 'Cancelado'
  };
  return labels[status as keyof typeof labels] || status;
};

export default function AdminOrders() {
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  const statusFilter = activeTab === 'all' ? undefined : activeTab;
  const { 
    orders, 
    isLoading, 
    isConnected, 
    updateOrderStatus, 
    confirmOrder, 
    startPreparing, 
    markReady,
    markDelivering,
    markDelivered,
    cancelOrder,
    refreshOrders 
  } = useAdminOrders({ status: statusFilter });

  // Filtrar pedidos por termo de busca
  const filteredOrders = orders.filter(order => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      order.id.toLowerCase().includes(searchLower) ||
      order.profiles?.full_name?.toLowerCase().includes(searchLower) ||
      order.profiles?.email?.toLowerCase().includes(searchLower) ||
      order.profiles?.phone?.toLowerCase().includes(searchLower)
    );
  });

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    await updateOrderStatus(orderId, newStatus as 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivering' | 'delivered' | 'cancelled');
  };

  if (isLoading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AdminSidebar />
          <main className="flex-1 p-6">
            <div className="flex items-center justify-center h-64">
              <LoadingSpinner />
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AdminSidebar />
        <main className="flex-1 p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Gestão de Pedidos</h1>
              <p className="text-muted-foreground">
                Gerencie todos os pedidos da plataforma
                {isConnected && (
                  <span className="ml-2 inline-flex items-center gap-1 text-sm text-green-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    Tempo real ativo
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar por ID, nome, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Button onClick={() => refreshOrders()} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar
              </Button>
            </div>
          </div>

          {/* Tabs de Status */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-6 w-fit">
              <TabsTrigger value="all">Todos ({orders.length})</TabsTrigger>
              <TabsTrigger value="pending">Pendentes</TabsTrigger>
              <TabsTrigger value="confirmed">Confirmados</TabsTrigger>
              <TabsTrigger value="preparing">Preparando</TabsTrigger>
              <TabsTrigger value="ready">Prontos</TabsTrigger>
              <TabsTrigger value="delivered">Entregues</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="space-y-4">
              {filteredOrders.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <p className="text-muted-foreground">
                      {searchTerm ? 'Nenhum pedido encontrado para esta busca.' : 'Nenhum pedido encontrado.'}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {filteredOrders.map((order) => (
                    <Card key={order.id} className="overflow-hidden">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <CardTitle className="text-lg">
                              Pedido #{order.id.slice(0, 8)}
                            </CardTitle>
                            <Badge className={getStatusColor(order.status)}>
                              {getStatusLabel(order.status)}
                            </Badge>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-semibold">{formatCurrency(order.total_amount)}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatDateTime(order.created_at)}
                            </p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Informações do Cliente */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-medium mb-2">Cliente</h4>
                            <p className="text-sm">{order.profiles?.full_name}</p>
                            <p className="text-sm text-muted-foreground">{order.profiles?.email}</p>
                            {order.profiles?.phone && (
                              <p className="text-sm text-muted-foreground">{order.profiles.phone}</p>
                            )}
                          </div>
                          <div>
                            <h4 className="font-medium mb-2">Entrega</h4>
                            {order.addresses ? (
                              <div className="text-sm">
                                <p>{order.addresses.street}, {order.addresses.number}</p>
                                <p>{order.addresses.neighborhood}</p>
                                <p>{order.addresses.city}</p>
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">Endereço não informado</p>
                            )}
                          </div>
                        </div>

                        {/* Itens do Pedido */}
                        {order.order_items && order.order_items.length > 0 && (
                          <div>
                            <h4 className="font-medium mb-2">Itens ({order.order_items.length})</h4>
                            <div className="space-y-1">
                              {order.order_items.slice(0, 3).map((item, index) => (
                                <div key={index} className="flex justify-between text-sm">
                                  <span>{item.quantity}x {item.products?.name}</span>
                                  <span>{formatCurrency(item.total_price)}</span>
                                </div>
                              ))}
                              {order.order_items.length > 3 && (
                                <p className="text-sm text-muted-foreground">
                                  +{order.order_items.length - 3} itens adicionais
                                </p>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Ações */}
                        <div className="flex items-center justify-between pt-2 border-t">
                          <div className="flex items-center gap-2">
                            <Select
                              value={order.status}
                              onValueChange={(value) => handleStatusUpdate(order.id, value)}
                            >
                              <SelectTrigger className="w-40">
                                <SelectValue />
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
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {/* Ações rápidas baseadas no status */}
                            {order.status === 'pending' && (
                              <Button 
                                size="sm" 
                                onClick={() => confirmOrder(order.id)}
                              >
                                Confirmar
                              </Button>
                            )}
                            {order.status === 'confirmed' && (
                              <Button 
                                size="sm" 
                                onClick={() => startPreparing(order.id)}
                              >
                                Iniciar Preparo
                              </Button>
                            )}
                            {order.status === 'preparing' && (
                              <Button 
                                size="sm" 
                                onClick={() => markReady(order.id)}
                              >
                                Marcar Pronto
                              </Button>
                            )}
                            {order.status === 'ready' && (
                              <Button 
                                size="sm" 
                                onClick={() => markDelivering(order.id)}
                              >
                                Saiu para Entrega
                              </Button>
                            )}
                            {order.status === 'delivering' && (
                              <Button 
                                size="sm" 
                                onClick={() => markDelivered(order.id)}
                              >
                                Marcar Entregue
                              </Button>
                            )}
                            
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-2" />
                              Ver Detalhes
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </SidebarProvider>
  );
}