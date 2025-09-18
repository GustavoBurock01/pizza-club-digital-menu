import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Truck, MapPin, Phone, Clock, Navigation, CheckCircle } from "lucide-react";
import { AttendantSidebar } from "@/components/AttendantSidebar";
import { useAttendantOrders } from "@/hooks/useAttendantOrders";
import { SidebarProvider } from "@/components/ui/sidebar";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { formatCurrency } from "@/utils/formatting";
import { toast } from "sonner";

export default function AttendantDelivery() {
  const { orders, updateOrderStatus, loading } = useAttendantOrders();
  const [selectedDeliveryZone, setSelectedDeliveryZone] = useState<string>('all');
  
  const handleStatusUpdate = async (orderId: string, status: string) => {
    try {
      await updateOrderStatus(orderId, status);
      toast.success("Status atualizado com sucesso!");
    } catch (error) {
      toast.error("Erro ao atualizar status");
    }
  };

  // Filtrar pedidos para entrega
  const deliveryOrders = orders?.filter(order => 
    ['ready', 'delivering'].includes(order.status)
  ).sort((a, b) => 
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  ) || [];

  const readyOrders = deliveryOrders.filter(o => o.status === 'ready');
  const outForDeliveryOrders = deliveryOrders.filter(o => o.status === 'delivering');

  // Agrupar pedidos por bairro
  const ordersByNeighborhood = deliveryOrders.reduce((acc, order) => {
    const neighborhood = order.neighborhood || 'Não informado';
    if (!acc[neighborhood]) acc[neighborhood] = [];
    acc[neighborhood].push(order);
    return acc;
  }, {} as Record<string, any[]>);

  const getOrderAge = (order: any) => {
    const orderTime = new Date(order.created_at);
    const minutes = Math.floor((Date.now() - orderTime.getTime()) / (1000 * 60));
    return minutes;
  };

  const getDeliveryPriority = (order: any) => {
    const age = getOrderAge(order);
    if (age > 45) return 'critical';
    if (age > 30) return 'high';
    return 'normal';
  };

  if (loading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AttendantSidebar />
          <div className="flex-1 flex items-center justify-center">
            <LoadingSpinner />
          </div>
        </div>
      </SidebarProvider>
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
              <h1 className="text-3xl font-bold text-gradient flex items-center gap-3">
                <Truck className="h-8 w-8" />
                Central de Entregas
              </h1>
              <p className="text-muted-foreground">
                Gerencie todas as entregas
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-sm">
                {readyOrders.length} prontos
              </Badge>
              <Badge variant="secondary" className="text-sm">
                {outForDeliveryOrders.length} em rota
              </Badge>
            </div>
          </div>

          {/* Delivery Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="glass hover-lift">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Prontos</p>
                    <p className="text-xl font-bold text-green-600">
                      {readyOrders.length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass hover-lift">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Truck className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Em Rota</p>
                    <p className="text-xl font-bold text-blue-600">
                      {outForDeliveryOrders.length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass hover-lift">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Bairros</p>
                    <p className="text-xl font-bold text-purple-600">
                      {Object.keys(ordersByNeighborhood).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass hover-lift">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Tempo Médio</p>
                    <p className="text-xl font-bold text-amber-600">35min</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Delivery Queue */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Pedidos Prontos para Entrega */}
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Prontos para Entrega
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 max-h-96 overflow-y-auto">
                {readyOrders.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Truck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum pedido pronto</p>
                  </div>
                ) : (
                  readyOrders.map((order) => {
                    const priority = getDeliveryPriority(order);
                    const age = getOrderAge(order);
                    
                    return (
                      <div 
                        key={order.id} 
                        className={`p-4 border rounded-lg glass hover:shadow-lg transition-all ${
                          priority === 'critical' ? 'border-red-300 bg-red-50' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">
                              #{order.id.slice(-8)}
                            </Badge>
                            {priority === 'critical' && (
                              <Badge variant="destructive" className="animate-pulse">
                                URGENTE
                              </Badge>
                            )}
                            <Badge variant="secondary">
                              {age}min
                            </Badge>
                          </div>
                        </div>

                        <div className="space-y-2 mb-3">
                          <p className="font-medium">{order.customer_name}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {order.customer_phone}
                          </div>
                          <div className="flex items-start gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-3 w-3 mt-0.5" />
                            <div>
                              <p>{order.street}, {order.number}</p>
                              <p>{order.neighborhood} - {order.city}</p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span>{order.items_count} itens</span>
                            <span className="font-medium">{formatCurrency(order.total_amount)}</span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleStatusUpdate(order.id, 'delivering')}
                            className="flex-1"
                          >
                            <Truck className="h-4 w-4 mr-2" />
                            Saiu para Entrega
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const address = `${order.street}, ${order.number}, ${order.neighborhood}, ${order.city}`;
                              const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
                              window.open(googleMapsUrl, '_blank');
                            }}
                          >
                            <Navigation className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>

            {/* Pedidos em Rota */}
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Em Rota de Entrega
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 max-h-96 overflow-y-auto">
                {outForDeliveryOrders.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Navigation className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum pedido em rota</p>
                  </div>
                ) : (
                  outForDeliveryOrders.map((order) => {
                    const age = getOrderAge(order);
                    
                    return (
                      <div 
                        key={order.id} 
                        className="p-4 border rounded-lg bg-blue-50 border-blue-200"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-blue-100">
                              #{order.id.slice(-8)}
                            </Badge>
                            <Badge variant="secondary" className="bg-blue-600 text-white">
                              EM ROTA
                            </Badge>
                          </div>
                        </div>

                        <div className="space-y-2 mb-3">
                          <p className="font-medium">{order.customer_name}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {order.customer_phone}
                          </div>
                          <div className="flex items-start gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-3 w-3 mt-0.5" />
                            <div>
                              <p>{order.street}, {order.number}</p>
                              <p>{order.neighborhood}</p>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Saiu há {age}min
                          </p>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleStatusUpdate(order.id, 'delivered')}
                            className="flex-1 bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Confirmar Entrega
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              window.open(`tel:${order.customer_phone}`, '_self');
                            }}
                          >
                            <Phone className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>

          {/* Mapa de Entregas por Bairro */}
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Entregas por Bairro
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
                {Object.entries(ordersByNeighborhood).map(([neighborhood, orders]) => (
                  <Card key={neighborhood} className="glass">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-sm">{neighborhood}</h4>
                        <Badge variant="secondary">{(orders as any[]).length}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Valor total: {formatCurrency(
                          (orders as any[]).reduce((sum, order) => sum + Number(order.total_amount), 0)
                        )}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </SidebarProvider>
  );
}