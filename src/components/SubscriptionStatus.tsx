import { Badge } from '@/components/ui/badge';
import { Shield, Lock, CheckCircle } from 'lucide-react';
import { useUnifiedAuth } from '@/hooks/useUnifiedAuth';

const SubscriptionStatus = () => {
  const { user, subscription, hasValidSubscription } = useUnifiedAuth();

  if (!user) return null;

  if (subscription.loading) {
    return (
      <Badge variant="secondary" className="animate-pulse">
        Verificando...
      </Badge>
    );
  }

  if (hasValidSubscription()) {
    return (
      <Badge className="bg-green-100 text-green-800 border-green-300">
        <CheckCircle className="h-3 w-3 mr-1" />
        Assinatura Ativa
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">
      <Lock className="h-3 w-3 mr-1" />
      Sem Assinatura
    </Badge>
  );
};

export default SubscriptionStatus;