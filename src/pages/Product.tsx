
import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Minus, Plus } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AddressConfirmation } from '@/components/AddressConfirmation';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string | null;
  ingredients: string[];
}

const CRUST_OPTIONS = [
  { id: 'tradicional', name: 'Tradicional', price: 0 },
  { id: 'catupiry', name: 'Catupiry', price: 5 },
  { id: 'cheddar', name: 'Cheddar', price: 5 },
  { id: 'chocolate', name: 'Chocolate', price: 6 },
];

const EXTRA_OPTIONS = [
  'Mussarela extra',
  'Catupiry',
  'Bacon',
  'Calabresa',
  'Champignon',
  'Azeitona',
  'Cebola',
  'Tomate',
];

const Product = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { toast } = useToast();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedCrust, setSelectedCrust] = useState('tradicional');
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [showAddressConfirmation, setShowAddressConfirmation] = useState(false);

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

  const handleExtraChange = (extra: string, checked: boolean) => {
    if (checked) {
      setSelectedExtras(prev => [...prev, extra]);
    } else {
      setSelectedExtras(prev => prev.filter(e => e !== extra));
    }
  };

  const calculateTotalPrice = () => {
    if (!product) return 0;
    
    let price = product.price;
    
    // Add crust price
    const crust = CRUST_OPTIONS.find(c => c.id === selectedCrust);
    if (crust) price += crust.price;
    
    // Add extras price (R$ 3 each)
    price += selectedExtras.length * 3;
    
    return price * quantity;
  };

  const handleAddToCart = () => {
    if (!product) return;

    const customizations: any = {};
    
    if (selectedCrust !== 'tradicional') {
      customizations.crust = selectedCrust;
    }
    
    if (selectedExtras.length > 0) {
      customizations.extras = selectedExtras;
    }

    // Add multiple items if quantity > 1
    for (let i = 0; i < quantity; i++) {
      addItem(product, customizations);
    }

    setShowAddressConfirmation(true);
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

            {/* Customizations */}
            <div className="space-y-4 mb-6">
              {/* Crust Options */}
              <Accordion type="single" collapsible>
                <AccordionItem value="crust">
                  <AccordionTrigger className="text-left">
                    <div className="flex items-center gap-2">
                      <span>Borda recheada</span>
                      <Badge variant="outline">Opcional</Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <RadioGroup value={selectedCrust} onValueChange={setSelectedCrust}>
                      {CRUST_OPTIONS.map((crust) => (
                        <div key={crust.id} className="flex items-center space-x-2">
                          <RadioGroupItem value={crust.id} id={crust.id} />
                          <Label htmlFor={crust.id} className="flex-1">
                            {crust.name}
                            {crust.price > 0 && (
                              <span className="text-sm text-muted-foreground ml-2">
                                +{formatPrice(crust.price)}
                              </span>
                            )}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </AccordionContent>
                </AccordionItem>

                {/* Extras */}
                <AccordionItem value="extras">
                  <AccordionTrigger className="text-left">
                    <div className="flex items-center gap-2">
                      <span>Adicionais</span>
                      <Badge variant="outline">+R$ 3,00 cada</Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-2 gap-2">
                      {EXTRA_OPTIONS.map((extra) => (
                        <div key={extra} className="flex items-center space-x-2">
                          <Checkbox
                            id={extra}
                            checked={selectedExtras.includes(extra)}
                            onCheckedChange={(checked) => handleExtraChange(extra, !!checked)}
                          />
                          <Label htmlFor={extra} className="text-sm">{extra}</Label>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

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
                Adicionar à sacola • {formatPrice(calculateTotalPrice())}
              </Button>
            </div>
          </div>

          <AddressConfirmation
            isOpen={showAddressConfirmation}
            onClose={() => setShowAddressConfirmation(false)}
            onContinue={() => {
              setShowAddressConfirmation(false);
              toast({
                title: "Produto adicionado!",
                description: `${quantity}x ${product.name} adicionado à sacola.`,
              });
              navigate('/dashboard');
            }}
          />
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Product;
