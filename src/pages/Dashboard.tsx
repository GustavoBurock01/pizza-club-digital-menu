
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Clock, CreditCard, Pizza, TrendingUp, Star, RefreshCw, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { FixedCartFooter } from '@/components/FixedCartFooter';

const Dashboard = () => {
  const { user } = useAuth();
  const { subscription, checkSubscription, createCheckout, openCustomerPortal } = useSubscription();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [lastOrder, setLastOrder] = useState<any>(null);
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || "Usuário";

  // Fetch real orders data
  useEffect(() => {
    if (user && subscription.subscribed) {
      fetchRecentOrders();
    } else {
      setLoadingOrders(false);
    }
  }, [user, subscription.subscribed]);

  // Fetch featured products (Mais Vendidos)
  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  const fetchRecentOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          addresses (*),
          order_items (
            *,
            products (name, image_url)
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(3);

      if (error) throw error;
      setRecentOrders(data || []);
      if (data && data.length > 0) {
        setLastOrder(data[0]);
      }
    } catch (error: any) {
      console.error('Erro ao carregar pedidos recentes:', error);
      toast({
        title: "Erro ao carregar pedidos",
        description: "Não foi possível carregar seus pedidos recentes",
        variant: "destructive"
      });
    } finally {
      setLoadingOrders(false);
    }
  };

  const fetchFeaturedProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_available', true)
        .order('order_position')
        .limit(3);

      if (error) throw error;
      setFeaturedProducts(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar produtos em destaque:', error);
    } finally {
      setLoadingProducts(false);
    }
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  const handleQuickAction = (action: string) => {
    if (!subscription.subscribed) {
      toast({
        title: "Assinatura necessária",
        description: "Você precisa de uma assinatura ativa para acessar esta funcionalidade",
        variant: "destructive"
      });
      return;
    }
    switch (action) {
      case 'order':
        navigate('/menu');
        break;
      case 'repeat':
        if (lastOrder) {
          navigate('/menu');
          toast({
            title: "Redirecionando para o cardápio",
            description: "Você pode repetir seu último pedido selecionando os mesmos itens"
          });
        } else {
          navigate('/menu');
        }
        break;
      case 'menu':
        navigate('/menu');
        break;
      default:
        break;
    }
  };

  const quickActions = [
    {
      title: "Novo Pedido",
      description: "Fazer um novo pedido",
      icon: ShoppingCart,
      action: "order",
      color: "bg-pizza-red",
      disabled: !subscription.subscribed
    },
    {
      title: "Repetir Último",
      description: lastOrder ? `${lastOrder.order_items?.[0]?.products?.name || 'Último pedido'}` : "Nenhum pedido anterior",
      icon: RefreshCw,
      action: "repeat",
      color: "bg-pizza-orange",
      disabled: !subscription.subscribed || !lastOrder
    },
    {
      title: "Cardápio",
      description: "Ver todos os sabores",
      icon: Pizza,
      action: "menu",
      color: "bg-pizza-gold",
      disabled: !subscription.subscribed
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'preparing':
        return 'bg-yellow-100 text-yellow-800';
      case 'out_for_delivery':
        return 'bg-blue-100 text-blue-800';
      case 'confirmed':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'Entregue';
      case 'preparing':
        return 'Preparando';
      case 'out_for_delivery':
        return 'A caminho';
      case 'confirmed':
        return 'Confirmado';
      case 'pending':
        return 'Pendente';
      case 'cancelled':
        return 'Cancelado';
      default:
        return 'Pendente';
    }
  };

  const formatExpiryDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  const renderSubscriptionButton = () => {
    if (subscription.subscribed) return null;

    if (!subscription.hasSubscriptionHistory) {
      return (
        <Button onClick={() => createCheckout('trial')} size="sm" className="gradient-pizza text-white">
          Primeiro mês R$ 1,00
        </Button>
      );
    }

    return (
      <Button onClick={() => createCheckout('monthly')} variant="outline" size="sm">
        Assinar R$ 9,90/mês
      </Button>
    );
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 p-6 space-y-6 pb-32">
          <div className="flex items-center gap-4 mb-6">
            <SidebarTrigger className="md:hidden" />
            <div>
              <h1 className="text-3xl font-bold text-pizza-dark">
                Bem-vindo, {userName.split(' ')[0]}! 👋
              </h1>
              <p className="text-muted-foreground">
                {subscription.subscribed ? "Que tal uma pizza deliciosa hoje?" : "Assine para ter acesso ao cardápio exclusivo!"}
              </p>
            </div>
          </div>

          {/* Status da Assinatura */}
          {subscription.loading ? (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-center">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Verificando assinatura...</span>
                </div>
              </CardContent>
            </Card>
          ) : subscription.subscribed ? (
            <Card className="bg-gradient-to-r from-pizza-red to-pizza-orange text-white">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-white">Plano {subscription.plan_name} Ativo ✅</CardTitle>
                    <CardDescription className="text-white/80">
                      Expira em: {formatExpiryDate(subscription.expires_at)}
                    </CardDescription>
                  </div>
                  <CreditCard className="h-8 w-8 text-white/80" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div className="text-sm">
                    <p>Valor: R$ {subscription.plan_price.toFixed(2)}/mês</p>
                    <p>Status: {subscription.status === 'active' ? 'Ativo' : 'Inativo'}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm" onClick={openCustomerPortal}>
                      Gerenciar Plano
                    </Button>
                    <Button variant="outline" size="sm" onClick={checkSubscription} className="text-neutral-950">
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Atualizar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Alert className="border-pizza-red bg-pizza-cream">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="flex justify-between items-center">
                <span>
                  <strong>Assinatura necessária!</strong> Assine para ter acesso ao cardápio exclusivo e fazer pedidos.
                </span>
                <div className="flex gap-2 ml-4">
                  {renderSubscriptionButton()}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Mais Vendidos */}
          {subscription.subscribed && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">🔥 Mais Vendidos</h2>
                <Button variant="link" onClick={() => navigate('/menu')} className="text-pizza-red">
                  Ver tudo
                </Button>
              </div>
              
              {loadingProducts ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Carregando produtos...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  {featuredProducts.map((product) => (
                    <Card key={product.id} className="cursor-pointer hover:shadow-lg transition-shadow group">
                      <CardContent className="p-4">
                        <div className="aspect-square bg-gradient-to-br from-pizza-cream to-pizza-orange/20 rounded-lg mb-3 flex items-center justify-center">
                          {product.image_url ? (
                            <img 
                              src={product.image_url} 
                              alt={product.name}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <div className="text-4xl">🍕</div>
                          )}
                        </div>
                        <h3 className="font-semibold mb-1 group-hover:text-pizza-red transition-colors">
                          {product.name}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                          {product.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold text-pizza-red">
                            {formatPrice(product.price)}
                          </span>
                          <Button 
                            size="sm" 
                            className="gradient-pizza text-white"
                            onClick={() => navigate(`/produto/${product.id}`)}
                          >
                            Ver mais
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Ações Rápidas */}
          <div>
            <h2 className="text-xl font-bold mb-4">Ações Rápidas</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {quickActions.map((action, index) => (
                <Card 
                  key={index} 
                  className={`transition-shadow cursor-pointer group ${
                    action.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg'
                  }`} 
                  onClick={() => !action.disabled && handleQuickAction(action.action)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-full ${action.color} text-white ${
                        action.disabled ? '' : 'group-hover:scale-110'
                      } transition-transform`}>
                        <action.icon className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{action.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {action.disabled && !subscription.subscribed ? 'Assinatura necessária' : action.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Estatísticas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-pizza-red" />
                  Suas Estatísticas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Status da assinatura:</span>
                  <Badge variant={subscription.subscribed ? "default" : "secondary"}>
                    {subscription.subscribed ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Plano atual:</span>
                  <Badge variant="outline">{subscription.plan_name}</Badge>
                </div>
                {subscription.subscribed && (
                  <>
                    <div className="flex justify-between items-center">
                      <span>Total de pedidos:</span>
                      <Badge variant="secondary">{recentOrders.length > 0 ? `${recentOrders.length}+ pedidos` : '0 pedidos'}</Badge>
                    </div>
                    {recentOrders.length > 0 && lastOrder && (
                      <>
                        <div className="flex justify-between items-center">
                          <span>Último pedido:</span>
                          <Badge className="gradient-pizza text-white">
                            {lastOrder.order_items?.[0]?.products?.name || 'Pizza'}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Avaliação média:</span>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map(star => (
                              <Star key={star} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            ))}
                            <span className="text-sm text-muted-foreground ml-1">5.0</span>
                          </div>
                        </div>
                      </>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Pedidos Recentes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-pizza-red" />
                  Pedidos Recentes
                </CardTitle>
                <CardDescription>
                  {subscription.subscribed ? "Seus últimos pedidos realizados" : "Faça sua assinatura para começar a pedir!"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {subscription.subscribed ? (
                  loadingOrders ? (
                    <div className="flex items-center justify-center py-8">
                      <RefreshCw className="h-6 w-6 animate-spin" />
                      <span className="ml-2">Carregando pedidos...</span>
                    </div>
                  ) : recentOrders.length > 0 ? (
                    <div className="space-y-4">
                      {recentOrders.map(order => (
                        <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors">
                          <div className="flex-1">
                            <p className="font-medium text-sm">
                              {order.order_items?.map((item: any) => item.products?.name).join(', ') || 'Pedido'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(order.created_at).toLocaleDateString('pt-BR')} às {new Date(order.created_at).toLocaleTimeString('pt-BR', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge className={`text-xs ${getStatusColor(order.status)}`}>
                              {getStatusLabel(order.status)}
                            </Badge>
                            <p className="text-sm font-medium mt-1">
                              R$ {order.total_amount?.toFixed(2) || '0,00'}
                            </p>
                          </div>
                        </div>
                      ))}
                      <Button variant="outline" className="w-full mt-4" onClick={() => navigate('/orders')}>
                        Ver todos os pedidos
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Pizza className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground mb-4">
                        Você ainda não fez nenhum pedido. Que tal experimentar agora?
                      </p>
                      <Button onClick={() => navigate('/menu')} className="gradient-pizza text-white">
                        Ver Cardápio
                      </Button>
                    </div>
                  )
                ) : (
                  <div className="text-center py-8">
                    <Pizza className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">
                      Assine para começar a fazer pedidos e ver seu histórico aqui!
                    </p>
                    <div className="flex gap-2 justify-center">
                      {renderSubscriptionButton()}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
        <FixedCartFooter />
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
