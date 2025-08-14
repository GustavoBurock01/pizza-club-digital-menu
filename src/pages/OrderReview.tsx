import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Clock, MapPin } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const OrderReview = () => {
  const { items, getSubtotal, getTotal, getItemCount } = useCart();
  const navigate = useNavigate();
  const [productDetails, setProductDetails] = useState<Record<string, { categoryName: string; subcategoryName: string }>>({});

  const formatPrice = (price: number) => {
    return price.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  const getCustomizations = (item: any) => {
    const customizations = [];
    
    if (item.customizations?.halfAndHalf) {
      customizations.push(`Meio a meio: ${item.customizations.halfAndHalf.firstHalf} / ${item.customizations.halfAndHalf.secondHalf}`);
    }
    
    if (item.customizations?.extras && item.customizations.extras.length > 0) {
      customizations.push(`Adicionais: ${item.customizations.extras.join(', ')}`);
    }
    
    if (item.customizations?.crust && item.customizations.crust !== 'tradicional') {
      customizations.push(`Borda: ${item.customizations.crust}`);
    }
    
    if (item.notes) {
      customizations.push(`Observações: ${item.notes}`);
    }
    
    return customizations;
  };

  // Buscar informações de categoria e subcategoria para os produtos
  useEffect(() => {
    const fetchProductDetails = async () => {
      const productIds = [...new Set(items.map(item => item.productId))];
      if (productIds.length === 0) return;

      try {
        const { data: products, error } = await supabase
          .from('products')
          .select(`
            id,
            category_id,
            subcategory_id
          `)
          .in('id', productIds);

        if (error) throw error;

        // Buscar subcategorias com suas categorias
        const subcategoryIds = [...new Set(products?.map(p => p.subcategory_id).filter(Boolean))];
        
        const { data: subcategoriesWithCategories, error: subcatError } = await supabase
          .from('subcategories')
          .select(`
            id,
            name,
            category_id,
            categories (
              id,
              name
            )
          `)
          .in('id', subcategoryIds);

        if (subcatError) throw subcatError;

        const detailsMap: Record<string, { categoryName: string; subcategoryName: string }> = {};
        
        products?.forEach((product: any) => {
          const subcategory = subcategoriesWithCategories?.find(sub => sub.id === product.subcategory_id);
          detailsMap[product.id] = {
            categoryName: subcategory?.categories?.name || '',
            subcategoryName: subcategory?.name || ''
          };
        });

        setProductDetails(detailsMap);
      } catch (error) {
        console.error('Erro ao buscar detalhes dos produtos:', error);
      }
    };

    fetchProductDetails();
  }, [items]);

  if (items.length === 0) {
    navigate('/cart');
    return null;
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <div className="ml-auto">
              <h1 className="text-xl font-semibold">Confirmar Pedido</h1>
            </div>
          </header>
          <div className="flex-1 p-6 pb-32">
            <div className="flex items-center gap-4 mb-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/cart')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar ao Carrinho
              </Button>
              <h1 className="text-2xl font-bold">Confirme seu Pedido</h1>
            </div>

            <div className="max-w-3xl mx-auto space-y-6">
              {/* Order Summary Header */}
              <Card className="border-2 border-pizza-orange/20">
                <CardHeader className="bg-gradient-to-r from-pizza-orange/10 to-pizza-red/10">
                  <CardTitle className="flex items-center justify-between">
                    <span>Resumo do Pedido</span>
                    <Badge variant="secondary" className="text-pizza-red">
                      {getItemCount()} {getItemCount() === 1 ? 'item' : 'itens'}
                    </Badge>
                  </CardTitle>
                </CardHeader>
              </Card>

              {/* Order Items */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span>Itens do Pedido</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {items.map((item, index) => (
                    <div key={item.id}>
                      <div className="flex gap-4 p-4 bg-muted/30 rounded-lg">
                        <div className="w-20 h-20 bg-gradient-to-br from-pizza-cream to-pizza-orange/20 rounded-lg flex items-center justify-center flex-shrink-0">
                          {item.image ? (
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-lg" />
                          ) : (
                            <span className="text-3xl">🍕</span>
                          )}
                        </div>
                        
                        <div className="flex-1">
                          {productDetails[item.productId] && (
                            <div className="text-sm text-muted-foreground mb-1">
                              {productDetails[item.productId].categoryName} - {productDetails[item.productId].subcategoryName}
                            </div>
                          )}
                          <h3 className="font-semibold text-lg">{item.name}</h3>
                          
                          {getCustomizations(item).length > 0 && (
                            <div className="mt-2 space-y-1">
                              {getCustomizations(item).map((customization, idx) => (
                                <div key={idx} className="text-sm text-muted-foreground bg-background/50 px-2 py-1 rounded">
                                  {customization}
                                </div>
                              ))}
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-pizza-red border-pizza-red/30">
                                Quantidade: {item.quantity}
                              </Badge>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-muted-foreground">
                                {formatPrice(item.price)} × {item.quantity}
                              </div>
                              <div className="font-bold text-lg text-pizza-red">
                                {formatPrice(item.price * item.quantity)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      {index < items.length - 1 && <Separator className="my-4" />}
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Delivery Info */}
              <Card className="border-green-200 bg-green-50/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-green-800">Entrega Grátis</h3>
                      <p className="text-sm text-green-600">Taxa de entrega cortesia da casa</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Estimated Time */}
              <Card className="border-blue-200 bg-blue-50/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Clock className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-blue-800">Tempo de Entrega</h3>
                      <p className="text-sm text-blue-600">Estimativa: 35-45 minutos</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Order Total */}
              <Card className="border-2 border-pizza-red/20">
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <div className="flex justify-between text-lg">
                      <span>Subtotal ({getItemCount()} {getItemCount() === 1 ? 'item' : 'itens'})</span>
                      <span className="font-medium">{formatPrice(getSubtotal())}</span>
                    </div>
                    <div className="flex justify-between text-lg">
                      <span>Taxa de entrega</span>
                      <span className="font-medium text-green-600">Grátis</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-2xl font-bold">
                      <span>Total</span>
                      <span className="text-pizza-red">{formatPrice(getTotal())}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Fixed Bottom Button */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 md:left-64 shadow-lg">
              <div className="max-w-3xl mx-auto">
                <Button 
                  onClick={() => navigate('/checkout')}
                  className="w-full gradient-pizza text-white h-14 text-lg font-semibold"
                >
                  Continuar para Endereço • {formatPrice(getTotal())}
                </Button>
              </div>
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default OrderReview;