import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/AdminSidebar";
import { formatCurrency, formatDateTime } from '@/utils/formatting';
import { 
  Settings, 
  Clock, 
  Truck, 
  DollarSign, 
  Tag, 
  Plus, 
  Edit, 
  Trash2,
  Package,
  Percent
} from 'lucide-react';

interface SystemSetting {
  id: string;
  key: string;
  value: any;
  description: string;
  category: string;
}

interface Coupon {
  id: string;
  code: string;
  description: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_value?: number;
  max_uses?: number;
  used_count: number;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
}

interface Beverage {
  id: string;
  name: string;
  price: number;
  stock_quantity: number;
  min_stock_alert: number;
  is_available: boolean;
}

export default function AdminSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [beverages, setBeverages] = useState<Beverage[]>([]);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [editingBeverage, setEditingBeverage] = useState<Beverage | null>(null);
  
  const [newCoupon, setNewCoupon] = useState({
    code: '',
    description: '',
    discount_type: 'percentage' as 'percentage' | 'fixed',
    discount_value: 0,
    min_order_value: 0,
    max_uses: 0,
    valid_until: ''
  });

  const [newBeverage, setNewBeverage] = useState({
    name: '',
    price: 0,
    stock_quantity: 0,
    min_stock_alert: 10
  });

  useEffect(() => {
    const checkAdminRole = async () => {
      if (!user) return;

      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profile?.role !== 'admin') {
          toast({
            title: 'Acesso negado',
            description: 'Você não tem permissão para acessar esta página.',
            variant: 'destructive'
          });
          navigate('/admin');
          return;
        }

        setIsAdmin(true);
        await loadData();
      } catch (error) {
        console.error('Erro ao verificar permissões:', error);
        navigate('/admin');
      } finally {
        setLoading(false);
      }
    };

    checkAdminRole();
  }, [user, navigate, toast]);

  const loadData = async () => {
    try {
      await Promise.all([
        loadSettings(),
        loadCoupons(),
        loadBeverages()
      ]);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar configurações.',
        variant: 'destructive'
      });
    }
  };

  const loadSettings = async () => {
    const { data } = await supabase
      .from('system_settings')
      .select('*')
      .order('category');

    setSettings(data || []);
  };

  const loadCoupons = async () => {
    const { data } = await supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false });

    setCoupons((data || []) as Coupon[]);
  };

  const loadBeverages = async () => {
    const { data } = await supabase
      .from('beverages')
      .select('*')
      .order('name');

    setBeverages(data || []);
  };

  const updateSetting = async (settingId: string, newValue: any) => {
    try {
      const { error } = await supabase
        .from('system_settings')
        .update({ value: newValue })
        .eq('id', settingId);

      if (error) throw error;

      toast({
        title: 'Configuração atualizada',
        description: 'Configuração salva com sucesso.'
      });

      loadSettings();
    } catch (error) {
      console.error('Erro ao atualizar configuração:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar configuração.',
        variant: 'destructive'
      });
    }
  };

  const saveCoupon = async () => {
    try {
      const couponData = {
        ...newCoupon,
        valid_until: new Date(newCoupon.valid_until).toISOString()
      };

      const { error } = editingCoupon
        ? await supabase.from('coupons').update(couponData).eq('id', editingCoupon.id)
        : await supabase.from('coupons').insert(couponData);

      if (error) throw error;

      toast({
        title: 'Cupom salvo',
        description: editingCoupon ? 'Cupom atualizado com sucesso.' : 'Cupom criado com sucesso.'
      });

      setEditingCoupon(null);
      setNewCoupon({
        code: '',
        description: '',
        discount_type: 'percentage',
        discount_value: 0,
        min_order_value: 0,
        max_uses: 0,
        valid_until: ''
      });
      loadCoupons();
    } catch (error) {
      console.error('Erro ao salvar cupom:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao salvar cupom.',
        variant: 'destructive'
      });
    }
  };

  const deleteCoupon = async (couponId: string) => {
    try {
      const { error } = await supabase
        .from('coupons')
        .delete()
        .eq('id', couponId);

      if (error) throw error;

      toast({
        title: 'Cupom excluído',
        description: 'Cupom excluído com sucesso.'
      });

      loadCoupons();
    } catch (error) {
      console.error('Erro ao excluir cupom:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao excluir cupom.',
        variant: 'destructive'
      });
    }
  };

  const saveBeverage = async () => {
    try {
      const { error } = editingBeverage
        ? await supabase.from('beverages').update(newBeverage).eq('id', editingBeverage.id)
        : await supabase.from('beverages').insert(newBeverage);

      if (error) throw error;

      toast({
        title: 'Bebida salva',
        description: editingBeverage ? 'Bebida atualizada com sucesso.' : 'Bebida criada com sucesso.'
      });

      setEditingBeverage(null);
      setNewBeverage({
        name: '',
        price: 0,
        stock_quantity: 0,
        min_stock_alert: 10
      });
      loadBeverages();
    } catch (error) {
      console.error('Erro ao salvar bebida:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao salvar bebida.',
        variant: 'destructive'
      });
    }
  };

  const deleteBeverage = async (beverageId: string) => {
    try {
      const { error } = await supabase
        .from('beverages')
        .delete()
        .eq('id', beverageId);

      if (error) throw error;

      toast({
        title: 'Bebida excluída',
        description: 'Bebida excluída com sucesso.'
      });

      loadBeverages();
    } catch (error) {
      console.error('Erro ao excluir bebida:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao excluir bebida.',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <div className="ml-auto">
              <h1 className="text-xl font-semibold">Configurações do Sistema</h1>
            </div>
          </header>
          
          <div className="flex-1 p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Ajustes Finos</h1>
                <p className="text-muted-foreground">Configure horários, taxas, estoque e cupons</p>
              </div>
              <Button onClick={() => navigate('/admin')} variant="outline">
                Voltar ao Admin
              </Button>
            </div>

            <Tabs defaultValue="general" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="general">Geral</TabsTrigger>
                <TabsTrigger value="delivery">Entrega</TabsTrigger>
                <TabsTrigger value="coupons">Cupons</TabsTrigger>
                <TabsTrigger value="beverages">Bebidas</TabsTrigger>
              </TabsList>

              {/* Tab Configurações Gerais */}
              <TabsContent value="general" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Horários de Funcionamento
                    </CardTitle>
                    <CardDescription>Configure os horários de abertura e fechamento</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {settings.filter(s => s.key === 'opening_hours').map(setting => (
                      <div key={setting.id} className="space-y-4">
                        {Object.entries(setting.value).map(([day, hours]: [string, any]) => (
                          <div key={day} className="flex items-center gap-4">
                            <Label className="w-20 capitalize">{
                              {
                                monday: 'Segunda',
                                tuesday: 'Terça',
                                wednesday: 'Quarta',
                                thursday: 'Quinta',
                                friday: 'Sexta',
                                saturday: 'Sábado',
                                sunday: 'Domingo'
                              }[day]
                            }</Label>
                            <Input
                              type="time"
                              value={hours.open}
                              onChange={(e) => {
                                const newValue = {
                                  ...setting.value,
                                  [day]: { ...hours, open: e.target.value }
                                };
                                updateSetting(setting.id, newValue);
                              }}
                              className="w-32"
                            />
                            <span>às</span>
                            <Input
                              type="time"
                              value={hours.close}
                              onChange={(e) => {
                                const newValue = {
                                  ...setting.value,
                                  [day]: { ...hours, close: e.target.value }
                                };
                                updateSetting(setting.id, newValue);
                              }}
                              className="w-32"
                            />
                          </div>
                        ))}
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Tempo de Preparo</CardTitle>
                    <CardDescription>Configure o tempo estimado de preparo dos pedidos</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {settings.filter(s => s.key === 'estimated_prep_time').map(setting => (
                      <div key={setting.id} className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Tempo normal (minutos)</Label>
                          <Input
                            type="number"
                            value={setting.value.default}
                            onChange={(e) => {
                              const newValue = {
                                ...setting.value,
                                default: parseInt(e.target.value) || 0
                              };
                              updateSetting(setting.id, newValue);
                            }}
                          />
                        </div>
                        <div>
                          <Label>Horário de pico (minutos)</Label>
                          <Input
                            type="number"
                            value={setting.value.busy_hours}
                            onChange={(e) => {
                              const newValue = {
                                ...setting.value,
                                busy_hours: parseInt(e.target.value) || 0
                              };
                              updateSetting(setting.id, newValue);
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab Entrega */}
              <TabsContent value="delivery" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Truck className="h-5 w-5" />
                      Taxa de Entrega
                    </CardTitle>
                    <CardDescription>Configure as taxas de entrega e pedido mínimo</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {settings.filter(s => s.key === 'delivery_fee').map(setting => (
                      <div key={setting.id} className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Taxa padrão (R$)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={setting.value.default}
                            onChange={(e) => {
                              const newValue = {
                                ...setting.value,
                                default: parseFloat(e.target.value) || 0
                              };
                              updateSetting(setting.id, newValue);
                            }}
                          />
                        </div>
                        <div>
                          <Label>Entrega grátis acima de (R$)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={setting.value.free_above}
                            onChange={(e) => {
                              const newValue = {
                                ...setting.value,
                                free_above: parseFloat(e.target.value) || 0
                              };
                              updateSetting(setting.id, newValue);
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Distância de Entrega</CardTitle>
                    <CardDescription>Configure a distância máxima para entrega</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {settings.filter(s => s.key === 'max_delivery_distance').map(setting => (
                      <div key={setting.id} className="max-w-sm">
                        <Label>Distância máxima (km)</Label>
                        <Input
                          type="number"
                          value={setting.value.distance}
                          onChange={(e) => {
                            const newValue = {
                              ...setting.value,
                              distance: parseInt(e.target.value) || 0
                            };
                            updateSetting(setting.id, newValue);
                          }}
                        />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab Cupons */}
              <TabsContent value="coupons" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Tag className="h-5 w-5" />
                      Cupons de Desconto
                    </CardTitle>
                    <CardDescription>Gerencie cupons promocionais</CardDescription>
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="w-fit">
                          <Plus className="h-4 w-4 mr-2" />
                          Novo Cupom
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>
                            {editingCoupon ? 'Editar Cupom' : 'Criar Novo Cupom'}
                          </DialogTitle>
                        </DialogHeader>
                        
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Código</Label>
                              <Input
                                value={newCoupon.code}
                                onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                                placeholder="DESCONTO10"
                              />
                            </div>
                            <div>
                              <Label>Tipo de Desconto</Label>
                              <Select 
                                value={newCoupon.discount_type} 
                                onValueChange={(value: 'percentage' | 'fixed') => 
                                  setNewCoupon({ ...newCoupon, discount_type: value })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="percentage">Porcentagem</SelectItem>
                                  <SelectItem value="fixed">Valor Fixo</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div>
                            <Label>Descrição</Label>
                            <Input
                              value={newCoupon.description}
                              onChange={(e) => setNewCoupon({ ...newCoupon, description: e.target.value })}
                              placeholder="Descrição do cupom"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>
                                Valor do Desconto {newCoupon.discount_type === 'percentage' ? '(%)' : '(R$)'}
                              </Label>
                              <Input
                                type="number"
                                step={newCoupon.discount_type === 'percentage' ? '1' : '0.01'}
                                value={newCoupon.discount_value}
                                onChange={(e) => setNewCoupon({ ...newCoupon, discount_value: parseFloat(e.target.value) || 0 })}
                              />
                            </div>
                            <div>
                              <Label>Pedido Mínimo (R$)</Label>
                              <Input
                                type="number"
                                step="0.01"
                                value={newCoupon.min_order_value}
                                onChange={(e) => setNewCoupon({ ...newCoupon, min_order_value: parseFloat(e.target.value) || 0 })}
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Máximo de Usos</Label>
                              <Input
                                type="number"
                                value={newCoupon.max_uses}
                                onChange={(e) => setNewCoupon({ ...newCoupon, max_uses: parseInt(e.target.value) || 0 })}
                                placeholder="0 = ilimitado"
                              />
                            </div>
                            <div>
                              <Label>Válido até</Label>
                              <Input
                                type="datetime-local"
                                value={newCoupon.valid_until}
                                onChange={(e) => setNewCoupon({ ...newCoupon, valid_until: e.target.value })}
                              />
                            </div>
                          </div>
                        </div>

                        <DialogFooter>
                          <Button onClick={saveCoupon}>
                            {editingCoupon ? 'Atualizar' : 'Criar'} Cupom
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Código</TableHead>
                            <TableHead>Descrição</TableHead>
                            <TableHead>Desconto</TableHead>
                            <TableHead>Usos</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Válido até</TableHead>
                            <TableHead>Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {coupons.map((coupon) => (
                            <TableRow key={coupon.id}>
                              <TableCell className="font-mono font-bold">{coupon.code}</TableCell>
                              <TableCell>{coupon.description}</TableCell>
                              <TableCell>
                                {coupon.discount_type === 'percentage' 
                                  ? `${coupon.discount_value}%` 
                                  : formatCurrency(coupon.discount_value)
                                }
                              </TableCell>
                              <TableCell>
                                {coupon.used_count}{coupon.max_uses ? `/${coupon.max_uses}` : ''}
                              </TableCell>
                              <TableCell>
                                <Badge variant={coupon.is_active ? 'outline' : 'secondary'}>
                                  {coupon.is_active ? 'Ativo' : 'Inativo'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {new Date(coupon.valid_until).toLocaleDateString('pt-BR')}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setEditingCoupon(coupon);
                                      setNewCoupon({
                                        code: coupon.code,
                                        description: coupon.description,
                                        discount_type: coupon.discount_type,
                                        discount_value: coupon.discount_value,
                                        min_order_value: coupon.min_order_value || 0,
                                        max_uses: coupon.max_uses || 0,
                                        valid_until: new Date(coupon.valid_until).toISOString().slice(0, 16)
                                      });
                                    }}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button size="sm" variant="outline">
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Excluir cupom?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Esta ação não pode ser desfeita. O cupom será permanentemente removido.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => deleteCoupon(coupon.id)}>
                                          Excluir
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab Bebidas */}
              <TabsContent value="beverages" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Estoque de Bebidas
                    </CardTitle>
                    <CardDescription>Gerencie o catálogo e estoque de bebidas</CardDescription>
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="w-fit">
                          <Plus className="h-4 w-4 mr-2" />
                          Nova Bebida
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>
                            {editingBeverage ? 'Editar Bebida' : 'Adicionar Nova Bebida'}
                          </DialogTitle>
                        </DialogHeader>
                        
                        <div className="space-y-4">
                          <div>
                            <Label>Nome da Bebida</Label>
                            <Input
                              value={newBeverage.name}
                              onChange={(e) => setNewBeverage({ ...newBeverage, name: e.target.value })}
                              placeholder="Coca-Cola Lata 350ml"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Preço (R$)</Label>
                              <Input
                                type="number"
                                step="0.01"
                                value={newBeverage.price}
                                onChange={(e) => setNewBeverage({ ...newBeverage, price: parseFloat(e.target.value) || 0 })}
                              />
                            </div>
                            <div>
                              <Label>Estoque Inicial</Label>
                              <Input
                                type="number"
                                value={newBeverage.stock_quantity}
                                onChange={(e) => setNewBeverage({ ...newBeverage, stock_quantity: parseInt(e.target.value) || 0 })}
                              />
                            </div>
                          </div>

                          <div>
                            <Label>Estoque Mínimo (Alerta)</Label>
                            <Input
                              type="number"
                              value={newBeverage.min_stock_alert}
                              onChange={(e) => setNewBeverage({ ...newBeverage, min_stock_alert: parseInt(e.target.value) || 0 })}
                            />
                          </div>
                        </div>

                        <DialogFooter>
                          <Button onClick={saveBeverage}>
                            {editingBeverage ? 'Atualizar' : 'Adicionar'} Bebida
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>Preço</TableHead>
                            <TableHead>Estoque</TableHead>
                            <TableHead>Estoque Mínimo</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {beverages.map((beverage) => (
                            <TableRow key={beverage.id}>
                              <TableCell className="font-medium">{beverage.name}</TableCell>
                              <TableCell>{formatCurrency(beverage.price)}</TableCell>
                              <TableCell>{beverage.stock_quantity}</TableCell>
                              <TableCell>{beverage.min_stock_alert}</TableCell>
                              <TableCell>
                                {beverage.stock_quantity <= beverage.min_stock_alert ? (
                                  <Badge variant="destructive">Estoque Baixo</Badge>
                                ) : beverage.is_available ? (
                                  <Badge variant="outline" className="border-green-500 text-green-600">Disponível</Badge>
                                ) : (
                                  <Badge variant="secondary">Indisponível</Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setEditingBeverage(beverage);
                                      setNewBeverage({
                                        name: beverage.name,
                                        price: beverage.price,
                                        stock_quantity: beverage.stock_quantity,
                                        min_stock_alert: beverage.min_stock_alert
                                      });
                                    }}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button size="sm" variant="outline">
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Excluir bebida?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Esta ação não pode ser desfeita. A bebida será permanentemente removida do catálogo.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => deleteBeverage(beverage.id)}>
                                          Excluir
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}