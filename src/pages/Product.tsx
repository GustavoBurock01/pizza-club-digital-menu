import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Minus, Plus, ShoppingCart, ChevronDown } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { CartCustomization, Product as ProductType } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/services/supabase';

const CRUST_OPTIONS = [
  { id: 'tradicional', name: 'Tradicional', price: 0 },
  { id: 'catupiry', name: 'Catupiry', price: 5 },
  { id: 'cheddar', name: 'Cheddar', price: 5 },
  { id: 'chocolate', name: 'Chocolate', price: 6 },
];

const EXTRAS_OPTIONS = [
  { id: 'extra-queijo', name: 'Queijo Extra', price: 3 },
  { id: 'bacon', name: 'Bacon', price: 4 },
  { id: 'calabresa', name: 'Calabresa', price: 3 },
  { id: 'frango', name: 'Frango', price: 4 },
  { id: 'cogumelos', name: 'Cogumelos', price: 3 },
  { id: 'azeitona', name: 'Azeitona', price: 2 },
  { id: 'tomate-seco', name: 'Tomate Seco', price: 3 },
  { id: 'rucula', name: 'Rúcula', price: 2 },
];
const Product = () => {
  const {
    id
  } = useParams();
  const navigate = useNavigate();
  const {
    addItem,
    getItemCount
  } = useCart();
  const {
    toast
  } = useToast();
  const [product, setProduct] = useState<ProductType | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedCrust, setSelectedCrust] = useState('tradicional');
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  useEffect(() => {
    if (id) {
      fetchProduct();
    }
  }, [id]);
  const fetchProduct = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('products').select('*, categories(name), subcategories(name)').eq('id', id).single();
      if (error) throw error;
      setProduct(data);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar produto",
        description: error.message,
        variant: "destructive"
      });
      navigate('/menu');
    } finally {
      setLoading(false);
    }
  };
  const handleAddToCart = () => {
    if (!product) return;
    
    const customizations: CartCustomization = {};
    
    // Check if it's a pizza and add customizations
    if (isPizza()) {
      if (selectedCrust !== 'tradicional') {
        customizations.crust = selectedCrust;
      }
      if (selectedExtras.length > 0) {
        customizations.extras = selectedExtras;
      }
    }
    
    // Add item with the selected quantity
    addItem(product, customizations, notes || undefined, quantity);
    
    toast({
      title: "Produto adicionado!",
      description: `${quantity}x ${product.name} adicionado ao carrinho.`
    });
    
    // Redirect to menu
    navigate('/menu');
  };

  const isPizza = () => {
    if (!product) return false;
    
    // IDs das subcategorias de pizza
    const pizzaSubcategoryIds = [
      '76016f75-cbd8-4d1c-97b1-ad06d865bb1b', // Salgadas (Pizzas Broto)
      'e0c3a8f0-9c7a-4abe-8984-7917c32a09e9', // Doces (Pizzas Broto)
      '9fb44275-cf01-4c29-a553-4e1950fe9114', // Salgadas (Pizzas Grandes)
      '760f341a-a218-4ca3-952d-0a7cb65b84b4'  // Doces (Pizzas Grandes)
    ];
    
    return product.subcategory_id ? pizzaSubcategoryIds.includes(product.subcategory_id) : false;
  };

  const isPizzaCategory = () => {
    if (!product) return false;
    
    // IDs das subcategorias de pizza (Pizzas Grandes e Brotos)
    const pizzaSubcategoryIds = [
      '76016f75-cbd8-4d1c-97b1-ad06d865bb1b', // Salgadas (Pizzas Broto)
      'e0c3a8f0-9c7a-4abe-8984-7917c32a09e9', // Doces (Pizzas Broto)
      '9fb44275-cf01-4c29-a553-4e1950fe9114', // Salgadas (Pizzas Grandes)
      '760f341a-a218-4ca3-952d-0a7cb65b84b4'  // Doces (Pizzas Grandes)
    ];
    
    return product.subcategory_id ? pizzaSubcategoryIds.includes(product.subcategory_id) : false;
  };

  const isDrinksCategory = () => {
    if (!product) return false;
    
    // Check if product has subcategories and check the subcategory name
    if (product.subcategories?.name) {
      const drinksKeywords = ['bebida', 'água', 'suco', 'refrigerante', 'drink', 'agua'];
      return drinksKeywords.some(keyword => 
        product.subcategories!.name.toLowerCase().includes(keyword.toLowerCase())
      );
    }
    
    return false;
  };

  const calculateTotalPrice = () => {
    if (!product) return 0;
    let price = product.price;
    
    // Add crust price if it's a pizza
    if (isPizza()) {
      const crust = CRUST_OPTIONS.find(c => c.id === selectedCrust);
      if (crust) price += crust.price;
      
      // Add extras price
      selectedExtras.forEach(extraId => {
        const extra = EXTRAS_OPTIONS.find(e => e.id === extraId);
        if (extra) price += extra.price;
      });
    }
    
    return price * quantity;
  };

  // Calculate total price for display - this will force re-render when quantity changes
  const totalPrice = calculateTotalPrice();

  const toggleExtra = (extraId: string) => {
    setSelectedExtras(prev => 
      prev.includes(extraId) 
        ? prev.filter(id => id !== extraId)
        : [...prev, extraId]
    );
  };
  const formatPrice = (price: number) => {
    return price.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pizza-red"></div>
      </div>;
  }
  if (!product) {
    return <div className="min-h-screen flex items-center justify-center">
        <p>Produto não encontrado</p>
      </div>;
  }
  return <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <div className="ml-auto">
              <h1 className="text-xl font-semibold">Produto</h1>
            </div>
          </header>
          <div className="flex-1">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="sm" onClick={() => navigate('/menu')} className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Voltar
                </Button>
              {getItemCount() > 0 && <Button onClick={() => navigate('/cart')} variant="outline" className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  ({getItemCount()})
                </Button>}
              </div>
            </div>

            <div className="max-w-2xl mx-auto p-4 pb-32">
            {/* Product Image */}
            <div className="aspect-square bg-gradient-to-br from-pizza-cream to-pizza-orange/20 flex items-center justify-center rounded-lg mb-6">
              {product.image_url ? <img src={product.image_url} alt={product.name} className="w-full h-full object-cover rounded-lg" /> : <div className="text-8xl">🍕</div>}
            </div>

            {/* Product Info */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-pizza-dark mb-2">{product.name}</h1>
              {isPizzaCategory() && product.ingredients && product.ingredients.length > 0 ? (
                <p className="text-muted-foreground mb-4">{product.ingredients.join(', ')}</p>
              ) : (
                <p className="text-muted-foreground mb-4">{product.description}</p>
              )}
              <div className="text-3xl font-bold text-pizza-red">
                {formatPrice(product.price)}
              </div>
            </div>


            {/* Pizza Customization */}
            {isPizza() && (
              <div className="space-y-6 mb-8">
                {/* Crust Selection */}
                <div className="space-y-3">
                  <Label className="text-base font-medium">Borda Recheada</Label>
                  <Select value={selectedCrust} onValueChange={setSelectedCrust}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione a borda" />
                    </SelectTrigger>
                    <SelectContent>
                      {CRUST_OPTIONS.map((crust) => (
                        <SelectItem key={crust.id} value={crust.id}>
                          <div className="flex items-center justify-between w-full">
                            <span>{crust.name}</span>
                            {crust.price > 0 && (
                              <span className="text-sm text-muted-foreground ml-2">
                                +{formatPrice(crust.price)}
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Extras Selection */}
                <div className="space-y-3">
                  <Label className="text-base font-medium">Adicionais</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-between"
                      >
                        <span>
                          {selectedExtras.length === 0
                            ? "Selecione adicionais"
                            : `${selectedExtras.length} adicional(is) selecionado(s)`
                          }
                        </span>
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-4" align="start">
                      <div className="space-y-3">
                        {EXTRAS_OPTIONS.map((extra) => (
                          <div key={extra.id} className="flex items-center space-x-3">
                            <Checkbox
                              id={extra.id}
                              checked={selectedExtras.includes(extra.id)}
                              onCheckedChange={() => toggleExtra(extra.id)}
                            />
                            <Label htmlFor={extra.id} className="flex-1 flex justify-between">
                              <span>{extra.name}</span>
                              <span className="text-sm text-muted-foreground">
                                +{formatPrice(extra.price)}
                              </span>
                            </Label>
                          </div>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-base font-medium">Observações</Label>
                  <Textarea
                    id="notes"
                    placeholder="Alguma observação especial sobre sua pizza..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
            )}

            {!isPizza() && (
              <div className="space-y-4 mb-8">
                {/* Notes for non-pizza items */}
                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-base font-medium">Observações</Label>
                  <Textarea
                    id="notes"
                    placeholder="Alguma observação especial..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                  />
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="flex items-center justify-between mb-8">
              <span className="font-medium">Quantidade</span>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" onClick={() => setQuantity(Math.max(1, quantity - 1))} className="h-9 w-9 p-0">
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-8 text-center font-medium">{quantity}</span>
                <Button variant="outline" size="sm" onClick={() => setQuantity(quantity + 1)} className="h-9 w-9 p-0">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Fixed Bottom Button */}
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 md:left-64">
            <div className="max-w-2xl mx-auto">
              <Button onClick={handleAddToCart} className="w-full gradient-pizza text-white h-12">
                Adicionar ao Carrinho • {formatPrice(totalPrice)}
              </Button>
            </div>
          </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>;
};
export default Product;