
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Check, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const status = searchParams.get('status') || 'success';
  const isSuccess = status === 'success';
  const isPending = status === 'pending';

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/menu');
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate]);

  const handleGoToMenu = () => {
    navigate('/menu');
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
      <Card className="w-full max-w-md text-center">
        <CardContent className="pt-8 pb-6">
          <div className="flex justify-center mb-6">
            <div className={`p-4 rounded-full animate-scale-in ${
              isSuccess ? 'bg-green-500' : 'bg-yellow-500'
            }`}>
              <Check className="w-8 h-8 text-white" />
            </div>
          </div>
          
          <h1 className={`text-2xl font-bold mb-2 ${
            isSuccess ? 'text-green-600' : 'text-yellow-600'
          }`}>
            {isSuccess ? 'Pagamento Aprovado!' : 'Pagamento Pendente'}
          </h1>
          
          <p className="text-muted-foreground mb-6">
            {isSuccess 
              ? 'Sua assinatura foi ativada com sucesso. Bem-vindo ao Pizza Club!'
              : 'Seu pagamento está sendo processado. Aguarde a confirmação.'
            }
          </p>
          
          <div className="space-y-3">
            <Button 
              onClick={handleGoToMenu}
              className="w-full gradient-pizza"
            >
              Ir para o Menu
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            
            <p className="text-sm text-muted-foreground">
              Redirecionando automaticamente em 5 segundos...
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSuccess;
