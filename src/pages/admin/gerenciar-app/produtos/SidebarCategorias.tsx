import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/services/supabase';
import { Skeleton } from '@/components/ui/skeleton';

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
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('order_position', { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

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

  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="mb-4">
        <h3 className="font-semibold mb-2">Categorias</h3>
        <Button variant="outline" size="sm" className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Categoria
        </Button>
      </div>

      <div className="space-y-1">
        {categories?.map((category) => (
          <div key={category.id}>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'w-full justify-between',
                selectedCategory === category.id && 'bg-accent'
              )}
              onClick={() => handleCategoryClick(category.id)}
            >
              <span className="flex items-center gap-2">
                {category.icon && <span>{category.icon}</span>}
                {category.name}
              </span>
              <ChevronRight
                className={cn(
                  'h-4 w-4 transition-transform',
                  expandedCategories.includes(category.id) && 'rotate-90'
                )}
              />
            </Button>
          </div>
        ))}
      </div>

      {categories?.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          Nenhuma categoria cadastrada
        </p>
      )}
    </Card>
  );
}
