import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Phone, MapPin, Package, Search, Eye, Star } from "lucide-react";
import { AttendantSidebar } from "@/components/AttendantSidebar";
import { useAttendantOrders } from "@/hooks/useAttendantOrders";
import { SidebarProvider } from "@/components/ui/sidebar";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { formatCurrency } from "@/utils/formatting";

export default function AttendantCustomers() {
  const { orders, loading } = useAttendantOrders();
  const [searchTerm, setSearchTerm] = useState("");

  // Agrupar pedidos por cliente
  const customerData = orders?.reduce((acc, order) => {
    const customerId = order.user_id || order.customer_phone;
    if (!customerId) return acc;

    if (!acc[customerId]) {
      acc[customerId] = {
        id: customerId,
        name: order.customer_name,
        email: order.customer_email,
        phone: order.customer_phone,
        orders: [],
        totalSpent: 0,
        lastOrder: order.created_at,
        favoriteNeighborhood: order.neighborhood,
        addresses: new Set()
      };
    }

    acc[customerId].orders.push(order);
    acc[customerId].totalSpent += Number(order.total_amount);
    
    if (new Date(order.created_at) > new Date(acc[customerId].lastOrder)) {
      acc[customerId].lastOrder = order.created_at;
    }

    if (order.street && order.neighborhood) {
      acc[customerId].addresses.add(`${order.street}, ${order.number} - ${order.neighborhood}`);
    }

    return acc;
  }, {} as Record<string, any>) || {};

  const customers = Object.values(customerData).sort((a: any, b: any) => 
    b.totalSpent - a.totalSpent
  );

  // Filtrar clientes por busca
  const filteredCustomers = customers.filter((customer: any) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      customer.name?.toLowerCase().includes(search) ||
      customer.phone?.includes(search) ||
      customer.email?.toLowerCase().includes(search)
    );
  });

  const getCustomerLevel = (totalSpent: number) => {
    if (totalSpent >= 500) return { level: 'VIP', color: 'bg-purple-600' };
    if (totalSpent >= 200) return { level: 'Gold', color: 'bg-yellow-600' };
    if (totalSpent >= 100) return { level: 'Silver', color: 'bg-gray-600' };
    return { level: 'Bronze', color: 'bg-orange-600' };
  };

  const getCustomerFrequency = (orders: any[]) => {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentOrders = orders.filter(order => 
      new Date(order.created_at) >= thirtyDaysAgo
    ).length;
    
    if (recentOrders >= 10) return 'Muito Frequente';
    if (recentOrders >= 5) return 'Frequente';
    if (recentOrders >= 2) return 'Regular';
    return 'Ocasional';
  };

  // Estatísticas gerais
  const totalCustomers = customers.length;
  const vipCustomers = customers.filter((c: any) => c.totalSpent >= 500).length;
  const averageSpent = customers.length > 0 
    ? (customers as any[]).reduce((sum: number, c: any) => sum + (c.totalSpent || 0), 0) / customers.length 
    : 0;
  const topCustomer = customers[0];

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
                <Users className="h-8 w-8" />
                Base de Clientes
              </h1>
              <p className="text-muted-foreground">
                Gerencie relacionamento com clientes
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-sm">
                {totalCustomers} clientes
              </Badge>
              <Badge variant="secondary" className="text-sm">
                {vipCustomers} VIP
              </Badge>
            </div>
          </div>

          {/* Customer Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="glass hover-lift">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="text-xl font-bold text-blue-600">
                      {totalCustomers}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass hover-lift">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                    <Star className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">VIP</p>
                    <p className="text-xl font-bold text-purple-600">
                      {vipCustomers}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass hover-lift">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                    <Package className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Gasto Médio</p>
                    <p className="text-xl font-bold text-green-600">
                      {formatCurrency(averageSpent)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass hover-lift">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                    <Star className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Top Cliente</p>
                    <p className="text-sm font-bold text-amber-600">
                      {(topCustomer as any)?.name || 'N/A'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {topCustomer ? formatCurrency((topCustomer as any).totalSpent || 0) : ''}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search */}
          <Card className="glass">
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar por nome, telefone ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Top Customers */}
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Top 5 Clientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {customers.slice(0, 5).map((customer: any, index) => {
                  const level = getCustomerLevel(customer.totalSpent);
                  return (
                    <div 
                      key={customer.id} 
                      className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-muted/10 to-muted/20 hover:from-muted/20 hover:to-muted/30 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center">
                            {index + 1}
                          </Badge>
                          <Badge className={level.color}>
                            {level.level}
                          </Badge>
                        </div>
                        <div>
                          <p className="font-medium">{customer.name}</p>
                          <p className="text-sm text-muted-foreground">{customer.phone}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">{formatCurrency(customer.totalSpent)}</p>
                        <p className="text-sm text-muted-foreground">{customer.orders.length} pedidos</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Customer List */}
          <Card className="glass">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Todos os Clientes
                </CardTitle>
                <Badge variant="outline">
                  {filteredCustomers.length} de {totalCustomers}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredCustomers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum cliente encontrado</p>
                  </div>
                ) : (
                  filteredCustomers.map((customer: any) => {
                    const level = getCustomerLevel(customer.totalSpent);
                    const frequency = getCustomerFrequency(customer.orders);
                    
                    return (
                      <div 
                        key={customer.id} 
                        className="p-4 border rounded-lg glass hover:shadow-lg transition-all"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                              <Users className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-medium">{customer.name}</p>
                                <Badge className={`${level.color} text-xs`}>
                                  {level.level}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {customer.phone}
                                </div>
                                {customer.email && (
                                  <div className="flex items-center gap-1">
                                    <Eye className="h-3 w-3" />
                                    {customer.email}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <p className="font-bold text-lg">{formatCurrency(customer.totalSpent)}</p>
                            <p className="text-sm text-muted-foreground">{customer.orders.length} pedidos</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Frequência</p>
                            <p className="font-medium">{frequency}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Último Pedido</p>
                            <p className="font-medium">
                              {new Date(customer.lastOrder).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Endereços</p>
                            <p className="font-medium">{customer.addresses.size} cadastrados</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Ticket Médio</p>
                            <p className="font-medium">
                              {formatCurrency(customer.totalSpent / customer.orders.length)}
                            </p>
                          </div>
                        </div>

                        {customer.addresses.size > 0 && (
                          <div className="mt-3 pt-3 border-t">
                            <p className="text-sm text-muted-foreground mb-2 flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              Endereços:
                            </p>
                            <div className="space-y-1">
                              {Array.from(customer.addresses).slice(0, 2).map((address: any, index) => (
                                <p key={index} className="text-xs text-muted-foreground">
                                  {address}
                                </p>
                              ))}
                              {customer.addresses.size > 2 && (
                                <p className="text-xs text-muted-foreground">
                                  +{customer.addresses.size - 2} outros endereços
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </SidebarProvider>
  );
}