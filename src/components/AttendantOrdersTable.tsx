import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Clock, MapPin, Phone, User, Package, DollarSign } from "lucide-react";
import { useAttendantOrders } from "@/hooks/useAttendantOrders";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { formatCurrency } from "@/utils/formatting";
import { toast } from "sonner";

interface AttendantOrdersTableProps {
  filters: {
    status: string;
    priority: string;
    paymentMethod: string;
  };
}

export function AttendantOrdersTable({ filters }: AttendantOrdersTableProps) {
  const { orders, updateOrderStatus, loading } = useAttendantOrders();
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      toast.success("Status do pedido atualizado com sucesso!");
    } catch (error) {
      toast.error("Erro ao atualizar status do pedido");
    }
  };

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

  // Filtrar pedidos baseado nos filtros ativos
  const filteredOrders = orders?.filter(order => {
    if (filters.status !== 'all' && order.status !== filters.status) {
      return false;
    }
    
    if (filters.paymentMethod !== 'all' && order.payment_method !== filters.paymentMethod) {
      return false;
    }
    
    if (filters.priority === 'urgent') {
      const orderTime = new Date(order.created_at);
      const minutesAgo = (Date.now() - orderTime.getTime()) / (1000 * 60);
      if (minutesAgo <= 5) return false;
    }
    
    return true;
  }) || [];

  const getPriorityBadge = (order: any) => {
    const orderTime = new Date(order.created_at);
    const minutesAgo = (Date.now() - orderTime.getTime()) / (1000 * 60);
    
    if (minutesAgo > 10) {
      return <Badge variant="destructive" className="text-xs animate-pulse">URGENTE</Badge>;
    } else if (minutesAgo > 5) {
      return <Badge variant="default" className="text-xs bg-amber-500">ATENÇÃO</Badge>;
    }
    return null;
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pedido</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Itens</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Nenhum pedido encontrado com os filtros selecionados
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order) => (
                <TableRow key={order.id} className="hover:bg-muted/50">
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">#{order.id.slice(-8)}</p>
                        {getPriorityBadge(order)}
                      </div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(order.created_at).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-medium">{order.customer_name}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {order.customer_phone}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span>{order.items_count} itens</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{formatCurrency(order.total_amount)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(order.status)}>
                      {getStatusLabel(order.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedOrder(order)}
                            className="hover-lift"
                          >
                            Detalhes
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl glass">
                          <DialogHeader>
                            <DialogTitle>Detalhes do Pedido #{selectedOrder?.id.slice(-8)}</DialogTitle>
                          </DialogHeader>
                          <OrderDetails order={selectedOrder} onStatusUpdate={handleStatusUpdate} />
                        </DialogContent>
                      </Dialog>
                      
                      <Select
                        value={order.status}
                        onValueChange={(value) => handleStatusUpdate(order.id, value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pendente</SelectItem>
                          <SelectItem value="confirmed">Confirmado</SelectItem>
                          <SelectItem value="preparing">Preparando</SelectItem>
                          <SelectItem value="ready">Pronto</SelectItem>
                          <SelectItem value="delivered">Entregue</SelectItem>
                          <SelectItem value="cancelled">Cancelado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Summary Footer */}
      {filteredOrders.length > 0 && (
        <div className="mt-4 p-4 bg-muted/20 rounded-lg">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Total de Pedidos:</span>
              <span className="ml-2 font-medium">{filteredOrders.length}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Valor Total:</span>
              <span className="ml-2 font-medium">
                {formatCurrency(
                  filteredOrders.reduce((total, order) => total + Number(order.total_amount), 0)
                )}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Pendentes:</span>
              <span className="ml-2 font-medium text-amber-600">
                {filteredOrders.filter(o => o.status === 'pending').length}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Em Preparo:</span>
              <span className="ml-2 font-medium text-blue-600">
                {filteredOrders.filter(o => ['confirmed', 'preparing'].includes(o.status)).length}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function OrderDetails({ order, onStatusUpdate }: { order: any; onStatusUpdate: (id: string, status: string) => void }) {
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
              Endereço
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
            <CardTitle className="text-sm">Observações</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm bg-muted/50 p-3 rounded-lg">{order.notes}</p>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between pt-4 border-t">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Total do Pedido</p>
          <p className="text-lg font-bold text-gradient">{formatCurrency(order.total_amount)}</p>
        </div>
        
        <Select
          value={order.status}
          onValueChange={(value) => onStatusUpdate(order.id, value)}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="confirmed">Confirmado</SelectItem>
            <SelectItem value="preparing">Preparando</SelectItem>
            <SelectItem value="ready">Pronto</SelectItem>
            <SelectItem value="delivered">Entregue</SelectItem>
            <SelectItem value="cancelled">Cancelado</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}