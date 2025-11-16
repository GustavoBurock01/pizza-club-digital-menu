import { Package2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface StripeItemsListProps {
  items: any[];
  loading?: boolean;
}

export const StripeItemsList = ({ items, loading }: StripeItemsListProps) => {
  if (loading) {
    return (
      <div className="space-y-4">
        <h3 className="text-base font-semibold text-gray-900">Itens do Pedido</h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="space-y-4">
        <h3 className="text-base font-semibold text-gray-900">Itens do Pedido</h3>
        <div className="text-center py-12">
          <Package2 className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Nenhum item encontrado</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-gray-900">Itens do Pedido</h3>
        <Badge variant="secondary" className="text-xs">
          {items.length} {items.length === 1 ? 'item' : 'itens'}
        </Badge>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <div 
            key={item.id} 
            className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-shadow"
          >
            {/* Nome e Quantidade */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-gray-900 mb-1">
                  {item.products?.name || 'Produto'}
                </h4>
                <p className="text-xs text-gray-500">
                  Quantidade: {item.quantity}
                </p>
              </div>
              <div className="text-right">
                <p className="text-base font-bold text-gray-900">
                  R$ {(item.total_price || 0).toFixed(2)}
                </p>
                <p className="text-xs text-gray-500">
                  R$ {(item.unit_price || 0).toFixed(2)} un.
                </p>
              </div>
            </div>

            {/* Customizações */}
            {item.customizations && (
              <div className="space-y-2 pt-3 border-t border-gray-100">
                {/* Borda */}
                {item.customizations.crustName && (
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-medium text-gray-500 min-w-[70px]">Borda:</span>
                    <span className="text-xs text-gray-700">{item.customizations.crustName}</span>
                  </div>
                )}

                {/* Extras */}
                {item.customizations.extrasNames && item.customizations.extrasNames.length > 0 && (
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-medium text-gray-500 min-w-[70px]">Extras:</span>
                    <span className="text-xs text-gray-700">
                      {item.customizations.extrasNames.join(', ')}
                    </span>
                  </div>
                )}

                {/* Bebidas */}
                {item.customizations.drinksNames && item.customizations.drinksNames.length > 0 && (
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-medium text-gray-500 min-w-[70px]">Bebidas:</span>
                    <span className="text-xs text-gray-700">
                      {item.customizations.drinksNames.join(', ')}
                    </span>
                  </div>
                )}

                {/* Observações */}
                {item.customizations.observations && (
                  <div className="flex items-start gap-2 mt-2">
                    <span className="text-xs font-medium text-gray-500 min-w-[70px]">Obs:</span>
                    <span className="text-xs text-gray-700 italic">
                      {item.customizations.observations}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Badge de estoque (se aplicável) */}
            {item.products?.stock_quantity !== undefined && item.products.stock_quantity !== null && (
              <div className="mt-3 pt-2 border-t border-gray-100">
                <Badge 
                  variant={item.products.stock_quantity > 10 ? "secondary" : "destructive"}
                  className="text-xs"
                >
                  Estoque: {item.products.stock_quantity}
                </Badge>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
