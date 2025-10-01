import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Crown, Check, Star, Shield, Clock, TrendingUp, Zap, Gift, Sparkles, AlertTriangle } from "lucide-react";
import { useUnifiedAuth } from "@/hooks/useUnifiedAuth";
import { useState } from "react";
interface SubscriptionPlansProps {
  currentPlan?: string;
  onSelectPlan?: (planId: 'annual') => void;
}
export const SubscriptionPlans = ({
  currentPlan,
  onSelectPlan
}: SubscriptionPlansProps) => {
  const {
    createCheckout,
    subscription
  } = useUnifiedAuth();
  const [pizzasPerMonth, setPizzasPerMonth] = useState(4);
  const handleSelectPlan = () => {
    if (onSelectPlan) {
      onSelectPlan('annual');
    } else {
      createCheckout('annual');
    }
  };
  const isCurrentPlan = subscription?.status === 'active';

  // Cálculos de economia
  const normalPrice = 79.90;
  const clubPrice = 59.90;
  const discountPerPizza = 20.00;
  const annualFee = 99.00;
  const monthlyEconomy = pizzasPerMonth * discountPerPizza;
  const annualEconomy = monthlyEconomy * 12;
  const netSavings = annualEconomy - annualFee;
  const roi = (netSavings / annualFee * 100).toFixed(0);
  return <div className="max-w-3xl mx-auto space-y-6 px-3">
      {/* Oferta Especial Badge */}
      <div className="text-center">
        <div className="inline-flex items-center gap-1 md:gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 md:px-6 py-2 md:py-3 rounded-full font-bold text-xs md:text-lg shadow-lg animate-pulse">
          <Star className="h-3 w-3 md:h-5 md:w-5" />
          🍕 CLUBE DA PIZZA - REI DA PIZZA PARATY 🍕
          <Star className="h-3 w-3 md:h-5 md:w-5" />
        </div>
      </div>

      {/* Card Principal - Oferta */}
      <Card className="relative border-2 border-orange-500 shadow-2xl bg-gradient-to-br from-white to-orange-50/30">
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <Badge className="bg-red-500 text-white px-3 md:px-6 py-1 md:py-2 text-xs md:text-base font-bold shadow-lg">
            🔥 DESCONTO VITALÍCIO
          </Badge>
        </div>

        <CardHeader className="text-center pb-4 md:pb-6 pt-6 md:pt-8 px-3 md:px-6">
          <div className="mx-auto w-14 h-14 md:w-20 md:h-20 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center mb-4 md:mb-6 shadow-lg">
            <Crown className="h-7 w-7 md:h-10 md:w-10 text-white" />
          </div>
          
          <CardTitle className="text-2xl md:text-4xl font-bold text-gray-900 mb-3 md:mb-4 px-2">
            Clube da Pizza - Rei da Pizza
          </CardTitle>
          
          <p className="text-base md:text-xl text-gray-600 mb-4 md:mb-6 font-medium px-2">
            Pague apenas R$ 99/ano e tenha R$ 20 de desconto em cada pizza, para sempre.
          </p>
          
          {/* Box de Preço */}
          <div className="bg-gradient-to-br from-orange-100 to-red-100 rounded-xl p-4 md:p-8 shadow-inner border-2 border-orange-300">
            <div className="flex items-baseline justify-center gap-1 md:gap-2 mb-3 md:mb-4">
              <span className="text-4xl md:text-6xl font-black text-red-600">
                R$ 99
              </span>
              <span className="text-lg md:text-2xl text-gray-700 font-bold">/ano</span>
            </div>
            
            {/* Comparação de Preços */}
            <div className="bg-white rounded-lg p-3 md:p-4 mb-3 md:mb-4">
              <div className="flex justify-between items-center text-sm md:text-lg">
                <span className="text-gray-600">Clientes normais pagam:</span>
                <span className="text-gray-500 line-through font-semibold">R$ {normalPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-sm md:text-lg mt-2">
                <span className="text-gray-900 font-bold">Com Clube:</span>
                <span className="text-green-600 font-black text-xl md:text-2xl">R$ {clubPrice.toFixed(2)}</span>
              </div>
            </div>

            <div className="bg-red-600 text-white rounded-lg p-3 md:p-4 text-center">
              <div className="text-2xl md:text-3xl font-black mb-1">R$ 20 OFF</div>
              <div className="text-xs md:text-sm font-medium">EM CADA PIZZA</div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-3 md:px-8 pb-6 md:pb-8">
          {/* Seção de Economia Interativa */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-4 md:p-6 mb-6 md:mb-8 border-2 border-green-300">
            <h3 className="text-lg md:text-2xl font-bold text-center mb-3 md:mb-4 text-gray-900 flex items-center justify-center gap-2">
              <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-green-600" />
              💰 Quanto você pode economizar?
            </h3>
            
            <div className="bg-white rounded-lg p-4 md:p-6 space-y-3 md:space-y-4">
              <div className="text-center mb-3 md:mb-4">
                <label className="text-gray-700 font-medium block mb-2 text-sm md:text-base">
                  Quantas pizzas você pede por mês?
                </label>
                <input type="number" min="1" max="50" value={pizzasPerMonth} onChange={e => setPizzasPerMonth(Number(e.target.value))} className="text-3xl md:text-4xl font-black text-center w-24 md:w-32 border-2 border-orange-300 rounded-lg p-2" />
              </div>

              <div className="space-y-2 text-sm md:text-lg">
                <div className="flex justify-between gap-2">
                  <span className="text-gray-600 text-xs md:text-base">Sem clube ({pizzasPerMonth} pizzas/mês):</span>
                  <span className="font-semibold whitespace-nowrap text-xs md:text-base">R$ {(pizzasPerMonth * normalPrice).toFixed(2)}/mês</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-gray-600 text-xs md:text-base">Com clube ({pizzasPerMonth} pizzas/mês):</span>
                  <span className="font-semibold text-green-600 whitespace-nowrap text-xs md:text-base">R$ {(pizzasPerMonth * clubPrice).toFixed(2)}/mês</span>
                </div>
                <div className="border-t-2 border-gray-300 pt-2 mt-2 space-y-1">
                  <div className="flex justify-between gap-2 text-base md:text-xl font-bold">
                    <span className="text-sm md:text-base">Economia mensal:</span>
                    <span className="text-green-600 whitespace-nowrap">R$ {monthlyEconomy.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between gap-2 text-base md:text-xl font-bold">
                    <span className="text-sm md:text-base">Economia anual:</span>
                    <span className="text-green-600 whitespace-nowrap">R$ {annualEconomy.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between gap-2 text-lg md:text-2xl font-black mt-2">
                    <span className="text-sm md:text-base">Economia Total (ano):</span>
                    <span className="text-green-600 whitespace-nowrap">R$ {netSavings.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg p-3 md:p-4 text-center mt-3 md:mt-4">
                <div className="text-2xl md:text-3xl font-black">{roi}% de retorno! 🚀</div>
                <div className="text-xs md:text-sm mt-1">Se pedir apenas 4 pizzas/mês, já recupera o investimento!</div>
              </div>
            </div>
          </div>

          {/* Benefícios Específicos */}
          <div className="space-y-3 md:space-y-4 mb-6 md:mb-8">
            <h3 className="text-xl md:text-2xl font-bold text-center mb-4 md:mb-6 text-gray-900">
              🏆 Por que entrar no Clube da Pizza hoje?
            </h3>
            
            {[{
            icon: <Sparkles className="h-5 w-5 md:h-6 md:w-6 text-orange-500" />,
            text: "R$20 de desconto em CADA pizza (sem limite de quantidade)"
          }, {
            icon: <Zap className="h-5 w-5 md:h-6 md:w-6 text-yellow-500" />,
            text: "Prioridade no delivery → sua pizza chega em até 30 minutos"
          }, {
            icon: <Crown className="h-5 w-5 md:h-6 md:w-6 text-purple-500" />,
            text: "Sabores secretos e combos exclusivos só para membros"
          }, {
            icon: <Gift className="h-5 w-5 md:h-6 md:w-6 text-red-500" />,
            text: "Brindes semanais → borda recheada grátis em dias especiais"
          }, {
            icon: <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-green-500" />,
            text: "Todo o cardápio mais barato que para clientes normais"
          }, {
            icon: <Star className="h-5 w-5 md:h-6 md:w-6 text-orange-500" />,
            text: "Futuro acesso a plataforma de investimentos (bônus premium)"
          }].map((benefit, index) => <div key={index} className="flex items-start gap-2 md:gap-4 p-3 md:p-4 bg-white/70 rounded-lg border border-orange-200 hover:bg-white hover:shadow-md transition-all">
                <div className="flex-shrink-0">{benefit.icon}</div>
                <div className="flex items-center gap-2 md:gap-3 flex-1">
                  <Check className="h-4 w-4 md:h-5 md:w-5 text-green-500 flex-shrink-0" />
                  <span className="text-gray-800 font-medium text-xs md:text-base">{benefit.text}</span>
                </div>
              </div>)}
          </div>

          {/* Alerta de Urgência */}
          <div className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-300 rounded-xl p-4 md:p-6 mb-6 md:mb-8">
            <div className="flex items-start gap-3 md:gap-4">
              <AlertTriangle className="h-6 w-6 md:h-8 md:w-8 text-red-600 flex-shrink-0 animate-pulse" />
              <div>
                <h4 className="text-base md:text-xl font-bold text-red-700 mb-2">⚠️ ATENÇÃO: CONDIÇÃO DE LANÇAMENTO</h4>
                <p className="text-gray-800 font-medium leading-relaxed text-xs md:text-base">
                  Após o lançamento, o desconto será limitado a apenas <strong className="text-red-600">R$20 POR PEDIDO</strong> (não por pizza).
                  <br />
                  <strong className="text-green-600">Quem assinar AGORA</strong> trava o desconto de <strong className="text-orange-600">R$20 POR PIZZA</strong> para sempre!
                </p>
              </div>
            </div>
          </div>

          {/* CTA Principal */}
          <div className="space-y-4 md:space-y-6">
            <Button className="w-full h-16 md:h-20 text-xs md:text-2xl font-black bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-2xl transform hover:scale-105 transition-all duration-200 animate-pulse px-3 leading-tight" onClick={handleSelectPlan} disabled={isCurrentPlan}>
              {isCurrentPlan ? <div className="flex items-center justify-center gap-2">
                  <Check className="h-4 w-4 md:h-8 md:w-8 flex-shrink-0" />
                  <span className="text-xs md:text-2xl">ASSINATURA ATIVA</span>
                </div> : <div className="flex items-center justify-center gap-2">
                  <Crown className="h-4 w-4 md:h-8 md:w-8 flex-shrink-0" />
                  <span className="text-[10px] md:text-2xl leading-tight">GARANTIR MEU DESCONTO VITALÍCIO AGORA!</span>
                </div>}
            </Button>
            
            {!isCurrentPlan && <>
                <Button variant="outline" className="w-full h-auto min-h-[3rem] md:h-16 text-[11px] md:text-xl font-bold border-2 border-orange-500 text-orange-600 hover:bg-orange-50 py-3 px-3 leading-tight" onClick={handleSelectPlan}>
                  QUERO ASSINAR E PAGAR MENOS EM TODA PIZZA
                </Button>

                <div className="text-center space-y-2 md:space-y-3 pt-3 md:pt-4">
                  <div className="flex items-center justify-center gap-2 text-green-600 font-bold text-sm md:text-lg">
                    <Shield className="h-4 w-4 md:h-5 md:w-5" />
                    <span>Cancelamento sem multa a qualquer momento</span>
                  </div>
                  <p className="text-xs md:text-base text-gray-700 font-medium px-2">
                    Você não perde nada testando. <strong>Na primeira pizza já compensa!</strong>
                  </p>
                </div>
              </>}
          </div>
        </CardContent>
      </Card>

      {/* FAQ Section */}
      <Card className="border-2 border-gray-200 shadow-xl">
        <CardHeader className="px-4 md:px-6">
          <CardTitle className="text-2xl md:text-3xl font-bold text-center text-gray-900">
            ❓ Perguntas Frequentes
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 md:px-6">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger className="text-sm md:text-lg font-semibold text-left">
                👉 O desconto é mesmo vitalício?
              </AccordionTrigger>
              <AccordionContent className="text-xs md:text-base text-gray-700">
                Sim! Quem assinar agora trava o benefício e terá R$20 OFF em cada pizza para sempre. 
                Essa é uma condição especial de lançamento que nunca mais se repetirá.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2">
              <AccordionTrigger className="text-sm md:text-lg font-semibold text-left">
                👉 E se eu não quiser renovar depois?
              </AccordionTrigger>
              <AccordionContent className="text-xs md:text-base text-gray-700">
                Sem problema. A assinatura é anual e você pode cancelar a renovação a qualquer momento. 
                Não há multa ou taxa de cancelamento.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3">
              <AccordionTrigger className="text-sm md:text-lg font-semibold text-left">
                👉 Funciona em todo o cardápio?
              </AccordionTrigger>
              <AccordionContent className="text-xs md:text-base text-gray-700">
                Sim! Todas as pizzas grandes do cardápio participam. Além disso, você tem preços especiais 
                em bebidas, bordas recheadas e outros itens do menu.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4">
              <AccordionTrigger className="text-sm md:text-lg font-semibold text-left">
                👉 Sou turista, posso participar?
              </AccordionTrigger>
              <AccordionContent className="text-xs md:text-base text-gray-700">
                Não. O Clube é exclusivo para moradores de Paraty-RJ. Queremos criar uma comunidade 
                fiel e premiá-los com as melhores condições.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* Garantia e Vagas Limitadas */}
      <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-300 shadow-xl">
        <CardContent className="p-6 md:p-8 text-center">
          <div className="text-3xl md:text-4xl mb-3 md:mb-4">🚨</div>
          <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-3 md:mb-4">Vagas Limitadas!</h3>
          <p className="text-sm md:text-lg text-gray-700 leading-relaxed">
            Para manter a exclusividade, estamos liberando o Clube apenas para um grupo inicial de moradores.
            <br />
            <strong className="text-red-600">Depois que fechar, acabou.</strong>
          </p>
        </CardContent>
      </Card>
    </div>;
};