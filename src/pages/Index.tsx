import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Pizza, Star, Clock, Shield, CreditCard, Check, ArrowRight, Users, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { useEffect } from 'react';

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  console.log('Index page rendering successfully', { user });

  const handleAuthNavigation = () => {
    if (user) {
      navigate('/menu');
    } else {
      navigate('/auth');
    }
  };

  const handleSubscriptionAction = () => {
    if (user) {
      // Redirecionar para checkout simples por enquanto
      navigate('/auth');
    } else {
      navigate('/auth');
    }
  };

  useEffect(() => {
    document.title = 'Pizza Premium - Cardápio Exclusivo de Pizzas Artesanais';
  }, []);

  const features = [{
    icon: Pizza,
    title: "Cardápio Exclusivo",
    description: "Acesso a mais de 50 sabores únicos disponíveis apenas para assinantes"
  }, {
    icon: Clock,
    title: "Entrega em 45min",
    description: "Garantia de entrega rápida ou sua próxima pizza é grátis"
  }, {
    icon: Shield,
    title: "Qualidade Premium",
    description: "Ingredientes selecionados e receitas artesanais desenvolvidas por chefs"
  }, {
    icon: Heart,
    title: "Atendimento VIP",
    description: "Suporte prioritário e personalização completa dos seus pedidos"
  }];

  const planBenefits = [
    "Acesso ao cardápio completo com +50 sabores", 
    "Entrega grátis ilimitada", 
    "Pizzas meio a meio sem taxa adicional", 
    "Bordas recheadas incluídas", 
    "Atendimento prioritário via WhatsApp", 
    "Promoções e descontos exclusivos", 
    "Histórico completo de pedidos", 
    "Cancelamento a qualquer momento"
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-red-600 p-2 rounded-lg">
              <Pizza className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-xl text-gray-900">Pizza Premium</h1>
              <p className="text-sm text-gray-600">Cardápio Exclusivo</p>
            </div>
          </div>
          <Button onClick={handleAuthNavigation} className="bg-red-600 hover:bg-red-700 text-white">
            {user ? 'Acessar Dashboard' : 'Entrar / Cadastrar'}
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-red-600 to-orange-500 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <Badge className="bg-white text-red-600 mb-6 text-sm px-4 py-2">
            🎉 Plano Anual por R$ 99,90
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            As Melhores Pizzas da Cidade
            <br />
            <span className="text-yellow-300">Só Para Assinantes</span>
          </h1>
          <p className="text-xl mb-8 text-white/90 max-w-2xl mx-auto">
            Acesse nosso cardápio exclusivo com mais de 50 sabores únicos, 
            entrega grátis ilimitada e atendimento VIP por apenas R$ 99,90/ano
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-white text-red-600 hover:bg-gray-100 text-lg px-8 py-4" onClick={handleSubscriptionAction}>
              Assinar por R$ 99,90/ano
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-red-600 text-lg px-8 py-4" onClick={() => navigate('/menu')}>
              Ver Cardápio Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-orange-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-red-600 mb-2">2,500+</div>
              <p className="text-gray-600">Assinantes Ativos</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-red-600 mb-2">50+</div>
              <p className="text-gray-600">Sabores Exclusivos</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-red-600 mb-2">45min</div>
              <p className="text-gray-600">Tempo Médio de Entrega</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-red-600 mb-2">4.9/5</div>
              <p className="text-gray-600">Avaliação dos Clientes</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Por Que Escolher Nossa Assinatura?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Oferecemos muito mais que pizzas deliciosas. Nossa assinatura é uma experiência completa.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="mx-auto bg-red-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                    <feature.icon className="h-8 w-8 text-red-600" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Plano Simples e Transparente
            </h2>
            <p className="text-xl text-gray-600">
              Sem pegadinhas, sem fidelidade. Cancele quando quiser.
            </p>
          </div>
          
          <div className="max-w-lg mx-auto">
            <Card className="border-2 border-red-600 shadow-xl">
              <CardHeader className="text-center bg-gradient-to-r from-red-600 to-orange-500 text-white rounded-t-lg">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <CreditCard className="h-6 w-6" />
                  <CardTitle className="text-2xl">Plano Premium</CardTitle>
                </div>
                <div className="text-4xl font-bold mb-2">
                  R$ 99,90
                  <span className="text-lg font-normal">/ano</span>
                </div>
                <CardDescription className="text-white/80">
                  Economia garantida no plano anual
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <div className="space-y-4 mb-8">
                  {planBenefits.map((benefit, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                      <span className="text-sm">{benefit}</span>
                    </div>
                  ))}
                </div>
                <Button className="w-full bg-gradient-to-r from-red-600 to-orange-500 text-white text-lg py-6" onClick={handleSubscriptionAction}>
                  Assinar por R$ 99,90/ano
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <p className="text-xs text-center text-gray-500 mt-4">
                  Cancele a qualquer momento. Sem fidelidade.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 bg-gradient-to-r from-red-600 to-orange-500 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Pronto Para a Melhor Pizza da Sua Vida?
          </h2>
          <p className="text-xl mb-8 text-white/90 max-w-2xl mx-auto">
            Junte-se a mais de 2.500 pessoas que já descobriram o prazer de ter acesso 
            ao melhor cardápio de pizzas da cidade.
          </p>
          <Button size="lg" onClick={handleSubscriptionAction} className="bg-white text-red-600 hover:bg-gray-100 px-8 py-4">
            Assinar por R$ 99,90/ano
            <Users className="ml-2 h-5 w-5" />
          </Button>
          <p className="text-sm text-white/80 mt-4">
            Sem compromisso • Cancele quando quiser • Suporte 24/7
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Pizza className="h-6 w-6" />
                <span className="font-bold">Pizza Premium</span>
              </div>
              <p className="text-gray-300 text-sm">
                O melhor sistema de cardápio exclusivo para pizzas artesanais da cidade.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Links Rápidos</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li><a href="#" className="hover:text-white">Como Funciona</a></li>
                <li><a href="#" className="hover:text-white">Cardápio Demo</a></li>
                <li><a href="#" className="hover:text-white">Avaliações</a></li>
                <li><a href="#" className="hover:text-white">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Suporte</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li><a href="#" className="hover:text-white">Central de Ajuda</a></li>
                <li><a href="#" className="hover:text-white">WhatsApp</a></li>
                <li><a href="#" className="hover:text-white">E-mail</a></li>
                <li><a href="#" className="hover:text-white">Política de Privacidade</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Contato</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>📍 Rua das Pizzas, 123</li>
                <li>📞 (11) 99999-9999</li>
                <li>✉️ contato@pizzapremium.com</li>
                <li>🕒 Seg-Dom: 18h às 23h</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-sm text-gray-300">
            <p>&copy; 2024 Pizza Premium. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;