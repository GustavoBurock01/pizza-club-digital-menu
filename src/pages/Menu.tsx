
import { useEffect, useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { MenuCategory } from "@/components/MenuCategory";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string | null;
  ingredients: string[];
}

interface Category {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  products: Product[];
}

const Menu = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('order_position');

      if (categoriesError) throw categoriesError;

      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('is_available', true)
        .order('order_position');

      if (productsError) throw productsError;

      const categoriesWithProducts = categoriesData.map(category => ({
        ...category,
        products: productsData.filter(product => product.category_id === category.id)
      }));

      setCategories(categoriesWithProducts);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar cardápio",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getTotalProducts = () => {
    return categories.reduce((total, category) => total + category.products.length, 0);
  };

  const categoryFilters = [
    { id: "all", name: "Todos", count: getTotalProducts() },
    ...categories.map(category => ({
      id: category.id,
      name: category.name.split(' ')[0] + (category.name.includes('(') ? ` ${category.name.split('(')[1]}` : ''),
      count: category.products.length
    }))
  ];

  const filteredCategories = selectedCategory === "all" 
    ? categories 
    : categories.filter(category => category.id === selectedCategory);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-pizza-red" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 p-6 space-y-6">
          <div className="flex items-center gap-4 mb-6">
            <SidebarTrigger className="md:hidden" />
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-pizza-dark mb-2">
                Cardápio Exclusivo 🍕
              </h1>
              <p className="text-muted-foreground">
                Deliciosas pizzas artesanais feitas especialmente para você
              </p>
            </div>
          </div>

          {/* Filtros e Busca */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar pizza ou ingrediente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filtros
              </Button>
            </div>

            {/* Categorias */}
            <div className="flex flex-wrap gap-2">
              {categoryFilters.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex items-center gap-2 ${
                    selectedCategory === category.id 
                      ? "gradient-pizza text-white" 
                      : "hover:bg-pizza-cream"
                  }`}
                >
                  {category.name}
                  <Badge variant="secondary" className="text-xs">
                    {category.count}
                  </Badge>
                </Button>
              ))}
            </div>
          </div>

          {/* Menu Categories */}
          <div className="space-y-12">
            {filteredCategories.map((category) => (
              <MenuCategory
                key={category.id}
                title={category.name}
                items={category.products.map(product => ({
                  ...product,
                  image: product.image_url || "",
                  category: category.name
                }))}
                icon={category.icon || "🍕"}
              />
            ))}
          </div>

          {/* Informações Adicionais */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-pizza-cream p-6 rounded-lg text-center">
              <div className="text-3xl mb-2">🚚</div>
              <h3 className="font-semibold mb-1">Entrega Grátis</h3>
              <p className="text-sm text-muted-foreground">
                Para assinantes em toda a cidade
              </p>
            </div>
            <div className="bg-pizza-cream p-6 rounded-lg text-center">
              <div className="text-3xl mb-2">⏰</div>
              <h3 className="font-semibold mb-1">Entrega Rápida</h3>
              <p className="text-sm text-muted-foreground">
                Em até 45 minutos na sua casa
              </p>
            </div>
            <div className="bg-pizza-cream p-6 rounded-lg text-center">
              <div className="text-3xl mb-2">🍕</div>
              <h3 className="font-semibold mb-1">Meio a Meio</h3>
              <p className="text-sm text-muted-foreground">
                Combine dois sabores em uma pizza
              </p>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Menu;
