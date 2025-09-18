import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Crown, ArrowLeft } from "lucide-react";
import { SubscriptionPlans } from "@/components/SubscriptionPlans";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

const SubscriptionPlansPage = () => {
  const { subscription } = useSubscription();
  const { user } = useAuth();
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
        <div className="text-center text-white mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-white p-3 rounded-full shadow-lg">
              <Crown className="h-8 w-8 text-pizza-red" />
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-2">
            Bem-vindo ao Pizza Premium, {userName}! 🍕
          </h1>
          <p className="text-xl text-white/90 mb-6">
            Escolha seu plano e tenha acesso ao cardápio exclusivo de pizzas artesanais
          </p>
          
          {subscription?.hasSubscriptionHistory ? (
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 max-w-2xl mx-auto">
              <p className="text-white/90">
                Sua assinatura expirou. Escolha um novo plano para continuar aproveitando nosso cardápio exclusivo!
              </p>
            </div>
          ) : (
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 max-w-2xl mx-auto">
              <p className="text-white/90">
                Como novo cliente, você tem acesso ao nosso <strong>Trial de 7 dias por apenas R$ 1,00!</strong>
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