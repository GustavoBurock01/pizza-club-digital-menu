import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ShoppingCart, Package } from 'lucide-react';

interface OrderItemsListProps {
  items: any[];
  loading: boolean;
}

export const OrderItemsList = ({ items, loading }: OrderItemsListProps) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <ShoppingCart className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-lg">Itens do Pedido</h3>
        {!loading && items.length > 0 && (
          <Badge variant="secondary" className="ml-auto">
            {items.length} {items.length === 1 ? 'item' : 'itens'}
          </Badge>
        )}
      </div>
      
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="w-16 h-16 rounded-md" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Nenhum item encontrado</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div 
              key={item.id} 
              className="flex gap-3 p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
            >
              {/* Imagem */}
              <div className="w-16 h-16 flex-shrink-0 rounded-md overflow-hidden bg-muted">
                {item.products?.image_url ? (
                  <img 
                    src={item.products.image_url} 
                    alt={item.products.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
              </div>
              
              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{item.products?.name || 'Produto'}</p>
                
                {/* Customizações */}
                {item.customizations && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {item.customizations.size && (
                      <Badge variant="outline" className="text-xs">
                        {item.customizations.size}
                      </Badge>
                    )}
                    {item.customizations.crust && (
                      <Badge variant="outline" className="text-xs">
                        {item.customizations.crust}
                      </Badge>
                    )}
                    {item.customizations.extras?.length > 0 && (
                      item.customizations.extras.map((extra: string, idx: number) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          + {extra}
                        </Badge>
                      ))
                    )}
                  </div>
                )}
                
                {/* Observações */}
                {item.customizations?.observations && (
                  <p className="text-xs text-muted-foreground mt-1 italic line-clamp-2">
                    "{item.customizations.observations}"
                  </p>
                )}
              </div>
              
              {/* Preço */}
              <div className="text-right flex-shrink-0">
                <p className="text-xs text-muted-foreground mb-1">
                  {item.quantity}x
                </p>
                <p className="font-semibold text-sm">
                  R$ {((item.unit_price || 0) * (item.quantity || 1)).toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
