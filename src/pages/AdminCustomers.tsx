import { AdminSidebar } from '@/components/AdminSidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { useAdminCustomers } from '@/hooks/useAdminCustomers';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { RefreshCw, Search, Users, TrendingUp, UserCheck, Crown } from 'lucide-react';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { formatCurrency, formatDateTime } from '@/utils/formatting';

export default function AdminCustomers() {
  const [searchTerm, setSearchTerm] = useState('');
  const { customers, stats, loading, refreshCustomers } = useAdminCustomers({
    search: searchTerm || undefined,
    limit: 100
  });

  if (loading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AdminSidebar />
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
        <AdminSidebar />
        <main className="flex-1 p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Gestão de Clientes</h1>
              <p className="text-muted-foreground">
                Visualize e gerencie todos os clientes da plataforma
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar clientes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Button onClick={refreshCustomers} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar
              </Button>
            </div>
          </div>

          {/* Cards de Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalCustomers}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Novos Este Mês</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.newCustomersThisMonth}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.customerGrowth > 0 ? '+' : ''}{stats.customerGrowth.toFixed(1)}% vs mês anterior
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Clientes Ativos</CardTitle>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeCustomers}</div>
                <p className="text-xs text-muted-foreground">
                  Últimos 30 dias
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Top Cliente</CardTitle>
                <Crown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.topCustomers[0] ? formatCurrency(stats.topCustomers[0].totalSpent) : 'R$ 0,00'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats.topCustomers[0]?.name || 'Nenhum'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Top Clientes */}
          {stats.topCustomers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Top 5 Clientes por Valor</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.topCustomers.slice(0, 5).map((customer, index) => (
                    <div key={customer.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{customer.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {customer.orderCount} pedidos
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(customer.totalSpent)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Lista de Clientes */}
          <Card>
            <CardHeader>
              <CardTitle>
                Todos os Clientes ({customers.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {customers.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {searchTerm ? 'Nenhum cliente encontrado para esta busca.' : 'Nenhum cliente encontrado.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {customers.map((customer) => (
                    <div key={customer.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={customer.avatar_url} />
                          <AvatarFallback>
                            {customer.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium truncate">{customer.full_name}</p>
                            {customer.totalOrders > 10 && (
                              <Badge variant="secondary">
                                <Crown className="h-3 w-3 mr-1" />
                                VIP
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">{customer.email}</p>
                          {customer.phone && (
                            <p className="text-sm text-muted-foreground">{customer.phone}</p>
                          )}
                          {customer.favoriteProducts.length > 0 && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Favoritos: {customer.favoriteProducts.slice(0, 2).join(', ')}
                              {customer.favoriteProducts.length > 2 && '...'}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right space-y-1">
                        <div className="flex items-center gap-4">
                          <div>
                            <p className="text-sm font-medium">{customer.totalOrders} pedidos</p>
                            <p className="text-sm text-muted-foreground">
                              {formatCurrency(customer.totalSpent)} total
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Cadastro</p>
                            <p className="text-xs">{formatDateTime(customer.created_at)}</p>
                          </div>
                          {customer.lastOrderDate && (
                            <div>
                              <p className="text-xs text-muted-foreground">Último pedido</p>
                              <p className="text-xs">{formatDateTime(customer.lastOrderDate)}</p>
                            </div>
                          )}
                        </div>
                        
                        {customer.addresses.length > 0 && (
                          <div className="text-xs text-muted-foreground">
                            {customer.addresses.length} endereço{customer.addresses.length > 1 ? 's' : ''}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </SidebarProvider>
  );
}