
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
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 md:left-64 z-40">
      <div className="max-w-2xl mx-auto">
        <Button 
          className="w-full gradient-pizza text-white h-12 flex items-center justify-between"
          onClick={() => navigate('/express-checkout')}
        >
          <div className="flex items-center gap-2">
            <div className="relative">
              <ShoppingCart className="h-5 w-5" />
              <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs bg-pizza-orange text-white">
                {itemCount}
              </Badge>
            </div>
            <span>Ver sacola</span>
          </div>
          <span className="font-bold">{formatPrice(total)}</span>
        </Button>
      </div>
    </div>
  );
};
