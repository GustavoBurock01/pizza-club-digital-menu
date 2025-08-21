import { useState, memo, useMemo } from "react";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { MenuCategory } from "@/components/MenuCategory";
import { MenuSearch } from "@/components/MenuSearch";
import { SubcategoryNavigation } from "@/components/SubcategoryNavigation";
import { Button } from "@/components/ui/button";
import { ShoppingCart, ChevronLeft } from "lucide-react";
import { useMenuOptimized } from "@/hooks/useMenuOptimized";
import { useCart } from "@/hooks/useCart";
import { useNavigate } from "react-router-dom";
import { MenuSkeleton, CategorySkeleton } from "@/components/MenuSkeleton";
import { FixedCartFooter } from "@/components/FixedCartFooter";

// Componente memoizado para otimização
const MenuContent = memo(({ 
  currentView, 
  categories, 
  products, 
  searchTerm,
  selectedCategoryId,
  handleSubcategorySelect,
  handleBackToCategories,
  handleBackToSubcategories,
  getCurrentCategoryName,
  getCurrentSubcategoryName
}: any) => {
  // Filter products com useMemo para otimização
  const filteredProducts = useMemo(() => 
    products.filter((product: any) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase())
    ), [products, searchTerm]
  );

  switch (currentView) {
    case 'categories':
      return (
        <SubcategoryNavigation
          categories={categories}
          onSubcategorySelect={handleSubcategorySelect}
          onBackToCategories={handleBackToCategories}
        />
      );
    
    case 'subcategories':
      return (
        <SubcategoryNavigation
          categories={categories}
          onSubcategorySelect={handleSubcategorySelect}
          onBackToCategories={handleBackToCategories}
          selectedCategoryId={selectedCategoryId}
        />
      );
    
    case 'products':
      return (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              onClick={handleBackToSubcategories}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Voltar para {getCurrentCategoryName()}
            </Button>
          </div>

          <MenuSearch
            searchTerm={searchTerm}
            onSearchChange={() => {}} // Será passado do componente pai
          />

          <MenuCategory
            title={getCurrentSubcategoryName()}
            items={filteredProducts.map((product: any) => ({
              ...product,
              image: product.image_url || "",
              category: getCurrentSubcategoryName()
            }))}
            icon="🍽️"
          />
        </div>
      );
    
    default:
      return null;
  }
});

const Menu = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const { getItemCount } = useCart();
  const navigate = useNavigate();
  
  const {
    categories,
    products,
    loading,
    currentView,
    selectedCategoryId,
    selectedSubcategoryId,
    handleSubcategorySelect,
    handleBackToCategories,
    handleBackToSubcategories,
    getCurrentCategoryName,
    getCurrentSubcategoryName
  } = useMenuOptimized();

  // Loading state otimizado com skeleton
  if (loading) {
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
              {currentView === 'products' ? <MenuSkeleton /> : <CategorySkeleton />}
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
                  {currentView === 'categories' 
                    ? `${categories.length} categorias disponíveis`
                    : currentView === 'subcategories' 
                      ? `Subcategorias de ${getCurrentCategoryName}`
                      : `${products.length} produtos disponíveis`
                  }
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

            <MenuContent
              currentView={currentView}
              categories={categories}
              products={products}
              searchTerm={searchTerm}
              selectedCategoryId={selectedCategoryId}
              handleSubcategorySelect={handleSubcategorySelect}
              handleBackToCategories={handleBackToCategories}
              handleBackToSubcategories={handleBackToSubcategories}
              getCurrentCategoryName={getCurrentCategoryName}
              getCurrentSubcategoryName={getCurrentSubcategoryName}
            />
            
            {/* Search para produtos - controlado pelo componente pai */}
            {currentView === 'products' && (
              <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-30 w-full max-w-md px-4">
                <MenuSearch
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                />
              </div>
            )}
          </div>
        </SidebarInset>
        
        {/* Fixed Cart Footer */}
        <FixedCartFooter />
      </div>
    </SidebarProvider>
  );
};

export default Menu;