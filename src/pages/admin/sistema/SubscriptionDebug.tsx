import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Bug, RefreshCw, Download, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUnifiedAuth } from '@/hooks/useUnifiedAuth';
import { useSubscriptionMonitoring } from '@/hooks/admin/useSubscriptionMonitoring';
import SessionStateCard from '@/components/admin/SessionStateCard';
import LocalCacheViewer from '@/components/admin/LocalCacheViewer';
import ReconciliationHistory from '@/components/admin/ReconciliationHistory';
import EdgeFunctionLogs from '@/components/admin/EdgeFunctionLogs';
import SubscriptionStats from '@/components/admin/SubscriptionStats';
import SubscriptionDebugger from '@/components/SubscriptionDebugger';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const SubscriptionDebugPage = () => {
  const navigate = useNavigate();
  const { user } = useUnifiedAuth();
  const monitoring = useSubscriptionMonitoring();
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [targetUserId, setTargetUserId] = useState('');

  // Auto-refresh a cada 10 segundos
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      monitoring.getSessionState();
      monitoring.getGeneralStats();
      monitoring.fetchDebugLogs(targetUserId || undefined);
    }, 10000);

    return () => clearInterval(interval);
  }, [autoRefresh, monitoring, targetUserId]);

  const handleExportDiagnostic = () => {
    const diagnostic = {
      timestamp: new Date().toISOString(),
      admin: {
        id: user?.id,
        email: user?.email,
      },
      session: monitoring.sessionState,
      cache: monitoring.listLocalCaches(),
      history: monitoring.history,
      debugLogs: monitoring.debugLogs,
      stats: monitoring.stats,
    };

    const dataStr = JSON.stringify(diagnostic, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `subscription-diagnostic-${new Date().toISOString()}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Acesso Negado</CardTitle>
            <CardDescription>Você precisa estar logado como admin.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/auth')} className="w-full">
              Fazer Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/admin/sistema')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar ao Sistema
            </Button>
            <div className="flex items-center gap-2">
              <Bug className="h-6 w-6 text-destructive" />
              <h1 className="text-3xl font-bold">Debug de Assinatura</h1>
              <Badge variant="destructive" className="ml-2">Admin Only</Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={autoRefresh ? "default" : "outline"}
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${autoRefresh ? 'animate-spin' : ''}`} />
              Auto-refresh {autoRefresh && '10s'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportDiagnostic}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Exportar Diagnóstico
            </Button>
          </div>
        </div>

        {/* Admin Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Informações do Admin</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Admin ID</div>
                <div className="font-mono text-sm">{user.id}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Email</div>
                <div className="font-mono text-sm">{user.email}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Data/Hora</div>
                <div className="font-mono text-sm">{new Date().toLocaleString('pt-BR')}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Debug como outro usuário */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Debugar Outro Usuário</CardTitle>
            <CardDescription>
              Como admin, você pode debugar a assinatura de qualquer usuário.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="target-user">User ID ou Email</Label>
                <Input
                  id="target-user"
                  value={targetUserId}
                  onChange={(e) => setTargetUserId(e.target.value)}
                  placeholder="86494811-2d14-4c03-b0c0-37427246a93e"
                  className="font-mono"
                />
              </div>
              <div className="flex items-end gap-2">
                <Button
                  onClick={() => monitoring.fetchDebugLogs(targetUserId)}
                  disabled={!targetUserId || monitoring.loading}
                >
                  Carregar Logs
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setTargetUserId('');
                    monitoring.fetchDebugLogs();
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Session State */}
        <SessionStateCard monitoring={monitoring} />

        {/* Local Cache */}
        <LocalCacheViewer monitoring={monitoring} />

        {/* Reconciliation History */}
        <ReconciliationHistory monitoring={monitoring} />

        {/* Edge Function Logs */}
        <EdgeFunctionLogs targetUserId={targetUserId} />

        {/* Subscription Stats */}
        <SubscriptionStats monitoring={monitoring} />

        {/* Debug Completo */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Debug Completo</CardTitle>
            <CardDescription>
              Diagnóstico completo da assinatura atual ou de outro usuário.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SubscriptionDebugger />
          </CardContent>
        </Card>

        {/* Instruções */}
        <Card>
          <CardHeader>
            <CardTitle>Como usar o Debug</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">🔍 Executar Debug</h4>
              <p className="text-sm text-muted-foreground">
                Use o botão "Executar Debug" para analisar o estado atual da assinatura. 
                Isso verifica banco de dados local, Stripe, sincronização e políticas RLS.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">🔄 Forçar Reconciliação</h4>
              <p className="text-sm text-muted-foreground">
                Use "Forçar Reconciliação" quando houver divergências. Isso compara e corrige 
                automaticamente dados entre Stripe e banco local.
              </p>
            </div>

            <div>
              <h4 className="font-medium mb-2">👤 Debugar Outro Usuário</h4>
              <p className="text-sm text-muted-foreground">
                Como admin, você pode inserir o user_id de qualquer usuário para debugar 
                sua assinatura. Útil para suporte técnico.
              </p>
            </div>

            <div>
              <h4 className="font-medium mb-2">⚠️ Quando usar</h4>
              <p className="text-sm text-muted-foreground">
                • Assinatura não reconhecida corretamente<br />
                • Assinatura criada manualmente no Stripe<br />
                • Divergências entre Stripe e sistema<br />
                • Forçar sincronização completa
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SubscriptionDebugPage;
