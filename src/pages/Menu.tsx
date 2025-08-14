import { useState } from "react";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { MenuCategory } from "@/components/MenuCategory";
import { MenuSearch } from "@/components/MenuSearch";
import { SubcategoryNavigation } from "@/components/SubcategoryNavigation";
import { Button } from "@/components/ui/button";
import { Loader2, ShoppingCart, ChevronLeft } from "lucide-react";
import { useMenu } from "@/hooks/useMenu";
import { useCart } from "@/hooks/useCart";
import { useNavigate } from "react-router-dom";

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
  } = useMenu();

  // Filter products based on search term
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

  const renderContent = () => {
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
            {/* Navigation breadcrumbs */}
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

            {/* Search */}
            <MenuSearch
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
            />

            {/* Products */}
            <MenuCategory
              title={getCurrentSubcategoryName()}
              items={filteredProducts.map(product => ({
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
  };

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
                      ? `Subcategorias de ${getCurrentCategoryName()}`
                      : `${filteredProducts.length} produtos disponíveis`
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

            {renderContent()}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Menu;