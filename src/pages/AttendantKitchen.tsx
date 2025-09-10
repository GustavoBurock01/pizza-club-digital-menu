import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChefHat, Clock, CheckCircle, AlertCircle, Package, Flame } from "lucide-react";
import { AttendantSidebar } from "@/components/AttendantSidebar";
import { useAttendantOrders } from "@/hooks/useAttendantOrders";
import { SidebarProvider } from "@/components/ui/sidebar";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { formatCurrency } from "@/utils/formatting";
import { toast } from "sonner";

export default function AttendantKitchen() {
  const { orders, updateOrderStatus, loading } = useAttendantOrders();
  const [kitchenTimer, setKitchenTimer] = useState<Record<string, number>>({});

  // Timer para pedidos em preparo
  useEffect(() => {
    const interval = setInterval(() => {
      const preparingOrders = orders?.filter(order => 
        ['confirmed', 'preparing'].includes(order.status)
      ) || [];

      const newTimers: Record<string, number> = {};
      preparingOrders.forEach(order => {
        const startTime = new Date(order.updated_at || order.created_at).getTime();
        const elapsed = Math.floor((Date.now() - startTime) / 1000 / 60); // em minutos
        newTimers[order.id] = elapsed;
      });
      setKitchenTimer(newTimers);
    }, 1000);

    return () => clearInterval(interval);
  }, [orders]);

  const handleStatusUpdate = async (orderId: string, status: string) => {
    try {
      await updateOrderStatus(orderId, status);
      toast.success("Status atualizado com sucesso!");
    } catch (error) {
      toast.error("Erro ao atualizar status");
    }
  };

  // Filtrar pedidos relevantes para a cozinha
  const kitchenOrders = orders?.filter(order => 
    ['pending', 'confirmed', 'preparing'].includes(order.status)
  ).sort((a, b) => {
    // Ordenar por prioridade: pendentes primeiro, depois por tempo
    if (a.status === 'pending' && b.status !== 'pending') return -1;
    if (b.status === 'pending' && a.status !== 'pending') return 1;
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  }) || [];

  const readyOrders = orders?.filter(order => order.status === 'ready') || [];

  const getOrderPriority = (order: any) => {
    const orderTime = new Date(order.created_at);
    const minutesAgo = (Date.now() - orderTime.getTime()) / (1000 * 60);
    
    if (minutesAgo > 15) return 'critical';
    if (minutesAgo > 10) return 'high';
    if (minutesAgo > 5) return 'medium';
    return 'normal';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500 animate-pulse';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      default: return 'bg-green-500';
    }
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
                <ChefHat className="h-8 w-8" />
                Painel da Cozinha
              </h1>
              <p className="text-muted-foreground">
                Gerencie o preparo dos pedidos
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-sm">
                {kitchenOrders.length} na fila
              </Badge>
              <Badge variant="secondary" className="text-sm">
                {readyOrders.length} prontos
              </Badge>
            </div>
          </div>

          {/* Kitchen Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="glass hover-lift">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Aguardando</p>
                    <p className="text-xl font-bold text-amber-600">
                      {kitchenOrders.filter(o => o.status === 'pending').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass hover-lift">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Flame className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Preparando</p>
                    <p className="text-xl font-bold text-blue-600">
                      {kitchenOrders.filter(o => ['confirmed', 'preparing'].includes(o.status)).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

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
                  <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Urgentes</p>
                    <p className="text-xl font-bold text-red-600">
                      {kitchenOrders.filter(o => getOrderPriority(o) === 'critical').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Kitchen Queue */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Fila de Preparo */}
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Flame className="h-5 w-5" />
                  Fila de Preparo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 max-h-96 overflow-y-auto">
                {kitchenOrders.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum pedido na fila</p>
                  </div>
                ) : (
                  kitchenOrders.map((order) => {
                    const priority = getOrderPriority(order);
                    const timer = kitchenTimer[order.id] || 0;
                    
                    return (
                      <div 
                        key={order.id} 
                        className="p-4 border rounded-lg glass hover:shadow-lg transition-all"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${getPriorityColor(priority)}`} />
                            <Badge variant="outline">
                              #{order.id.slice(-8)}
                            </Badge>
                            {timer > 0 && (
                              <Badge variant="secondary">
                                {timer}min
                              </Badge>
                            )}
                          </div>
                          <Badge 
                            variant={order.status === 'pending' ? 'destructive' : 'default'}
                            className="text-xs"
                          >
                            {order.status === 'pending' ? 'Aguardando' : 
                             order.status === 'confirmed' ? 'Confirmado' : 'Preparando'}
                          </Badge>
                        </div>

                        <div className="space-y-2 mb-3">
                          <p className="font-medium">{order.customer_name}</p>
                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <span>{order.items_count} itens</span>
                            <span>{formatCurrency(order.total_amount)}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Pedido às {new Date(order.created_at).toLocaleTimeString()}
                          </p>
                        </div>

                        <div className="flex gap-2">
                          {order.status === 'pending' && (
                            <Button
                              size="sm"
                              onClick={() => handleStatusUpdate(order.id, 'confirmed')}
                              className="flex-1"
                            >
                              Confirmar
                            </Button>
                          )}
                          {order.status === 'confirmed' && (
                            <Button
                              size="sm"
                              onClick={() => handleStatusUpdate(order.id, 'preparing')}
                              className="flex-1"
                            >
                              Iniciar Preparo
                            </Button>
                          )}
                          {order.status === 'preparing' && (
                            <Button
                              size="sm"
                              onClick={() => handleStatusUpdate(order.id, 'ready')}
                              className="flex-1 bg-green-600 hover:bg-green-700"
                            >
                              Marcar como Pronto
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>

            {/* Pedidos Prontos */}
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Pedidos Prontos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 max-h-96 overflow-y-auto">
                {readyOrders.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum pedido pronto</p>
                  </div>
                ) : (
                  readyOrders.map((order) => (
                    <div 
                      key={order.id} 
                      className="p-4 border rounded-lg bg-green-50 border-green-200"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-green-100">
                            #{order.id.slice(-8)}
                          </Badge>
                        </div>
                        <Badge variant="secondary" className="bg-green-600 text-white">
                          PRONTO
                        </Badge>
                      </div>

                      <div className="space-y-2 mb-3">
                        <p className="font-medium">{order.customer_name}</p>
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>{order.items_count} itens</span>
                          <span>{formatCurrency(order.total_amount)}</span>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusUpdate(order.id, 'delivered')}
                        className="w-full"
                      >
                        Marcar como Entregue
                      </Button>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}