import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

export const SubscriptionReconciling = () => {
  return (
    <Alert className="border-blue-200 bg-blue-50">
      <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
      <AlertDescription className="ml-2 text-blue-800">
        Sincronizando assinatura com o Stripe...
      </AlertDescription>
    </Alert>
  );
};
