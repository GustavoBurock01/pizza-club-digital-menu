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
import { Percent, Plus, Edit, Trash2, Package, TrendingUp } from 'lucide-react';

const promotions = [
  {
    id: 1,
    name: 'Combo Família - 2 Pizzas',
    type: 'bundle',
    discount: 20,
    description: '2 Pizzas Grandes por R$ 79,90',
    products: ['Pizza Margherita G', 'Pizza Calabresa G'],
    price: 79.90,
    originalPrice: 99.90,
    sales: 156,
    revenue: 12464.40,
    startDate: '2024-01-01',
    endDate: '2024-03-31',
    isActive: true,
  },
  {
    id: 2,
    name: 'Terça da Pizza',
    type: 'day_special',
    discount: 30,
    description: '30% OFF em todas as pizzas',
    products: ['Todas as pizzas'],
    price: null,
    originalPrice: null,
    sales: 89,
    revenue: 3115.00,
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    isActive: true,
  },
  {
    id: 3,
    name: 'Leve 3 Pague 2',
    type: 'buy_x_get_y',
    discount: 33,
    description: 'Na compra de 3 bebidas, pague apenas 2',
    products: ['Refrigerantes 2L'],
    price: null,
    originalPrice: null,
    sales: 234,
    revenue: 2106.00,
    startDate: '2024-01-15',
    endDate: '2024-02-28',
    isActive: true,
  },
];

export default function Promocoes() {
  const [isCreating, setIsCreating] = useState(false);

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'bundle': return 'Combo';
      case 'day_special': return 'Dia Especial';
      case 'buy_x_get_y': return 'Leve X Pague Y';
      default: return type;
    }
  };

  const getTotalRevenue = () => {
    return promotions.reduce((acc, promo) => acc + promo.revenue, 0);
  };

  const getTotalSales = () => {
    return promotions.reduce((acc, promo) => acc + promo.sales, 0);
  };

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-secondary rounded-lg">
              <Percent className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Promoções Ativas</p>
              <p className="text-2xl font-bold">3</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-secondary rounded-lg">
              <Package className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Vendas Totais</p>
              <p className="text-2xl font-bold">{getTotalSales()}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-secondary rounded-lg">
              <TrendingUp className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Receita Gerada</p>
              <p className="text-2xl font-bold">R$ {(getTotalRevenue() / 1000).toFixed(1)}k</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-secondary rounded-lg">
              <Percent className="h-5 w-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Desconto Médio</p>
              <p className="text-2xl font-bold">27%</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Criar Promoção */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Promoções Ativas</h3>
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nova Promoção
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Criar Nova Promoção</DialogTitle>
                <DialogDescription>
                  Configure uma nova promoção ou combo especial
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nome da Promoção</Label>
                    <Input placeholder="Ex: Combo Família" />
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo de Promoção</Label>
                    <Select defaultValue="bundle">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bundle">Combo</SelectItem>
                        <SelectItem value="day_special">Dia Especial</SelectItem>
                        <SelectItem value="buy_x_get_y">Leve X Pague Y</SelectItem>
                        <SelectItem value="percentage">Desconto %</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Input placeholder="Descrição da promoção" />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Desconto (%)</Label>
                    <Input type="number" placeholder="20" />
                  </div>
                  <div className="space-y-2">
                    <Label>Preço Promocional</Label>
                    <Input type="number" placeholder="79.90" />
                  </div>
                  <div className="space-y-2">
                    <Label>Preço Original</Label>
                    <Input type="number" placeholder="99.90" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Data Início</Label>
                    <Input type="date" />
                  </div>
                  <div className="space-y-2">
                    <Label>Data Fim</Label>
                    <Input type="date" />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Switch id="promo-active" defaultChecked />
                  <Label htmlFor="promo-active">Promoção Ativa</Label>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button className="flex-1">
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Promoção
                  </Button>
                  <Button variant="outline" onClick={() => setIsCreating(false)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Lista de Promoções */}
        <div className="space-y-3">
          {promotions.map((promo) => (
            <Card key={promo.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-semibold">{promo.name}</h4>
                    <Badge variant={promo.isActive ? 'default' : 'secondary'}>
                      {promo.isActive ? 'Ativa' : 'Inativa'}
                    </Badge>
                    <Badge variant="outline">{getTypeLabel(promo.type)}</Badge>
                    <Badge className="bg-green-500">-{promo.discount}%</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{promo.description}</p>
                  
                  <div className="grid grid-cols-5 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Produtos</p>
                      <p className="font-bold">{promo.products.join(', ')}</p>
                    </div>
                    {promo.price && (
                      <>
                        <div>
                          <p className="text-muted-foreground">Preço</p>
                          <p className="font-bold">R$ {promo.price.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Original</p>
                          <p className="font-bold line-through">R$ {promo.originalPrice?.toFixed(2)}</p>
                        </div>
                      </>
                    )}
                    <div>
                      <p className="text-muted-foreground">Vendas</p>
                      <p className="font-bold">{promo.sales}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Receita</p>
                      <p className="font-bold text-green-500">R$ {promo.revenue.toFixed(2)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span>Início: {promo.startDate}</span>
                    <span>•</span>
                    <span>Fim: {promo.endDate}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="ghost" size="sm">
                    <Edit className="h-4 w-4" />
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
