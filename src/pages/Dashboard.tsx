
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
  RefreshCw
} from 'lucide-react';

const Dashboard = () => {
  const user = {
    name: "João Silva",
    plan: "Premium",
    daysLeft: 23,
    totalOrders: 15,
    favoriteSize: "Grande",
    favoriteFlavor: "Margherita"
  };

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
      color: "bg-pizza-red"
    },
    {
      title: "Repetir Último",
      description: "Pizza Margherita Grande",
      icon: RefreshCw,
      action: "repeat",
      color: "bg-pizza-orange"
    },
    {
      title: "Cardápio",
      description: "Ver todos os sabores",
      icon: Pizza,
      action: "menu",
      color: "bg-pizza-gold"
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

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 p-6 space-y-6">
          <div className="flex items-center gap-4 mb-6">
            <SidebarTrigger className="md:hidden" />
            <div>
              <h1 className="text-3xl font-bold text-pizza-dark">
                Bem-vindo, {user.name.split(' ')[0]}! 👋
              </h1>
              <p className="text-muted-foreground">
                Que tal uma pizza deliciosa hoje?
              </p>
            </div>
          </div>

          {/* Status da Assinatura */}
          <Card className="bg-gradient-to-r from-pizza-red to-pizza-orange text-white">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-white">Plano {user.plan} Ativo</CardTitle>
                  <CardDescription className="text-white/80">
                    {user.daysLeft} dias restantes na sua assinatura
                  </CardDescription>
                </div>
                <CreditCard className="h-8 w-8 text-white/80" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div className="text-sm">
                  <p>Próxima cobrança: 15/02/2024</p>
                  <p>Valor: R$ 9,90</p>
                </div>
                <Button variant="secondary" size="sm">
                  Gerenciar Plano
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Ações Rápidas */}
          <div>
            <h2 className="text-xl font-bold mb-4">Ações Rápidas</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {quickActions.map((action, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer group">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-full ${action.color} text-white group-hover:scale-110 transition-transform`}>
                        <action.icon className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{action.title}</h3>
                        <p className="text-sm text-muted-foreground">{action.description}</p>
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
                  <span>Total de pedidos:</span>
                  <Badge variant="secondary">{user.totalOrders} pedidos</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Tamanho favorito:</span>
                  <Badge variant="outline">{user.favoriteSize}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Sabor favorito:</span>
                  <Badge className="gradient-pizza text-white">{user.favoriteFlavor}</Badge>
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
                  Seus últimos pedidos realizados
                </CardDescription>
              </CardHeader>
              <CardContent>
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
                </div>
                <Button variant="outline" className="w-full mt-4">
                  Ver todos os pedidos
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
