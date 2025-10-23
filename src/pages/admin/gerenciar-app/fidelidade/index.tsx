import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

export default function Fidelidade() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Sistema de Fidelidade</h2>
        <p className="text-muted-foreground">
          Configure pontos e recompensas para seus clientes
        </p>
      </div>

      <Card className="p-6 space-y-6">
        {/* Ativar sistema */}
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="loyalty-active">Ativar programa de fidelidade</Label>
            <p className="text-sm text-muted-foreground">
              Clientes ganham pontos a cada compra
            </p>
          </div>
          <Switch id="loyalty-active" />
        </div>

        <Separator />

        {/* Configuração de pontos */}
        <div className="space-y-4">
          <h3 className="font-semibold">Acúmulo de Pontos</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="points-per-real">Pontos por R$ 1,00</Label>
              <Input
                id="points-per-real"
                type="number"
                step="0.1"
                defaultValue="1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="min-purchase">Compra mínima (R$)</Label>
              <Input
                id="min-purchase"
                type="number"
                step="0.01"
                defaultValue="15.00"
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Resgatar pontos */}
        <div className="space-y-4">
          <h3 className="font-semibold">Resgate de Pontos</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="points-to-discount">Pontos para desconto</Label>
              <Input
                id="points-to-discount"
                type="number"
                defaultValue="100"
              />
              <p className="text-xs text-muted-foreground">
                Quantos pontos equivalem a R$ 1,00 de desconto
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="max-discount">Desconto máximo (%)</Label>
              <Input
                id="max-discount"
                type="number"
                defaultValue="50"
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Bônus */}
        <div className="space-y-4">
          <h3 className="font-semibold">Bônus Especiais</h3>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="birthday-bonus">Bônus de aniversário</Label>
              <p className="text-sm text-muted-foreground">
                Pontos extras no mês do aniversário
              </p>
            </div>
            <Input
              id="birthday-bonus"
              type="number"
              defaultValue="100"
              className="w-24"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="first-purchase-bonus">Primeira compra</Label>
              <p className="text-sm text-muted-foreground">
                Bônus para novos clientes
              </p>
            </div>
            <Input
              id="first-purchase-bonus"
              type="number"
              defaultValue="50"
              className="w-24"
            />
          </div>
        </div>

        <div className="pt-4">
          <Button>Salvar Configurações</Button>
        </div>
      </Card>
    </div>
  );
}
