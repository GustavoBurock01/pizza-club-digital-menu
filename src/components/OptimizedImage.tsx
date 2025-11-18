// ===== COMPONENTE DE IMAGEM OTIMIZADA - FASE 3 MELHORADO =====

import { useState, useEffect, useRef, memo } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
  lazy?: boolean;
  quality?: number;
  sizes?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export const OptimizedImage = memo(({
  src,
  alt,
  className,
  placeholder = '/placeholder.svg',
  lazy = true,
  quality = 80,
  sizes = '100vw',
  onLoad,
  onError
}: OptimizedImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [imageSrc, setImageSrc] = useState(lazy ? placeholder : src);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!lazy || !imgRef.current) {
      setImageSrc(src);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setImageSrc(src);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '100px',
        threshold: 0.01
      }
    );

    observer.observe(imgRef.current);

    return () => {
      if (imgRef.current) {
        observer.unobserve(imgRef.current);
      }
    };
  }, [src, lazy]);

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

  const generateSrcSet = (src: string) => {
    if (!src || src.startsWith('/placeholder')) return undefined;
    const widths = [400, 800, 1200];
    return widths.map(w => `${src}?w=${w}&q=${quality} ${w}w`).join(', ');
  };

  return (
    <div className={cn('relative overflow-hidden', className)}>
      <img
        ref={imgRef}
        src={imageSrc}
        srcSet={generateSrcSet(imageSrc)}
        sizes={sizes}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          'transition-opacity duration-500 w-full h-full object-cover',
          !isLoaded && 'opacity-0',
          isLoaded && 'opacity-100',
          isError && 'opacity-50'
        )}
        loading={lazy ? 'lazy' : 'eager'}
        decoding="async"
        fetchPriority={lazy ? 'low' : 'high'}
      />
      
      {!isLoaded && !isError && (
        <div className="absolute inset-0 bg-gradient-to-br from-muted via-muted/80 to-muted animate-pulse" />
      )}
      
      {isError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted gap-2">
          <div className="text-4xl opacity-50">📷</div>
          <span className="text-muted-foreground text-xs text-center px-4">
            Imagem não disponível
          </span>
        </div>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  return prevProps.src === nextProps.src && 
         prevProps.className === nextProps.className;
});

OptimizedImage.displayName = 'OptimizedImage';
