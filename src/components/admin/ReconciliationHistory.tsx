import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, RefreshCw, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useSubscriptionMonitoring } from '@/hooks/admin/useSubscriptionMonitoring';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface ReconciliationHistoryProps {
  monitoring: ReturnType<typeof useSubscriptionMonitoring>;
}

const ReconciliationHistory = ({ monitoring }: ReconciliationHistoryProps) => {
  useEffect(() => {
    monitoring.getReconciliationHistory();
  }, [monitoring]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'timeout':
        return <Clock className="h-4 w-4 text-warning" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-success/10 text-success border-success">Sucesso</Badge>;
      case 'error':
        return <Badge variant="destructive">Erro</Badge>;
      case 'timeout':
        return <Badge variant="outline" className="bg-warning/10 text-warning border-warning">Timeout</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Histórico de Reconciliações</CardTitle>
            <CardDescription>
              Últimas tentativas de sincronização (armazenado na sessão)
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => monitoring.getReconciliationHistory()}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={monitoring.clearReconciliationHistory}
              disabled={monitoring.history.length === 0}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Limpar Histórico
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {monitoring.history.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma tentativa de reconciliação registrada nesta sessão
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>User ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Duração</TableHead>
                  <TableHead>Detalhes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monitoring.history.slice(0, 10).map((attempt, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-mono text-xs">
                      {new Date(attempt.timestamp).toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {attempt.userId.substring(0, 8)}...
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(attempt.status)}
                        {getStatusBadge(attempt.status)}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {attempt.duration}ms
                    </TableCell>
                    <TableCell>
                      {attempt.error ? (
                        <div className="text-xs text-destructive max-w-xs truncate" title={attempt.error}>
                          {attempt.error}
                        </div>
                      ) : attempt.result ? (
                        <div className="text-xs text-muted-foreground max-w-xs truncate">
                          {JSON.stringify(attempt.result)}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        
        {monitoring.history.length > 10 && (
          <div className="mt-4 text-center text-sm text-muted-foreground">
            Mostrando 10 de {monitoring.history.length} tentativas
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ReconciliationHistory;
