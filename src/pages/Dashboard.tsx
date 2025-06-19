
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Sparkles, Clock, Gift } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const { subscription } = useSubscription();
  const navigate = useNavigate();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 p-6 space-y-6">
          <div className="flex items-center gap-4 mb-6">
            <SidebarTrigger className="md:hidden" />
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-pizza-dark mb-2">
                Bem-vindo ao Rei da Pizza! 👑
              </h1>
              <p className="text-muted-foreground">
                Sua pizzaria exclusiva com sabores únicos
              </p>
            </div>
          </div>

          {/* Status da Assinatura */}
          <Card className="gradient-pizza text-white">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Crown className="h-6 w-6" />
                <div>
                  <CardTitle className="text-white">
                    {subscription?.status === 'active' ? 'Assinatura Ativa' : 'Assinatura Inativa'}
                  </CardTitle>
                  <CardDescription className="text-pizza-cream">
                    {subscription?.status === 'active' 
                      ? `Plano ${subscription.plan_name} - Acesso total ao cardápio exclusivo`
                      : 'Ative sua assinatura para acessar o cardápio completo'
                    }
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="ml-auto bg-white text-pizza-red">
                  {subscription?.status === 'active' ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
            </CardHeader>
            {subscription?.status === 'active' && (
              <CardContent>
                <div className="flex items-center gap-4 text-sm text-pizza-cream">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>Válido até {subscription.expires_at ? new Date(subscription.expires_at).toLocaleDateString('pt-BR') : 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Gift className="h-4 w-4" />
                    <span>Entrega grátis incluída</span>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Ações Rápidas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/menu')}>
              <CardHeader className="text-center pb-2">
                <div className="text-4xl mb-2">🍕</div>
                <CardTitle className="text-lg">Ver Cardápio</CardTitle>
                <CardDescription className="text-sm">
                  Explore nossas pizzas exclusivas
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/cart')}>
              <CardHeader className="text-center pb-2">
                <div className="text-4xl mb-2">🛒</div>
                <CardTitle className="text-lg">Minha Sacola</CardTitle>
                <CardDescription className="text-sm">
                  Veja seus pedidos salvos
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/orders')}>
              <CardHeader className="text-center pb-2">
                <div className="text-4xl mb-2">📋</div>
                <CardTitle className="text-lg">Pedidos</CardTitle>
                <CardDescription className="text-sm">
                  Acompanhe seus pedidos
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/account')}>
              <CardHeader className="text-center pb-2">
                <div className="text-4xl mb-2">👤</div>
                <CardTitle className="text-lg">Minha Conta</CardTitle>
                <CardDescription className="text-sm">
                  Gerencie seus dados
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          {/* Benefícios da Assinatura */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="text-center">
              <CardHeader>
                <div className="text-3xl mb-2">🚚</div>
                <CardTitle className="text-lg">Entrega Grátis</CardTitle>
                <CardDescription>
                  Para assinantes em toda a cidade
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="text-3xl mb-2">⏰</div>
                <CardTitle className="text-lg">Entrega Rápida</CardTitle>
                <CardDescription>
                  Em até 45 minutos na sua casa
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="text-3xl mb-2">🌟</div>
                <CardTitle className="text-lg">Sabores Exclusivos</CardTitle>
                <CardDescription>
                  Acesso a receitas especiais
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          {subscription?.status !== 'active' && (
            <Card className="border-pizza-red bg-pizza-cream/10">
              <CardHeader className="text-center">
                <Sparkles className="h-8 w-8 text-pizza-red mx-auto mb-2" />
                <CardTitle className="text-pizza-red">Ative sua assinatura</CardTitle>
                <CardDescription>
                  Tenha acesso completo ao nosso cardápio exclusivo e entrega grátis
                </CardDescription>
                <Button className="gradient-pizza text-white mt-4" onClick={() => navigate('/account')}>
                  Ver Planos
                </Button>
              </CardHeader>
            </Card>
          )}
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
