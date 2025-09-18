import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { BarChart3, Download, Calendar as CalendarIcon, TrendingUp, DollarSign, Package, Users, Clock } from "lucide-react";
import { AttendantSidebar } from "@/components/AttendantSidebar";
import { useAttendantOrders } from "@/hooks/useAttendantOrders";
import { useAttendantStats } from "@/hooks/useAttendantStats";
import { SidebarProvider } from "@/components/ui/sidebar";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { formatCurrency } from "@/utils/formatting";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function AttendantReports() {
  const { orders, loading } = useAttendantOrders();
  const { stats } = useAttendantStats();
  const [selectedPeriod, setSelectedPeriod] = useState<string>('today');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [reportType, setReportType] = useState<string>('sales');

  // Filtrar pedidos por período
  const getFilteredOrders = () => {
    if (!orders) return [];
    
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));
    
    switch (selectedPeriod) {
      case 'today':
        return orders.filter(order => {
          const orderDate = new Date(order.created_at);
          return orderDate >= startOfDay && orderDate <= endOfDay;
        });
      case 'week':
        const startOfWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        return orders.filter(order => new Date(order.created_at) >= startOfWeek);
      case 'month':
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        return orders.filter(order => new Date(order.created_at) >= startOfMonth);
      default:
        return orders;
    }
  };

  const filteredOrders = getFilteredOrders();
  
  // Cálculos de métricas
  const totalRevenue = filteredOrders
    .filter(order => ['delivered'].includes(order.status))
    .reduce((sum, order) => sum + Number(order.total_amount), 0);
  
  const totalOrders = filteredOrders.length;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  
  const ordersByStatus = filteredOrders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const ordersByPaymentMethod = filteredOrders.reduce((acc, order) => {
    const method = order.payment_method || 'unknown';
    acc[method] = (acc[method] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Dados para gráficos (simulado - pode ser implementado com recharts)
  const hourlyData = Array.from({ length: 24 }, (_, hour) => {
    const ordersInHour = filteredOrders.filter(order => {
      const orderHour = new Date(order.created_at).getHours();
      return orderHour === hour;
    }).length;
    
    return {
      hour,
      orders: ordersInHour,
      revenue: filteredOrders
        .filter(order => new Date(order.created_at).getHours() === hour)
        .reduce((sum, order) => sum + Number(order.total_amount), 0)
    };
  });

  const peakHours = hourlyData
    .sort((a, b) => b.orders - a.orders)
    .slice(0, 3);

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
                <BarChart3 className="h-8 w-8" />
                Relatórios & Analytics
              </h1>
              <p className="text-muted-foreground">
                Análise de performance e vendas
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Hoje</SelectItem>
                  <SelectItem value="week">Esta Semana</SelectItem>
                  <SelectItem value="month">Este Mês</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="glass hover-lift">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Faturamento</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(totalRevenue)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {selectedPeriod === 'today' ? 'hoje' : 
                       selectedPeriod === 'week' ? 'esta semana' : 'este mês'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass hover-lift">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <Package className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Pedidos</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {totalOrders}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Total do período
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass hover-lift">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Ticket Médio</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {formatCurrency(avgOrderValue)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Por pedido
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass hover-lift">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
                    <Clock className="h-6 w-6 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Tempo Médio</p>
                    <p className="text-2xl font-bold text-amber-600">
                      {stats?.avgDeliveryTime || 0}min
                    </p>
                    <p className="text-xs text-muted-foreground">
                      De preparo
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts and Analysis */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Status Distribution */}
            <Card className="glass">
              <CardHeader>
                <CardTitle>Distribuição por Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(ordersByStatus).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">
                        {status === 'pending' ? 'Pendente' :
                         status === 'confirmed' ? 'Confirmado' :
                         status === 'preparing' ? 'Preparando' :
                         status === 'ready' ? 'Pronto' :
                         status === 'delivered' ? 'Entregue' :
                         status === 'cancelled' ? 'Cancelado' : status}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{count as number} pedidos</p>
                      <p className="text-xs text-muted-foreground">
                        {totalOrders > 0 ? (((count as number) / totalOrders) * 100).toFixed(1) : 0}%
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Payment Methods */}
            <Card className="glass">
              <CardHeader>
                <CardTitle>Métodos de Pagamento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(ordersByPaymentMethod).map(([method, count]) => (
                  <div key={method} className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary">
                        {method === 'pix' ? 'PIX' :
                         method === 'card' ? 'Cartão' :
                         method === 'cash' ? 'Dinheiro' : method}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{count as number} pedidos</p>
                      <p className="text-xs text-muted-foreground">
                        {totalOrders > 0 ? (((count as number) / totalOrders) * 100).toFixed(1) : 0}%
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Peak Hours */}
          <Card className="glass">
            <CardHeader>
              <CardTitle>Horários de Pico</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {peakHours.map((data, index) => (
                  <Card key={data.hour} className="glass">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant={index === 0 ? 'destructive' : 'secondary'}>
                          #{index + 1}
                        </Badge>
                        <p className="font-medium">
                          {data.hour}:00 - {data.hour + 1}:00
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">
                          {data.orders} pedidos
                        </p>
                        <p className="text-sm font-medium">
                          {formatCurrency(data.revenue)}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Detailed Orders Table */}
          <Card className="glass">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Histórico Detalhado</CardTitle>
                <Button variant="outline" size="sm">
                  Ver Todos
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredOrders.slice(0, 10).map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">
                        #{order.id.slice(-8)}
                      </Badge>
                      <div>
                        <p className="font-medium">{order.customer_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString('pt-BR')} às{' '}
                          {new Date(order.created_at).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(order.total_amount)}</p>
                      <Badge
                        variant={
                          order.status === 'delivered' ? 'secondary' :
                          order.status === 'cancelled' ? 'destructive' : 'outline'
                        }
                        className="text-xs"
                      >
                        {order.status === 'delivered' ? 'Entregue' :
                         order.status === 'cancelled' ? 'Cancelado' :
                         order.status === 'pending' ? 'Pendente' : order.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </SidebarProvider>
  );
}