import { memo, useMemo } from "react";
import { MenuCategory } from "@/components/MenuCategory";
import { MenuSearch } from "@/components/MenuSearch";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft } from "lucide-react";

// ===== COMPONENTE OTIMIZADO PARA CONTEÚDO DO MENU =====

interface OptimizedMenuContentProps {
  currentView: 'categories' | 'subcategories' | 'products';
  categories: any[];
  products: any[];
  searchTerm: string;
  selectedCategoryId: string | null;
  handleCategorySelect: (categoryId: string) => void;
  handleSubcategorySelect: (subcategoryId: string) => void;
  handleBackToCategories: () => void;
  handleBackToSubcategories: () => void;
  getCurrentCategory: () => any;
  getCurrentSubcategory: () => any;
  onSearchChange: (term: string) => void;
}

export const OptimizedMenuContent = memo(({
  currentView,
  categories,
  products,
  searchTerm,
  selectedCategoryId,
  handleCategorySelect,
  handleSubcategorySelect,
  handleBackToCategories,
  handleBackToSubcategories,
  getCurrentCategory,
  getCurrentSubcategory,
  onSearchChange
}: OptimizedMenuContentProps) => {
  // Filter products com useMemo para otimização
  const filteredProducts = useMemo(() => 
    products.filter((product: any) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase())
    ), [products, searchTerm]
  );

  // ===== NAVEGAÇÃO ENTRE CATEGORIAS =====
  if (currentView === 'categories') {
    console.log('Rendering categories view:', categories);
    
    return (
      <div className="space-y-6">
        <MenuSearch
          searchTerm={searchTerm}
          onSearchChange={onSearchChange}
        />
        
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-foreground">Escolha uma Categoria</h2>
          
          {categories.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Nenhuma categoria encontrada</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((category) => (
                <Card 
                  key={category.id} 
                  className="cursor-pointer hover:shadow-lg transition-all duration-200 border border-border bg-card"
                  onClick={() => {
                    console.log('Category selected:', category);
                    handleCategorySelect(category.id);
                  }}
                >
                  <CardHeader className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-3xl">
                            {category.name.toLowerCase().includes('pizza') ? '🍕' : 
                             category.name.toLowerCase().includes('bebida') ? '🥤' : '🍽️'}
                          </span>
                          <CardTitle className="text-lg font-semibold text-foreground">
                            {category.name}
                          </CardTitle>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {category.name.toLowerCase().includes('grande') ? 'Pizzas tamanho grande' :
                           category.name.toLowerCase().includes('broto') ? 'Pizzas tamanho broto' :
                           category.name.toLowerCase().includes('bebida') ? 'Todas as bebidas disponíveis' :
                           `Produtos da categoria ${category.name}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {category.subcategories?.length || 0} subcategorias
                        </p>
                      </div>
                      <div className="text-muted-foreground">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="9,18 15,12 9,6"></polyline>
                        </svg>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ===== NAVEGAÇÃO ENTRE SUBCATEGORIAS =====
  if (currentView === 'subcategories') {
    const selectedCategory = getCurrentCategory();
    
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={handleBackToCategories}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Voltar às Categorias
          </Button>
          <h2 className="text-2xl font-bold">{selectedCategory?.name || ''}</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {selectedCategory?.subcategories?.map((subcategory: any) => (
            <Card 
              key={subcategory.id} 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleSubcategorySelect(subcategory.id)}
            >
              <CardHeader>
                <CardTitle className="text-center">
                  <span className="text-2xl">🍽️</span>
                  <div>{subcategory.name}</div>
                </CardTitle>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // ===== LISTA DE PRODUTOS =====
  if (currentView === 'products') {
    const currentCategory = getCurrentCategory();
    const currentSubcategory = getCurrentSubcategory();
    
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            onClick={handleBackToSubcategories}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Voltar às Subcategorias
          </Button>
          <h2 className="text-2xl font-bold">{currentSubcategory?.name || ''}</h2>
        </div>

        <MenuSearch
          searchTerm={searchTerm}
          onSearchChange={onSearchChange}
        />

        <MenuCategory
          title={currentSubcategory?.name || ''}
          items={filteredProducts.map((product: any) => ({
            ...product,
            image: product.image_url || "",
            category: currentCategory?.name || ''
          }))}
          icon="🍽️"
        />
      </div>
    );
  }

  return null;
});