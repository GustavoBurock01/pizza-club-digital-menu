import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface Category {
  id: string;
  name: string;
  subcategories?: { id: string; name: string }[];
}

// Mock data - substituir por dados reais do Supabase
const mockCategories: Category[] = [
  {
    id: '1',
    name: 'Pizzas Grandes',
    subcategories: [
      { id: '1-1', name: 'Salgadas' },
      { id: '1-2', name: 'Doces' },
    ],
  },
  {
    id: '2',
    name: 'Pizza Broto',
    subcategories: [
      { id: '2-1', name: 'Salgadas' },
      { id: '2-2', name: 'Doces' },
    ],
  },
  {
    id: '3',
    name: 'Bebidas',
  },
  {
    id: '4',
    name: 'Promoções',
  },
];

interface Props {
  selectedCategory: string | null;
  selectedSubcategory: string | null;
  onSelectCategory: (id: string) => void;
  onSelectSubcategory: (id: string | null) => void;
}

export function SidebarCategorias({
  selectedCategory,
  selectedSubcategory,
  onSelectCategory,
  onSelectSubcategory,
}: Props) {
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['1']);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleCategoryClick = (categoryId: string) => {
    onSelectCategory(categoryId);
    onSelectSubcategory(null);
    toggleCategory(categoryId);
  };

  return (
    <Card className="p-4">
      <div className="mb-4">
        <h3 className="font-semibold mb-2">Categorias</h3>
        <Button variant="outline" size="sm" className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Menu
        </Button>
      </div>

      <div className="space-y-1">
        {mockCategories.map((category) => (
          <div key={category.id}>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'w-full justify-between',
                selectedCategory === category.id && !selectedSubcategory && 'bg-accent'
              )}
              onClick={() => handleCategoryClick(category.id)}
            >
              <span>{category.name}</span>
              {category.subcategories && (
                <ChevronRight
                  className={cn(
                    'h-4 w-4 transition-transform',
                    expandedCategories.includes(category.id) && 'rotate-90'
                  )}
                />
              )}
            </Button>

            {/* Subcategorias */}
            {category.subcategories &&
              expandedCategories.includes(category.id) && (
                <div className="ml-4 mt-1 space-y-1">
                  {category.subcategories.map((sub) => (
                    <Button
                      key={sub.id}
                      variant="ghost"
                      size="sm"
                      className={cn(
                        'w-full justify-start text-sm',
                        selectedSubcategory === sub.id && 'bg-accent'
                      )}
                      onClick={() => {
                        onSelectCategory(category.id);
                        onSelectSubcategory(sub.id);
                      }}
                    >
                      {sub.name}
                    </Button>
                  ))}
                </div>
              )}
          </div>
        ))}
      </div>
    </Card>
  );
}
