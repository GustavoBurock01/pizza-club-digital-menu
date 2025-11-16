import { Badge } from "@/components/ui/badge";
import { useCatalogPricing } from "@/hooks/useCatalogPricing";

interface StripeItemsListProps {
  items: any[];
  loading?: boolean;
}

export const StripeItemsList = ({ items, loading }: StripeItemsListProps) => {
  const { crustByName, extraByName, loading: pricingLoading } = useCatalogPricing();

  const getCrustPrice = (crustName: string): number => {
    if (!crustName) return 0;
    const crust = crustByName[crustName];
    return crust?.price || 0;
  };

  const getExtraPrice = (extraName: string): number => {
    if (!extraName) return 0;
    const extra = extraByName[extraName];
    return extra?.price || 0;
  };

  // Agrupar itens por categoria
  const groupedItems = items.reduce((acc, item) => {
    const category = item.products?.categories?.name || 'Outros Produtos';
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {} as Record<string, any[]>);

  if (loading || pricingLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-muted h-32 rounded-lg" />
        ))}
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <div className="text-4xl mb-3">📦</div>
        <p className="text-sm">Nenhum item encontrado</p>
      </div>
    );
  }

  const totalItems = items.reduce((sum, item) => sum + (item.total_price || 0), 0);

  return (
    <div className="space-y-6">
      {Object.entries(groupedItems).map(([category, categoryItems]) => (
        <div key={category}>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 px-1">
            {category}
          </h4>
          <div className="space-y-4">
            {(categoryItems as any[]).map((item: any, index: number) => {
              const crustPrice = item.customizations?.crustName 
                ? getCrustPrice(item.customizations.crustName) 
                : 0;
              
              const extrasTotal = (item.customizations?.extrasNames || [])
                .reduce((sum: number, extraName: string) => sum + getExtraPrice(extraName), 0);

              const basePrice = item.unit_price * item.quantity;
              const customizationsTotal = crustPrice + extrasTotal;

              return (
                <div
                  key={index}
                  className="bg-card border border-border rounded-lg p-4 hover:shadow-sm transition-shadow"
                >
                  {/* Badges de categoria/subcategoria/tamanho */}
                  <div className="flex flex-wrap gap-2 mb-2">
                    <Badge variant="secondary" className="text-xs">
                      {item.products?.categories?.name || 'Produto'}
                    </Badge>
                    {item.products?.subcategory && (
                      <Badge variant="outline" className="text-xs">
                        {item.products.subcategory}
                      </Badge>
                    )}
                    {item.products?.size && (
                      <Badge variant="outline" className="text-xs">
                        {item.products.size}
                      </Badge>
                    )}
                  </div>

                  {/* Nome do produto */}
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="font-semibold text-sm text-foreground flex-1">
                      {item.products?.name || 'Produto'}
                    </h3>
                    <span className="text-xs text-muted-foreground ml-2">
                      Qtd: {item.quantity}
                    </span>
                  </div>

                  {/* Descrição do produto */}
                  {item.products?.description && (
                    <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                      {item.products.description}
                    </p>
                  )}

                  {/* Breakdown de preços */}
                  <div className="space-y-1.5 mt-3">
                    {/* Preço base */}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {item.quantity}x Preço base
                      </span>
                      <span className="text-foreground font-medium">
                        R$ {basePrice.toFixed(2)}
                      </span>
                    </div>

                    {/* Borda recheada (destaque especial) */}
                    {item.customizations?.crustName && crustPrice > 0 && (
                      <div className="flex items-center justify-between text-xs bg-amber-50 dark:bg-amber-950/30 px-3 py-1.5 rounded border border-amber-200 dark:border-amber-800">
                        <span className="text-amber-900 dark:text-amber-200 font-medium">
                          + Borda: {item.customizations.crustName}
                        </span>
                        <span className="text-amber-900 dark:text-amber-200 font-semibold">
                          + R$ {crustPrice.toFixed(2)}
                        </span>
                      </div>
                    )}

                    {/* Extras */}
                    {item.customizations?.extrasNames?.map((extraName: string, idx: number) => {
                      const extraPrice = getExtraPrice(extraName);
                      return (
                        <div key={idx} className="flex items-center justify-between text-xs pl-3">
                          <span className="text-muted-foreground">
                            + {extraName}
                          </span>
                          <span className="text-foreground font-medium">
                            + R$ {extraPrice.toFixed(2)}
                          </span>
                        </div>
                      );
                    })}

                    {/* Bebidas */}
                    {item.customizations?.drinksNames?.map((drinkName: string, idx: number) => (
                      <div key={idx} className="flex items-center justify-between text-xs pl-3">
                        <span className="text-muted-foreground">
                          + {drinkName}
                        </span>
                        <span className="text-foreground font-medium">
                          (incluído)
                        </span>
                      </div>
                    ))}

                    {/* Linha separadora + Total do item */}
                    <div className="pt-2 mt-2 border-t border-border">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-foreground">
                          Total do item
                        </span>
                        <span className="text-base font-bold text-foreground">
                          R$ {(item.total_price || 0).toFixed(2)}
                        </span>
                      </div>
                      {customizationsTotal > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          (Base: R$ {basePrice.toFixed(2)} + Adicionais: R$ {customizationsTotal.toFixed(2)})
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Observações */}
                  {item.customizations?.observations && (
                    <div className="mt-3 p-2.5 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded">
                      <p className="text-xs text-blue-900 dark:text-blue-200 leading-relaxed">
                        💬 {item.customizations.observations}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Card de total geral */}
      <div className="sticky bottom-0 mt-6 p-4 bg-muted border-2 border-border rounded-lg shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground mb-1">
              Total de Itens
            </p>
            <p className="text-sm font-semibold text-foreground">
              {items.length} {items.length === 1 ? 'item' : 'itens'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground mb-1">
              Subtotal
            </p>
            <p className="text-xl font-bold text-foreground">
              R$ {totalItems.toFixed(2)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
