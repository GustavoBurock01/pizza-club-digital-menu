import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tag, Plus, Copy, Trash2, TrendingUp, Users, DollarSign } from 'lucide-react';

const coupons = [
  {
    id: 1,
    code: 'WELCOME20',
    description: 'Desconto de boas-vindas',
    type: 'percentage',
    value: 20,
    minValue: 30,
    maxDiscount: 15,
    uses: 145,
    limit: 500,
    validUntil: '2024-03-31',
    isActive: true,
  },
  {
    id: 2,
    code: 'PIZZA10OFF',
    description: 'R$ 10 de desconto em pizzas',
    type: 'fixed',
    value: 10,
    minValue: 50,
    maxDiscount: null,
    uses: 87,
    limit: 200,
    validUntil: '2024-02-28',
    isActive: true,
  },
  {
    id: 3,
    code: 'FRETEGRATIS',
    description: 'Frete grátis em pedidos acima de R$ 40',
    type: 'free_delivery',
    value: 0,
    minValue: 40,
    maxDiscount: null,
    uses: 234,
    limit: 1000,
    validUntil: '2024-12-31',
    isActive: true,
  },
  {
    id: 4,
    code: 'PRIMEIRACOMPRA',
    description: '30% OFF na primeira compra',
    type: 'percentage',
    value: 30,
    minValue: 25,
    maxDiscount: 20,
    uses: 56,
    limit: 100,
    validUntil: '2024-06-30',
    isActive: false,
  },
];

export default function Cupons() {
  const [isCreating, setIsCreating] = useState(false);

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'percentage': return 'Porcentagem';
      case 'fixed': return 'Valor Fixo';
      case 'free_delivery': return 'Frete Grátis';
      default: return type;
    }
  };

  const getTotalRevenue = () => {
    return coupons.reduce((acc, coupon) => acc + (coupon.uses * 35), 0);
  };

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-secondary rounded-lg">
              <Tag className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Cupons Ativos</p>
              <p className="text-2xl font-bold">3</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-secondary rounded-lg">
              <Users className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total de Usos</p>
              <p className="text-2xl font-bold">522</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-secondary rounded-lg">
              <DollarSign className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Desconto Total</p>
              <p className="text-2xl font-bold">R$ 2.3k</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-secondary rounded-lg">
              <TrendingUp className="h-5 w-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">ROI</p>
              <p className="text-2xl font-bold">340%</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Criar Cupom */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Cupons de Desconto</h3>
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Cupom
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Criar Novo Cupom</DialogTitle>
                <DialogDescription>
                  Configure um novo cupom de desconto
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Código do Cupom</Label>
                    <Input placeholder="Ex: PROMO20" className="uppercase" />
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo de Desconto</Label>
                    <Select defaultValue="percentage">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Porcentagem</SelectItem>
                        <SelectItem value="fixed">Valor Fixo</SelectItem>
                        <SelectItem value="free_delivery">Frete Grátis</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Input placeholder="Descrição do cupom" />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Valor do Desconto</Label>
                    <Input type="number" placeholder="20" />
                  </div>
                  <div className="space-y-2">
                    <Label>Valor Mínimo (R$)</Label>
                    <Input type="number" placeholder="30" />
                  </div>
                  <div className="space-y-2">
                    <Label>Desconto Máximo (R$)</Label>
                    <Input type="number" placeholder="15" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Limite de Usos</Label>
                    <Input type="number" placeholder="500" />
                  </div>
                  <div className="space-y-2">
                    <Label>Válido Até</Label>
                    <Input type="date" />
                  </div>
                  <div className="space-y-2 flex items-end">
                    <div className="flex items-center gap-2">
                      <Switch id="active" defaultChecked />
                      <Label htmlFor="active">Ativo</Label>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button className="flex-1">
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Cupom
                  </Button>
                  <Button variant="outline" onClick={() => setIsCreating(false)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Lista de Cupons */}
        <div className="space-y-3">
          {coupons.map((coupon) => (
            <Card key={coupon.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="font-mono font-bold text-lg">{coupon.code}</div>
                    <Badge variant={coupon.isActive ? 'default' : 'secondary'}>
                      {coupon.isActive ? 'Ativo' : 'Inativo'}
                    </Badge>
                    <Badge variant="outline">{getTypeLabel(coupon.type)}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{coupon.description}</p>
                  
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Desconto</p>
                      <p className="font-bold">
                        {coupon.type === 'percentage' ? `${coupon.value}%` : 
                         coupon.type === 'fixed' ? `R$ ${coupon.value}` : 'Grátis'}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Usos</p>
                      <p className="font-bold">{coupon.uses} / {coupon.limit}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Valor Mínimo</p>
                      <p className="font-bold">R$ {coupon.minValue}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Válido Até</p>
                      <p className="font-bold">{coupon.validUntil}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="ghost" size="sm">
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Card>
    </div>
  );
}
