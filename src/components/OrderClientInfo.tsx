import { Card } from '@/components/ui/card';
import { User } from 'lucide-react';

interface OrderClientInfoProps {
  order: any;
}

export const OrderClientInfo = ({ order }: OrderClientInfoProps) => {
  return (
    <Card className="p-4 border-l-4 border-l-blue-500">
      <div className="flex items-center gap-2 mb-3">
        <User className="h-5 w-5 text-blue-500" />
        <h3 className="font-semibold text-lg">Cliente</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-muted-foreground text-xs mb-1">Nome</p>
          <p className="font-medium">{order.customer_name || 'Não informado'}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs mb-1">CPF</p>
          <p className="font-medium">{order.profiles?.cpf || 'Não informado'}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs mb-1">Telefone</p>
          <p className="font-medium">{order.customer_phone || 'Não informado'}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs mb-1">Email</p>
          <p className="font-medium truncate">{order.profiles?.email || 'Não informado'}</p>
        </div>
      </div>
    </Card>
  );
};
