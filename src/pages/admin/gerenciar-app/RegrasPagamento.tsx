import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

export default function RegrasPagamento() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Regras e Pagamentos</h2>
        <p className="text-muted-foreground">
          Configure formas de pagamento e regras de pedidos
        </p>
      </div>

      <Card className="p-6 space-y-6">
        {/* Formas de pagamento */}
        <div className="space-y-4">
          <h3 className="font-semibold">Formas de Pagamento</h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="pix">PIX</Label>
              <Switch id="pix" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="credit">Cartão de Crédito</Label>
              <Switch id="credit" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="debit">Cartão de Débito</Label>
              <Switch id="debit" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="cash">Dinheiro</Label>
              <Switch id="cash" defaultChecked />
            </div>
          </div>
        </div>

        <Separator />

        {/* Limites de pedido */}
        <div className="space-y-4">
          <h3 className="font-semibold">Limites de Pedido</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="min-order">Valor Mínimo (R$)</Label>
              <Input
                id="min-order"
                type="number"
                step="0.01"
                defaultValue="15.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max-order">Valor Máximo (R$)</Label>
              <Input
                id="max-order"
                type="number"
                step="0.01"
                defaultValue="500.00"
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Descontos automáticos */}
        <div className="space-y-4">
          <h3 className="font-semibold">Descontos Automáticos</h3>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="auto-discount">Ativar desconto progressivo</Label>
              <p className="text-sm text-muted-foreground">
                Ex: 10% acima de R$ 100
              </p>
            </div>
            <Switch id="auto-discount" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="discount-threshold">Valor mínimo (R$)</Label>
              <Input
                id="discount-threshold"
                type="number"
                step="0.01"
                placeholder="100.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="discount-percent">Desconto (%)</Label>
              <Input
                id="discount-percent"
                type="number"
                step="1"
                placeholder="10"
              />
            </div>
          </div>
        </div>

        <div className="pt-4">
          <Button>Salvar Configurações</Button>
        </div>
      </Card>
    </div>
  );
}
