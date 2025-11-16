import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  User, 
  MapPin, 
  CreditCard, 
  Receipt,
  DollarSign,
  ExternalLink,
  Package
} from "lucide-react";
import { useCatalogPricing } from "@/hooks/useCatalogPricing";

interface StripeInfoCardsProps {
  order: any;
  items?: any[];
}

export const StripeInfoCards = ({ order, items = [] }: StripeInfoCardsProps) => {
  const { crustById, crustByName, extraByName } = useCatalogPricing();
  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      pix: 'PIX',
      credit_card: 'Cartão de Crédito',
      debit_card: 'Cartão de Débito',
      cash: 'Dinheiro',
      credit_card_delivery: 'Cartão de Crédito (Presencial)',
      debit_card_delivery: 'Cartão de Débito (Presencial)',
    };
    return labels[method] || method;
  };

  const getPaymentStatusBadge = () => {
    if (order.payment_status === 'paid') {
      return (
        <Badge className="bg-green-50 text-green-700 border-green-200 text-xs">
          ✓ Pago
        </Badge>
      );
    }
    
    const isPresencial = ['credit_card_delivery', 'debit_card_delivery', 'cash'].includes(order.payment_method);
    
    return (
      <Badge variant="secondary" className="text-xs">
        {isPresencial ? '💰 A Cobrar' : '⏳ Pendente'}
      </Badge>
    );
  };

  // Calcular subtotal baseado nos itens reais
  const calculateItemsSubtotal = () => {
    if (!items || items.length === 0) {
      // Fallback para o cálculo antigo
      return order.total_amount - (order.delivery_fee || 0) + (order.discount_amount || 0);
    }

    let total = 0;
    
    items.forEach((item: any) => {
      // Preço base do produto
      const basePrice = item.unit_price * item.quantity;
      
      // Calcular preço da borda
      let crustPrice = 0;
      if (item.customizations?.crust) {
        const crust = crustById[item.customizations.crust];
        crustPrice = (crust?.price || 0) * item.quantity;
      } else if (item.customizations?.crustName) {
        const crust = crustByName[item.customizations.crustName];
        crustPrice = (crust?.price || 0) * item.quantity;
      }
      
      // Calcular preço dos extras
      let extrasPrice = 0;
      if (item.customizations?.extrasNames && Array.isArray(item.customizations.extrasNames)) {
        item.customizations.extrasNames.forEach((extraName: string) => {
          const extra = extraByName[extraName];
          extrasPrice += (extra?.price || 0) * item.quantity;
        });
      }
      
      total += basePrice + crustPrice + extrasPrice;
    });
    
    return total;
  };

  const subtotal = calculateItemsSubtotal();
  const deliveryFee = order.delivery_fee || 0;
  const discountAmount = order.discount_amount || 0;
  const totalAmount = subtotal + deliveryFee - discountAmount;

  return (
    <div className="space-y-6">
      {/* CARD: Cliente */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <User className="h-4 w-4 text-gray-500" />
          <h3 className="text-base font-semibold text-gray-900">Cliente</h3>
        </div>
        
        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Nome
            </label>
            <p className="text-sm text-gray-900 mt-1">
              {order.customer_name || 'Não informado'}
            </p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Telefone
            </label>
            <a 
              href={`tel:${order.customer_phone}`}
              className="text-sm text-blue-600 hover:text-blue-700 mt-1 block"
            >
              {order.customer_phone || 'Não informado'}
            </a>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              CPF
            </label>
            <p className="text-sm text-gray-900 mt-1">
              {order.profiles?.cpf || '—'}
            </p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Email
            </label>
            <p className="text-sm text-gray-900 mt-1 truncate">
              {order.profiles?.email || '—'}
            </p>
          </div>
        </div>
      </div>

      <Separator className="my-6" />

      {/* CARD: Entrega / Retirada */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          {order.delivery_method === 'delivery' ? (
            <MapPin className="h-4 w-4 text-gray-500" />
          ) : (
            <Package className="h-4 w-4 text-gray-500" />
          )}
          <h3 className="text-base font-semibold text-gray-900">
            {order.delivery_method === 'delivery' ? 'Entrega' : 'Retirada'}
          </h3>
          <Badge variant="outline" className="text-xs ml-2">
            {order.delivery_method === 'delivery' ? '🚚 Delivery' : '🏪 Retirada'}
          </Badge>
        </div>

        {order.delivery_method === 'delivery' ? (
          <div className="space-y-3">
            {order.delivery_address_snapshot ? (
              <>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Endereço
                  </label>
                  <p className="text-sm text-gray-900 mt-1">
                    {order.delivery_address_snapshot.street}, {order.delivery_address_snapshot.number}
                  </p>
                  {order.delivery_address_snapshot.complement && (
                    <p className="text-xs text-gray-600 mt-1">
                      {order.delivery_address_snapshot.complement}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {order.delivery_address_snapshot.neighborhood} - {order.delivery_address_snapshot.city}/{order.delivery_address_snapshot.state}
                  </p>
                  {order.delivery_address_snapshot.zip_code && (
                    <p className="text-xs text-gray-500">
                      CEP: {order.delivery_address_snapshot.zip_code}
                    </p>
                  )}
                </div>
                {order.delivery_address_snapshot.reference_point && (
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Ponto de Referência
                    </label>
                    <p className="text-sm text-gray-900 mt-1">
                      {order.delivery_address_snapshot.reference_point}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-gray-600">Endereço não informado</p>
            )}
            
            {order.delivery_fee > 0 && (
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <span className="text-xs text-gray-500">Taxa de entrega</span>
                <span className="text-sm font-semibold text-gray-900">
                  R$ {order.delivery_fee.toFixed(2)}
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900 font-medium">Cliente irá retirar o pedido no balcão</p>
            {order.estimated_delivery_time && (
              <p className="text-xs text-blue-700 mt-1">
                Tempo estimado: {order.estimated_delivery_time} minutos
              </p>
            )}
          </div>
        )}

        {order.notes && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-xs font-medium text-amber-900 mb-1">Observações do Pedido</p>
            <p className="text-sm text-amber-800">{order.notes}</p>
          </div>
        )}
      </div>

      <Separator className="my-6" />

      {/* CARD: Pagamento */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="h-4 w-4 text-gray-500" />
          <h3 className="text-base font-semibold text-gray-900">Pagamento</h3>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Método
              </label>
              <p className="text-sm text-gray-900 mt-1">
                {getPaymentMethodLabel(order.payment_method)}
              </p>
            </div>
            <div>
              {getPaymentStatusBadge()}
            </div>
          </div>

          {order.payment_method === 'cash' && order.change_amount && (
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Troco para</span>
                <span className="text-sm font-semibold text-gray-900">
                  R$ {order.change_amount.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {order.external_payment_id && (
            <div className="pt-2">
              <Button 
                variant="outline" 
                size="sm"
                className="w-full text-xs"
                onClick={() => window.open(`https://dashboard.stripe.com/payments/${order.external_payment_id}`, '_blank')}
              >
                <ExternalLink className="h-3 w-3 mr-2" />
                Ver transação no Stripe
              </Button>
            </div>
          )}
        </div>
      </div>

      <Separator className="my-6" />

      {/* CARD: Resumo Financeiro */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Receipt className="h-4 w-4 text-gray-500" />
          <h3 className="text-base font-semibold text-gray-900">Resumo do Pedido</h3>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Subtotal</span>
            <span className="text-gray-900">R$ {subtotal.toFixed(2)}</span>
          </div>
          
          {order.delivery_fee > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Taxa de entrega</span>
              <span className="text-gray-900">R$ {order.delivery_fee.toFixed(2)}</span>
            </div>
          )}
          
          {order.discount_amount > 0 && (
            <>
              <div className="flex items-center justify-between text-sm">
                <span className="text-green-600">Desconto</span>
                <span className="text-green-600">- R$ {order.discount_amount.toFixed(2)}</span>
              </div>
              {order.coupon_code && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Cupom aplicado</span>
                  <span className="text-gray-500 font-mono">{order.coupon_code}</span>
                </div>
              )}
            </>
          )}
          
          <div className="pt-3 border-t border-gray-200 mt-3">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Total
              </span>
              <span className="text-2xl font-bold text-gray-900">
                R$ {totalAmount.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
