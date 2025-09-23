import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Truck, 
  CreditCard, 
  FileText, 
  Database, 
  Settings, 
  Activity,
  CheckCircle,
  AlertCircle,
  Clock,
  Zap,
  BarChart3,
  Download,
  Printer
} from "lucide-react";
import { DeliveryIntegrations } from "@/components/DeliveryIntegrations";
import { PaymentReconciliation } from "@/components/PaymentReconciliation";
import { FiscalReports } from "@/components/FiscalReports";
import { ERPIntegrations } from "@/components/ERPIntegrations";
import { WebhookLogs } from "@/components/WebhookLogs";
import { IntegrationsOverview } from "@/components/IntegrationsOverview";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ThermalPrintTest } from "@/components/ThermalPrintTest";
import { useIntegrationsData } from "@/hooks/useIntegrationsData";

export default function IntegrationsManager() {
  const { data: integrationsData, loading, refetch } = useIntegrationsData();
  const [activeTab, setActiveTab] = useState("overview");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const stats = integrationsData?.overview || {
    active_integrations: 0,
    pending_webhooks: 0,
    reconciliation_issues: 0,
    fiscal_reports_pending: 0,
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient">Central de Integrações</h1>
          <p className="text-muted-foreground">Gerencie todas as integrações externas em um só lugar</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="gap-2"
          >
            <Activity className="h-4 w-4" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover-lift glass">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Integrações Ativas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.active_integrations}
            </div>
            <p className="text-xs text-muted-foreground">
              Funcionando normalmente
            </p>
          </CardContent>
        </Card>

        <Card className="hover-lift glass">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Webhooks Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {stats.pending_webhooks}
            </div>
            <p className="text-xs text-muted-foreground">
              Aguardando processamento
            </p>
          </CardContent>
        </Card>

        <Card className="hover-lift glass">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reconciliação</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.reconciliation_issues}
            </div>
            <p className="text-xs text-muted-foreground">
              Discrepâncias encontradas
            </p>
          </CardContent>
        </Card>

        <Card className="hover-lift glass">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Relatórios Fiscais</CardTitle>
            <FileText className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.fiscal_reports_pending}
            </div>
            <p className="text-xs text-muted-foreground">
              Pendentes de geração
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-7 glass">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="delivery" className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            Entrega
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Pagamentos
          </TabsTrigger>
          <TabsTrigger value="fiscal" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Fiscal
          </TabsTrigger>
          <TabsTrigger value="erp" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            ERP
          </TabsTrigger>
          <TabsTrigger value="webhooks" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Webhooks
          </TabsTrigger>
          <TabsTrigger value="thermal" className="flex items-center gap-2">
            <Printer className="h-4 w-4" />
            Impressora
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <IntegrationsOverview data={integrationsData} />
        </TabsContent>

        <TabsContent value="delivery" className="space-y-6">
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Integrações de Entrega
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DeliveryIntegrations />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Reconciliação de Pagamentos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PaymentReconciliation />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fiscal" className="space-y-6">
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Relatórios Fiscais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FiscalReports />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="erp" className="space-y-6">
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Integração com ERP
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ERPIntegrations />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-6">
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Logs de Webhooks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <WebhookLogs />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="thermal" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <ThermalPrintTest />
            
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Printer className="h-5 w-5" />
                  Status das Impressoras
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Printer className="w-4 h-4 text-green-600" />
                    <span className="font-medium text-green-800">Sistema Operacional</span>
                  </div>
                  <Badge variant="outline" className="bg-green-100 text-green-800">
                    ✓ Ativo
                  </Badge>
                </div>
                
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p><strong>Edge Function:</strong> ✅ Configurada e ativa</p>
                  <p><strong>Formato:</strong> ESC/POS padrão Elgin</p>
                  <p><strong>Papel:</strong> 58mm ou 80mm térmico</p>
                  <p><strong>Conectividade:</strong> USB ou TCP/IP</p>
                </div>
                
                <div className="pt-3 border-t">
                  <h4 className="font-medium mb-2">Próximos Passos:</h4>
                  <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                    <li>Conectar impressora fisicamente</li>
                    <li>Configurar IP fixo (rede) ou instalar drivers (USB)</li>
                    <li>Executar teste de impressão</li>
                    <li>Verificar qualidade da comanda impressa</li>
                    <li>Treinar equipe no uso do sistema</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}