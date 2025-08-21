import { useAdminData } from '@/hooks/useAdminData';
import { AdminStatsCards } from '@/components/AdminStatsCards';
import { AdminOrdersTable } from '@/components/AdminOrdersTable';
import { AdminProductsList } from '@/components/AdminProductsList';
import { AdminUsersList } from '@/components/AdminUsersList';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw } from 'lucide-react';

export default function Admin() {
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
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Painel Administrativo</h1>
            <p className="text-gray-600">Gerencie seus pedidos, produtos e usuários</p>
          </div>
          <Button onClick={refreshData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="mb-8">
          <AdminStatsCards stats={stats} />
        </div>

        {/* Main Content */}
        <Tabs defaultValue="orders" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="orders">Pedidos</TabsTrigger>
            <TabsTrigger value="products">Produtos</TabsTrigger>
            <TabsTrigger value="users">Usuários</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="space-y-6">
            <AdminOrdersTable orders={orders} onUpdateStatus={updateOrderStatus} />
          </TabsContent>

          <TabsContent value="products" className="space-y-6">
            <AdminProductsList products={products} />
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <AdminUsersList users={users} />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Analytics em Desenvolvimento</h3>
              <p className="text-gray-600">Esta seção será implementada em breve.</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}