import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { DollarSign } from 'lucide-react';

interface OrderFinancialSummaryProps {
  order: any;
}

export const OrderFinancialSummary = ({ order }: OrderFinancialSummaryProps) => {
  const subtotal = (order.total_amount || 0) - (order.delivery_fee || 0) + (order.discount_amount || 0);
  
  const getPaymentMethodLabel = (method: string) => {
    const methods: Record<string, string> = {
      cash: '💵 Dinheiro',
      pix: '📱 PIX',
      card: '💳 Cartão',
      credit_card: '💳 Cartão de Crédito',
      debit_card: '💳 Cartão de Débito',
    };
    return methods[method] || method;
  };

  const getPaymentStatusLabel = (status: string) => {
    const statuses: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
      paid: { label: '✅ Pago', variant: 'default' },
      pending: { label: '⏳ Pendente', variant: 'secondary' },
      pending_payment: { label: '⏳ Aguardando Pagamento', variant: 'secondary' },
      failed: { label: '❌ Falhou', variant: 'destructive' },
    };
    return statuses[status] || { label: status, variant: 'secondary' };
  };

  const paymentStatus = getPaymentStatusLabel(order.payment_status || 'pending');

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <DollarSign className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-lg">Resumo Financeiro</h3>
      </div>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="font-medium">R$ {subtotal.toFixed(2)}</span>
        </div>
        
        {order.delivery_method === 'delivery' && order.delivery_fee > 0 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Taxa de Entrega</span>
            <span className="font-medium">R$ {(order.delivery_fee || 0).toFixed(2)}</span>
          </div>
        )}
        
        {order.discount_amount > 0 && (
          <div className="flex justify-between text-green-600">
            <span>
              Desconto {order.coupon_code && (
                <Badge variant="outline" className="ml-1 text-xs">
                  {order.coupon_code}
                </Badge>
              )}
            </span>
            <span className="font-medium">- R$ {order.discount_amount.toFixed(2)}</span>
          </div>
        )}
        
        <Separator className="my-2" />
        
        <div className="flex justify-between text-lg font-bold pt-2">
          <span>TOTAL</span>
          <span className="text-primary">R$ {(order.total_amount || 0).toFixed(2)}</span>
        </div>
      </div>
      
      <Separator className="my-3" />
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Forma de Pagamento</span>
          <Badge variant="outline" className="text-xs">
            {getPaymentMethodLabel(order.payment_method || 'cash')}
          </Badge>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Status do Pagamento</span>
          <Badge variant={paymentStatus.variant} className="text-xs">
            {paymentStatus.label}
          </Badge>
        </div>

        {order.payment_method === 'cash' && order.change_for && (
          <div className="mt-2 p-2 bg-muted rounded-md">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Troco para</span>
              <span className="font-medium">R$ {(order.change_for || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs mt-1">
              <span className="text-muted-foreground">Troco</span>
              <span className="font-semibold text-green-600">
                R$ {((order.change_for || 0) - (order.total_amount || 0)).toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
