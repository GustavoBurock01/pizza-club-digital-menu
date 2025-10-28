
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart } from 'lucide-react';
import { useUnifiedStore } from '@/stores/simpleStore';
import { useNavigate } from 'react-router-dom';

export const FixedCartFooter = () => {
  const { items, getTotal, getItemCount } = useUnifiedStore();
  const navigate = useNavigate();
  const itemCount = getItemCount();
  const total = getTotal();

  if (itemCount === 0) return null;

  const formatPrice = (price: number) => {
    return price.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t shadow-lg p-3 sm:p-4 md:left-64 z-40 safe-area-bottom">
      <div className="max-w-2xl mx-auto">
        <Button 
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-11 sm:h-12 flex items-center justify-between text-sm sm:text-base"
          onClick={() => navigate('/checkout')}
        >
          <div className="flex items-center gap-2">
            <div className="relative">
              <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
              <Badge className="absolute -top-2 -right-2 h-4 w-4 sm:h-5 sm:w-5 p-0 text-[10px] sm:text-xs bg-accent text-accent-foreground flex items-center justify-center">
                {itemCount}
              </Badge>
            </div>
            <span className="font-medium">Ver sacola</span>
          </div>
          <span className="font-bold">{formatPrice(total)}</span>
        </Button>
      </div>
    </div>
  );
};
