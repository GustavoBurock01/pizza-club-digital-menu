// ===== MENU CARD OTIMIZADO =====

import { memo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Info, ShoppingCart } from 'lucide-react';
import { useUnifiedStore } from '@/stores/simpleStore';
import { PizzaCustomizer } from './PizzaCustomizer';

interface MenuItemProps {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category_name?: string;
  ingredients?: string[];
  is_available: boolean;
}

export const OptimizedMenuCard = memo(({ item }: { item: MenuItemProps }) => {
  const [showIngredients, setShowIngredients] = useState(false);
  const [showCustomizer, setShowCustomizer] = useState(false);
  const addItem = useUnifiedStore(state => state.addItem);

  const formatPrice = (price: number) => {
    return price.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  const handleQuickAdd = () => {
    addItem(item);
  };

  const isDrinksCategory = () => {
    const drinksKeywords = ['bebida', 'água', 'suco', 'refrigerante', 'drink', 'agua'];
    return drinksKeywords.some(keyword => 
      (item.category_name || '').toLowerCase().includes(keyword.toLowerCase())
    );
  };

  const isPizzaCategory = () => {
    const pizzaKeywords = ['pizza', 'brot'];
    return pizzaKeywords.some(keyword => 
      (item.category_name || '').toLowerCase().includes(keyword.toLowerCase())
    );
  };

  if (!item.is_available) return null;

  return (
    <>
      <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden">
        <div className="relative">
          <div className="aspect-square bg-gradient-to-br from-pizza-cream to-pizza-orange/20 flex items-center justify-center">
            {item.image_url ? (
              <img 
                src={item.image_url} 
                alt={item.name}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="text-6xl">🍕</div>
            )}
          </div>
          {item.category_name && (
            <Badge className="absolute top-2 left-2 bg-white text-pizza-red shadow-md">
              {item.category_name}
            </Badge>
          )}
        </div>

        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <CardTitle className="text-lg group-hover:text-pizza-red transition-colors">
              {item.name}
            </CardTitle>
            {!isDrinksCategory() && item.ingredients && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowIngredients(!showIngredients)}
                className="text-pizza-red hover:bg-pizza-red/10"
              >
                <Info className="h-4 w-4" />
              </Button>
            )}
          </div>
          <CardDescription className="text-sm">
            {isPizzaCategory() && item.ingredients ? (
              <span className="text-muted-foreground">
                {item.ingredients.join(', ')}
              </span>
            ) : (
              item.description
            )}
          </CardDescription>
        </CardHeader>

        {showIngredients && item.ingredients && !isDrinksCategory() && (
          <CardContent className="pt-0 pb-2">
            <div className="p-3 bg-pizza-cream rounded-lg">
              <p className="text-sm font-medium text-pizza-dark mb-2">Ingredientes:</p>
              <p className="text-xs text-muted-foreground">
                {item.ingredients.join(', ')}
              </p>
            </div>
          </CardContent>
        )}

        <CardContent className="pt-0">
          <div className="flex justify-between items-center">
            <span className="text-2xl font-bold text-pizza-red">
              {formatPrice(item.price)}
            </span>
            <div className="flex gap-2">
              <Button 
                variant="outline"
                size="sm"
                onClick={handleQuickAdd}
                className="flex items-center gap-1"
              >
                <ShoppingCart className="h-3 w-3" />
              </Button>
              {isPizzaCategory() && (
                <Button 
                  className="gradient-pizza text-white hover:opacity-90 transition-opacity"
                  onClick={() => setShowCustomizer(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Customizar
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal do PizzaCustomizer */}
      <PizzaCustomizer
        product={item}
        isOpen={showCustomizer}
        onClose={() => setShowCustomizer(false)}
      />
    </>
  );
});

export default OptimizedMenuCard;