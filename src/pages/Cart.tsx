
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Minus, Plus, X } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { useNavigate } from 'react-router-dom';

const Cart = () => {
  const { items, updateQuantity, removeItem, getSubtotal, getTotal } = useCart();
  const navigate = useNavigate();

  const formatPrice = (price: number) => {
    return price.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  if (items.length === 0) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <SidebarInset>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
              <SidebarTrigger className="-ml-1" />
              <div className="ml-auto">
                <h1 className="text-xl font-semibold">Carrinho</h1>
              </div>
            </header>
            <div className="flex-1 p-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/menu')}
                className="flex items-center gap-2 mb-6"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>

            <div className="max-w-2xl mx-auto text-center py-12">
              <div className="text-6xl mb-4">🛒</div>
              <h2 className="text-2xl font-bold mb-2">Sua sacola está vazia</h2>
              <p className="text-muted-foreground mb-6">
                Adicione produtos deliciosos à sua sacola
              </p>
              <Button 
                onClick={() => navigate('/menu')}
                className="gradient-pizza text-white"
              >
                Ver Cardápio
              </Button>
            </div>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <div className="ml-auto">
              <h1 className="text-xl font-semibold">Carrinho</h1>
            </div>
          </header>
          <div className="flex-1 p-6 pb-32">
            <div className="flex items-center gap-4 mb-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/menu')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
              <h1 className="text-2xl font-bold">Sua Sacola</h1>
            </div>

          <div className="max-w-2xl mx-auto space-y-6">
            {/* Cart Items */}
            <Card>
              <CardHeader>
                <CardTitle>Itens ({items.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg">
                    <div className="w-16 h-16 bg-gradient-to-br from-pizza-cream to-pizza-orange/20 rounded-lg flex items-center justify-center">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        <span className="text-2xl">🍕</span>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="font-medium">{item.name}</h3>
                      
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="h-8 w-8 p-0"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="h-8 w-8 p-0"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{formatPrice(item.price * item.quantity)}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(item.id)}
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                <Button 
                  variant="link" 
                  onClick={() => navigate('/menu')}
                  className="text-pizza-red"
                >
                  + Adicionar mais itens
                </Button>
              </CardContent>
            </Card>

            {/* Summary */}
            <Card>
              <CardContent className="p-4 space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatPrice(getSubtotal())}</span>
                </div>
                <div className="flex justify-between">
                  <span>Taxa de entrega</span>
                  <span className="text-green-600">Grátis</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-pizza-red">{formatPrice(getTotal())}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Fixed Bottom Button */}
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 md:left-64">
            <div className="max-w-2xl mx-auto">
              <Button 
                onClick={() => navigate('/checkout')}
                className="w-full gradient-pizza text-white h-12"
              >
                Finalizar Pedido • {formatPrice(getTotal())}
              </Button>
            </div>
          </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Cart;
