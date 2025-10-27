import { useState, useEffect, useRef, memo } from 'react';
import { cn } from '@/lib/utils';

// ===== COMPONENTE DE IMAGEM OTIMIZADA (FASE 3) =====

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
  lazy?: boolean;
  onLoad?: () => void;
  onError?: () => void;
  width?: number;
  height?: number;
  priority?: boolean;
}

// Detectar suporte a WebP
const supportsWebP = (() => {
  if (typeof window === 'undefined') return false;
  const canvas = document.createElement('canvas');
  return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
})();

// Converter URL para WebP se possível
const getOptimizedSrc = (src: string): string => {
  if (!supportsWebP || !src) return src;
  
  // Se a imagem já é WebP, retornar como está
  if (src.endsWith('.webp')) return src;
  
  // Para imagens externas, tentar adicionar parâmetro de formato
  if (src.startsWith('http')) {
    try {
      const url = new URL(src);
      // Verificar se é Supabase Storage
      if (url.hostname.includes('supabase')) {
        url.searchParams.set('format', 'webp');
        return url.toString();
      }
    } catch {
      return src;
    }
  }
  
  return src;
};

const OptimizedImageComponent = ({
  src,
  alt,
  className,
  placeholder = '/placeholder.svg',
  lazy = true,
  width,
  height,
  priority = false,
  onLoad,
  onError
}: OptimizedImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const optimizedSrc = getOptimizedSrc(src);
  const [imageSrc, setImageSrc] = useState(
    lazy && !priority ? placeholder : optimizedSrc
  );
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!lazy || priority || !imgRef.current) {
      setImageSrc(optimizedSrc);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setImageSrc(optimizedSrc);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: priority ? '100px' : '50px',
        threshold: 0.1
      }
    );

    const currentRef = imgRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [optimizedSrc, lazy, priority]);

  const handleLoad = () => {
    setIsLoaded(true);
    setIsError(false);
    onLoad?.();
  };

  const handleError = () => {
    setIsError(true);
    setImageSrc(placeholder);
    onError?.();
  };

  return (
    <div className={cn('relative overflow-hidden', className)}>
      <img
        ref={imgRef}
        src={imageSrc}
        alt={alt}
        width={width}
        height={height}
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          'transition-opacity duration-300 w-full h-full object-cover',
          !isLoaded && 'opacity-0',
          isLoaded && 'opacity-100',
          isError && 'opacity-50'
        )}
        loading={lazy && !priority ? 'lazy' : 'eager'}
        decoding="async"
        fetchPriority={priority ? 'high' : 'auto'}
      />
      
      {/* Loading skeleton */}
      {!isLoaded && !isError && (
        <div className="absolute inset-0 bg-muted animate-pulse" />
      )}
      
      {/* Error state */}
      {isError && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <span className="text-muted-foreground text-sm">
            Erro ao carregar imagem
          </span>
        </div>
      )}
    </div>
  );
};

// Memoizar componente para evitar re-renders desnecessários
export const OptimizedImage = memo(OptimizedImageComponent);