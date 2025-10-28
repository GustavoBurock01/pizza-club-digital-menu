// ===== VIRTUALIZATION HOOK PARA LISTAS GRANDES =====

import { useState, useEffect, useRef, useMemo } from 'react';

interface UseVirtualizationOptions {
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}

/**
 * Hook para virtualizar listas grandes e melhorar performance
 * Renderiza apenas os itens visíveis + buffer (overscan)
 */
export const useVirtualization = <T,>(
  items: T[],
  options: UseVirtualizationOptions
) => {
  const { itemHeight, containerHeight, overscan = 3 } = options;
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const { visibleItems, totalHeight, offsetY } = useMemo(() => {
    const itemsPerView = Math.ceil(containerHeight / itemHeight);
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length,
      startIndex + itemsPerView + overscan * 2
    );

    return {
      visibleItems: items.slice(startIndex, endIndex).map((item, index) => ({
        item,
        index: startIndex + index,
      })),
      totalHeight: items.length * itemHeight,
      offsetY: startIndex * itemHeight,
    };
  }, [items, scrollTop, itemHeight, containerHeight, overscan]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      setScrollTop(container.scrollTop);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  return {
    containerRef,
    visibleItems,
    totalHeight,
    offsetY,
  };
};

/**
 * Exemplo de uso:
 * 
 * const items = [...]; // Array com 1000+ itens
 * 
 * const { containerRef, visibleItems, totalHeight, offsetY } = useVirtualization(
 *   items,
 *   { itemHeight: 60, containerHeight: 400 }
 * );
 * 
 * return (
 *   <div ref={containerRef} style={{ height: 400, overflow: 'auto' }}>
 *     <div style={{ height: totalHeight, position: 'relative' }}>
 *       <div style={{ transform: `translateY(${offsetY}px)` }}>
 *         {visibleItems.map(({ item, index }) => (
 *           <div key={index} style={{ height: 60 }}>
 *             {item.name}
 *           </div>
 *         ))}
 *       </div>
 *     </div>
 *   </div>
 * );
 */
