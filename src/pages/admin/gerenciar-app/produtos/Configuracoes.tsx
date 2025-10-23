import { PlaceholderFeature } from '@/components/admin/PlaceholderFeature';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';

export function Configuracoes() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Configurações de Produtos</h2>
        <p className="text-muted-foreground">
          Configure regras globais para produtos
        </p>
      </div>

      <Card className="p-6 space-y-6">
        {/* Estoque */}
        <div className="space-y-4">
          <h3 className="font-semibold">Controle de Estoque</h3>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="stock-control">Ativar controle de estoque</Label>
              <p className="text-sm text-muted-foreground">
                Produtos ficarão indisponíveis quando estoque zerar
              </p>
            </div>
            <Switch id="stock-control" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="low-stock">Alerta de estoque baixo</Label>
            <Input
              id="low-stock"
              type="number"
              placeholder="10"
              className="max-w-xs"
            />
            <p className="text-xs text-muted-foreground">
              Notificar quando estoque estiver abaixo deste valor
            </p>
          </div>
        </div>

        {/* Disponibilidade */}
        <div className="space-y-4">
          <h3 className="font-semibold">Disponibilidade</h3>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="auto-disable">Desativar automaticamente</Label>
              <p className="text-sm text-muted-foreground">
                Produtos sem estoque serão automaticamente desativados
              </p>
            </div>
            <Switch id="auto-disable" />
          </div>
        </div>

        {/* Preços */}
        <div className="space-y-4">
          <h3 className="font-semibold">Preços</h3>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="show-old-price">Exibir preço anterior</Label>
              <p className="text-sm text-muted-foreground">
                Mostrar preço riscado quando houver promoção
              </p>
            </div>
            <Switch id="show-old-price" defaultChecked />
          </div>
        </div>

        <div className="pt-4">
          <Button>Salvar Configurações</Button>
        </div>
      </Card>
    </div>
  );
}
