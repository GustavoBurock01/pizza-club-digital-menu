import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Check, Clock } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";

interface Plan {
  id: 'trial' | 'monthly' | 'annual';
  name: string;
  price: number;
  originalPrice?: number;
  period: string;
  features: string[];
  badge?: string;
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline';
  popular?: boolean;
}

const plans: Plan[] = [
  {
    id: 'trial',
    name: 'Trial',
    price: 1.00,
    period: '7 dias',
    features: [
      'Acesso completo por 7 dias',
      'Todos os produtos do cardápio',
      'Suporte prioritário',
      'Cancelamento a qualquer momento'
    ],
    badge: 'Teste',
    badgeVariant: 'outline'
  },
  {
    id: 'monthly',
    name: 'Mensal',
    price: 9.90,
    period: 'mês',
    features: [
      'Acesso completo ao cardápio',
      'Pedidos ilimitados',
      'Suporte prioritário',
      'Cancelamento a qualquer momento'
    ]
  },
  {
    id: 'annual',
    name: 'Anual',
    price: 99.90,
    originalPrice: 118.80,
    period: 'ano',
    features: [
      'Acesso completo ao cardápio',
      'Pedidos ilimitados',
      'Suporte prioritário',
      'Economia de R$ 18,90',
      'Cancelamento a qualquer momento'
    ],
    badge: 'Mais Popular',
    badgeVariant: 'default',
    popular: true
  }
];

interface SubscriptionPlansProps {
  currentPlan?: string;
  onSelectPlan?: (planId: 'trial' | 'monthly' | 'annual') => void;
}

export const SubscriptionPlans = ({ currentPlan, onSelectPlan }: SubscriptionPlansProps) => {
  const { createCheckout, subscription } = useSubscription();

  const handleSelectPlan = (planId: 'trial' | 'monthly' | 'annual') => {
    if (onSelectPlan) {
      onSelectPlan(planId);
    } else {
      createCheckout(planId);
    }
  };

  const isCurrentPlan = (planId: string) => {
    return subscription?.status === 'active' && 
           subscription?.plan_name?.toLowerCase() === planId.toLowerCase();
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
      {plans.map((plan) => (
        <Card 
          key={plan.id}
          className={`relative transition-all duration-200 hover:shadow-lg ${
            plan.popular 
              ? 'border-orange-500 shadow-lg scale-105' 
              : 'border-gray-200 hover:border-orange-300'
          } ${isCurrentPlan(plan.id) ? 'ring-2 ring-green-500' : ''}`}
        >
          {plan.badge && (
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <Badge variant={plan.badgeVariant || 'default'} className="px-3 py-1">
                {plan.badge}
              </Badge>
            </div>
          )}

          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-3">
              {plan.id === 'trial' ? (
                <Clock className="h-6 w-6 text-orange-600" />
              ) : (
                <Crown className="h-6 w-6 text-orange-600" />
              )}
            </div>
            
            <CardTitle className="text-xl">{plan.name}</CardTitle>
            
            <div className="mt-4">
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-3xl font-bold text-pizza-dark">
                  R$ {plan.price.toFixed(2)}
                </span>
                <span className="text-muted-foreground">/{plan.period}</span>
              </div>
              
              {plan.originalPrice && (
                <div className="mt-1">
                  <span className="text-sm text-muted-foreground line-through">
                    R$ {plan.originalPrice.toFixed(2)}/{plan.period}
                  </span>
                  <span className="text-sm text-green-600 ml-2 font-medium">
                    Economize {Math.round(((plan.originalPrice - plan.price) / plan.originalPrice) * 100)}%
                  </span>
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            <ul className="space-y-3 mb-6">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-600">{feature}</span>
                </li>
              ))}
            </ul>

            <Button
              className={`w-full ${
                plan.popular 
                  ? 'gradient-pizza text-white' 
                  : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
              } ${isCurrentPlan(plan.id) ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => handleSelectPlan(plan.id)}
              disabled={isCurrentPlan(plan.id)}
            >
              {isCurrentPlan(plan.id) ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Plano Atual
                </>
              ) : (
                `Escolher ${plan.name}`
              )}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};