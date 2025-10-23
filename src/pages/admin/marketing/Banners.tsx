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
import { Image, Plus, Edit, Trash2, Eye, TrendingUp } from 'lucide-react';

const banners = [
  {
    id: 1,
    title: 'Black Friday - 50% OFF',
    position: 'home_hero',
    imageUrl: '/placeholder.svg',
    link: '/menu?promo=blackfriday',
    startDate: '2024-01-20',
    endDate: '2024-01-27',
    clicks: 1245,
    impressions: 4567,
    isActive: true,
  },
  {
    id: 2,
    title: 'Novo Cardápio',
    position: 'menu_top',
    imageUrl: '/placeholder.svg',
    link: '/menu?category=novidades',
    startDate: '2024-01-15',
    endDate: '2024-02-15',
    clicks: 789,
    impressions: 3421,
    isActive: true,
  },
  {
    id: 3,
    title: 'Delivery Grátis',
    position: 'checkout',
    imageUrl: '/placeholder.svg',
    link: null,
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    clicks: 456,
    impressions: 2134,
    isActive: true,
  },
];

export default function Banners() {
  const [isCreating, setIsCreating] = useState(false);

  const getPositionLabel = (position: string) => {
    switch (position) {
      case 'home_hero': return 'Página Inicial (Hero)';
      case 'menu_top': return 'Topo do Cardápio';
      case 'checkout': return 'Checkout';
      case 'menu_sidebar': return 'Sidebar do Cardápio';
      default: return position;
    }
  };

  const getTotalClicks = () => {
    return banners.reduce((acc, banner) => acc + banner.clicks, 0);
  };

  const getTotalImpressions = () => {
    return banners.reduce((acc, banner) => acc + banner.impressions, 0);
  };

  const getAverageCTR = () => {
    const clicks = getTotalClicks();
    const impressions = getTotalImpressions();
    return impressions > 0 ? ((clicks / impressions) * 100).toFixed(1) : 0;
  };

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-secondary rounded-lg">
              <Image className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Banners Ativos</p>
              <p className="text-2xl font-bold">3</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-secondary rounded-lg">
              <Eye className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Impressões</p>
              <p className="text-2xl font-bold">{(getTotalImpressions() / 1000).toFixed(1)}k</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-secondary rounded-lg">
              <TrendingUp className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Cliques</p>
              <p className="text-2xl font-bold">{(getTotalClicks() / 1000).toFixed(1)}k</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-secondary rounded-lg">
              <TrendingUp className="h-5 w-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">CTR Médio</p>
              <p className="text-2xl font-bold">{getAverageCTR()}%</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Criar Banner */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Banners Promocionais</h3>
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Banner
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Criar Novo Banner</DialogTitle>
                <DialogDescription>
                  Configure um novo banner promocional
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Título do Banner</Label>
                  <Input placeholder="Ex: Black Friday - 50% OFF" />
                </div>

                <div className="space-y-2">
                  <Label>Posição do Banner</Label>
                  <Select defaultValue="home_hero">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="home_hero">Página Inicial (Hero)</SelectItem>
                      <SelectItem value="menu_top">Topo do Cardápio</SelectItem>
                      <SelectItem value="menu_sidebar">Sidebar do Cardápio</SelectItem>
                      <SelectItem value="checkout">Checkout</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Imagem do Banner</Label>
                  <Input type="file" accept="image/*" />
                  <p className="text-xs text-muted-foreground">
                    Tamanho recomendado: 1200x400px
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Link de Destino (opcional)</Label>
                  <Input placeholder="/menu?promo=blackfriday" />
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
                  <Switch id="banner-active" defaultChecked />
                  <Label htmlFor="banner-active">Banner Ativo</Label>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button className="flex-1">
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Banner
                  </Button>
                  <Button variant="outline" onClick={() => setIsCreating(false)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Lista de Banners */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {banners.map((banner) => (
            <Card key={banner.id} className="overflow-hidden">
              {/* Preview da Imagem */}
              <div className="aspect-[3/1] bg-muted flex items-center justify-center">
                <Image className="h-12 w-12 text-muted-foreground" />
              </div>
              
              {/* Informações */}
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-semibold">{banner.title}</h4>
                  <Badge variant={banner.isActive ? 'default' : 'secondary'}>
                    {banner.isActive ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
                
                <p className="text-sm text-muted-foreground mb-3">
                  {getPositionLabel(banner.position)}
                </p>

                <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Impressões</p>
                    <p className="font-bold">{banner.impressions.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Cliques</p>
                    <p className="font-bold">{banner.clicks.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">CTR</p>
                    <p className="font-bold">
                      {((banner.clicks / banner.impressions) * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Validade</p>
                    <p className="font-bold text-xs">{banner.startDate} - {banner.endDate}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
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
