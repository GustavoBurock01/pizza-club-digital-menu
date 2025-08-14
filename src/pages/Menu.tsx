
import { useState, useEffect } from "react";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { MenuCategory } from "@/components/MenuCategory";
import { MenuSearch } from "@/components/MenuSearch";
import { Button } from "@/components/ui/button";
import { Loader2, ShoppingCart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/hooks/useCart";
import { useNavigate } from "react-router-dom";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string | null;
  ingredients: string[];
}

const Menu = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { getItemCount } = useCart();
  const navigate = useNavigate();

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_available', true)
        .order('order_position');

      if (error) throw error;
      setProducts(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar produtos",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-pizza-red" />
      </div>
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
              <h1 className="text-xl font-semibold">Cardápio</h1>
            </div>
          </header>
          <div className="flex-1 p-6 space-y-6 pb-20">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-pizza-dark mb-2">
                  Cardápio 🍕
                </h1>
                <p className="text-muted-foreground">
                  {filteredProducts.length} produtos disponíveis
                </p>
              </div>
            {getItemCount() > 0 && (
              <Button 
                onClick={() => navigate('/cart')}
                className="gradient-pizza text-white relative"
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Carrinho ({getItemCount()})
              </Button>
            )}
          </div>

          {/* Search */}
          <MenuSearch
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
          />

          {/* Products */}
          <MenuCategory
            title="Produtos"
            items={filteredProducts.map(product => ({
              ...product,
              image: product.image_url || "",
              category: "Produtos"
            }))}
            icon="🍽️"
          />
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Menu;
