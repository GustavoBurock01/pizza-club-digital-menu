import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Printer, 
  Layout, 
  Zap, 
  FileText, 
  Plus, 
  RefreshCw,
  Trash2,
  Info
} from 'lucide-react';
import { toast } from 'sonner';

// Componentes de impressão
import { 
  PrinterCard, 
  PrinterForm, 
  PrintLayoutEditor, 
  PrintPreviewLive, 
  PrintLogsTable, 
  PrintAutomationSettings,
  type PrintLayoutConfig
} from '@/components/printing';
import type { PrinterConfig } from '@/components/printing/PrinterCard';
import type { AutomationConfig } from '@/components/printing/PrintAutomationSettings';

// Hooks
import { usePrinterManager } from '@/hooks/usePrinterManager';
import { usePrintLayout } from '@/hooks/usePrintLayout';
import { usePrintLogs } from '@/hooks/usePrintLogs';

// Config padrão de automação (salva em localStorage)
const defaultAutomationConfig: AutomationConfig = {
  auto_print_enabled: false,
  auto_print_on_confirm: true,
  auto_print_on_payment: false,
  default_copies: 1,
  print_delay_seconds: 0,
  retry_enabled: true,
  retry_attempts: 3,
  retry_delay_seconds: 5,
  sound_enabled: true,
};

export default function Impressao() {
  const [activeTab, setActiveTab] = useState('impressoras');
  const [showPrinterForm, setShowPrinterForm] = useState(false);
  const [editingPrinter, setEditingPrinter] = useState<PrinterConfig | null>(null);
  const [testingPrinterId, setTestingPrinterId] = useState<string | null>(null);
  
  // Automação config (localStorage)
  const [automationConfig, setAutomationConfig] = useState<AutomationConfig>(defaultAutomationConfig);

  // Hooks de gerenciamento
  const { 
    printers, 
    isLoading: printersLoading, 
    addPrinter, 
    updatePrinter, 
    deletePrinter,
    togglePrinterEnabled,
    setDefaultPrinter,
    testPrinter,
    fetchPrinters
  } = usePrinterManager();

  const { 
    layout, 
    isLoading: layoutLoading, 
    saveLayout, 
    resetLayout,
  } = usePrintLayout();

  const { 
    logs, 
    isLoading: logsLoading, 
    fetchLogs, 
    clearOldLogs,
    getStats
  } = usePrintLogs({ limit: 100, autoRefresh: true, refreshInterval: 30000 });

  // Carregar config de automação do localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('print-automation-config');
      if (saved) {
        setAutomationConfig(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Erro ao carregar config de automação:', error);
    }
  }, []);

  // Handlers - Impressoras
  const handleAddPrinter = () => {
    setEditingPrinter(null);
    setShowPrinterForm(true);
  };

  const handleEditPrinter = (printer: PrinterConfig) => {
    setEditingPrinter(printer);
    setShowPrinterForm(true);
  };

  const handleSavePrinter = async (data: Partial<PrinterConfig>) => {
    try {
      if (editingPrinter) {
        await updatePrinter(editingPrinter.id, data);
        toast.success('Impressora atualizada com sucesso!');
      } else {
        await addPrinter(data);
        toast.success('Impressora adicionada com sucesso!');
      }
      setShowPrinterForm(false);
      setEditingPrinter(null);
    } catch (error) {
      toast.error('Erro ao salvar impressora');
    }
  };

  const handleDeletePrinter = async (printerId: string) => {
    try {
      await deletePrinter(printerId);
      toast.success('Impressora removida');
    } catch (error) {
      toast.error('Erro ao remover impressora');
    }
  };

  const handleTestPrinter = async (printerId: string) => {
    const printer = printers.find(p => p.id === printerId);
    if (!printer) return;
    
    try {
      setTestingPrinterId(printerId);
      await testPrinter(printer);
      toast.success('Teste enviado com sucesso!');
    } catch (error) {
      toast.error('Erro ao testar impressora');
    } finally {
      setTestingPrinterId(null);
    }
  };

  // Handlers - Layout
  const handleSaveLayout = async (newLayout: PrintLayoutConfig) => {
    try {
      await saveLayout(newLayout);
      toast.success('Layout salvo com sucesso!');
    } catch (error) {
      toast.error('Erro ao salvar layout');
    }
  };

  const handleResetLayout = () => {
    resetLayout();
    toast.success('Layout restaurado para padrão');
  };

  // Handlers - Automação
  const handleSaveAutomation = async (newConfig: AutomationConfig) => {
    try {
      localStorage.setItem('print-automation-config', JSON.stringify(newConfig));
      setAutomationConfig(newConfig);
      toast.success('Configurações de automação salvas!');
    } catch (error) {
      toast.error('Erro ao salvar configurações');
    }
  };

  // Handlers - Logs
  const handleClearOldLogs = async () => {
    try {
      await clearOldLogs(7);
      toast.success('Logs antigos removidos');
    } catch (error) {
      toast.error('Erro ao limpar logs');
    }
  };

  const handleRetryPrint = async (logId: string, orderId: string) => {
    const defaultPrinter = printers.find(p => p.is_default && p.is_enabled);
    if (defaultPrinter) {
      await testPrinter(defaultPrinter);
      toast.info('Reimpressão enviada');
    } else {
      toast.error('Nenhuma impressora padrão configurada');
    }
  };

  const stats = getStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Printer className="h-6 w-6" />
          Configurações de Impressão
        </h2>
        <p className="text-muted-foreground">
          Gerencie impressoras, layout de comandas e automação de impressão
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="impressoras" className="flex items-center gap-2">
            <Printer className="h-4 w-4" />
            <span className="hidden sm:inline">Impressoras</span>
          </TabsTrigger>
          <TabsTrigger value="layout" className="flex items-center gap-2">
            <Layout className="h-4 w-4" />
            <span className="hidden sm:inline">Layout</span>
          </TabsTrigger>
          <TabsTrigger value="automacao" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            <span className="hidden sm:inline">Automação</span>
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Logs</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab: Impressoras */}
        <TabsContent value="impressoras" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Impressoras Configuradas</h3>
              <p className="text-sm text-muted-foreground">
                {printers.length} impressora{printers.length !== 1 ? 's' : ''} cadastrada{printers.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={fetchPrinters} disabled={printersLoading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${printersLoading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
              <Button onClick={handleAddPrinter}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Impressora
              </Button>
            </div>
          </div>

          {printers.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Printer className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhuma impressora configurada</h3>
                <p className="text-sm text-muted-foreground text-center mb-4">
                  Adicione sua primeira impressora para começar a imprimir comandas automaticamente.
                </p>
                <Button onClick={handleAddPrinter}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Impressora
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {printers.map((printer) => (
                <PrinterCard
                  key={printer.id}
                  printer={printer}
                  onEdit={handleEditPrinter}
                  onDelete={handleDeletePrinter}
                  onTest={handleTestPrinter}
                  onToggleEnabled={(id, enabled) => togglePrinterEnabled(id, enabled)}
                  onSetDefault={setDefaultPrinter}
                  isTesting={testingPrinterId === printer.id}
                />
              ))}
            </div>
          )}

          {/* Instruções */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Dica:</strong> Configure uma impressora como padrão para que ela seja usada automaticamente na impressão de comandas.
              Impressoras USB funcionam melhor com modelos Elgin i7 Plus.
            </AlertDescription>
          </Alert>
        </TabsContent>

        {/* Tab: Layout */}
        <TabsContent value="layout" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Layout da Comanda</h3>
              <p className="text-sm text-muted-foreground">
                Personalize como as comandas serão impressas
              </p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Editor */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Configurações</CardTitle>
                <CardDescription>
                  Selecione quais informações exibir na comanda
                </CardDescription>
              </CardHeader>
              <CardContent>
                {layout && (
                  <PrintLayoutEditor
                    config={layout}
                    onSave={handleSaveLayout}
                    onReset={handleResetLayout}
                    isLoading={layoutLoading}
                  />
                )}
              </CardContent>
            </Card>

            {/* Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Preview ao Vivo</CardTitle>
                <CardDescription>
                  Visualize como a comanda ficará
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                {layout && (
                  <PrintPreviewLive 
                    layout={layout} 
                    paperWidth={58}
                    className="max-w-[250px]"
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Automação */}
        <TabsContent value="automacao" className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">Automação de Impressão</h3>
            <p className="text-sm text-muted-foreground">
              Configure impressão automática ao receber novos pedidos
            </p>
          </div>

          <PrintAutomationSettings 
            config={automationConfig}
            printers={printers}
            onSave={handleSaveAutomation}
            isLoading={false}
          />

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Quando a impressão automática está ativada, as comandas serão impressas automaticamente 
              assim que um pedido for confirmado. Os atendentes verão um indicador no painel.
            </AlertDescription>
          </Alert>
        </TabsContent>

        {/* Tab: Logs */}
        <TabsContent value="logs" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Histórico de Impressões</h3>
              <p className="text-sm text-muted-foreground">
                {stats.total} registro{stats.total !== 1 ? 's' : ''} • 
                {' '}{stats.successful} sucesso{stats.successful !== 1 ? 's' : ''} • 
                {' '}{stats.failed} erro{stats.failed !== 1 ? 's' : ''}
                {stats.successRate !== undefined && ` • ${stats.successRate.toFixed(0)}% taxa de sucesso`}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={fetchLogs} disabled={logsLoading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${logsLoading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
              <Button variant="outline" size="sm" onClick={handleClearOldLogs}>
                <Trash2 className="h-4 w-4 mr-2" />
                Limpar Antigos
              </Button>
            </div>
          </div>

          <PrintLogsTable 
            logs={logs}
            onRefresh={fetchLogs}
            onRetry={handleRetryPrint}
          />
        </TabsContent>
      </Tabs>

      {/* Dialog: Adicionar/Editar Impressora */}
      <PrinterForm
        open={showPrinterForm}
        onOpenChange={setShowPrinterForm}
        printer={editingPrinter}
        onSave={handleSavePrinter}
      />
    </div>
  );
}
