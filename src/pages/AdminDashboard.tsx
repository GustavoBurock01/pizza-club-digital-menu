import { useUnifiedAdminData } from '@/hooks/useUnifiedAdminData';
import { AppSidebar } from '@/components/AppSidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, ShoppingCart, Package, Users, DollarSign, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { formatCurrency } from '@/utils/formatting';
import { RevenueChart } from '@/components/RevenueChart';
import { AdminAuditLog } from '@/components/AdminAuditLog';

export default function AdminDashboard() {
  const { stats, loading, refreshAllData } = useUnifiedAdminData();

  if (loading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
        <AppSidebar />
          <main className="flex-1 p-6">
            <div className="flex items-center justify-center h-64">
              <LoadingSpinner />
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Dashboard Administrativo</h1>
              <p className="text-muted-foreground">Visão geral do negócio e principais métricas</p>
            </div>
            <Button onClick={() => refreshAllData()} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>

          {/* KPI Cards - Apenas estatísticas, não clicáveis */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pedidos Hoje</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.todayOrders}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.pendingOrders} pendentes
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Receita Hoje</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stats.todayRevenue)}</div>
                <p className="text-xs text-muted-foreground">
                  Ticket médio: {formatCurrency(stats.averageOrderValue)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pedidos Pendentes</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pendingOrders}</div>
                <p className="text-xs text-muted-foreground">
                  Requerem atenção
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pedidos Concluídos</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.completedOrders}</div>
                <p className="text-xs text-muted-foreground">
                  Total de pedidos
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Gráfico de Evolução */}
          <RevenueChart />

          {/* Grid de Informações */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Auditoria e Logs */}
            <AdminAuditLog />

            {/* Top Products */}
            {stats.topSellingProducts.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    <CardTitle>Produtos Mais Vendidos</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {stats.topSellingProducts.map((product, index) => (
                      <div key={product.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-muted-foreground">{product.totalSold} vendidos</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatCurrency(product.totalRevenue)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}