import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { AdminProduct, useUnifiedAdminData } from '@/hooks/useUnifiedAdminData';
import { formatCurrency } from '@/utils/formatting';

interface AdminProductsListProps {
  products: AdminProduct[];
}

export function AdminProductsList() {
  const { products, toggleAvailability } = useUnifiedAdminData();
  return (
    <Card>
      <CardHeader>
        <CardTitle>Produtos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {products.length === 0 ? (
            <p className="text-center text-muted-foreground">Nenhum produto encontrado</p>
          ) : (
            products.map((product) => (
              <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {product.categories?.name || 'Sem categoria'}
                        {product.subcategories?.name && ` • ${product.subcategories.name}`}
                      </p>
                      {product.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {product.description.slice(0, 100)}...
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(product.price)}</p>
                    <Badge variant={product.is_available ? 'default' : 'secondary'}>
                      {product.is_available ? 'Disponível' : 'Indisponível'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      id={`available-${product.id}`}
                      checked={product.is_available}
                      onCheckedChange={(checked) => toggleAvailability(product.id, checked)}
                    />
                    <Label htmlFor={`available-${product.id}`} className="text-sm cursor-pointer">
                      {product.is_available ? 'Ativo' : 'Pausado'}
                    </Label>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};