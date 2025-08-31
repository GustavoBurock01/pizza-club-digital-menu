import { memo, useMemo } from "react";
import { MenuCategory } from "@/components/MenuCategory";
import { MenuSearch } from "@/components/MenuSearch";
import { SubcategoryNavigation } from "@/components/SubcategoryNavigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

// ===== COMPONENTE OTIMIZADO PARA CONTEÚDO DO MENU =====

interface OptimizedMenuContentProps {
  currentView: 'categories' | 'subcategories' | 'products';
  categories: any[];
  products: any[];
  searchTerm: string;
  selectedCategoryId: string | null;
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
    return (
      <div className="space-y-6">
        <MenuSearch
          searchTerm={searchTerm}
          onSearchChange={onSearchChange}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <MenuCategory
              key={category.id}
              title={category.name}
              items={[]}
              icon="🍽️"
              onClick={() => {
                if (category.subcategories?.length > 0) {
                  handleSubcategorySelect(category.id);
                }
              }}
            />
          ))}
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
        
        {selectedCategory?.subcategories && (
          <SubcategoryNavigation
            subcategories={selectedCategory.subcategories}
            onSelect={handleSubcategorySelect}
          />
        )}
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