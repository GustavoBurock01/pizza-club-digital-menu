
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useUnifiedStore } from '@/stores/simpleStore';
import { CartCustomization } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { ChevronDown } from 'lucide-react';

interface PizzaCustomizerProps {
  product: any;
  isOpen: boolean;
  onClose: () => void;
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
  'Pimentão',
  'Milho',
];

export const PizzaCustomizer = ({ product, isOpen, onClose }: PizzaCustomizerProps) => {
  const [isHalfAndHalf, setIsHalfAndHalf] = useState(false);
  const [firstHalf, setFirstHalf] = useState('');
  const [secondHalf, setSecondHalf] = useState('');
  const [selectedCrust, setSelectedCrust] = useState('tradicional');
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [crustPopoverOpen, setCrustPopoverOpen] = useState(false);
  
  const { addItem } = useUnifiedStore();
  const { toast } = useToast();

  const handleExtraChange = (extra: string, checked: boolean) => {
    if (checked) {
      setSelectedExtras(prev => [...prev, extra]);
    } else {
      setSelectedExtras(prev => prev.filter(e => e !== extra));
    }
  };

  const calculateTotalPrice = () => {
    let price = product.price;
    
    // Add crust price
    const crust = CRUST_OPTIONS.find(c => c.id === selectedCrust);
    if (crust) price += crust.price;
    
    // Add extras price (R$ 3 each)
    price += selectedExtras.length * 3;
    
    return price * quantity;
  };

  const handleAddToCart = () => {
    const customizations: CartCustomization = {};
    
    if (isHalfAndHalf && firstHalf && secondHalf) {
      customizations.halfAndHalf = { firstHalf, secondHalf };
    }
    
    if (selectedCrust !== 'tradicional') {
      customizations.crust = selectedCrust;
    }
    
    if (selectedExtras.length > 0) {
      customizations.extras = selectedExtras;
    }

    // Add multiple items if quantity > 1
    for (let i = 0; i < quantity; i++) {
      addItem(product, customizations, notes || undefined);
    }

    toast({
      title: "Adicionado ao carrinho!",
      description: `${quantity}x ${product.name} adicionado com sucesso.`,
    });

    // Reset form
    setIsHalfAndHalf(false);
    setFirstHalf('');
    setSecondHalf('');
    setSelectedCrust('tradicional');
    setSelectedExtras([]);
    setNotes('');
    setQuantity(1);
    
    onClose();
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto" aria-labelledby="pizza-dialog-title" aria-describedby="pizza-dialog-description">
        <DialogHeader>
          <DialogTitle id="pizza-dialog-title">Personalizar {product.name}</DialogTitle>
          <DialogDescription id="pizza-dialog-description">
            Escolha o tipo de massa, ingredientes extras e outras opções para personalizar sua pizza.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Half and Half Option */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="half-and-half"
                checked={isHalfAndHalf}
                onCheckedChange={(checked) => setIsHalfAndHalf(!!checked)}
              />
              <Label htmlFor="half-and-half">Meio a meio</Label>
            </div>
            
            {isHalfAndHalf && (
              <div className="grid grid-cols-2 gap-3 ml-6">
                <div>
                  <Label>Primeira metade</Label>
                  <input
                    type="text"
                    placeholder="Ex: Margherita"
                    value={firstHalf}
                    onChange={(e) => setFirstHalf(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
                  />
                </div>
                <div>
                  <Label>Segunda metade</Label>
                  <input
                    type="text"
                    placeholder="Ex: Calabresa"
                    value={secondHalf}
                    onChange={(e) => setSecondHalf(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Crust Selection */}
          <div className="space-y-3">
            <Label>Borda Recheada</Label>
            <Popover open={crustPopoverOpen} onOpenChange={setCrustPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={crustPopoverOpen}
                  className="w-full justify-between"
                >
                  {CRUST_OPTIONS.find(crust => crust.id === selectedCrust)?.name || "Selecione uma borda"}
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <div className="p-2">
                  {CRUST_OPTIONS.map((crust) => (
                    <Button
                      key={crust.id}
                      variant="ghost"
                      className="w-full justify-start h-auto p-3"
                      onClick={() => {
                        setSelectedCrust(crust.id);
                        setCrustPopoverOpen(false);
                      }}
                    >
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{crust.name}</span>
                        {crust.price > 0 && (
                          <span className="text-sm text-muted-foreground">
                            +{formatPrice(crust.price)}
                          </span>
                        )}
                      </div>
                    </Button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Extras */}
          <div className="space-y-3">
            <Label>Ingredientes extras (+R$ 3,00 cada)</Label>
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
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              placeholder="Alguma observação especial..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          {/* Quantity */}
          <div className="space-y-2">
            <Label>Quantidade</Label>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="h-9 w-9 p-0"
              >
                -
              </Button>
              <span className="w-8 text-center font-medium">{quantity}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuantity(quantity + 1)}
                className="h-9 w-9 p-0"
              >
                +
              </Button>
            </div>
          </div>

          {/* Total and Add Button */}
          <div className="border-t pt-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-medium">Total:</span>
              <span className="text-xl font-bold text-pizza-red">
                {formatPrice(calculateTotalPrice())}
              </span>
            </div>
            <Button 
              onClick={handleAddToCart} 
              className="w-full gradient-pizza"
              disabled={isHalfAndHalf && (!firstHalf || !secondHalf)}
            >
              Adicionar ao Carrinho
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
