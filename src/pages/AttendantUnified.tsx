// ===== PAINEL UNIFICADO DE ATENDENTE =====

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Clock, Package, Users, AlertCircle, Bell, Settings, RefreshCw, 
  Volume2, VolumeX, CheckCircle, ChefHat, Truck, Phone, MapPin,
  Filter, Eye, Printer
} from "lucide-react";
import { AttendantSidebar } from "@/components/AttendantSidebar";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useAttendant } from "@/providers/AttendantProvider";
import { toast } from "sonner";

interface FilterState {
  status: string;
  priority: string;
  paymentMethod: string;
}

export default function AttendantUnified() {
  const { 
    stats, 
    orders, 
    loading, 
    isUpdating, 
    refreshData,
    confirmOrder,
    startPreparation,
    markReady,
    markDelivered,
    cancelOrder 
  } = useAttendant();

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [filters, setFilters] = useState<FilterState>({
    status: 'all',
    priority: 'all',
    paymentMethod: 'all'
  });

  const toggleSound = () => {
    setSoundEnabled(!soundEnabled);
    toast.info(soundEnabled ? "Sons desabilitados" : "Sons habilitados");
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: "bg-amber-100 text-amber-800 border-amber-200",
      confirmed: "bg-blue-100 text-blue-800 border-blue-200",
      preparing: "bg-purple-100 text-purple-800 border-purple-200",
      ready: "bg-green-100 text-green-800 border-green-200",
      delivering: "bg-orange-100 text-orange-800 border-orange-200",
      delivered: "bg-gray-100 text-gray-800 border-gray-200",
      cancelled: "bg-red-100 text-red-800 border-red-200"
    };
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      pending: "Pendente",
      confirmed: "Confirmado", 
      preparing: "Preparando",
      ready: "Pronto",
      delivering: "Entregando",
      delivered: "Entregue",
      cancelled: "Cancelado"
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getQuickActions = (order: any) => {
    switch (order.status) {
      case 'pending':
        return (
          <div className="flex gap-2">
            <Button size="sm" onClick={() => confirmOrder(order.id)} disabled={isUpdating}>
              <CheckCircle className="h-3 w-3 mr-1" />
              Confirmar
            </Button>
            <Button size="sm" variant="destructive" onClick={() => cancelOrder(order.id)} disabled={isUpdating}>
              Cancelar
            </Button>
          </div>
        );
      case 'confirmed':
        return (
          <Button size="sm" onClick={() => startPreparation(order.id)} disabled={isUpdating}>
            <ChefHat className="h-3 w-3 mr-1" />
            Iniciar Preparo
          </Button>
        );
      case 'preparing':
        return (
          <Button size="sm" onClick={() => markReady(order.id)} disabled={isUpdating}>
            <Package className="h-3 w-3 mr-1" />
            Marcar Pronto
          </Button>
        );
      case 'ready':
        return (
          <Button size="sm" onClick={() => markDelivered(order.id)} disabled={isUpdating}>
            <Truck className="h-3 w-3 mr-1" />
            Marcar Entregue
          </Button>
        );
      default:
        return null;
    }
  };

  const filteredOrders = orders?.filter(order => {
    if (filters.status !== 'all' && order.status !== filters.status) return false;
    if (filters.paymentMethod !== 'all' && order.payment_method !== filters.paymentMethod) return false;
    return true;
  }) || [];

  // Separar pedidos por categoria
  const pendingOrders = filteredOrders.filter(o => o.status === 'pending');
  const kitchenOrders = filteredOrders.filter(o => ['confirmed', 'preparing'].includes(o.status));
  const readyOrders = filteredOrders.filter(o => o.status === 'ready');
  const deliveryOrders = filteredOrders.filter(o => o.status === 'delivering');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-elegant">
        <AttendantSidebar />
        
        <main className="flex-1 p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gradient">Gestão de Pedidos</h1>
              <p className="text-muted-foreground">Sistema unificado de atendimento</p>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleSound}
                className="gap-2"
              >
                {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                Som
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={refreshData}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Atualizar
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="hover-lift glass">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
                <AlertCircle className="h-4 w-4 text-amber-500 animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-600">
                  {stats?.pendingOrders || 0}
                </div>
              </CardContent>
            </Card>

            <Card className="hover-lift glass">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Preparando</CardTitle>
                <ChefHat className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {stats?.preparingOrders || 0}
                </div>
              </CardContent>
            </Card>

            <Card className="hover-lift glass">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
                <Clock className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {stats?.avgDeliveryTime || 0}min
                </div>
              </CardContent>
            </Card>

            <Card className="hover-lift glass">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Clientes Hoje</CardTitle>
                <Users className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {stats?.todayCustomers || 0}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs Interface */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="kitchen">Cozinha</TabsTrigger>
              <TabsTrigger value="delivery">Entrega</TabsTrigger>
              <TabsTrigger value="all">Todos</TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="space-y-4">
              <div className="grid gap-6 md:grid-cols-2">
                <Card className="glass">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-amber-500" />
                      Pedidos Pendentes ({pendingOrders.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {pendingOrders.map((order) => (
                      <div key={order.id} className="p-3 border rounded-lg space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">#{order.id.slice(-8)}</p>
                            <p className="text-sm text-muted-foreground">{order.customer_name}</p>
                            <p className="text-sm">R$ {order.total_amount.toFixed(2)}</p>
                          </div>
                          <Badge className={getStatusColor(order.status)}>
                            {getStatusLabel(order.status)}
                          </Badge>
                        </div>
                        {getQuickActions(order)}
                      </div>
                    ))}
                    {pendingOrders.length === 0 && (
                      <p className="text-center text-muted-foreground py-8">
                        Nenhum pedido pendente
                      </p>
                    )}
                  </CardContent>
                </Card>

                <Card className="glass">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ChefHat className="h-5 w-5 text-blue-500" />
                      Cozinha ({kitchenOrders.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {kitchenOrders.map((order) => (
                      <div key={order.id} className="p-3 border rounded-lg space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">#{order.id.slice(-8)}</p>
                            <p className="text-sm text-muted-foreground">{order.customer_name}</p>
                            <p className="text-sm">{order.items_count} itens</p>
                          </div>
                          <Badge className={getStatusColor(order.status)}>
                            {getStatusLabel(order.status)}
                          </Badge>
                        </div>
                        {getQuickActions(order)}
                      </div>
                    ))}
                    {kitchenOrders.length === 0 && (
                      <p className="text-center text-muted-foreground py-8">
                        Nenhum pedido na cozinha
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="kitchen" className="space-y-4">
              <Card className="glass">
                <CardHeader>
                  <CardTitle>Fila da Cozinha</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {kitchenOrders.map((order) => (
                      <Card key={order.id} className="p-4">
                        <div className="space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">#{order.id.slice(-8)}</p>
                              <p className="text-sm text-muted-foreground">{order.customer_name}</p>
                            </div>
                            <Badge className={getStatusColor(order.status)}>
                              {getStatusLabel(order.status)}
                            </Badge>
                          </div>
                          <div className="text-sm space-y-1">
                            <p><strong>Itens:</strong> {order.items_count}</p>
                            <p><strong>Total:</strong> R$ {order.total_amount.toFixed(2)}</p>
                            {order.notes && <p><strong>Obs:</strong> {order.notes}</p>}
                          </div>
                          {getQuickActions(order)}
                        </div>
                      </Card>
                    ))}
                  </div>
                  {kitchenOrders.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhum pedido na cozinha
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="delivery" className="space-y-4">
              <div className="grid gap-6 md:grid-cols-2">
                <Card className="glass">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5 text-green-500" />
                      Prontos para Entrega ({readyOrders.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {readyOrders.map((order) => (
                      <div key={order.id} className="p-3 border rounded-lg space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">#{order.id.slice(-8)}</p>
                            <p className="text-sm text-muted-foreground">{order.customer_name}</p>
                            <p className="text-sm">{order.customer_phone}</p>
                            {order.neighborhood && (
                              <p className="text-xs text-muted-foreground">{order.neighborhood}</p>
                            )}
                          </div>
                          <Badge className={getStatusColor(order.status)}>
                            {getStatusLabel(order.status)}
                          </Badge>
                        </div>
                        <div className="flex gap-2">
                          {getQuickActions(order)}
                          <Button size="sm" variant="outline">
                            <MapPin className="h-3 w-3 mr-1" />
                            Endereço
                          </Button>
                        </div>
                      </div>
                    ))}
                    {readyOrders.length === 0 && (
                      <p className="text-center text-muted-foreground py-8">
                        Nenhum pedido pronto
                      </p>
                    )}
                  </CardContent>
                </Card>

                <Card className="glass">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Truck className="h-5 w-5 text-orange-500" />
                      Em Entrega ({deliveryOrders.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {deliveryOrders.map((order) => (
                      <div key={order.id} className="p-3 border rounded-lg space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">#{order.id.slice(-8)}</p>
                            <p className="text-sm text-muted-foreground">{order.customer_name}</p>
                            <p className="text-sm">{order.customer_phone}</p>
                            {order.neighborhood && (
                              <p className="text-xs text-muted-foreground">{order.neighborhood}</p>
                            )}
                          </div>
                          <Badge className={getStatusColor(order.status)}>
                            {getStatusLabel(order.status)}
                          </Badge>
                        </div>
                        <div className="flex gap-2">
                          {getQuickActions(order)}
                          <Button size="sm" variant="outline">
                            <Phone className="h-3 w-3 mr-1" />
                            Ligar
                          </Button>
                        </div>
                      </div>
                    ))}
                    {deliveryOrders.length === 0 && (
                      <p className="text-center text-muted-foreground py-8">
                        Nenhum pedido em entrega
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="all" className="space-y-4">
              <Card className="glass">
                <CardHeader>
                  <CardTitle>Todos os Pedidos Ativos</CardTitle>
                  <div className="flex gap-2">
                    <select 
                      value={filters.status} 
                      onChange={(e) => setFilters({...filters, status: e.target.value})}
                      className="px-3 py-1 border rounded text-sm"
                    >
                      <option value="all">Todos os Status</option>
                      <option value="pending">Pendente</option>
                      <option value="confirmed">Confirmado</option>
                      <option value="preparing">Preparando</option>
                      <option value="ready">Pronto</option>
                      <option value="delivering">Entregando</option>
                    </select>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {filteredOrders.map((order) => (
                      <div key={order.id} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start mb-3">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1">
                            <div>
                              <p className="font-medium">#{order.id.slice(-8)}</p>
                              <p className="text-sm text-muted-foreground">{order.customer_name}</p>
                            </div>
                            <div>
                              <p className="text-sm">{order.customer_phone}</p>
                              <p className="text-sm text-muted-foreground">{order.items_count} itens</p>
                            </div>
                            <div>
                              <p className="text-sm">R$ {order.total_amount.toFixed(2)}</p>
                              <p className="text-sm text-muted-foreground">{order.payment_method}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">
                                {new Date(order.created_at).toLocaleTimeString()}
                              </p>
                              {order.neighborhood && (
                                <p className="text-xs text-muted-foreground">{order.neighborhood}</p>
                              )}
                            </div>
                          </div>
                          <Badge className={getStatusColor(order.status)}>
                            {getStatusLabel(order.status)}
                          </Badge>
                        </div>
                        <div className="flex gap-2">
                          {getQuickActions(order)}
                          <Button size="sm" variant="outline">
                            <Eye className="h-3 w-3 mr-1" />
                            Detalhes
                          </Button>
                        </div>
                      </div>
                    ))}
                    {filteredOrders.length === 0 && (
                      <p className="text-center text-muted-foreground py-8">
                        Nenhum pedido encontrado
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </SidebarProvider>
  );
}