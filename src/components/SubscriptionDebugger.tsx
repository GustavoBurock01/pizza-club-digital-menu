import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, Bug, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DebugData {
  summary: any;
  details: any;
}

const SubscriptionDebugger = () => {
  const [loading, setLoading] = useState(false);
  const [debugData, setDebugData] = useState<DebugData | null>(null);
  const [reconciling, setReconciling] = useState(false);

  const runDebug = async () => {
    setLoading(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.access_token) {
        toast.error('Não autenticado');
        return;
      }

      const { data, error } = await supabase.functions.invoke('debug-subscription', {
        headers: {
          Authorization: `Bearer ${session.session.access_token}`
        }
      });

      if (error) throw error;

      setDebugData(data);
      toast.success('Debug executado com sucesso');
    } catch (error) {
      console.error('Debug error:', error);
      toast.error('Erro ao executar debug');
    } finally {
      setLoading(false);
    }
  };

  const runReconciliation = async () => {
    setReconciling(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.access_token) {
        toast.error('Não autenticado');
        return;
      }

      const { data, error } = await supabase.functions.invoke('subscription-reconciler', {
        headers: {
          Authorization: `Bearer ${session.session.access_token}`
        }
      });

      if (error) throw error;

      toast.success(`Reconciliação completa: ${data.report.updated} atualizações`);
      
      // Re-run debug to see updated state
      setTimeout(() => runDebug(), 1000);
    } catch (error) {
      console.error('Reconciliation error:', error);
      toast.error('Erro na reconciliação');
    } finally {
      setReconciling(false);
    }
  };

  const StatusIcon = ({ status }: { status: boolean | null }) => {
    if (status === null) return <XCircle className="h-4 w-4 text-gray-400" />;
    return status ? 
      <CheckCircle className="h-4 w-4 text-green-500" /> : 
      <XCircle className="h-4 w-4 text-red-500" />;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bug className="h-5 w-5" />
            Debug de Assinatura
          </CardTitle>
          <CardDescription>
            Diagnóstico completo do estado da assinatura entre Stripe e Supabase
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button onClick={runDebug} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Bug className="h-4 w-4 mr-2" />}
              Executar Debug
            </Button>
            <Button onClick={runReconciliation} disabled={reconciling} variant="outline">
              {reconciling ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Forçar Reconciliação
            </Button>
          </div>
        </CardContent>
      </Card>

      {debugData && (
        <div className="space-y-4">
          {/* Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle>Resumo do Diagnóstico</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <StatusIcon status={!!debugData.summary.database_subscription} />
                  <span className="text-sm">BD Local</span>
                </div>
                <div className="flex items-center gap-2">
                  <StatusIcon status={debugData.summary.active_subscriptions.length > 0} />
                  <span className="text-sm">Stripe Ativo</span>
                </div>
                <div className="flex items-center gap-2">
                  <StatusIcon status={debugData.summary.profile_has_stripe_id} />
                  <span className="text-sm">Customer ID</span>
                </div>
                <div className="flex items-center gap-2">
                  <StatusIcon status={debugData.summary.rls_policies_count > 0} />
                  <span className="text-sm">RLS Policies</span>
                </div>
              </div>
              
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold">{debugData.summary.stripe_customers_count}</div>
                  <div className="text-xs text-muted-foreground">Customers Stripe</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{debugData.summary.stripe_subscriptions_count}</div>
                  <div className="text-xs text-muted-foreground">Subscriptions</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{debugData.summary.active_subscriptions.length}</div>
                  <div className="text-xs text-muted-foreground">Ativas</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{debugData.summary.audit_logs_count}</div>
                  <div className="text-xs text-muted-foreground">Logs Audit</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Database Subscription */}
          {debugData.details.database_subscription && (
            <Card>
              <CardHeader>
                <CardTitle>Assinatura no Banco Local</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <Badge variant={debugData.details.database_subscription.status === 'active' ? 'default' : 'secondary'}>
                      {debugData.details.database_subscription.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Plano:</span>
                    <span>{debugData.details.database_subscription.plan_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Preço:</span>
                    <span>R$ {debugData.details.database_subscription.plan_price}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Expira em:</span>
                    <span>{debugData.details.database_subscription.expires_at ? 
                      new Date(debugData.details.database_subscription.expires_at).toLocaleDateString() : 
                      'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sync Status:</span>
                    <Badge variant="outline">{debugData.details.database_subscription.sync_status}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Stripe Subscriptions */}
          {debugData.details.stripe_subscriptions?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Assinaturas no Stripe</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {debugData.details.stripe_subscriptions.map((sub: any, index: number) => (
                    <div key={index} className="border rounded p-3 space-y-2">
                      <div className="flex justify-between">
                        <span>ID:</span>
                        <span className="font-mono text-sm">{sub.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Status:</span>
                        <Badge variant={sub.status === 'active' ? 'default' : 'secondary'}>
                          {sub.status}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Período:</span>
                        <span className="text-sm">
                          {new Date(sub.current_period_end).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Price ID:</span>
                        <span className="font-mono text-xs">{sub.price_id}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default SubscriptionDebugger;