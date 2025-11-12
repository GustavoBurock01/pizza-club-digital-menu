import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Clock, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { useSubscriptionMonitoring } from '@/hooks/admin/useSubscriptionMonitoring';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SessionStateCardProps {
  monitoring: ReturnType<typeof useSubscriptionMonitoring>;
}

const SessionStateCard = ({ monitoring }: SessionStateCardProps) => {
  const { toast } = useToast();

  useEffect(() => {
    monitoring.getSessionState();
  }, [monitoring]);

  const handleRenewSession = async () => {
    try {
      const { error } = await supabase.auth.refreshSession();
      
      if (error) throw error;

      await monitoring.getSessionState();
      
      toast({
        title: "Sessão renovada",
        description: "Token de autenticação atualizado com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao renovar sessão",
        description: "Não foi possível renovar a sessão. Tente fazer login novamente.",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = () => {
    if (!monitoring.sessionState) return <XCircle className="h-5 w-5 text-destructive" />;
    
    const { isValid, expiresAt } = monitoring.sessionState;
    const timeRemaining = expiresAt - Date.now();
    const fiveMinutes = 5 * 60 * 1000;

    if (!isValid) return <XCircle className="h-5 w-5 text-destructive" />;
    if (timeRemaining < fiveMinutes) return <AlertTriangle className="h-5 w-5 text-warning" />;
    return <CheckCircle className="h-5 w-5 text-success" />;
  };

  const getStatusBadge = () => {
    if (!monitoring.sessionState) return <Badge variant="destructive">Sem Sessão</Badge>;
    
    const { isValid, expiresAt } = monitoring.sessionState;
    const timeRemaining = expiresAt - Date.now();
    const fiveMinutes = 5 * 60 * 1000;

    if (!isValid) return <Badge variant="destructive">Expirado</Badge>;
    if (timeRemaining < fiveMinutes) return <Badge variant="outline" className="bg-warning/10 text-warning border-warning">Expirando em Breve</Badge>;
    return <Badge className="bg-success/10 text-success border-success">Válido</Badge>;
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle>Estado da Sessão</CardTitle>
            {getStatusIcon()}
          </div>
          {getStatusBadge()}
        </div>
        <CardDescription>
          Informações sobre o token JWT e validade da sessão
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!monitoring.sessionState ? (
          <div className="text-center py-8 text-muted-foreground">
            Carregando informações da sessão...
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Token JWT</div>
                <div className="font-mono text-xs break-all bg-muted p-2 rounded">
                  {monitoring.sessionState.token.substring(0, 20)}...
                  {monitoring.sessionState.token.substring(monitoring.sessionState.token.length - 20)}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Data de Expiração</div>
                <div className="font-mono text-sm">
                  {new Date(monitoring.sessionState.expiresAt).toLocaleString('pt-BR')}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Tempo Restante
                </div>
                <div className={`text-lg font-semibold ${
                  !monitoring.sessionState.isValid ? 'text-destructive' :
                  (monitoring.sessionState.expiresAt - Date.now()) < 5 * 60 * 1000 ? 'text-warning' :
                  'text-success'
                }`}>
                  {monitoring.sessionState.timeRemaining}
                </div>
              </div>
              <div className="flex items-end">
                <Button
                  onClick={handleRenewSession}
                  variant="outline"
                  className="w-full"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Renovar Sessão
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SessionStateCard;
