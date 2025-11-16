interface StripeItemsListProps {
  items: any[];
}

export const StripeItemsList = ({ items }: StripeItemsListProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Itens do Pedido</h3>
        <span className="text-xs text-gray-500">{items.length} {items.length === 1 ? 'item' : 'itens'}</span>
      </div>
      
      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.id} className="flex items-start gap-4 py-3 border-b border-gray-100 last:border-0">
            {/* Quantidade em círculo discreto */}
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
              <span className="text-xs font-semibold text-gray-700">{item.quantity}x</span>
            </div>
            
            {/* Detalhes do item */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">{item.products?.name || 'Produto'}</p>
              
              {item.customizations?.crustName && (
                <p className="text-xs text-gray-500 mt-1">
                  Borda: {item.customizations.crustName}
                  {item.customizations.crustPrice > 0 && ` (+R$ ${item.customizations.crustPrice.toFixed(2)})`}
                </p>
              )}
              
              {item.customizations?.extrasNames && item.customizations.extrasNames.length > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  Extras: {item.customizations.extrasNames.join(', ')}
                </p>
              )}
              
              {item.customizations?.drinksNames && item.customizations.drinksNames.length > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  Bebidas: {item.customizations.drinksNames.join(', ')}
                </p>
              )}
              
              {item.customizations?.observations && (
                <p className="text-xs text-gray-500 mt-1 italic">
                  Obs: {item.customizations.observations}
                </p>
              )}
            </div>
            
            {/* Preço alinhado à direita */}
            <div className="flex-shrink-0 text-right">
              <p className="text-sm font-semibold text-gray-900">
                R$ {(item.total_price || 0).toFixed(2)}
              </p>
              <p className="text-xs text-gray-500">
                R$ {(item.unit_price || 0).toFixed(2)} un.
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
