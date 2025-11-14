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
        <div className="space-y-2">
          {items.map((item) => {
            const c = item.customizations || {};
            const productName = item.products?.name || 'Produto';
            const categoryName = item.products?.categories?.name || null;
            const subcategoryName = item.products?.subcategories?.name || null;
            const quantity = item.quantity || 1;
            const unit = Number(item.unit_price || 0);
            const total = Number(item.total_price ?? unit * quantity);

            const crustLabel = c.crustName || c.crust || null;
            const crustPrice = c.crustPrice || c.crust_price || null;
            const extrasList = (c.extrasNames || c.extras || []) as string[];
            const extrasPrices = c.extrasPrices || c.extras_prices || null;

            return (
              <div key={item.id} className="py-3 border-b border-border/50 last:border-0">
                {/* Linha principal */}
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {quantity}x {productName}
                    </p>
                    {/* Categoria e Subcategoria */}
                    <div className="flex gap-2 mt-0.5">
                      {categoryName && (
                        <Badge variant="outline" className="text-[10px] h-5 px-1.5 bg-primary/5">
                          {categoryName}
                        </Badge>
                      )}
                      {subcategoryName && (
                        <Badge variant="outline" className="text-[10px] h-5 px-1.5 bg-secondary/5">
                          {subcategoryName}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-sm font-semibold ml-3">
                    R$ {total.toFixed(2)}
                  </p>
                </div>

                {/* Tamanho */}
                {c.size && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    <span className="font-medium">Tamanho:</span> {c.size}
                  </div>
                )}

                {/* Borda */}
                {crustLabel && (
                  <div className="mt-1.5 flex items-center justify-between text-xs bg-accent/30 rounded px-2 py-1.5">
                    <span className="text-foreground">
                      <span className="font-medium">Borda:</span> {crustLabel}
                    </span>
                    {crustPrice != null && crustPrice > 0 && (
                      <span className="font-semibold text-foreground">
                        + R$ {Number(crustPrice).toFixed(2)}
                      </span>
                    )}
                  </div>
                )}

                {/* Adicionais */}
                {Array.isArray(extrasList) && extrasList.length > 0 && (
                  <div className="mt-1.5 flex items-center justify-between text-xs bg-accent/30 rounded px-2 py-1.5">
                    <span className="text-foreground">
                      <span className="font-medium">Adicionais:</span> {extrasList.join(', ')}
                    </span>
                    {Array.isArray(extrasPrices) && extrasPrices.length > 0 && (
                      <span className="font-semibold text-foreground">
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
