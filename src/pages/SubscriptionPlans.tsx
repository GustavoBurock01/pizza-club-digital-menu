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
        <div className="text-center text-white mb-8">
          <div className="flex justify-center mb-6">
            <div className="bg-gradient-to-br from-orange-400 to-red-500 p-4 rounded-full shadow-2xl animate-pulse">
              <Crown className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-black mb-6 bg-gradient-to-r from-white to-orange-100 bg-clip-text text-transparent leading-tight">
            A MAIOR OPORTUNIDADE DA HISTÓRIA DA REI DA PIZZA CHEGOU
          </h1>
          <p className="text-3xl text-white/95 mb-4 font-bold">
            Desconto Vitalício em Toda Pizza
          </p>
          <p className="text-xl text-white/85 mb-8 max-w-3xl mx-auto">
            Exclusivo para moradores de Paraty-RJ
          </p>
          
          {/* Badge de Urgência */}
          <div className="inline-flex items-center gap-2 bg-red-600/90 backdrop-blur-sm text-white px-6 py-3 rounded-full font-bold text-lg shadow-2xl mb-8 animate-pulse border-2 border-white/20">
            ⚠️ CONDIÇÃO DE LANÇAMENTO - NUNCA MAIS SE REPETIRÁ
          </div>
          
          {subscription?.hasSubscriptionHistory ? (
            <div className="bg-red-500/20 backdrop-blur-sm rounded-xl p-6 max-w-2xl mx-auto border border-red-300/30 mb-8">
              <p className="text-white text-lg font-medium">
                🔥 <strong>Oferta especial de retorno!</strong> Você já foi membro, pode voltar e travar o desconto vitalício agora.
              </p>
            </div>
          ) : (
            <div className="bg-orange-500/20 backdrop-blur-sm rounded-xl p-6 max-w-2xl mx-auto border border-orange-300/30 mb-8">
              <p className="text-white text-lg font-medium">
                🎉 <strong>Oferta de lançamento!</strong> Assine agora e garanta seu desconto vitalício de R$20 em cada pizza.
              </p>
            </div>
          )}
        </div>

        {/* Prova Social */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-4xl mx-auto">
          <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl">
            <CardContent className="p-6 text-center">
              <div className="text-4xl font-black text-orange-600 mb-2">+200</div>
              <p className="text-gray-700 font-medium">Clientes na lista de espera</p>
            </CardContent>
          </Card>
          <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl">
            <CardContent className="p-6 text-center">
              <div className="text-4xl font-black text-orange-600 mb-2">4.9⭐</div>
              <p className="text-gray-700 font-medium">Avaliação no app próprio</p>
            </CardContent>
          </Card>
          <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl">
            <CardContent className="p-6 text-center">
              <div className="text-4xl font-black text-orange-600 mb-2">30min</div>
              <p className="text-gray-700 font-medium">Entrega mais rápida de Paraty</p>
            </CardContent>
          </Card>
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