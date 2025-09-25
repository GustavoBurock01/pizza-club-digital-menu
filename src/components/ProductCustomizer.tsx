import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useUnifiedStore } from '@/stores/simpleStore';
import { CartCustomization } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { ChevronDown, Minus, Plus } from 'lucide-react';

interface ProductCustomizerProps {
  product: any;
  isOpen: boolean;
  onClose: () => void;
}

// Configurações dinâmicas baseadas no tipo de produto
const getProductConfig = (product: any) => {
  const category = product?.category?.toLowerCase() || '';
  const productName = product?.name?.toLowerCase() || '';
  
  // Configuração para pizzas
  if (category.includes('pizza') || productName.includes('pizza')) {
    return {
      showCrust: true,
      showExtras: true,
      crustOptions: [
        { id: 'tradicional', name: 'Tradicional', price: 0 },
        { id: 'catupiry', name: 'Catupiry', price: 5 },
        { id: 'cheddar', name: 'Cheddar', price: 5 },
        { id: 'chocolate', name: 'Chocolate', price: 7 },
      ],
      extraOptions: [
        'Queijo Extra',
        'Calabresa',
        'Champignon',
        'Azeitona',
        'Cebola',
        'Tomate',
        'Pimentão',
        'Milho',
      ],
      extraPrice: 3
    };
  }
  
  // Configuração para bebidas
  if (category.includes('bebida') || category.includes('drink')) {
    return {
      showCrust: false,
      showExtras: false,
      showTemperature: true,
      temperatureOptions: [
        { id: 'gelada', name: 'Gelada', price: 0 },
        { id: 'natural', name: 'Natural', price: 0 },
      ]
    };
  }
  
  // Configuração para lanches/hambúrgueres
  if (category.includes('lanche') || category.includes('hamburguer') || category.includes('burger')) {
    return {
      showCrust: false,
      showExtras: true,
      extraOptions: [
        'Queijo Extra',
        'Bacon',
        'Ovo',
        'Alface',
        'Tomate',
        'Cebola',
        'Picles',
        'Molho Extra',
      ],
      extraPrice: 2
    };
  }
  
  // Configuração padrão - apenas observações e quantidade
  return {
    showCrust: false,
    showExtras: false,
  };
};

export const ProductCustomizer = ({ product, isOpen, onClose }: ProductCustomizerProps) => {
  const config = getProductConfig(product);
  
  const [selectedCrust, setSelectedCrust] = useState('tradicional');
  const [selectedTemperature, setSelectedTemperature] = useState('gelada');
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [crustPopoverOpen, setCrustPopoverOpen] = useState(false);
  const [extrasPopoverOpen, setExtrasPopoverOpen] = useState(false);
  
  const { addItem } = useUnifiedStore();
  const { toast } = useToast();

  const resetForm = () => {
    setSelectedCrust('tradicional');
    setSelectedTemperature('gelada');
    setSelectedExtras([]);
    setNotes('');
    setQuantity(1);
    setCrustPopoverOpen(false);
    setExtrasPopoverOpen(false);
  };

  const handleExtraChange = (extra: string, checked: boolean) => {
    if (checked) {
      setSelectedExtras([...selectedExtras, extra]);
    } else {
      setSelectedExtras(selectedExtras.filter(e => e !== extra));
    }
  };

  const calculateTotalPrice = () => {
    let total = product.price * quantity;
    
    // Adicionar preço da borda (pizzas)
    if (config.showCrust && config.crustOptions) {
      const crustOption = config.crustOptions.find(c => c.id === selectedCrust);
      if (crustOption) {
        total += crustOption.price * quantity;
      }
    }
    
    // Adicionar preço dos extras
    if (config.showExtras && config.extraPrice) {
      total += selectedExtras.length * config.extraPrice * quantity;
    }
    
    return total;
  };

  const handleAddToCart = () => {
    const customizations: CartCustomization = {};
    
    // Adicionar customizações baseadas na configuração
    if (config.showCrust && selectedCrust !== 'tradicional') {
      customizations.crust = selectedCrust;
    }
    
    if (config.showTemperature && selectedTemperature !== 'gelada') {
      customizations.extras = [...(customizations.extras || []), `Temperatura: ${selectedTemperature}`];
    }
    
    if (config.showExtras && selectedExtras.length > 0) {
      customizations.extras = selectedExtras;
    }

    addItem(product, customizations, notes, quantity);
    
    toast({
      title: "Produto adicionado!",
      description: `${quantity}x ${product.name} adicionado ao carrinho.`,
    });
    
    resetForm();
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
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 bg-pizza-orange rounded-full flex items-center justify-center text-white text-sm font-bold">
              P
            </div>
            {product.name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Imagem e descrição */}
          {product.image_url && (
            <img 
              src={product.image_url} 
              alt={product.name}
              className="w-full h-48 object-cover rounded-lg"
            />
          )}
          
          {product.description && (
            <p className="text-sm text-muted-foreground">
              {product.description}
            </p>
          )}

          {/* Preço base */}
          <div className="flex justify-between items-center">
            <span className="text-sm">Preço base:</span>
            <Badge variant="outline">{formatPrice(product.price)}</Badge>
          </div>

          {/* Opções de Borda (Pizzas) */}
          {config.showCrust && config.crustOptions && (
            <div className="space-y-2">
              <Label>Tipo de Borda</Label>
              <Popover open={crustPopoverOpen} onOpenChange={setCrustPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="w-full justify-between"
                  >
                    {config.crustOptions.find(c => c.id === selectedCrust)?.name || 'Selecionar'}
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <RadioGroup value={selectedCrust} onValueChange={setSelectedCrust}>
                    {config.crustOptions.map((crust) => (
                      <div key={crust.id} className="flex items-center space-x-2 p-2 hover:bg-accent rounded">
                        <RadioGroupItem value={crust.id} id={crust.id} />
                        <Label htmlFor={crust.id} className="flex-1 cursor-pointer">
                          <div className="flex justify-between">
                            <span>{crust.name}</span>
                            <span className="text-sm text-muted-foreground">
                              {crust.price > 0 ? `+${formatPrice(crust.price)}` : 'Grátis'}
                            </span>
                          </div>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </PopoverContent>
              </Popover>
            </div>
          )}

          {/* Opções de Temperatura (Bebidas) */}
          {config.showTemperature && config.temperatureOptions && (
            <div className="space-y-2">
              <Label>Temperatura</Label>
              <RadioGroup value={selectedTemperature} onValueChange={setSelectedTemperature}>
                {config.temperatureOptions.map((temp) => (
                  <div key={temp.id} className="flex items-center space-x-2">
                    <RadioGroupItem value={temp.id} id={temp.id} />
                    <Label htmlFor={temp.id} className="flex-1 cursor-pointer">
                      {temp.name}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}

          {/* Extras */}
          {config.showExtras && config.extraOptions && (
            <div className="space-y-2">
              <Label>Adicionais ({formatPrice(config.extraPrice || 0)} cada)</Label>
              <Popover open={extrasPopoverOpen} onOpenChange={setExtrasPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="w-full justify-between"
                  >
                    {selectedExtras.length === 0 
                      ? 'Selecionar extras' 
                      : `${selectedExtras.length} extras selecionados`
                    }
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="space-y-2">
                    {config.extraOptions.map((extra) => (
                      <div key={extra} className="flex items-center space-x-2 p-2 hover:bg-accent rounded">
                        <Checkbox
                          id={extra}
                          checked={selectedExtras.includes(extra)}
                          onCheckedChange={(checked) => handleExtraChange(extra, checked as boolean)}
                        />
                        <Label htmlFor={extra} className="flex-1 cursor-pointer">
                          <div className="flex justify-between">
                            <span>{extra}</span>
                            <span className="text-sm text-muted-foreground">
                              +{formatPrice(config.extraPrice || 0)}
                            </span>
                          </div>
                        </Label>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
              
              {selectedExtras.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {selectedExtras.map((extra) => (
                    <Badge key={extra} variant="secondary" className="text-xs">
                      {extra}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="notes">Observações (opcional)</Label>
            <Textarea
              id="notes"
              placeholder="Ex: sem cebola, bem passado, etc."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Quantidade */}
          <div className="space-y-2">
            <Label>Quantidade</Label>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-12 text-center font-medium">{quantity}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuantity(quantity + 1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Total e botões */}
          <div className="space-y-4 pt-4 border-t">
            <div className="flex justify-between items-center text-lg font-semibold">
              <span>Total:</span>
              <span className="text-pizza-orange">{formatPrice(calculateTotalPrice())}</span>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} className="flex-1">
                Cancelar
              </Button>
              <Button onClick={handleAddToCart} className="flex-1 gradient-pizza">
                Adicionar ao Carrinho
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};