
import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Minus, Plus, ShoppingCart } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string | null;
  ingredients: string[];
}

const Product = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem, getItemCount } = useCart();
  const { toast } = useToast();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (id) {
      fetchProduct();
    }
  }, [id]);

  const fetchProduct = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setProduct(data);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar produto",
        description: error.message,
        variant: "destructive",
      });
      navigate('/menu');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;

    for (let i = 0; i < quantity; i++) {
      addItem(product);
    }

    toast({
      title: "Produto adicionado!",
      description: `${quantity}x ${product.name} adicionado ao carrinho.`,
    });
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pizza-red"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Produto não encontrado</p>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b z-10 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="md:hidden" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/menu')}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Voltar
                </Button>
              </div>
              {getItemCount() > 0 && (
                <Button 
                  onClick={() => navigate('/cart')}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <ShoppingCart className="h-4 w-4" />
                  ({getItemCount()})
                </Button>
              )}
            </div>
          </div>

          <div className="max-w-2xl mx-auto p-4 pb-32">
            {/* Product Image */}
            <div className="aspect-square bg-gradient-to-br from-pizza-cream to-pizza-orange/20 flex items-center justify-center rounded-lg mb-6">
              {product.image_url ? (
                <img 
                  src={product.image_url} 
                  alt={product.name}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <div className="text-8xl">🍕</div>
              )}
            </div>

            {/* Product Info */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-pizza-dark mb-2">{product.name}</h1>
              <p className="text-muted-foreground mb-4">{product.description}</p>
              <div className="text-3xl font-bold text-pizza-red">
                {formatPrice(product.price)}
              </div>
            </div>

            {/* Ingredients */}
            {product.ingredients && product.ingredients.length > 0 && (
              <Card className="mb-6">
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-2">Ingredientes:</h3>
                  <p className="text-sm text-muted-foreground">
                    {product.ingredients.join(', ')}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Quantity */}
            <div className="flex items-center justify-between mb-8">
              <span className="font-medium">Quantidade</span>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="h-9 w-9 p-0"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-8 text-center font-medium">{quantity}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuantity(quantity + 1)}
                  className="h-9 w-9 p-0"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Fixed Bottom Button */}
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 md:left-64">
            <div className="max-w-2xl mx-auto">
              <Button 
                onClick={handleAddToCart} 
                className="w-full gradient-pizza text-white h-12"
              >
                Adicionar ao Carrinho • {formatPrice(product.price * quantity)}
              </Button>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Product;
