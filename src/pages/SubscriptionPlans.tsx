import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Crown, ArrowLeft, CheckCircle, XCircle } from "lucide-react";
import { SubscriptionPlans } from "@/components/SubscriptionPlans";
// Subscription now comes from useUnifiedAuth
import { useUnifiedAuth } from "@/hooks/useUnifiedAuth";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { StripeConfigChecker } from "@/components/StripeConfigChecker";

const SubscriptionPlansPage = () => {
  const { subscription, refreshSubscription } = useUnifiedAuth();
  const { user } = useUnifiedAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  // Handle success/cancel from Stripe
  useEffect(() => {
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');

    if (success === 'true') {
      toast({
        title: "Pagamento bem-sucedido! 🎉",
        description: "Sua assinatura está sendo processada. Em instantes você terá acesso aos benefícios.",
        duration: 5000,
      });
      
      // Refresh subscription status
      setTimeout(() => {
        refreshSubscription();
      }, 2000);

      // Clean URL
      window.history.replaceState({}, '', '/plans');
    } else if (canceled === 'true') {
      toast({
        title: "Pagamento cancelado",
        description: "Você pode tentar novamente quando quiser.",
        variant: "destructive",
      });

      // Clean URL
      window.history.replaceState({}, '', '/plans');
    }
  }, [searchParams, toast, refreshSubscription]);

  // Redirecionar se usuário já tem assinatura ativa
  useEffect(() => {
    if (subscription?.status === 'active') {
      navigate('/dashboard');
    }
  }, [subscription, navigate]);

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'usuário';

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-slate-950 to-black p-3 md:p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-red-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-red-700/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-6 md:mb-8 px-2">
          <div className="flex justify-center mb-4 md:mb-6">
            <div className="glass bg-red-600/20 p-4 md:p-6 rounded-full shadow-2xl animate-pulse border border-red-500/30">
              <Crown className="h-8 w-8 md:h-12 md:w-12 text-red-500" />
            </div>
          </div>
          <h1 className="text-2xl md:text-5xl font-black mb-4 md:mb-6 text-white drop-shadow-lg leading-tight px-2">
            A MAIOR OPORTUNIDADE DA HISTÓRIA DA <span className="text-red-500">REI DA PIZZA</span> CHEGOU
          </h1>
          <p className="text-lg md:text-3xl text-white mb-3 md:mb-4 font-bold drop-shadow-md">
            Desconto Vitalício em Toda Pizza
          </p>
          <p className="text-sm md:text-xl text-white/90 mb-6 md:mb-8 max-w-3xl mx-auto drop-shadow px-2">
            Exclusivo para moradores de Paraty-RJ
          </p>
          
          {/* Badge de Urgência */}
          <div className="inline-flex items-center gap-2 bg-red-600 text-white px-4 md:px-6 py-2 md:py-3 rounded-full font-bold text-xs md:text-lg shadow-2xl mb-6 md:mb-8 animate-pulse border border-red-700">
            ⚠️ CONDIÇÃO DE LANÇAMENTO - NUNCA MAIS SE REPETIRÁ
          </div>
          
          {subscription?.hasSubscriptionHistory ? (
            <div className="glass bg-red-500/20 rounded-2xl p-4 md:p-6 max-w-2xl mx-auto border border-red-300/50 mb-6 md:mb-8 shadow-xl">
              <p className="text-white text-sm md:text-lg font-medium px-2">
                🔥 <strong>Oferta especial de retorno!</strong> Você já foi membro, pode voltar e travar o desconto vitalício agora.
              </p>
            </div>
          ) : (
            <div className="glass bg-red-500/20 rounded-2xl p-4 md:p-6 max-w-2xl mx-auto border border-red-300/50 mb-6 md:mb-8 shadow-xl">
              <p className="text-white text-sm md:text-lg font-medium px-2">
                🎉 <strong>Oferta de lançamento!</strong> Assine agora e garanta seu desconto vitalício de R$20 em cada pizza.
              </p>
            </div>
          )}
        </div>

        {/* Prova Social */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-12 max-w-4xl mx-auto px-2">
          <div className="glass bg-white/5 rounded-2xl p-4 md:p-6 text-center border border-red-500/30 shadow-xl hover:scale-105 transition-transform hover:border-red-500/50">
            <div className="text-3xl md:text-4xl font-black text-red-500 mb-2">+200</div>
            <p className="text-white font-medium text-xs md:text-base">Clientes na lista de espera</p>
          </div>
          <div className="glass bg-white/5 rounded-2xl p-4 md:p-6 text-center border border-red-500/30 shadow-xl hover:scale-105 transition-transform hover:border-red-500/50">
            <div className="text-3xl md:text-4xl font-black text-red-500 mb-2">4.9⭐</div>
            <p className="text-white font-medium text-xs md:text-base">Avaliação no app próprio</p>
          </div>
          <div className="glass bg-white/5 rounded-2xl p-4 md:p-6 text-center border border-red-500/30 shadow-xl hover:scale-105 transition-transform hover:border-red-500/50">
            <div className="text-3xl md:text-4xl font-black text-red-500 mb-2">30min</div>
            <p className="text-white font-medium text-xs md:text-base">Entrega mais rápida de Paraty</p>
          </div>
        </div>

        {/* Planos */}
        <div className="glass bg-white/5 rounded-3xl shadow-2xl border border-red-500/30 p-4 md:p-8 mb-6 md:mb-8">
          <SubscriptionPlans />
        </div>

        {/* Debug Section - Visible only in development */}
        {window.location.hostname === 'localhost' && (
          <div className="mb-6 md:mb-8">
            <StripeConfigChecker />
          </div>
        )}

        {/* Footer */}
        <div className="text-center space-y-3 md:space-y-0 md:space-x-4 px-2 pb-6">
          <Button 
            variant="outline" 
            className="glass bg-white/5 border-red-500/30 text-white hover:bg-red-600/20 hover:border-red-500/50 hover:scale-105 transition-all shadow-lg w-full md:w-auto text-sm md:text-base h-12 md:h-auto"
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Dashboard
          </Button>
          <Button 
            variant="outline" 
            className="glass bg-white/5 border-red-500/30 text-white hover:bg-red-600/20 hover:border-red-500/50 hover:scale-105 transition-all shadow-lg w-full md:w-auto text-sm md:text-base h-12 md:h-auto"
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