
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase, QUERY_KEYS } from '@/services/supabase';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { PizzaCustomizer } from '@/components/PizzaCustomizer';
import { useState, useEffect } from 'react';
import { OptimizedLoadingSpinner } from '@/components/OptimizedLoadingSpinner';
import { useToast } from '@/hooks/use-toast';

const Product = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showCustomizer, setShowCustomizer] = useState(false);

  // Buscar dados do produto
  const { data: product, isLoading, error } = useQuery({
    queryKey: QUERY_KEYS.PRODUCT(id || ''),
    queryFn: async () => {
      if (!id) throw new Error('ID do produto é obrigatório');
      
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          subcategories (
            name,
            categories (
              name
            )
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Abrir automaticamente o customizador quando o produto carregar
  useEffect(() => {
    if (product && !showCustomizer) {
      setShowCustomizer(true);
    }
  }, [product]);

  const formatPrice = (price: number) => {
    return price.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  const handleCustomizerClose = () => {
    setShowCustomizer(false);
    navigate(-1); // Voltar para a página anterior
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <OptimizedLoadingSpinner />
      </div>
    );
  }

  if (error || !product) {
    toast({
      title: "Erro",
      description: "Produto não encontrado.",
      variant: "destructive"
    });
    navigate(-1);
    return null;
  }

  const categoryName = product.subcategories?.categories?.name || 'Categoria';
  const subcategoryName = product.subcategories?.name || 'Subcategoria';

  return (
    <div className="min-h-screen bg-gradient-to-br from-pizza-cream to-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header com botão voltar */}
        <div className="flex items-center gap-4 mb-8">
          <Button 
            variant="outline" 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <div className="text-sm text-muted-foreground">
            {categoryName} / {subcategoryName}
          </div>
        </div>

        {/* Conteúdo do produto */}
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Imagem do produto */}
            <div className="aspect-square bg-gradient-to-br from-pizza-cream to-pizza-orange/20 rounded-xl overflow-hidden">
              {product.image_url ? (
                <img 
                  src={product.image_url} 
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-8xl">🍕</div>
                </div>
              )}
            </div>

            {/* Informações do produto */}
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-pizza-dark mb-2">
                  {product.name}
                </h1>
                <p className="text-muted-foreground text-lg">
                  {product.description}
                </p>
              </div>

              {product.ingredients && product.ingredients.length > 0 && (
                <div className="bg-pizza-cream/50 rounded-lg p-4">
                  <h3 className="font-semibold text-pizza-dark mb-2">
                    Ingredientes:
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {product.ingredients.join(', ')}
                  </p>
                </div>
              )}

              <div className="border-t pt-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-3xl font-bold text-pizza-red">
                    {formatPrice(product.price)}
                  </span>
                </div>

                <Button 
                  onClick={() => setShowCustomizer(true)}
                  className="w-full gradient-pizza text-white text-lg py-6"
                  size="lg"
                >
                  Personalizar e Adicionar ao Carrinho
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Customizador */}
      {product && (
        <PizzaCustomizer
          product={product}
          isOpen={showCustomizer}
          onClose={handleCustomizerClose}
        />
      )}
    </div>
  );
};

export default Product;
