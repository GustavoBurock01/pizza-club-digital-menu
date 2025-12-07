import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Zap, 
  Bell, 
  Clock, 
  Copy, 
  RefreshCw,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { PrinterConfig } from './PrinterCard';

export interface AutomationConfig {
  auto_print_enabled: boolean;
  auto_print_on_confirm: boolean;
  auto_print_on_payment: boolean;
  default_copies: number;
  print_delay_seconds: number;
  retry_enabled: boolean;
  retry_attempts: number;
  retry_delay_seconds: number;
  sound_enabled: boolean;
  default_printer_id?: string;
}

interface PrintAutomationSettingsProps {
  config: AutomationConfig;
  printers: PrinterConfig[];
  onSave: (config: AutomationConfig) => Promise<void>;
  isLoading?: boolean;
}

const defaultAutomation: AutomationConfig = {
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

export function PrintAutomationSettings({
  config,
  printers,
  onSave,
  isLoading = false,
}: PrintAutomationSettingsProps) {
  const [localConfig, setLocalConfig] = useState<AutomationConfig>({
    ...defaultAutomation,
    ...config,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const handleChange = <K extends keyof AutomationConfig>(
    key: K,
    value: AutomationConfig[K]
  ) => {
    setLocalConfig((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await onSave(localConfig);
      setHasChanges(false);
    } finally {
      setIsSaving(false);
    }
  };

  const enabledPrinters = printers.filter(p => p.is_enabled);

  return (
    <div className="space-y-6">
      {/* Main Toggle */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h4 className="font-semibold">Impressão Automática</h4>
              <p className="text-sm text-muted-foreground">
                Imprimir comandas automaticamente quando novos pedidos chegarem
              </p>
            </div>
          </div>
          <Switch
            checked={localConfig.auto_print_enabled}
            onCheckedChange={(checked) => handleChange('auto_print_enabled', checked)}
          />
        </div>

        {localConfig.auto_print_enabled && enabledPrinters.length === 0 && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Nenhuma impressora ativa. Adicione e ative uma impressora para usar a impressão automática.
            </AlertDescription>
          </Alert>
        )}

        {localConfig.auto_print_enabled && enabledPrinters.length > 0 && (
          <Alert className="mt-4 bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">
              Impressão automática ativa! Pedidos serão impressos automaticamente.
            </AlertDescription>
          </Alert>
        )}
      </Card>

      {/* Trigger Settings */}
      <Card className="p-4">
        <h4 className="font-semibold mb-4 flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Quando imprimir
        </h4>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Ao confirmar pedido</Label>
              <p className="text-xs text-muted-foreground">
                Imprimir quando o status mudar para "Confirmado"
              </p>
            </div>
            <Switch
              checked={localConfig.auto_print_on_confirm}
              onCheckedChange={(checked) => handleChange('auto_print_on_confirm', checked)}
              disabled={!localConfig.auto_print_enabled}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Ao receber pagamento</Label>
              <p className="text-xs text-muted-foreground">
                Imprimir quando o pagamento for confirmado
              </p>
            </div>
            <Switch
              checked={localConfig.auto_print_on_payment}
              onCheckedChange={(checked) => handleChange('auto_print_on_payment', checked)}
              disabled={!localConfig.auto_print_enabled}
            />
          </div>

          <div className="space-y-2">
            <Label>Atraso antes de imprimir</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={localConfig.print_delay_seconds}
                onChange={(e) => handleChange('print_delay_seconds', parseInt(e.target.value) || 0)}
                className="w-24"
                min={0}
                max={60}
                disabled={!localConfig.auto_print_enabled}
              />
              <span className="text-sm text-muted-foreground">segundos</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Útil para evitar impressões de pedidos cancelados rapidamente
            </p>
          </div>
        </div>
      </Card>

      {/* Print Settings */}
      <Card className="p-4">
        <h4 className="font-semibold mb-4 flex items-center gap-2">
          <Copy className="h-4 w-4" />
          Configurações de impressão
        </h4>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Número de cópias</Label>
              <Select
                value={String(localConfig.default_copies)}
                onValueChange={(value) => handleChange('default_copies', parseInt(value))}
                disabled={!localConfig.auto_print_enabled}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 cópia</SelectItem>
                  <SelectItem value="2">2 cópias</SelectItem>
                  <SelectItem value="3">3 cópias</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Impressora padrão</Label>
              <Select
                value={localConfig.default_printer_id || ''}
                onValueChange={(value) => handleChange('default_printer_id', value)}
                disabled={!localConfig.auto_print_enabled || enabledPrinters.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar..." />
                </SelectTrigger>
                <SelectContent>
                  {enabledPrinters.map((printer) => (
                    <SelectItem key={printer.id} value={printer.id}>
                      {printer.name}
                      {printer.is_default && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          Padrão
                        </Badge>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </Card>

      {/* Retry Settings */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Tentativas automáticas
          </h4>
          <Switch
            checked={localConfig.retry_enabled}
            onCheckedChange={(checked) => handleChange('retry_enabled', checked)}
            disabled={!localConfig.auto_print_enabled}
          />
        </div>

        {localConfig.retry_enabled && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Número de tentativas</Label>
              <Select
                value={String(localConfig.retry_attempts)}
                onValueChange={(value) => handleChange('retry_attempts', parseInt(value))}
                disabled={!localConfig.auto_print_enabled}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 tentativa</SelectItem>
                  <SelectItem value="2">2 tentativas</SelectItem>
                  <SelectItem value="3">3 tentativas</SelectItem>
                  <SelectItem value="5">5 tentativas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Intervalo entre tentativas</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={localConfig.retry_delay_seconds}
                  onChange={(e) => handleChange('retry_delay_seconds', parseInt(e.target.value) || 5)}
                  className="w-24"
                  min={1}
                  max={60}
                  disabled={!localConfig.auto_print_enabled}
                />
                <span className="text-sm text-muted-foreground">seg</span>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Sound Settings */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <div>
              <Label>Som ao imprimir</Label>
              <p className="text-xs text-muted-foreground">
                Tocar som de notificação após imprimir
              </p>
            </div>
          </div>
          <Switch
            checked={localConfig.sound_enabled}
            onCheckedChange={(checked) => handleChange('sound_enabled', checked)}
            disabled={!localConfig.auto_print_enabled}
          />
        </div>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={!hasChanges || isSaving || isLoading}
          className="gap-2"
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Salvar configurações
        </Button>
      </div>
    </div>
  );
}
