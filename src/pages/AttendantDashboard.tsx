import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Package, Users, AlertCircle, Bell, Settings, Filter, RefreshCw, Volume2, VolumeX } from "lucide-react";
import { AttendantOrdersTable } from "@/components/AttendantOrdersTable";
import { AttendantSidebar } from "@/components/AttendantSidebar";
import { AttendantNotifications } from "@/components/AttendantNotifications";
import { AttendantFilters } from "@/components/AttendantFilters";
import { useAttendantSystem } from "@/hooks/useAttendantSystem";
import { attendantOptimizer } from "@/utils/attendantOptimizer";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { SidebarProvider } from "@/components/ui/sidebar";
import { toast } from "sonner";

export default function AttendantDashboard() {
  const { stats, statsLoading: loading } = useAttendantSystem();
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [activeFilters, setActiveFilters] = useState({
    status: 'all',
    priority: 'all',
    paymentMethod: 'all'
  });
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Performance optimization
  useEffect(() => {
    attendantOptimizer.checkPerformance();
  }, []);

  // Som de notificação para novos pedidos (otimizado)
  useEffect(() => {
    if (soundEnabled && stats?.pendingOrders && stats.pendingOrders > 0) {
      attendantOptimizer.playNotificationSound();
    }
  }, [stats?.pendingOrders, soundEnabled]);

  const handleRefresh = () => {
    attendantOptimizer.clearCache();
    setLastRefresh(new Date());
    toast.success("Dados atualizados com sucesso!");
  };

  const toggleSound = () => {
    setSoundEnabled(!soundEnabled);
    toast.info(soundEnabled ? "Sons desabilitados" : "Sons habilitados");
  };

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
              <h1 className="text-3xl font-bold text-gradient">Painel de Atendimento</h1>
              <p className="text-muted-foreground">Gerencie os pedidos em tempo real</p>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="text-sm">
                Atualizado: {lastRefresh.toLocaleTimeString()}
              </Badge>
              
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
                onClick={handleRefresh}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Atualizar
              </Button>
              
              <AttendantNotifications />
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="hover-lift glass">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pedidos Pendentes</CardTitle>
                <AlertCircle className="h-4 w-4 text-amber-500 animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-600">
                  {stats?.pendingOrders || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Aguardando confirmação
                </p>
              </CardContent>
            </Card>

            <Card className="hover-lift glass">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Em Preparo</CardTitle>
                <Package className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {stats?.preparingOrders || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Na cozinha
                </p>
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
                <p className="text-xs text-muted-foreground">
                  De preparo
                </p>
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
                <p className="text-xs text-muted-foreground">
                  Únicos
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <AttendantFilters 
            filters={activeFilters} 
            onFiltersChange={setActiveFilters} 
          />

          {/* Orders Table */}
          <Card className="glass">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Pedidos Ativos
                </CardTitle>
                <Badge variant="outline" className="text-xs">
                  {stats?.pendingOrders + stats?.preparingOrders || 0} ativos
                </Badge>
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