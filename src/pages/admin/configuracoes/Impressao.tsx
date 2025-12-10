import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Printer, 
  Layout, 
  Zap, 
  FileText, 
  Plus, 
  RefreshCw,
  Trash2,
  Info,
  ChevronDown,
  ChevronUp
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
  const [showPrinterForm, setShowPrinterForm] = useState(false);
  const [editingPrinter, setEditingPrinter] = useState<PrinterConfig | null>(null);
  const [testingPrinterId, setTestingPrinterId] = useState<string | null>(null);
  const [logsOpen, setLogsOpen] = useState(false);
  
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

      {/* Seção 1: Impressoras */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Printer className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Impressoras Configuradas</CardTitle>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={fetchPrinters} disabled={printersLoading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${printersLoading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Atualizar</span>
              </Button>
              <Button size="sm" onClick={handleAddPrinter}>
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Adicionar</span>
              </Button>
            </div>
          </div>
          <CardDescription>
            {printers.length} impressora{printers.length !== 1 ? 's' : ''} cadastrada{printers.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {printers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Printer className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground mb-3">
                Nenhuma impressora configurada. Adicione sua primeira impressora.
              </p>
              <Button variant="outline" size="sm" onClick={handleAddPrinter}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Impressora
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
        </CardContent>
      </Card>

      {/* Seção 2: Layout da Comanda */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Layout className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Layout da Comanda</CardTitle>
          </div>
          <CardDescription>
            Personalize como as comandas serão impressas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Editor */}
            <div>
              <h4 className="text-sm font-medium mb-3">Configurações</h4>
              {layout && (
                <PrintLayoutEditor
                  config={layout}
                  onSave={handleSaveLayout}
                  onReset={handleResetLayout}
                  isLoading={layoutLoading}
                />
              )}
            </div>

            {/* Preview */}
            <div>
              <h4 className="text-sm font-medium mb-3">Preview ao Vivo</h4>
              <div className="flex justify-center p-4 bg-muted/30 rounded-lg">
                {layout && (
                  <PrintPreviewLive 
                    layout={layout} 
                    paperWidth={58}
                    className="max-w-[250px]"
                  />
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Seção 3: Automação */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Automação de Impressão</CardTitle>
          </div>
          <CardDescription>
            Configure impressão automática ao receber novos pedidos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <PrintAutomationSettings 
            config={automationConfig}
            printers={printers}
            onSave={handleSaveAutomation}
            isLoading={false}
          />

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Quando ativada, as comandas serão impressas automaticamente ao confirmar pedidos.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Seção 4: Histórico de Impressões (Colapsável) */}
      <Collapsible open={logsOpen} onOpenChange={setLogsOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="pb-3 cursor-pointer hover:bg-muted/50 transition-colors rounded-t-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Histórico de Impressões</CardTitle>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">
                    {stats.total} registros • {stats.successRate?.toFixed(0) || 0}% sucesso
                  </span>
                  {logsOpen ? (
                    <ChevronUp className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <CardContent className="pt-0">
              <div className="flex items-center justify-end gap-2 mb-4">
                <Button variant="outline" size="sm" onClick={fetchLogs} disabled={logsLoading}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${logsLoading ? 'animate-spin' : ''}`} />
                  Atualizar
                </Button>
                <Button variant="outline" size="sm" onClick={handleClearOldLogs}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Limpar Antigos
                </Button>
              </div>

              <PrintLogsTable 
                logs={logs}
                onRefresh={fetchLogs}
                onRetry={handleRetryPrint}
              />
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

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
