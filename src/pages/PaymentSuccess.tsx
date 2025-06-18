
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const PaymentSuccess = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/dashboard');
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate]);

  const handleGoToDashboard = () => {
    navigate('/dashboard');
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
      <Card className="w-full max-w-md text-center">
        <CardContent className="pt-8 pb-6">
          <div className="flex justify-center mb-6">
            <div className="bg-green-500 p-4 rounded-full animate-scale-in">
              <Check className="w-8 h-8 text-white" />
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-green-600 mb-2">
            Pagamento Aprovado!
          </h1>
          
          <p className="text-muted-foreground mb-6">
            Sua assinatura foi ativada com sucesso. Bem-vindo ao Pizza Club!
          </p>
          
          <div className="space-y-3">
            <Button 
              onClick={handleGoToDashboard}
              className="w-full gradient-pizza"
            >
              Ir para Dashboard
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
