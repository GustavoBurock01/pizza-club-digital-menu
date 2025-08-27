
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Info, ShoppingCart } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUnifiedStore } from '@/stores/simpleStore';

interface MenuItemProps {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  ingredients?: string[];
}

export const MenuCard = ({ 
  id, 
  name, 
  description, 
  price, 
  image, 
  category, 
  ingredients = []
}: MenuItemProps) => {
  const [showIngredients, setShowIngredients] = useState(false);
  const { addItem } = useUnifiedStore();
  const navigate = useNavigate();

  const formatPrice = (price: number) => {
    return price.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  const handleQuickAdd = () => {
    addItem({
      id,
      name,
      price,
      image_url: image
    });
  };

  const isDrinksCategory = () => {
    const drinksKeywords = ['bebida', 'água', 'suco', 'refrigerante', 'drink', 'agua'];
    return drinksKeywords.some(keyword => 
      category.toLowerCase().includes(keyword.toLowerCase())
    );
  };

  const isPizzaCategory = () => {
    const pizzaKeywords = ['pizza', 'brot'];
    return pizzaKeywords.some(keyword => 
      category.toLowerCase().includes(keyword.toLowerCase())
    );
  };

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden">
      <div className="relative">
        <div className="aspect-square bg-gradient-to-br from-pizza-cream to-pizza-orange/20 flex items-center justify-center">
          {image ? (
            <img 
              src={image} 
              alt={name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-6xl">🍕</div>
          )}
        </div>
        <Badge className="absolute top-2 left-2 bg-white text-pizza-red shadow-md">
          {category}
        </Badge>
      </div>

      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg group-hover:text-pizza-red transition-colors">
            {name}
          </CardTitle>
          {!isDrinksCategory() && (
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
          {isPizzaCategory() && ingredients.length > 0 ? (
            <span className="text-muted-foreground">
              {ingredients.join(', ')}
            </span>
          ) : (
            description
          )}
        </CardDescription>
      </CardHeader>

      {showIngredients && ingredients.length > 0 && !isDrinksCategory() && (
        <CardContent className="pt-0 pb-2">
          <div className="p-3 bg-pizza-cream rounded-lg">
            <p className="text-sm font-medium text-pizza-dark mb-2">Ingredientes:</p>
            <p className="text-xs text-muted-foreground">
              {ingredients.join(', ')}
            </p>
          </div>
        </CardContent>
      )}

      <CardContent className="pt-0">
        <div className="flex justify-between items-center">
          <span className="text-2xl font-bold text-pizza-red">
            {formatPrice(price)}
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
            <Button 
              className="gradient-pizza text-white hover:opacity-90 transition-opacity"
              onClick={() => navigate(`/produto/${id}`)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Ver Produto
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
