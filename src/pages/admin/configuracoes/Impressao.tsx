import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Printer, TestTube } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export default function Impressao() {
  return (
    <div className="space-y-6">
      <Card className="p-6 space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-1 flex items-center gap-2">
            <Printer className="h-5 w-5" />
            Configurações de Impressora Térmica
          </h3>
          <p className="text-sm text-muted-foreground">
            Configure sua impressora térmica para impressão automática de pedidos
          </p>
        </div>

        <Separator />

        {/* Ativação */}
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="thermal-enabled">Impressão automática</Label>
            <p className="text-sm text-muted-foreground">
              Imprimir automaticamente ao receber novos pedidos
            </p>
          </div>
          <Switch id="thermal-enabled" />
        </div>

        {/* Tipo de impressora */}
        <div className="space-y-2">
          <Label htmlFor="printer-type">Tipo de impressora</Label>
          <Select defaultValue="usb">
            <SelectTrigger id="printer-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="usb">USB</SelectItem>
              <SelectItem value="network">Rede (IP)</SelectItem>
              <SelectItem value="bluetooth">Bluetooth</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Endereço IP (se rede) */}
        <div className="space-y-2">
          <Label htmlFor="printer-ip">Endereço IP da impressora</Label>
          <Input
            id="printer-ip"
            type="text"
            placeholder="192.168.1.100"
            className="max-w-md"
          />
          <p className="text-xs text-muted-foreground">
            Apenas para impressoras de rede
          </p>
        </div>

        {/* Largura do papel */}
        <div className="space-y-2">
          <Label htmlFor="paper-width">Largura do papel (mm)</Label>
          <Select defaultValue="80">
            <SelectTrigger id="paper-width" className="max-w-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="58">58mm</SelectItem>
              <SelectItem value="80">80mm</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Número de cópias */}
        <div className="space-y-2">
          <Label htmlFor="copies">Número de cópias</Label>
          <Input
            id="copies"
            type="number"
            defaultValue="1"
            min="1"
            max="5"
            className="max-w-xs"
          />
        </div>

        <Separator />

        {/* Opções de impressão */}
        <div className="space-y-4">
          <h4 className="font-medium">Opções de impressão</h4>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="print-customer-info">Imprimir dados do cliente</Label>
              <p className="text-sm text-muted-foreground">Nome, telefone e endereço</p>
            </div>
            <Switch id="print-customer-info" defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="print-qr">Imprimir QR Code</Label>
              <p className="text-sm text-muted-foreground">Para rastreamento do pedido</p>
            </div>
            <Switch id="print-qr" defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="print-logo">Imprimir logo da empresa</Label>
              <p className="text-sm text-muted-foreground">Logo no topo do cupom</p>
            </div>
            <Switch id="print-logo" defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="cut-paper">Cortar papel automaticamente</Label>
              <p className="text-sm text-muted-foreground">Após finalizar impressão</p>
            </div>
            <Switch id="cut-paper" defaultChecked />
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button>
            Salvar Configurações
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <TestTube className="h-4 w-4" />
            Imprimir Teste
          </Button>
        </div>
      </Card>
    </div>
  );
}
