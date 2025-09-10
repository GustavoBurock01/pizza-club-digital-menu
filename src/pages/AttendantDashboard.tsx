import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Package, Users, AlertCircle } from "lucide-react";
import { AttendantOrdersTable } from "@/components/AttendantOrdersTable";
import { useAttendantStats } from "@/hooks/useAttendantStats";
import { LoadingSpinner } from "@/components/LoadingSpinner";

export default function AttendantDashboard() {
  const { stats, loading } = useAttendantStats();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Painel de Atendimento</h1>
          <p className="text-muted-foreground">Gerencie os pedidos em tempo real</p>
        </div>
        <Badge variant="secondary" className="text-sm">
          Atualizado há poucos segundos
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pedidos Pendentes</CardTitle>
            <AlertCircle className="h-4 w-4 text-amber-500" />
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

        <Card>
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

        <Card>
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

        <Card>
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

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Pedidos Ativos</CardTitle>
        </CardHeader>
        <CardContent>
          <AttendantOrdersTable />
        </CardContent>
      </Card>
    </div>
  );
}