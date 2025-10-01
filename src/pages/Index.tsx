import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Pizza, Clock, Shield, Star, Users, Truck, 
  Gift, ChevronDown, ChevronUp, Sparkles, 
  Zap, Target, Trophy, ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUnifiedAuth } from '@/hooks/useUnifiedAuth';
import { useEffect, useState } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const Index = () => {
  const navigate = useNavigate();
  const { user } = useUnifiedAuth();
  const [pizzasPerYear, setPizzasPerYear] = useState(10);

  useEffect(() => {
    document.title = '🍕 Clube da Pizza - Rei da Pizza Paraty | Desconto Vitalício';
  }, []);

  const handleSubscribe = () => {
    if (user) {
      navigate('/plans');
    } else {
      navigate('/auth');
    }
  };

  const normalCost = pizzasPerYear * 100;
  const memberCost = pizzasPerYear * 80 + 99;
  const savings = normalCost - memberCost;

  const benefits = [
    { icon: Target, text: "R$20 de desconto em toda pizza (sem limite)" },
    { icon: Truck, text: "Prioridade no delivery → entrega em até 30 minutos" },
    { icon: Sparkles, text: "Sabores secretos e combos exclusivos" },
    { icon: Gift, text: "Brindes semanais → borda recheada grátis" },
    { icon: Pizza, text: "Todo o cardápio mais barato" },
    { icon: Shield, text: "Exclusivo para moradores de Paraty-RJ" }
  ];

  const faqs = [
    {
      question: "O desconto é mesmo vitalício?",
      answer: "Sim! Quem assinar agora trava o benefício e terá R$20 OFF em cada pizza para sempre."
    },
    {
      question: "E se eu não quiser renovar depois?",
      answer: "Sem problema. A assinatura é anual e você pode cancelar a renovação a qualquer momento."
    },
    {
      question: "Funciona em todo o cardápio?",
      answer: "Sim! Todas as pizzas grandes do cardápio participam."
    },
    {
      question: "Sou turista, posso participar?",
      answer: "Não. O Clube é exclusivo para moradores de Paraty."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-slate-950 to-black relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-red-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-red-700/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Header Minimalista */}
      <header className="glass bg-white/5 sticky top-0 z-50 border-b border-red-500/30 backdrop-blur-xl">
        <div className="container mx-auto px-3 md:px-4 py-3 md:py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="bg-red-600 p-2 md:p-2.5 rounded-xl shadow-2xl">
              <Pizza className="h-5 w-5 md:h-6 md:w-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-base md:text-lg text-white">🍕 Clube da Pizza</h1>
              <p className="text-[10px] md:text-xs text-white/70">Rei da Pizza • Paraty</p>
            </div>
          </div>
          <Button 
            onClick={handleSubscribe} 
            className="bg-red-600 hover:bg-red-700 text-white shadow-2xl hover:scale-105 transition-all text-xs md:text-base px-3 md:px-4 h-8 md:h-10"
          >
            {user ? 'Assinar Agora' : 'Entrar'}
          </Button>
        </div>
      </header>

      {/* Hero Section - Headline Matadora */}
      <section className="py-12 md:py-24 relative z-10">
        <div className="container mx-auto px-3 md:px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-red-600 text-white px-3 md:px-4 py-2 rounded-full font-bold text-[10px] md:text-sm shadow-2xl mb-6 md:mb-8 animate-pulse border border-red-700">
            🔥 LANÇAMENTO EXCLUSIVO - VAGAS LIMITADAS
          </div>
          
          <h1 className="text-2xl md:text-5xl lg:text-6xl font-black mb-4 md:mb-6 leading-tight text-white drop-shadow-lg px-2">
            A MAIOR OPORTUNIDADE DA<br className="hidden md:block" />
            <span className="md:hidden"> </span>HISTÓRIA DA <span className="text-red-500">REI DA PIZZA</span> CHEGOU:
            <br />
            <span className="text-red-500 drop-shadow-lg">
              DESCONTO VITALÍCIO EM TODA PIZZA
            </span>
          </h1>
          
          <p className="text-base md:text-2xl mb-6 md:mb-8 text-white/90 font-medium px-2">
            Só para moradores de Paraty.
          </p>
          
          <div className="glass bg-white/10 border border-red-500/30 rounded-2xl p-4 md:p-6 max-w-2xl mx-auto mb-6 md:mb-8 shadow-2xl">
            <p className="text-xl md:text-3xl font-bold mb-2 text-white">
              Pague apenas <span className="text-red-500">R$ 99/ano</span>
            </p>
            <p className="text-sm md:text-xl text-white">
              e tenha <span className="font-bold text-red-500">R$20 de desconto</span> em cada pizza, para sempre.
            </p>
            <p className="text-xs md:text-sm mt-3 text-white/80">
              ⚠️ Essa oferta única só existe no lançamento. Depois, nunca mais.
            </p>
          </div>

          <Button 
            size="lg" 
            onClick={handleSubscribe}
            className="bg-red-600 hover:bg-red-700 text-white text-base md:text-xl px-8 md:px-12 py-6 md:py-7 shadow-2xl hover:scale-105 transition-all font-bold w-full md:w-auto"
          >
            ASSINE AGORA
            <ArrowRight className="ml-2 h-5 w-5 md:h-6 md:w-6" />
          </Button>
        </div>
      </section>

      {/* Benefícios Principais */}
      <section className="py-12 md:py-20 relative z-10">
        <div className="container mx-auto px-3 md:px-4">
          <div className="text-center mb-8 md:mb-12">
            <Trophy className="h-10 w-10 md:h-12 md:w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl md:text-4xl font-bold text-white mb-4 px-2">
              Por que entrar no Clube da Pizza hoje?
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 max-w-5xl mx-auto">
            {benefits.map((benefit, index) => (
              <div key={index} className="glass bg-white/5 border border-red-500/30 shadow-2xl hover:scale-105 transition-transform rounded-xl">
                <div className="p-4 md:p-6 flex items-start gap-3 md:gap-4">
                  <div className="bg-red-600/20 p-2 md:p-3 rounded-lg flex-shrink-0">
                    <benefit.icon className="h-5 w-5 md:h-6 md:w-6 text-red-500" />
                  </div>
                  <p className="text-xs md:text-sm font-medium text-white">{benefit.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Calculadora de Economia */}
      <section className="py-12 md:py-20 relative z-10">
        <div className="container mx-auto px-3 md:px-4">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-6 md:mb-8">
              <Zap className="h-10 w-10 md:h-12 md:w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl md:text-4xl font-bold text-white mb-4 px-2">
                💰 Quanto você pode economizar?
              </h2>
            </div>

            <div className="glass bg-white/5 border-2 border-red-500/30 shadow-2xl rounded-2xl overflow-hidden">
              <div className="bg-red-600 text-white p-4 md:p-6">
                <h3 className="text-center text-xl md:text-2xl font-bold">Calculadora de Economia</h3>
              </div>
              <div className="p-4 md:p-8">
                <div className="mb-6 md:mb-8">
                  <label className="block text-xs md:text-sm font-medium mb-3 text-white">
                    Quantas pizzas você pede por ano?
                  </label>
                  <Input 
                    type="number"
                    value={pizzasPerYear}
                    onChange={(e) => setPizzasPerYear(Math.max(1, parseInt(e.target.value) || 1))}
                    className="text-center text-lg md:text-xl font-bold bg-white/10 border-red-500/30 text-white"
                    min="1"
                  />
                </div>

                <div className="space-y-3 md:space-y-4 mb-4 md:mb-6">
                  <div className="flex justify-between items-center p-3 md:p-4 bg-white/5 rounded-lg border border-white/10">
                    <span className="font-medium text-white text-xs md:text-base">Cliente normal:</span>
                    <span className="text-lg md:text-xl font-bold text-white">R$ {normalCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 md:p-4 bg-red-600/20 rounded-lg border-2 border-red-500">
                    <span className="font-medium text-white text-xs md:text-base">Membro do Clube:</span>
                    <span className="text-lg md:text-xl font-bold text-red-500">R$ {memberCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 md:p-4 bg-green-600/20 rounded-lg border-2 border-green-500">
                    <span className="font-bold text-sm md:text-lg text-white">💵 Economia Total:</span>
                    <span className="text-xl md:text-2xl font-black text-green-400">R$ {savings.toFixed(2)}</span>
                  </div>
                </div>

                <div className="text-center text-xs md:text-sm text-white/80 space-y-1">
                  <p>➡️ Se pedir 20 pizzas no ano, sua economia sobe para <strong className="text-white">R$ 401</strong></p>
                  <p className="font-bold text-red-500">✨ E o melhor: o desconto é vitalício!</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Prova Social */}
      <section className="py-12 relative z-10">
        <div className="container mx-auto px-3 md:px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 text-center mb-8 md:mb-12">
            <div className="glass bg-white/5 rounded-2xl p-4 md:p-6 border border-red-500/30 shadow-xl hover:scale-105 transition-transform">
              <div className="text-2xl md:text-4xl font-black text-red-500 mb-2">+200</div>
              <p className="text-[10px] md:text-sm text-white font-medium">Clientes na lista de espera</p>
            </div>
            <div className="glass bg-white/5 rounded-2xl p-4 md:p-6 border border-red-500/30 shadow-xl hover:scale-105 transition-transform">
              <div className="text-2xl md:text-4xl font-black text-red-500 mb-2 flex items-center justify-center gap-1">
                4.9 <Star className="h-4 w-4 md:h-6 md:w-6 fill-yellow-500 text-yellow-500" />
              </div>
              <p className="text-[10px] md:text-sm text-white font-medium">Nota no app próprio</p>
            </div>
            <div className="glass bg-white/5 rounded-2xl p-4 md:p-6 border border-red-500/30 shadow-xl hover:scale-105 transition-transform">
              <div className="text-2xl md:text-4xl font-black text-red-500 mb-2">SUPER</div>
              <p className="text-[10px] md:text-sm text-white font-medium">Reconhecida no iFood</p>
            </div>
            <div className="glass bg-white/5 rounded-2xl p-4 md:p-6 border border-red-500/30 shadow-xl hover:scale-105 transition-transform">
              <div className="text-2xl md:text-4xl font-black text-red-500 mb-2 flex items-center justify-center gap-2">
                <Clock className="h-6 w-6 md:h-8 md:w-8" /> 30min
              </div>
              <p className="text-[10px] md:text-sm text-white font-medium">A mais rápida de Paraty</p>
            </div>
          </div>

          <div className="max-w-3xl mx-auto glass bg-white/5 p-4 md:p-6 rounded-xl border border-red-500/30 shadow-2xl">
            <div className="flex items-start gap-3 md:gap-4">
              <div className="text-2xl md:text-4xl">💬</div>
              <div>
                <p className="text-white italic mb-2 text-xs md:text-base">
                  "A melhor pizza da cidade, e agora com desconto vitalício pros clientes fiéis. Inacreditável!"
                </p>
                <p className="text-xs md:text-sm text-white/70">— Cliente da Rei da Pizza</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-12 md:py-20 relative z-10">
        <div className="container mx-auto px-3 md:px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl md:text-4xl font-bold text-center text-white mb-8 md:mb-12 px-2">
              ❓ Perguntas Frequentes
            </h2>
            
            <Accordion type="single" collapsible className="space-y-3 md:space-y-4">
              {faqs.map((faq, index) => (
                <div 
                  key={index} 
                  className="glass bg-white/5 border border-red-500/30 rounded-lg px-4 md:px-6 shadow-2xl"
                >
                  <AccordionItem value={`item-${index}`} className="border-none">
                    <AccordionTrigger className="text-left font-semibold text-white hover:no-underline text-xs md:text-lg py-4">
                      👉 {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-white/80 text-xs md:text-base pb-4">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                </div>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* Urgência - Vagas Limitadas */}
      <section className="py-12 md:py-16 relative z-10 border-y-2 border-red-500/30">
        <div className="container mx-auto px-3 md:px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <div className="inline-block bg-red-600 text-white px-4 md:px-6 py-2 md:py-3 rounded-full font-bold text-sm md:text-lg mb-4 md:mb-6 shadow-2xl animate-pulse">
              🚨 ATENÇÃO: VAGAS LIMITADAS
            </div>
            <h2 className="text-xl md:text-3xl font-bold text-white mb-3 md:mb-4 px-2">
              Para manter a exclusividade, estamos liberando o Clube apenas para um grupo inicial de moradores.
            </h2>
            <p className="text-lg md:text-xl text-red-500 font-bold">
              Depois que fechar, acabou.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-16 md:py-20 relative z-10">
        <div className="container mx-auto px-3 md:px-4 text-center">
          <h2 className="text-2xl md:text-5xl font-black mb-4 md:mb-6 text-white px-2">
            🍕 Não perca essa chance única:
          </h2>
          <p className="text-lg md:text-3xl font-bold mb-6 md:mb-8 text-red-500 px-2">
            "ASSINE AGORA E GARANTA SEU DESCONTO VITALÍCIO"
          </p>
          <Button 
            size="lg"
            onClick={handleSubscribe}
            className="bg-red-600 hover:bg-red-700 text-white text-base md:text-2xl px-8 md:px-16 py-6 md:py-8 shadow-2xl hover:scale-105 transition-all font-black w-full md:w-auto"
          >
            ASSINE AGORA
            <Sparkles className="ml-2 md:ml-3 h-5 w-5 md:h-7 md:w-7" />
          </Button>
          <p className="text-xs md:text-sm mt-4 md:mt-6 text-white/80">
            ✅ Sem compromisso • ✅ Desconto vitalício • ✅ Cancele quando quiser
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black/50 border-t border-red-500/30 text-white py-8 md:py-12 relative z-10">
        <div className="container mx-auto px-3 md:px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 text-center md:text-left">
            <div>
              <div className="flex items-center gap-2 justify-center md:justify-start mb-3 md:mb-4">
                <Pizza className="h-5 w-5 md:h-6 md:w-6 text-red-500" />
                <span className="font-bold text-sm md:text-base">Clube da Pizza</span>
              </div>
              <p className="text-xs md:text-sm text-white/70">
                Rei da Pizza - Paraty, RJ
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-3 md:mb-4 text-sm md:text-base">Contato</h3>
              <ul className="space-y-2 text-xs md:text-sm text-white/70">
                <li>📍 Paraty - RJ</li>
                <li>📞 WhatsApp: (24) 99999-9999</li>
                <li>🕒 Entrega em até 30 minutos</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3 md:mb-4 text-sm md:text-base">Sobre</h3>
              <ul className="space-y-2 text-xs md:text-sm text-white/70">
                <li>Nota 4.9 ⭐</li>
                <li>Super no iFood 🏆</li>
                <li>+200 clientes na lista ❤️</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/20 mt-6 md:mt-8 pt-6 md:pt-8 text-center text-xs md:text-sm text-white/60">
            <p>&copy; 2024 Clube da Pizza - Rei da Pizza Paraty. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
