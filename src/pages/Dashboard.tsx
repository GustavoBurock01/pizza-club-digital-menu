
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ShoppingCart, Repeat, Sparkles, Clock, Crown } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/services/supabase";
import { RecentOrder } from "@/types";
import { formatCurrency, formatDateTime } from "@/utils/formatting";
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
  const { subscription, createCheckout } = useSubscription();
  const { addItem } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loadingRepeat, setLoadingRepeat] = useState(false);

  useEffect(() => {
    fetchRecentOrders();
  }, [user]);

  const fetchRecentOrders = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          created_at,
          total_amount,
          status,
          order_items (
            product_id,
            quantity,
            customizations,
            products (
              name
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setRecentOrders(data || []);
    } catch (error: any) {
      console.error('Error fetching recent orders:', error);
    }
  };

  const repeatLastOrder = async () => {
    if (recentOrders.length === 0) {
      toast({
        title: "Nenhum pedido anterior",
        description: "Você ainda não fez nenhum pedido.",
        variant: "destructive",
      });
      return;
    }

    setLoadingRepeat(true);
    try {
      const lastOrder = recentOrders[0];
      
      for (const item of lastOrder.order_items) {
        // Buscar dados do produto
        const { data: product, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', item.product_id)
          .single();

        if (error || !product) {
          console.error('Error fetching product:', error);
          continue;
        }

        // Adicionar ao carrinho
        for (let i = 0; i < item.quantity; i++) {
          addItem(product, item.customizations);
        }
      }

      toast({
        title: "Pedido repetido!",
        description: "Os itens do seu último pedido foram adicionados ao carrinho.",
      });

      navigate('/cart');
    } catch (error: any) {
      console.error('Error repeating order:', error);
      toast({
        title: "Erro ao repetir pedido",
        description: "Não foi possível repetir o pedido. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoadingRepeat(false);
    }
  };

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'usuário';

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <div className="ml-auto">
              <h1 className="text-xl font-semibold">Dashboard</h1>
            </div>
          </header>
          <div className="flex-1 p-6 space-y-6">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-pizza-dark mb-2">
                Bem-vindo, {userName}! 👋
              </h1>
              <p className="text-muted-foreground">
                {subscription?.status === 'active' 
                  ? 'Sua assinatura está ativa! Aproveite o cardápio exclusivo.'
                  : 'Assine para ter acesso ao cardápio exclusivo!'
                }
              </p>
            </div>

          {/* Banner de assinatura - só mostra se não tiver assinatura ativa */}
          {subscription?.status !== 'active' && (
            <Alert className="border-orange-200 bg-orange-50">
              <Sparkles className="h-4 w-4 text-orange-600" />
              <AlertDescription className="flex items-center justify-between">
                <span className="text-orange-800 font-medium">
                  Assinatura necessária para acessar o cardápio!
                </span>
                <Button 
                  className="bg-orange-500 hover:bg-orange-600 text-white ml-4"
                  onClick={() => createCheckout('annual')}
                >
                  Assinar por R$ 99,90/ano
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Ações Rápidas */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Ações Rápidas</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/menu')}>
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-3">
                    <ShoppingCart className="h-6 w-6 text-orange-600" />
                  </div>
                  <CardTitle className="text-lg">Novo Pedido</CardTitle>
                  <CardDescription className="text-sm">
                    Explore nosso cardápio
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card 
                className="hover:shadow-lg transition-shadow cursor-pointer" 
                onClick={repeatLastOrder}
              >
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-3">
                    <Repeat className={`h-6 w-6 text-orange-600 ${loadingRepeat ? 'animate-spin' : ''}`} />
                  </div>
                  <CardTitle className="text-lg">Repetir Último</CardTitle>
                  <CardDescription className="text-sm">
                    {recentOrders.length > 0 ? 'Peça novamente' : 'Nenhum pedido anterior'}
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/menu')}>
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mb-3">
                    <Sparkles className="h-6 w-6 text-yellow-600" />
                  </div>
                  <CardTitle className="text-lg">Cardápio</CardTitle>
                  <CardDescription className="text-sm">
                    Veja todas as opções
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>

          {/* Seção inferior com duas colunas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Suas Estatísticas */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Suas Estatísticas</h2>
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Crown className="h-5 w-5 text-pizza-red" />
                      <div>
                        <CardTitle className="text-lg">Status da Assinatura</CardTitle>
                        <CardDescription>
                          {subscription?.status === 'active' 
                            ? `Plano ${subscription.plan_name} ativo`
                            : 'Nenhuma assinatura ativa'
                          }
                        </CardDescription>
                      </div>
                      <Badge variant={subscription?.status === 'active' ? 'default' : 'secondary'} className="ml-auto">
                        {subscription?.status === 'active' ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                  </CardHeader>
                  {subscription?.status === 'active' && subscription.expires_at && (
                    <CardContent className="pt-0">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>
                          Válido até {new Date(subscription.expires_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </CardContent>
                  )}
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Plano Atual</CardTitle>
                    <CardDescription>
                      {subscription?.status === 'active' 
                        ? `${subscription.plan_name} - R$ ${subscription.plan_price.toFixed(2)}/ano`
                        : 'Nenhum plano ativo'
                      }
                    </CardDescription>
                  </CardHeader>
                  {subscription?.status !== 'active' && (
                    <CardContent className="pt-0">
                      <Button 
                        className="w-full gradient-pizza text-white"
                        onClick={() => createCheckout('annual')}
                      >
                        Ativar Assinatura
                      </Button>
                    </CardContent>
                  )}
                </Card>
              </div>
            </div>

            {/* Pedidos Recentes */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Pedidos Recentes</h2>
              <Card>
                <CardContent className="p-6">
                  {recentOrders.length > 0 ? (
                    <div className="space-y-4">
                      {recentOrders.map((order) => (
                        <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">
                              Pedido #{order.id.slice(-6)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(order.created_at).toLocaleDateString('pt-BR')} • R$ {order.total_amount.toFixed(2)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {order.order_items.length} {order.order_items.length === 1 ? 'item' : 'itens'}
                            </p>
                          </div>
                          <Badge variant="outline">
                            {order.status === 'delivered' ? 'Entregue' : 
                             order.status === 'pending' ? 'Pendente' : 
                             order.status === 'preparing' ? 'Preparando' : order.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground mb-4">Nenhum pedido encontrado</p>
                      {subscription?.status !== 'active' && (
                        <Button 
                          className="bg-orange-500 hover:bg-orange-600 text-white"
                          onClick={() => createCheckout('annual')}
                        >
                          Assinar por R$ 99,90/ano
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
