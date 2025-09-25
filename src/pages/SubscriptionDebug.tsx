import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SubscriptionDebugger from '@/components/SubscriptionDebugger';
import { useUnifiedAuth } from '@/hooks/useUnifiedAuth';

const SubscriptionDebugPage = () => {
  const navigate = useNavigate();
  const { user, hasValidSubscription } = useUnifiedAuth();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Acesso Negado</CardTitle>
            <CardDescription>Você precisa estar logado para acessar esta página.</CardDescription>
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
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar ao Dashboard
            </Button>
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              <h1 className="text-3xl font-bold">Debug de Assinatura</h1>
            </div>
          </div>
          <Badge variant={hasValidSubscription() ? "default" : "secondary"}>
            {hasValidSubscription() ? "Assinatura Ativa" : "Sem Assinatura"}
          </Badge>
        </div>

        {/* User Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Informações do Usuário</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">ID do Usuário</div>
                <div className="font-mono text-sm">{user.id}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Email</div>
                <div className="font-mono text-sm">{user.email}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Status da Sessão</div>
                <Badge variant="outline">Autenticado</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Debug Component */}
        <SubscriptionDebugger />

        {/* Instructions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Como usar o Debug</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">🔍 Executar Debug</h4>
              <p className="text-sm text-muted-foreground">
                Clique em "Executar Debug" para analisar o estado atual da sua assinatura. Isso verificará:
                <br />• Status no banco de dados local
                <br />• Assinaturas no Stripe
                <br />• Sincronização entre os sistemas
                <br />• Políticas de segurança (RLS)
              </p>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">🔄 Forçar Reconciliação</h4>
              <p className="text-sm text-muted-foreground">
                Use "Forçar Reconciliação" quando houver divergências entre Stripe e banco local. Isso irá:
                <br />• Comparar dados do Stripe com o banco local
                <br />• Corrigir automaticamente divergências encontradas
                <br />• Atualizar informações desatualizadas
                <br />• Gerar relatório das correções aplicadas
              </p>
            </div>

            <div>
              <h4 className="font-medium mb-2">⚠️ Quando usar</h4>
              <p className="text-sm text-muted-foreground">
                Utilize estas ferramentas quando:
                <br />• Sua assinatura não está sendo reconhecida corretamente
                <br />• Você criou uma assinatura manualmente no Stripe
                <br />• Há divergências entre o que vê no Stripe e no sistema
                <br />• Precisa forçar uma sincronização completa
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SubscriptionDebugPage;