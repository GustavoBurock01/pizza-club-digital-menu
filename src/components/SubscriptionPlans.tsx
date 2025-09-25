import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Check, Star, Shield, Clock } from "lucide-react";
import { useUnifiedAuth } from "@/hooks/useUnifiedAuth";

interface SubscriptionPlansProps {
  currentPlan?: string;
  onSelectPlan?: (planId: 'annual') => void;
}

export const SubscriptionPlans = ({ currentPlan, onSelectPlan }: SubscriptionPlansProps) => {
  const { createCheckout, subscription } = useUnifiedAuth();

  const handleSelectPlan = () => {
    if (onSelectPlan) {
      onSelectPlan('annual');
    } else {
      createCheckout('annual');
    }
  };

  const isCurrentPlan = subscription?.status === 'active';

  return (
    <div className="max-w-2xl mx-auto">
      {/* Oferta Especial Badge */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-full font-bold text-lg shadow-lg animate-pulse">
          <Star className="h-5 w-5" />
          OFERTA EXCLUSIVA VIP
          <Star className="h-5 w-5" />
        </div>
      </div>

      {/* Card Principal */}
      <Card className="relative border-2 border-orange-500 shadow-2xl bg-gradient-to-br from-white to-orange-50/30">
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <Badge className="bg-red-500 text-white px-4 py-2 text-sm font-bold">
            🔥 MELHOR VALOR
          </Badge>
        </div>

        <CardHeader className="text-center pb-6 pt-8">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center mb-6 shadow-lg">
            <Crown className="h-10 w-10 text-white" />
          </div>
          
          <CardTitle className="text-3xl font-bold text-gray-900 mb-2">
            Assinatura VIP Pizza Premium
          </CardTitle>
          
          <p className="text-lg text-gray-600 mb-6">
            Acesso ilimitado às pizzas artesanais mais premiadas da cidade
          </p>
          
          <div className="bg-white rounded-xl p-6 shadow-inner border">
            <div className="flex items-baseline justify-center gap-2 mb-2">
              <span className="text-sm text-gray-500">apenas</span>
              <span className="text-5xl font-black text-red-600">
                R$ 8,32
              </span>
              <span className="text-lg text-gray-600">/mês</span>
            </div>
            
            <div className="text-center">
              <span className="text-sm text-gray-500 line-through">
                R$ 9,90/mês (cobrança mensal)
              </span>
              <div className="text-lg font-bold text-green-600 mt-1">
                💰 Economize R$ 18,90 por ano!
              </div>
              <div className="text-sm text-gray-600 mt-2">
                <strong>Pagamento anual: R$ 99,90</strong>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-8 pb-8">
          {/* Benefícios VIP */}
          <div className="space-y-4 mb-8">
            <h3 className="text-xl font-bold text-center mb-6 text-gray-900">
              🏆 Benefícios Exclusivos VIP
            </h3>
            
            {[
              { icon: "🍕", text: "Cardápio premium com receitas exclusivas não disponíveis em outros lugares" },
              { icon: "⚡", text: "Entrega prioritária em até 30 minutos ou menos" },
              { icon: "💎", text: "Ingredientes artesanais importados e selecionados" },
              { icon: "🎯", text: "Pedidos ilimitados sem taxa de entrega" },
              { icon: "👑", text: "Suporte VIP 24/7 com atendimento prioritário" },
              { icon: "💝", text: "Descontos especiais em bebidas e sobremesas" }
            ].map((benefit, index) => (
              <div key={index} className="flex items-start gap-4 p-3 bg-white/50 rounded-lg">
                <div className="text-2xl">{benefit.icon}</div>
                <div className="flex items-center gap-3 flex-1">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span className="text-gray-700 font-medium">{benefit.text}</span>
                </div>
              </div>
            ))}
          </div>

          {/* CTA Principal */}
          <div className="space-y-4">
            <Button
              className="w-full h-16 text-xl font-bold bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg transform hover:scale-105 transition-all duration-200"
              onClick={handleSelectPlan}
              disabled={isCurrentPlan}
            >
              {isCurrentPlan ? (
                <>
                  <Check className="h-6 w-6 mr-3" />
                  ASSINATURA ATIVA
                </>
              ) : (
                <>
                  <Crown className="h-6 w-6 mr-3" />
                  QUERO MINHA ASSINATURA VIP AGORA!
                </>
              )}
            </Button>
            
            {!isCurrentPlan && (
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-2 text-green-600 font-medium">
                  <Shield className="h-4 w-4" />
                  <span>30 dias de garantia total</span>
                </div>
                <p className="text-sm text-gray-600">
                  Se não ficar 100% satisfeito, devolvemos seu dinheiro
                </p>
                <p className="text-xs text-gray-500">
                  Cancelamento simples a qualquer momento
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};