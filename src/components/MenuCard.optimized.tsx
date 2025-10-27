// ===== MENU CARD OTIMIZADO (FASE 3) =====

import { memo } from 'react';
import { Card } from '@/components/ui/card';
import { OptimizedImage } from '@/components/OptimizedImage';
import { cn } from '@/lib/utils';

interface MenuCardProps {
  id: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  isAvailable?: boolean;
  onClick?: () => void;
  className?: string;
}

const MenuCardComponent = ({
  id,
  name,
  description,
  price,
  imageUrl,
  isAvailable = true,
  onClick,
  className
}: MenuCardProps) => {
  const formatPrice = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  return (
    <Card
      className={cn(
        'overflow-hidden cursor-pointer transition-all duration-200',
        'hover:shadow-lg hover:scale-[1.02]',
        !isAvailable && 'opacity-60 cursor-not-allowed',
        className
      )}
      onClick={isAvailable ? onClick : undefined}
    >
      {imageUrl && (
        <div className="aspect-video w-full">
          <OptimizedImage
            src={imageUrl}
            alt={name}
            className="w-full h-full"
            lazy={true}
            width={400}
            height={225}
          />
        </div>
      )}
      
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-lg line-clamp-2">{name}</h3>
          <span className="font-bold text-primary whitespace-nowrap">
            {formatPrice(price)}
          </span>
        </div>
        
        {description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {description}
          </p>
        )}
        
        {!isAvailable && (
          <div className="mt-2">
            <span className="text-xs text-destructive font-medium">
              Indisponível
            </span>
          </div>
        )}
      </div>
    </Card>
  );
};

// Memoizar para evitar re-renders quando props não mudam
export const MenuCardOptimized = memo(MenuCardComponent, (prev, next) => {
  return (
    prev.id === next.id &&
    prev.name === next.name &&
    prev.price === next.price &&
    prev.isAvailable === next.isAvailable &&
    prev.imageUrl === next.imageUrl
  );
});
