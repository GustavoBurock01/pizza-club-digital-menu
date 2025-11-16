import { Badge } from '@/components/ui/badge';

interface StripeDeliveryInfoProps {
  order: any;
}

export const StripeDeliveryInfo = ({ order }: StripeDeliveryInfoProps) => {
  const isDelivery = order.delivery_method === 'delivery';
  
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-semibold text-gray-900">
          {isDelivery ? 'Entrega' : 'Retirada'}
        </h3>
        <Badge variant="outline" className="text-xs">
          {isDelivery ? '🚚 Delivery' : '🏪 Retirada'}
        </Badge>
      </div>
      
      {isDelivery ? (
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Endereço
            </label>
            <p className="text-sm text-gray-900 mt-1">
              {order.delivery_address_snapshot?.street}, {order.delivery_address_snapshot?.number}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {order.delivery_address_snapshot?.neighborhood} - {order.delivery_address_snapshot?.city}/{order.delivery_address_snapshot?.state}
            </p>
            {order.delivery_address_snapshot?.zip_code && (
              <p className="text-xs text-gray-500 mt-1">
                CEP: {order.delivery_address_snapshot.zip_code}
              </p>
            )}
          </div>
          {order.delivery_address_snapshot?.complement && (
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Complemento
              </label>
              <p className="text-sm text-gray-900 mt-1">
                {order.delivery_address_snapshot.complement}
              </p>
            </div>
          )}
          {order.delivery_address_snapshot?.reference_point && (
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Ponto de Referência
              </label>
              <p className="text-sm text-gray-900 mt-1">
                {order.delivery_address_snapshot.reference_point}
              </p>
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-gray-600">Cliente irá retirar o pedido no local</p>
      )}
      
      {order.notes && (
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
          <p className="text-xs font-medium text-amber-900 mb-1">Observações</p>
          <p className="text-sm text-amber-800">{order.notes}</p>
        </div>
      )}
    </div>
  );
};
