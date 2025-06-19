
import { useEffect, useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { MenuCategory } from "@/components/MenuCategory";
import { SubcategoryNavigation } from "@/components/SubcategoryNavigation";
import { CartDrawer } from "@/components/CartDrawer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, Loader2, Home } from "lucide-react";
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

interface Subcategory {
  id: string;
  name: string;
  description: string | null;
  category_id: string;
  order_position: number | null;
  is_active: boolean | null;
  created_at: string | null;
  product_count: number;
}

interface Category {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  subcategories: Subcategory[];
}

const Menu = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string>("");
  const [currentView, setCurrentView] = useState<'categories' | 'subcategories' | 'products'>('categories');
  const { toast } = useToast();

  useEffect(() => {
    fetchCategoriesAndSubcategories();
  }, []);

  const fetchCategoriesAndSubcategories = async () => {
    try {
      // Buscar categorias
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('order_position');

      if (categoriesError) throw categoriesError;

      // Buscar subcategorias
      const { data: subcategoriesData, error: subcategoriesError } = await supabase
        .from('subcategories')
        .select('*')
        .eq('is_active', true)
        .order('order_position');

      if (subcategoriesError) throw subcategoriesError;

      // Contar produtos por subcategoria
      const { data: productCounts, error: countError } = await supabase
        .from('products')
        .select('subcategory_id')
        .eq('is_available', true);

      if (countError) throw countError;

      const subcategoryProductCounts = productCounts.reduce((acc: Record<string, number>, product) => {
        if (product.subcategory_id) {
          acc[product.subcategory_id] = (acc[product.subcategory_id] || 0) + 1;
        }
        return acc;
      }, {});

      // Organizar dados hierarquicamente
      const categoriesWithSubcategories = categoriesData.map(category => ({
        ...category,
        subcategories: subcategoriesData
          .filter(sub => sub.category_id === category.id)
          .map(sub => ({
            ...sub,
            product_count: subcategoryProductCounts[sub.id] || 0
          }))
      }));

      setCategories(categoriesWithSubcategories);
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

  const fetchProductsBySubcategory = async (subcategoryId: string) => {
    try {
      setLoading(true);
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('subcategory_id', subcategoryId)
        .eq('is_available', true)
        .order('order_position');

      if (productsError) throw productsError;

      setProducts(productsData || []);
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

  const handleSubcategorySelect = (categoryId: string, subcategoryId: string) => {
    setSelectedCategoryId(categoryId);
    
    if (subcategoryId) {
      setSelectedSubcategoryId(subcategoryId);
      setCurrentView('products');
      fetchProductsBySubcategory(subcategoryId);
    } else {
      setCurrentView('subcategories');
    }
  };

  const handleBackToCategories = () => {
    setSelectedCategoryId("");
    setSelectedSubcategoryId("");
    setCurrentView('categories');
    setProducts([]);
  };

  const handleBackToSubcategories = () => {
    setSelectedSubcategoryId("");
    setCurrentView('subcategories');
    setProducts([]);
  };

  const getCurrentCategoryName = () => {
    const category = categories.find(cat => cat.id === selectedCategoryId);
    return category?.name || "";
  };

  const getCurrentSubcategoryName = () => {
    const category = categories.find(cat => cat.id === selectedCategoryId);
    const subcategory = category?.subcategories.find(sub => sub.id === selectedSubcategoryId);
    return subcategory?.name || "";
  };

  if (loading && currentView === 'categories') {
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
              <div className="flex items-center gap-2 mb-2">
                {currentView !== 'categories' && (
                  <>
                    <Button variant="ghost" onClick={handleBackToCategories} className="p-1">
                      <Home className="h-4 w-4" />
                    </Button>
                    <span className="text-muted-foreground">/</span>
                    <span className="text-muted-foreground">{getCurrentCategoryName()}</span>
                    {currentView === 'products' && (
                      <>
                        <span className="text-muted-foreground">/</span>
                        <span className="font-medium">{getCurrentSubcategoryName()}</span>
                      </>
                    )}
                  </>
                )}
              </div>
              <h1 className="text-3xl font-bold text-pizza-dark mb-2">
                {currentView === 'categories' && "Cardápio Exclusivo 🍕"}
                {currentView === 'subcategories' && `${getCurrentCategoryName()}`}
                {currentView === 'products' && `${getCurrentSubcategoryName()}`}
              </h1>
              <p className="text-muted-foreground">
                {currentView === 'categories' && "Escolha uma categoria para começar"}
                {currentView === 'subcategories' && "Selecione uma subcategoria"}
                {currentView === 'products' && `${products.length} ${products.length === 1 ? 'produto encontrado' : 'produtos encontrados'}`}
              </p>
            </div>
            <CartDrawer />
          </div>

          {/* Busca (apenas na view de produtos) */}
          {currentView === 'products' && (
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar produto..."
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
          )}

          {/* Navegação de Categorias e Subcategorias */}
          {(currentView === 'categories' || currentView === 'subcategories') && (
            <SubcategoryNavigation
              categories={categories}
              onSubcategorySelect={handleSubcategorySelect}
              onBackToCategories={handleBackToCategories}
              selectedCategoryId={currentView === 'subcategories' ? selectedCategoryId : undefined}
            />
          )}

          {/* Lista de Produtos */}
          {currentView === 'products' && (
            <div className="space-y-12">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-pizza-red" />
                </div>
              ) : (
                <>
                  {products.length > 0 && (
                    <MenuCategory
                      title={getCurrentSubcategoryName()}
                      items={products.map(product => ({
                        ...product,
                        image: product.image_url || "",
                        category: getCurrentSubcategoryName()
                      }))}
                      icon="🍽️"
                    />
                  )}
                  
                  {currentView === 'products' && (
                    <div className="flex justify-center">
                      <Button 
                        variant="outline" 
                        onClick={handleBackToSubcategories}
                        className="flex items-center gap-2"
                      >
                        Voltar para {getCurrentCategoryName()}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Informações Adicionais (apenas na view de categorias) */}
          {currentView === 'categories' && (
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
          )}
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Menu;
