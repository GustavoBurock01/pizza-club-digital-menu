import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, Search, Filter, Eye, Clock, AlertTriangle } from "lucide-react";
import { AttendantOrdersTable } from "@/components/AttendantOrdersTable";
import { AttendantSidebar } from "@/components/AttendantSidebar";
import { AttendantFilters } from "@/components/AttendantFilters";
import { useAttendantOrders } from "@/hooks/useAttendantOrders";
import { useAttendantStats } from "@/hooks/useAttendantStats";
import { SidebarProvider } from "@/components/ui/sidebar";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { toast } from "sonner";

export default function AttendantOrders() {
  const { orders, loading } = useAttendantOrders();
  const { stats } = useAttendantStats();
  const [activeFilters, setActiveFilters] = useState({
    status: 'all',
    priority: 'all',
    paymentMethod: 'all'
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Filtrar pedidos por busca
  const filteredOrders = orders?.filter(order => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        order.customer_name?.toLowerCase().includes(search) ||
        order.customer_phone?.includes(search) ||
        order.id.includes(search)
      );
    }
    return true;
  }) || [];

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
                <Package className="h-8 w-8" />
                Pedidos Ativos
              </h1>
              <p className="text-muted-foreground">
                Gerencie todos os pedidos em andamento
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-sm">
                {filteredOrders.length} pedidos
              </Badge>
              <Button
                variant={viewMode === 'table' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('table')}
              >
                Tabela
              </Button>
              <Button
                variant={viewMode === 'cards' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('cards')}
              >
                Cards
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="glass hover-lift">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Pendentes</p>
                    <p className="text-xl font-bold text-amber-600">
                      {stats?.pendingOrders || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass hover-lift">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Package className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Em Preparo</p>
                    <p className="text-xl font-bold text-blue-600">
                      {stats?.preparingOrders || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass hover-lift">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Tempo Médio</p>
                    <p className="text-xl font-bold text-green-600">
                      {stats?.avgDeliveryTime || 0}min
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass hover-lift">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                    <Eye className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Hoje</p>
                    <p className="text-xl font-bold text-purple-600">
                      {orders?.length || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search Bar */}
          <Card className="glass">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Buscar por cliente, telefone ou ID do pedido..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filtros Avançados
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Filters */}
          <AttendantFilters 
            filters={activeFilters} 
            onFiltersChange={setActiveFilters} 
          />

          {/* Orders Display */}
          <Card className="glass">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Lista de Pedidos
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {filteredOrders.length} de {orders?.length || 0}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.reload()}
                  >
                    Atualizar
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <AttendantOrdersTable filters={activeFilters} />
            </CardContent>
          </Card>
        </main>
      </div>
    </SidebarProvider>
  );
}