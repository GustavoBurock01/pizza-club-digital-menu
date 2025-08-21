import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Order } from '@/hooks/useAdminData';
import { formatCurrency, formatDateTime } from '@/utils/formatting';

interface AdminOrdersTableProps {
  orders: Order[];
  onUpdateStatus: (orderId: string, status: string) => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending': return 'bg-yellow-100 text-yellow-800';
    case 'confirmed': return 'bg-blue-100 text-blue-800';
    case 'preparing': return 'bg-orange-100 text-orange-800';
    case 'ready': return 'bg-purple-100 text-purple-800';
    case 'delivering': return 'bg-indigo-100 text-indigo-800';
    case 'delivered': return 'bg-green-100 text-green-800';
    case 'cancelled': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'pending': return 'Pendente';
    case 'confirmed': return 'Confirmado';
    case 'preparing': return 'Preparando';
    case 'ready': return 'Pronto';
    case 'delivering': return 'Entregando';
    case 'delivered': return 'Entregue';
    case 'cancelled': return 'Cancelado';
    default: return status;
  }
};

export const AdminOrdersTable = ({ orders, onUpdateStatus }: AdminOrdersTableProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pedidos Recentes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {orders.length === 0 ? (
            <p className="text-center text-muted-foreground">Nenhum pedido encontrado</p>
          ) : (
            orders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-medium">#{order.id.slice(-8)}</p>
                      <p className="text-sm text-muted-foreground">
                        {order.profiles?.full_name || 'Cliente'} • {formatDateTime(order.created_at)}
                      </p>
                    </div>
                    <Badge className={getStatusColor(order.status)}>
                      {getStatusLabel(order.status)}
                    </Badge>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(order.total_amount)}</p>
                      <p className="text-sm text-muted-foreground">{order.payment_method}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={order.status}
                    onValueChange={(value) => onUpdateStatus(order.id, value)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="confirmed">Confirmado</SelectItem>
                      <SelectItem value="preparing">Preparando</SelectItem>
                      <SelectItem value="ready">Pronto</SelectItem>
                      <SelectItem value="delivering">Entregando</SelectItem>
                      <SelectItem value="delivered">Entregue</SelectItem>
                      <SelectItem value="cancelled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};