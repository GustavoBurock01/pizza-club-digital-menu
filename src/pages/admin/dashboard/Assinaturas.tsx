import { AdminLayout } from '@/components/admin/AdminLayout';
import { PlaceholderFeature } from '@/components/admin/PlaceholderFeature';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, TrendingUp, Calendar, DollarSign } from 'lucide-react';

export default function Assinaturas() {
  return (
    <AdminLayout 
      title="Gestão de Assinaturas" 
      description="Acompanhe assinantes, renovações e métricas de retenção"
    >
      {/* Métricas de Assinaturas (Placeholders) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assinantes Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">
              Em breve
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Recorrente</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">
              MRR mensal
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Renovações</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">
              Este mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Retenção</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">
              Últimos 3 meses
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Placeholder da funcionalidade completa */}
      <PlaceholderFeature
        icon={Users}
        title="Sistema de Assinaturas"
        description="Funcionalidade completa de gestão de assinantes, incluindo renovações automáticas, histórico de pagamentos, análise de churn e métricas de retenção estará disponível em breve."
        status="in-progress"
      />
    </AdminLayout>
  );
}