
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ShoppingCart, 
  Clock, 
  CreditCard, 
  Pizza,
  TrendingUp,
  Star,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { Alert, AlertDescription } from '@/components/ui/alert';

const Dashboard = () => {
  const { user } = useAuth();
  const { subscription, checkSubscription, createCheckout, openCustomerPortal } = useSubscription();

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || "Usuário";

  const recentOrders = [
    {
      id: 1,
      date: "Hoje, 19:30",
      items: "Pizza Margherita Grande",
      status: "Entregue",
      total: 35.90
    },
    {
      id: 2,
      date: "Ontem, 20:15",
      items: "Pizza Calabresa Broto + Coca-Cola",
      status: "Entregue",
      total: 28.50
    },
    {
      id: 3,
      date: "15/01, 18:45",
      items: "Pizza Portuguesa Grande (Meio a Meio)",
      status: "Entregue",
      total: 42.90
    }
  ];

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
      description: "Pizza Margherita Grande",
      icon: RefreshCw,
      action: "repeat",
      color: "bg-pizza-orange",
      disabled: !subscription.subscribed
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
      case 'Entregue':
        return 'bg-green-100 text-green-800';
      case 'Preparando':
        return 'bg-yellow-100 text-yellow-800';
      case 'A caminho':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatExpiryDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 p-6 space-y-6">
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
                    <Button variant="outline" size="sm" onClick={checkSubscription}>
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
                  <Button 
                    onClick={() => createCheckout('trial')} 
                    size="sm"
                    className="gradient-pizza text-white"
                  >
                    Primeiro mês R$ 1,00
                  </Button>
                  <Button 
                    onClick={() => createCheckout('monthly')} 
                    variant="outline" 
                    size="sm"
                  >
                    Assinar R$ 9,90/mês
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
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
                          {action.disabled ? 'Assinatura necessária' : action.description}
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
                      <Badge variant="secondary">15 pedidos</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Sabor favorito:</span>
                      <Badge className="gradient-pizza text-white">Margherita</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Avaliação média:</span>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        ))}
                        <span className="text-sm text-muted-foreground ml-1">5.0</span>
                      </div>
                    </div>
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
                  <div className="space-y-4">
                    {recentOrders.map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{order.items}</p>
                          <p className="text-xs text-muted-foreground">{order.date}</p>
                        </div>
                        <div className="text-right">
                          <Badge className={`text-xs ${getStatusColor(order.status)}`}>
                            {order.status}
                          </Badge>
                          <p className="text-sm font-medium mt-1">
                            R$ {order.total.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                    <Button variant="outline" className="w-full mt-4">
                      Ver todos os pedidos
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Pizza className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">
                      Assine para começar a fazer pedidos e ver seu histórico aqui!
                    </p>
                    <div className="flex gap-2 justify-center">
                      <Button 
                        onClick={() => createCheckout('trial')} 
                        size="sm"
                        className="gradient-pizza text-white"
                      >
                        Começar com R$ 1,00
                      </Button>
                      <Button 
                        onClick={() => createCheckout('monthly')} 
                        variant="outline" 
                        size="sm"
                      >
                        Assinar R$ 9,90
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
