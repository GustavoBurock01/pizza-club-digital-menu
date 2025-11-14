import { MapPin } from 'lucide-react';

interface OrderDeliveryInfoProps {
  order: any;
}

export const OrderDeliveryInfo = ({ order }: OrderDeliveryInfoProps) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <MapPin className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-lg">
          {order.delivery_method === 'pickup' ? 'Retirada' : 'Entrega'}
        </h3>
      </div>
      
      {order.delivery_method === 'delivery' ? (
        <div className="space-y-3 text-sm">
          <div>
            <p className="text-muted-foreground text-xs mb-1">Endereço</p>
            <p className="font-medium">
              {order.delivery_address_snapshot?.street}, {order.delivery_address_snapshot?.number}
            </p>
            <p className="text-muted-foreground">
              {order.delivery_address_snapshot?.neighborhood} - {order.delivery_address_snapshot?.city}/{order.delivery_address_snapshot?.state}
            </p>
            {order.delivery_address_snapshot?.cep && (
              <p className="text-muted-foreground text-xs">
                CEP: {order.delivery_address_snapshot.cep}
              </p>
            )}
          </div>
          
          {order.delivery_address_snapshot?.complement && (
            <div>
              <p className="text-muted-foreground text-xs mb-1">Complemento</p>
              <p className="text-sm">{order.delivery_address_snapshot.complement}</p>
            </div>
          )}
          
          {order.delivery_address_snapshot?.reference && (
            <div>
              <p className="text-muted-foreground text-xs mb-1">Ponto de Referência</p>
              <p className="text-sm">{order.delivery_address_snapshot.reference}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="text-sm">
          <p className="text-muted-foreground">🏪 Cliente irá retirar no local</p>
        </div>
      )}
      
      {order.delivery_method === 'delivery' && order.notes && (
        <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-xs font-medium text-yellow-800 dark:text-yellow-300 mb-1">
            📝 Observações do Cliente
          </p>
          <p className="text-sm text-yellow-700 dark:text-yellow-400">{order.notes}</p>
        </div>
      )}
    </div>
  );
};
