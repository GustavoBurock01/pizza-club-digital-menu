import { Skeleton } from '@/components/ui/skeleton';
import { ShoppingCart, Package } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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
        <div className="space-y-4">
          {items.map((item) => {
            const c = item.customizations || {};
            const productName = item.products?.name || 'Produto';
            const categoryName = item.products?.categories?.name || null;
            const subcategoryName = item.products?.subcategories?.name || null;
            const quantity = item.quantity || 1;
            const unit = Number(item.unit_price || 0);
            const total = Number(item.total_price ?? unit * quantity);

            const crustLabel = c.crustName || c.crust || null;
            const crustPrice = Number(c.crustPrice || c.crust_price || 0);
            const extrasList = (c.extrasNames || c.extras || []) as string[];
            const extrasPrices = (c.extrasPrices || c.extras_prices || []) as number[];

            return (
              <div key={item.id} className="pb-4 border-b border-border/50 last:border-0">
                {/* Categoria e Subcategoria como título */}
                {(categoryName || subcategoryName) && (
                  <div className="mb-2 text-xs font-bold text-muted-foreground uppercase tracking-wide">
                    {categoryName}{subcategoryName ? ` - ${subcategoryName}` : ''}
                  </div>
                )}

                {/* Linha principal com produto e preço total */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <p className="text-sm font-semibold">
                      {quantity}x {productName}
                    </p>
                  </div>
                  <p className="text-sm font-bold ml-3">
                    R$ {total.toFixed(2)}
                  </p>
                </div>

                {/* Tamanho */}
                {c.size && (
                  <div className="mb-1.5 text-xs text-muted-foreground">
                    <span className="font-medium">Tamanho:</span> {c.size}
                  </div>
                )}

                {/* Borda Recheada */}
                {crustLabel && (
                  <div className="mb-1.5 text-xs">
                    <span className="font-medium">Borda Recheada:</span> {crustLabel}
                    {crustPrice > 0 && (
                      <span className="ml-2 font-semibold">
                        + R$ {crustPrice.toFixed(2)}
                      </span>
                    )}
                  </div>
                )}

                {/* Extras/Adicionais */}
                {Array.isArray(extrasList) && extrasList.length > 0 && (
                  <div className="mb-1.5 text-xs">
                    <span className="font-medium">Extras:</span> {extrasList.join(', ')}
                    {Array.isArray(extrasPrices) && extrasPrices.length > 0 && (
                      <span className="ml-2 font-semibold">
                        + R$ {extrasPrices.reduce((acc: number, n: number) => acc + Number(n || 0), 0).toFixed(2)}
                      </span>
                    )}
                  </div>
                )}

                {/* Observações */}
                {c.observations && (
                  <div className="mt-2 text-xs text-muted-foreground italic bg-muted/30 rounded px-2 py-1.5">
                    <span className="font-medium not-italic">Observações:</span> {c.observations}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
