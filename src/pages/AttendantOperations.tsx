import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Clock, Package, User, Phone, MapPin, Printer, Eye, CheckCircle, Play, Truck, X } from "lucide-react";
import { AttendantSidebar } from "@/components/AttendantSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useAttendantSystem } from "@/hooks/useAttendantSystem";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { formatCurrency } from "@/utils/formatting";
import { toast } from "sonner";

export default function AttendantOperations() {
  const { 
    orders, 
    ordersLoading, 
    confirmOrder, 
    startPreparation, 
    markReady, 
    markDelivered, 
    cancelOrder 
  } = useAttendantSystem();
  
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState('active');

  // Filtrar pedidos ativos (exceto entregues e cancelados)
  const filteredOrders = orders?.filter(order => {
    if (statusFilter === 'active') {
      return !['delivered', 'cancelled'].includes(order.status);
    }
    if (statusFilter === 'all') {
      return true;
    }
    return order.status === statusFilter;
  }) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'confirmed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'preparing': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'ready': return 'bg-green-100 text-green-800 border-green-200';
      case 'delivered': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'confirmed': return 'Confirmado';
      case 'preparing': return 'Preparando';
      case 'ready': return 'Pronto';
      case 'delivered': return 'Entregue';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  const getQuickActions = (order: any) => {
    switch (order.status) {
      case 'pending':
        return (
          <div className="flex gap-2">
            <Button 
              size="sm" 
              onClick={() => confirmOrder(order.id)}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Confirmar
            </Button>
            <Button 
              size="sm" 
              variant="destructive"
              onClick={() => cancelOrder(order.id)}
            >
              <X className="h-4 w-4 mr-1" />
              Cancelar
            </Button>
          </div>
        );
      case 'confirmed':
        return (
          <Button 
            size="sm" 
            onClick={() => startPreparation(order.id)}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Play className="h-4 w-4 mr-1" />
            Iniciar Preparo
          </Button>
        );
      case 'preparing':
        return (
          <Button 
            size="sm" 
            onClick={() => markReady(order.id)}
            className="bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            Marcar Pronto
          </Button>
        );
      case 'ready':
        return (
          <Button 
            size="sm" 
            onClick={() => markDelivered(order.id)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Truck className="h-4 w-4 mr-1" />
            Entregar
          </Button>
        );
      default:
        return null;
    }
  };

  const printOrder = (order: any) => {
    // Implementar impressão do pedido
    const printContent = `
      PEDIDO #${order.id.slice(-8)}
      Cliente: ${order.customer_name}
      Telefone: ${order.customer_phone}
      Total: ${formatCurrency(order.total_amount)}
      Status: ${getStatusLabel(order.status)}
      Data: ${new Date(order.created_at).toLocaleString()}
      
      ${order.notes ? `Observações: ${order.notes}` : ''}
    `;
    
    const printWindow = window.open('', '', 'width=300,height=400');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head><title>Pedido #${order.id.slice(-8)}</title></head>
          <body style="font-family: monospace; font-size: 12px; white-space: pre-wrap;">
            ${printContent}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }
    toast.success("Pedido enviado para impressora!");
  };

  if (ordersLoading) {
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
                <Package className="h-8 w-8" />
                Operações - Gestão de Pedidos
              </h1>
              <p className="text-muted-foreground">
                Confirme, prepare e entregue pedidos em tempo real
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Pedidos Ativos</SelectItem>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendentes</SelectItem>
                  <SelectItem value="confirmed">Confirmados</SelectItem>
                  <SelectItem value="preparing">Em Preparo</SelectItem>
                  <SelectItem value="ready">Prontos</SelectItem>
                </SelectContent>
              </Select>
              
              <Badge variant="outline" className="text-sm">
                {filteredOrders.length} pedidos
              </Badge>
            </div>
          </div>

          {/* Orders Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredOrders.map((order) => {
              const orderTime = new Date(order.created_at);
              const minutesAgo = Math.floor((Date.now() - orderTime.getTime()) / (1000 * 60));
              const isUrgent = order.status === 'pending' && minutesAgo > 5;
              
              return (
                <Card key={order.id} className={`glass hover-lift transition-all ${isUrgent ? 'ring-2 ring-red-500 animate-pulse' : ''}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">#{order.id.slice(-8)}</CardTitle>
                        {isUrgent && <Badge variant="destructive" className="animate-pulse">URGENTE</Badge>}
                      </div>
                      <Badge className={getStatusColor(order.status)}>
                        {getStatusLabel(order.status)}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Customer Info */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{order.customer_name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        <span>{order.customer_phone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>Há {minutesAgo} min</span>
                      </div>
                    </div>

                    {/* Order Info */}
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{order.items_count} itens</span>
                      </div>
                      <span className="font-bold text-lg text-gradient">
                        {formatCurrency(order.total_amount)}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between gap-2 pt-2">
                      {getQuickActions(order)}
                      
                      <div className="flex gap-1">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => printOrder(order)}
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
                        
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
                          <DialogContent className="max-w-2xl glass">
                            <DialogHeader>
                              <DialogTitle>Detalhes do Pedido #{selectedOrder?.id.slice(-8)}</DialogTitle>
                            </DialogHeader>
                            <OrderDetailsModal order={selectedOrder} />
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filteredOrders.length === 0 && (
            <Card className="glass">
              <CardContent className="text-center py-12">
                <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-medium mb-2">Nenhum pedido encontrado</h3>
                <p className="text-muted-foreground">
                  {statusFilter === 'active' 
                    ? 'Não há pedidos ativos no momento.' 
                    : 'Altere os filtros para ver mais pedidos.'
                  }
                </p>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </SidebarProvider>
  );
}

function OrderDetailsModal({ order }: { order: any }) {
  if (!order) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <Card className="glass">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <User className="h-4 w-4" />
              Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="font-medium">{order.customer_name}</p>
            <p className="text-sm text-muted-foreground">{order.customer_email}</p>
            <p className="text-sm text-muted-foreground">{order.customer_phone}</p>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Endereço de Entrega
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <p className="text-sm">{order.street}, {order.number}</p>
            <p className="text-sm text-muted-foreground">{order.neighborhood}</p>
            <p className="text-sm text-muted-foreground">{order.city}</p>
          </CardContent>
        </Card>
      </div>

      {order.notes && (
        <Card className="glass">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Observações do Cliente</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm bg-muted/50 p-3 rounded-lg">{order.notes}</p>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between pt-4 border-t">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Total do Pedido</p>
          <p className="text-xl font-bold text-gradient">{formatCurrency(order.total_amount)}</p>
        </div>
        
        <div className="text-right space-y-1">
          <p className="text-sm text-muted-foreground">Criado em</p>
          <p className="text-sm font-medium">
            {new Date(order.created_at).toLocaleString('pt-BR')}
          </p>
        </div>
      </div>
    </div>
  );
}