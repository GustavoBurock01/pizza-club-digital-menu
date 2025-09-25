import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Crown, ArrowLeft } from "lucide-react";
import { SubscriptionPlans } from "@/components/SubscriptionPlans";
// Subscription now comes from useUnifiedAuth
import { useUnifiedAuth } from "@/hooks/useUnifiedAuth";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

const SubscriptionPlansPage = () => {
  const { subscription } = useUnifiedAuth();
  const { user } = useUnifiedAuth();
  const navigate = useNavigate();

  // Redirecionar se usuário já tem assinatura ativa
  useEffect(() => {
    if (subscription?.status === 'active') {
      navigate('/dashboard');
    }
  }, [subscription, navigate]);

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'usuário';

  return (
    <div className="min-h-screen gradient-pizza p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center text-white mb-12">
          <div className="flex justify-center mb-6">
            <div className="bg-gradient-to-br from-orange-400 to-red-500 p-4 rounded-full shadow-2xl">
              <Crown className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-black mb-4 bg-gradient-to-r from-white to-orange-100 bg-clip-text text-transparent">
            Olá, {userName}! 👋
          </h1>
          <p className="text-2xl text-white/90 mb-2 font-medium">
            Bem-vindo ao clube VIP mais exclusivo de pizzas da cidade!
          </p>
          <p className="text-lg text-white/80 mb-8 max-w-3xl mx-auto">
            Junte-se a centenas de clientes que já descobriram o segredo das melhores pizzas artesanais
          </p>
          
          {subscription?.hasSubscriptionHistory ? (
            <div className="bg-red-500/20 backdrop-blur-sm rounded-xl p-6 max-w-2xl mx-auto border border-red-300/30">
              <p className="text-white text-lg font-medium">
                🔥 <strong>Oferta especial de retorno!</strong> Sua assinatura expirou, mas você ainda pode aproveitar nosso preço VIP exclusivo.
              </p>
            </div>
          ) : (
            <div className="bg-orange-500/20 backdrop-blur-sm rounded-xl p-6 max-w-2xl mx-auto border border-orange-300/30">
              <p className="text-white text-lg font-medium">
                🎉 <strong>Oferta de lançamento!</strong> Seja um dos primeiros membros VIP e garante o melhor preço que já oferecemos.
              </p>
            </div>
          )}
        </div>

        {/* Planos */}
        <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
          <CardContent className="p-8">
            <SubscriptionPlans />
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 space-x-4">
          <Button 
            variant="outline" 
            className="bg-white/20 border-white/30 text-white hover:bg-white/30"
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Dashboard
          </Button>
          <Button 
            variant="outline" 
            className="bg-white/20 border-white/30 text-white hover:bg-white/30"
            onClick={() => navigate('/')}
          >
            Página Inicial
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPlansPage;