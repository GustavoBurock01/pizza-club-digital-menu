import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Users, Activity, AlertCircle, Timer } from 'lucide-react';
import { useSubscriptionMonitoring } from '@/hooks/admin/useSubscriptionMonitoring';

interface SubscriptionStatsProps {
  monitoring: ReturnType<typeof useSubscriptionMonitoring>;
}

const SubscriptionStats = ({ monitoring }: SubscriptionStatsProps) => {
  useEffect(() => {
    monitoring.getGeneralStats();
  }, [monitoring]);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('pt-BR').format(num);
  };

  const formatPercent = (num: number) => {
    return `${num.toFixed(1)}%`;
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Estatísticas Gerais</CardTitle>
            <CardDescription>
              Métricas globais do sistema de assinatura (últimas 24h)
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => monitoring.getGeneralStats()}
            disabled={monitoring.loading}
          >
            <RefreshCw className={`h-4 w-4 ${monitoring.loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!monitoring.stats ? (
          <div className="text-center py-8 text-muted-foreground">
            Carregando estatísticas...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-5 w-5 text-primary" />
                <span className="text-sm text-muted-foreground">
                  Assinaturas Ativas
                </span>
              </div>
              <div className="text-3xl font-bold">
                {formatNumber(monitoring.stats.totalActiveSubscriptions)}
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="h-5 w-5 text-blue-500" />
                <span className="text-sm text-muted-foreground">
                  Tentativas (24h)
                </span>
              </div>
              <div className="text-3xl font-bold">
                {formatNumber(monitoring.stats.totalReconciliationAttempts)}
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className={`h-5 w-5 ${
                  monitoring.stats.errorRate > 10 ? 'text-destructive' :
                  monitoring.stats.errorRate > 5 ? 'text-warning' :
                  'text-success'
                }`} />
                <span className="text-sm text-muted-foreground">
                  Taxa de Erro
                </span>
              </div>
              <div className={`text-3xl font-bold ${
                monitoring.stats.errorRate > 10 ? 'text-destructive' :
                monitoring.stats.errorRate > 5 ? 'text-warning' :
                'text-success'
              }`}>
                {formatPercent(monitoring.stats.errorRate)}
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Timer className="h-5 w-5 text-purple-500" />
                <span className="text-sm text-muted-foreground">
                  Tempo Médio
                </span>
              </div>
              <div className="text-3xl font-bold">
                {formatDuration(monitoring.stats.avgReconciliationTime)}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SubscriptionStats;
