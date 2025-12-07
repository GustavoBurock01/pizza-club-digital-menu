import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Wifi, 
  Usb, 
  Bluetooth, 
  AlertCircle,
  Loader2,
  Search
} from 'lucide-react';
import { PrinterConfig } from './PrinterCard';

interface PrinterFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  printer?: PrinterConfig | null;
  onSave: (printer: Partial<PrinterConfig>) => Promise<void>;
  onDiscoverBluetooth?: () => Promise<BluetoothDevice[]>;
}

interface BluetoothDevice {
  name: string;
  address: string;
}

const defaultPrinter: Partial<PrinterConfig> = {
  name: '',
  connection_type: 'usb',
  ip_address: '',
  port: 9100,
  bluetooth_address: '',
  paper_width: 58,
  is_default: false,
  is_enabled: true,
};

export function PrinterForm({
  open,
  onOpenChange,
  printer,
  onSave,
  onDiscoverBluetooth,
}: PrinterFormProps) {
  const [formData, setFormData] = useState<Partial<PrinterConfig>>(defaultPrinter);
  const [isSaving, setIsSaving] = useState(false);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [bluetoothDevices, setBluetoothDevices] = useState<BluetoothDevice[]>([]);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!printer?.id;

  useEffect(() => {
    if (open) {
      if (printer) {
        setFormData(printer);
      } else {
        setFormData(defaultPrinter);
      }
      setError(null);
      setBluetoothDevices([]);
    }
  }, [open, printer]);

  const handleSubmit = async () => {
    setError(null);

    // Validation
    if (!formData.name?.trim()) {
      setError('Nome da impressora é obrigatório');
      return;
    }

    if (formData.connection_type === 'network' && !formData.ip_address?.trim()) {
      setError('Endereço IP é obrigatório para conexão de rede');
      return;
    }

    if (formData.connection_type === 'bluetooth' && !formData.bluetooth_address?.trim()) {
      setError('Endereço Bluetooth é obrigatório');
      return;
    }

    try {
      setIsSaving(true);
      await onSave(formData);
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar impressora');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscoverBluetooth = async () => {
    if (!onDiscoverBluetooth) return;
    
    try {
      setIsDiscovering(true);
      setError(null);
      const devices = await onDiscoverBluetooth();
      setBluetoothDevices(devices);
    } catch (err: any) {
      setError(err.message || 'Erro ao buscar dispositivos Bluetooth');
    } finally {
      setIsDiscovering(false);
    }
  };

  const selectBluetoothDevice = (device: BluetoothDevice) => {
    setFormData({
      ...formData,
      bluetooth_address: device.address,
      name: formData.name || device.name,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Impressora' : 'Adicionar Impressora'}
          </DialogTitle>
          <DialogDescription>
            Configure os detalhes da impressora térmica
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="printer-name">Nome da impressora</Label>
            <Input
              id="printer-name"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Impressora Cozinha"
            />
          </div>

          {/* Tipo de Conexão */}
          <div className="space-y-2">
            <Label>Tipo de conexão</Label>
            <Tabs 
              value={formData.connection_type} 
              onValueChange={(value) => setFormData({ 
                ...formData, 
                connection_type: value as 'usb' | 'network' | 'bluetooth' 
              })}
            >
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="usb" className="gap-2">
                  <Usb className="h-4 w-4" />
                  USB
                </TabsTrigger>
                <TabsTrigger value="network" className="gap-2">
                  <Wifi className="h-4 w-4" />
                  Rede
                </TabsTrigger>
                <TabsTrigger value="bluetooth" className="gap-2">
                  <Bluetooth className="h-4 w-4" />
                  Bluetooth
                </TabsTrigger>
              </TabsList>

              {/* USB Tab */}
              <TabsContent value="usb" className="mt-4">
                <Alert>
                  <Usb className="h-4 w-4" />
                  <AlertDescription>
                    Conecte a impressora via USB e certifique-se de que os drivers estão instalados.
                    A impressora será detectada automaticamente.
                  </AlertDescription>
                </Alert>
              </TabsContent>

              {/* Network Tab */}
              <TabsContent value="network" className="mt-4 space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="ip-address">Endereço IP</Label>
                    <Input
                      id="ip-address"
                      value={formData.ip_address || ''}
                      onChange={(e) => setFormData({ ...formData, ip_address: e.target.value })}
                      placeholder="192.168.1.100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="port">Porta</Label>
                    <Input
                      id="port"
                      type="number"
                      value={formData.port || 9100}
                      onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) || 9100 })}
                      placeholder="9100"
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  A porta padrão para impressoras térmicas é 9100
                </p>
              </TabsContent>

              {/* Bluetooth Tab */}
              <TabsContent value="bluetooth" className="mt-4 space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="bluetooth-address">Endereço Bluetooth</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDiscoverBluetooth}
                      disabled={isDiscovering}
                      className="gap-1"
                    >
                      {isDiscovering ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Search className="h-3.5 w-3.5" />
                      )}
                      Buscar
                    </Button>
                  </div>
                  <Input
                    id="bluetooth-address"
                    value={formData.bluetooth_address || ''}
                    onChange={(e) => setFormData({ ...formData, bluetooth_address: e.target.value })}
                    placeholder="XX:XX:XX:XX:XX:XX"
                  />
                </div>

                {/* Discovered Devices */}
                {bluetoothDevices.length > 0 && (
                  <div className="space-y-2">
                    <Label>Dispositivos encontrados</Label>
                    <div className="grid gap-2 max-h-32 overflow-y-auto">
                      {bluetoothDevices.map((device) => (
                        <Button
                          key={device.address}
                          variant="outline"
                          className="justify-start gap-2 h-auto py-2"
                          onClick={() => selectBluetoothDevice(device)}
                        >
                          <Bluetooth className="h-4 w-4 text-blue-500" />
                          <div className="text-left">
                            <p className="font-medium">{device.name}</p>
                            <p className="text-xs text-muted-foreground font-mono">
                              {device.address}
                            </p>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                <Alert>
                  <Bluetooth className="h-4 w-4" />
                  <AlertDescription>
                    Certifique-se de que o Bluetooth está ativado e a impressora está pareada.
                  </AlertDescription>
                </Alert>
              </TabsContent>
            </Tabs>
          </div>

          {/* Largura do Papel */}
          <div className="space-y-2">
            <Label htmlFor="paper-width">Largura do papel</Label>
            <Select
              value={String(formData.paper_width)}
              onValueChange={(value) => setFormData({ ...formData, paper_width: parseInt(value) })}
            >
              <SelectTrigger id="paper-width">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="58">58mm (padrão)</SelectItem>
                <SelectItem value="80">80mm</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Opções */}
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="is-default">Definir como padrão</Label>
              <p className="text-xs text-muted-foreground">
                Usar esta impressora para impressão automática
              </p>
            </div>
            <Switch
              id="is-default"
              checked={formData.is_default || false}
              onCheckedChange={(checked) => setFormData({ ...formData, is_default: checked })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              isEditing ? 'Salvar alterações' : 'Adicionar impressora'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
