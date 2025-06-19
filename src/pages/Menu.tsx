
import { useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { MenuCategory } from "@/components/MenuCategory";
import { SubcategoryNavigation } from "@/components/SubcategoryNavigation";
import { MenuHeader } from "@/components/MenuHeader";
import { MenuSearch } from "@/components/MenuSearch";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useMenu } from "@/hooks/useMenu";

const Menu = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const {
    categories,
    products,
    loading,
    currentView,
    selectedCategoryId,
    handleSubcategorySelect,
    handleBackToCategories,
    handleBackToSubcategories,
    getCurrentCategoryName,
    getCurrentSubcategoryName,
  } = useMenu();

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
          <MenuHeader
            currentView={currentView}
            getCurrentCategoryName={getCurrentCategoryName}
            getCurrentSubcategoryName={getCurrentSubcategoryName}
            handleBackToCategories={handleBackToCategories}
            productsCount={products.length}
          />

          {/* Busca (apenas na view de produtos) */}
          {currentView === 'products' && (
            <MenuSearch
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
            />
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
