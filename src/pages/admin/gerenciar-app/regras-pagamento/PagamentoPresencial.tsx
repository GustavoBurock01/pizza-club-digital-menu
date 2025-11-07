import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useState } from 'react';
import { toast } from 'sonner';

export default function PagamentoPresencial() {
  const [cash, setCash] = useState(true);
  const [changeFor, setChangeFor] = useState('100.00');
  const [deliveryFee, setDeliveryFee] = useState('5.00');
  const [freeDeliveryAbove, setFreeDeliveryAbove] = useState('50.00');

  const handleSave = () => {
    console.log('Salvando pagamento presencial:', { cash, changeFor, deliveryFee, freeDeliveryAbove });
    toast.success('Configurações de pagamento presencial salvas!');
  };

  return (
    <Card className="p-6 space-y-6">
      <div>
        <h3 className="font-semibold text-lg mb-1">Pagamento Presencial</h3>
        <p className="text-sm text-muted-foreground">
          Configure as formas de pagamento presencial e entrega
        </p>
      </div>

      <Separator />

      {/* Dinheiro */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="cash" className="font-medium">Dinheiro</Label>
            <p className="text-sm text-muted-foreground">Aceitar pagamento em dinheiro na entrega</p>
          </div>
          <Switch id="cash" checked={cash} onCheckedChange={setCash} />
        </div>

        {cash && (
          <div className="ml-6 space-y-2">
            <Label htmlFor="change-for">Aceitar troco para (R$)</Label>
            <Input
              id="change-for"
              type="number"
              step="0.01"
              value={changeFor}
              onChange={(e) => setChangeFor(e.target.value)}
              className="w-40"
              placeholder="100.00"
            />
            <p className="text-xs text-muted-foreground">
              Valor máximo que o entregador terá troco disponível
            </p>
          </div>
        )}
      </div>

      <Separator />

      {/* Taxa de entrega */}
      <div className="space-y-4">
        <h4 className="font-medium">Configurações de Entrega</h4>
        
        <div className="space-y-2">
          <Label htmlFor="delivery-fee">Taxa de entrega (R$)</Label>
          <Input
            id="delivery-fee"
            type="number"
            step="0.01"
            value={deliveryFee}
            onChange={(e) => setDeliveryFee(e.target.value)}
            className="w-40"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="free-delivery">Entrega grátis acima de (R$)</Label>
          <Input
            id="free-delivery"
            type="number"
            step="0.01"
            value={freeDeliveryAbove}
            onChange={(e) => setFreeDeliveryAbove(e.target.value)}
            className="w-40"
            placeholder="0 para desabilitar"
          />
          <p className="text-xs text-muted-foreground">
            Defina 0 para desabilitar entrega grátis
          </p>
        </div>
      </div>

      <div className="pt-4">
        <Button onClick={handleSave}>Salvar Configurações</Button>
      </div>
    </Card>
  );
}
