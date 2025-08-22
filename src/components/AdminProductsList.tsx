import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AdminProduct } from '@/hooks/useAdminProducts';
import { formatCurrency } from '@/utils/formatting';

interface AdminProductsListProps {
  products: AdminProduct[];
}

export const AdminProductsList = ({ products }: AdminProductsListProps) => {
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
                <div className="text-right">
                  <p className="font-medium">{formatCurrency(product.price)}</p>
                  <Badge variant={product.is_available ? 'default' : 'secondary'}>
                    {product.is_available ? 'Disponível' : 'Indisponível'}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};