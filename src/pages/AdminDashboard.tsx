import { useAdminData } from '@/hooks/useAdminData';
import { AdminStatsCards } from '@/components/AdminStatsCards';
import { AdminOrdersTable } from '@/components/AdminOrdersTable';
import { AdminProductsList } from '@/components/AdminProductsList';
import { AdminUsersList } from '@/components/AdminUsersList';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, Users, Package, ShoppingCart, TrendingUp } from 'lucide-react';

export default function AdminDashboard() {
  const {
    loading,
    stats,
    orders,
    products,
    users,
    updateOrderStatus,
    refreshData
  } = useAdminData();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard Administrativo</h1>
            <p className="text-muted-foreground">Visão geral do seu negócio</p>
          </div>
          <Button onClick={refreshData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>

        {/* Quick Stats Overview */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Pedidos</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalOrders || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.pendingOrders || 0} pendentes
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {Number(stats?.totalRevenue || 0).toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                Receita total do estabelecimento
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Produtos</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalProducts || 0}</div>
              <p className="text-xs text-muted-foreground">
                Catálogo ativo
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Usuários</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
              <p className="text-xs text-muted-foreground">
                Clientes cadastrados
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Stats Cards */}
        <AdminStatsCards stats={stats} />

        {/* Main Content Tabs */}
        <Tabs defaultValue="orders" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="orders">Pedidos Recentes</TabsTrigger>
            <TabsTrigger value="products">Produtos</TabsTrigger>
            <TabsTrigger value="users">Usuários</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Pedidos Recentes</CardTitle>
                <CardDescription>
                  Gerencie os pedidos mais recentes do seu estabelecimento
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AdminOrdersTable orders={orders} onUpdateStatus={updateOrderStatus} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Catálogo de Produtos</CardTitle>
                <CardDescription>
                  Visualize e gerencie todos os produtos do seu cardápio
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AdminProductsList products={products} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Usuários Cadastrados</CardTitle>
                <CardDescription>
                  Lista de todos os clientes registrados na plataforma
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AdminUsersList users={users} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Analytics Avançado</CardTitle>
                <CardDescription>
                  Relatórios detalhados e métricas de performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">Analytics em Desenvolvimento</h3>
                  <p className="text-muted-foreground">Esta seção será implementada em breve com relatórios detalhados.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}