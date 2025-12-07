import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  Store, 
  Phone, 
  MapPin, 
  FileText, 
  User, 
  Mail,
  Type,
  AlignJustify,
  Save,
  RotateCcw,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PrintLayoutConfig {
  id?: string;
  show_logo: boolean;
  show_store_name: boolean;
  show_store_phone: boolean;
  show_store_address: boolean;
  show_customer_cpf: boolean;
  show_customer_email: boolean;
  font_size: 'small' | 'normal' | 'large';
  line_spacing: number;
  footer_message: string;
}

interface PrintLayoutEditorProps {
  config: PrintLayoutConfig;
  onSave: (config: PrintLayoutConfig) => Promise<void>;
  onReset: () => void;
  isLoading?: boolean;
}

const defaultConfig: PrintLayoutConfig = {
  show_logo: false,
  show_store_name: true,
  show_store_phone: true,
  show_store_address: false,
  show_customer_cpf: false,
  show_customer_email: false,
  font_size: 'normal',
  line_spacing: 2,
  footer_message: 'Obrigado pela preferência!',
};

export function PrintLayoutEditor({
  config,
  onSave,
  onReset,
  isLoading = false,
}: PrintLayoutEditorProps) {
  const [localConfig, setLocalConfig] = useState<PrintLayoutConfig>(config);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setLocalConfig(config);
    setHasChanges(false);
  }, [config]);

  const handleChange = <K extends keyof PrintLayoutConfig>(
    key: K,
    value: PrintLayoutConfig[K]
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

  const handleReset = () => {
    setLocalConfig(defaultConfig);
    setHasChanges(true);
    onReset();
  };

  const ToggleOption = ({
    id,
    label,
    description,
    icon: Icon,
    checked,
    onCheckedChange,
  }: {
    id: string;
    label: string;
    description?: string;
    icon: any;
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
  }) => (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-3">
        <div className="p-1.5 bg-muted rounded">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div>
          <Label htmlFor={id} className="cursor-pointer">{label}</Label>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
      />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <Card className="p-4">
        <h4 className="font-semibold mb-4 flex items-center gap-2">
          <Store className="h-4 w-4" />
          Cabeçalho da Comanda
        </h4>
        
        <div className="space-y-1">
          <ToggleOption
            id="show-logo"
            label="Logo da loja"
            description="Imprimir logo no topo (requer suporte da impressora)"
            icon={Store}
            checked={localConfig.show_logo}
            onCheckedChange={(checked) => handleChange('show_logo', checked)}
          />
          <ToggleOption
            id="show-store-name"
            label="Nome da loja"
            icon={Store}
            checked={localConfig.show_store_name}
            onCheckedChange={(checked) => handleChange('show_store_name', checked)}
          />
          <ToggleOption
            id="show-store-phone"
            label="Telefone da loja"
            icon={Phone}
            checked={localConfig.show_store_phone}
            onCheckedChange={(checked) => handleChange('show_store_phone', checked)}
          />
          <ToggleOption
            id="show-store-address"
            label="Endereço da loja"
            icon={MapPin}
            checked={localConfig.show_store_address}
            onCheckedChange={(checked) => handleChange('show_store_address', checked)}
          />
        </div>
      </Card>

      {/* Customer Info Section */}
      <Card className="p-4">
        <h4 className="font-semibold mb-4 flex items-center gap-2">
          <User className="h-4 w-4" />
          Dados do Cliente
        </h4>
        
        <div className="space-y-1">
          <ToggleOption
            id="show-customer-cpf"
            label="CPF do cliente"
            description="Para fins fiscais"
            icon={FileText}
            checked={localConfig.show_customer_cpf}
            onCheckedChange={(checked) => handleChange('show_customer_cpf', checked)}
          />
          <ToggleOption
            id="show-customer-email"
            label="E-mail do cliente"
            icon={Mail}
            checked={localConfig.show_customer_email}
            onCheckedChange={(checked) => handleChange('show_customer_email', checked)}
          />
        </div>
      </Card>

      {/* Typography Section */}
      <Card className="p-4">
        <h4 className="font-semibold mb-4 flex items-center gap-2">
          <Type className="h-4 w-4" />
          Tipografia
        </h4>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="font-size">Tamanho da fonte</Label>
            <Select
              value={localConfig.font_size}
              onValueChange={(value) => handleChange('font_size', value as PrintLayoutConfig['font_size'])}
            >
              <SelectTrigger id="font-size">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="small">Pequena</SelectItem>
                <SelectItem value="normal">Normal (recomendado)</SelectItem>
                <SelectItem value="large">Grande</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Espaçamento entre linhas</Label>
              <span className="text-sm text-muted-foreground">
                {localConfig.line_spacing}px
              </span>
            </div>
            <Slider
              value={[localConfig.line_spacing]}
              onValueChange={([value]) => handleChange('line_spacing', value)}
              min={0}
              max={8}
              step={1}
              className="w-full"
            />
          </div>
        </div>
      </Card>

      {/* Footer Section */}
      <Card className="p-4">
        <h4 className="font-semibold mb-4 flex items-center gap-2">
          <AlignJustify className="h-4 w-4" />
          Rodapé
        </h4>
        
        <div className="space-y-2">
          <Label htmlFor="footer-message">Mensagem de rodapé</Label>
          <Textarea
            id="footer-message"
            value={localConfig.footer_message}
            onChange={(e) => handleChange('footer_message', e.target.value)}
            placeholder="Ex: Obrigado pela preferência!"
            rows={2}
          />
          <p className="text-xs text-muted-foreground">
            Aparece no final de cada comanda
          </p>
        </div>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4">
        <Button
          variant="outline"
          onClick={handleReset}
          disabled={isSaving || isLoading}
          className="gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          Restaurar padrão
        </Button>
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
          Salvar layout
        </Button>
      </div>
    </div>
  );
}
