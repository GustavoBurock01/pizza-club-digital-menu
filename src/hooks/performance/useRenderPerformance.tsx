// ===== HOOK DE MONITORAMENTO DE PERFORMANCE - FASE 3 =====

import { useEffect, useRef } from 'react';

interface RenderMetrics {
  componentName: string;
  renderCount: number;
  renderTime: number;
  lastRenderTimestamp: number;
}

const renderMetrics = new Map<string, RenderMetrics>();

/**
 * Hook para monitorar performance de re-renders
 * Útil para detectar componentes que renderizam demais
 * 
 * @example
 * function MyComponent() {
 *   useRenderPerformance('MyComponent');
 *   return <div>Content</div>
 * }
 */
export const useRenderPerformance = (componentName: string, enabled = process.env.NODE_ENV === 'development') => {
  const renderCount = useRef(0);
  const startTime = useRef(performance.now());

  useEffect(() => {
    if (!enabled) return;

    renderCount.current += 1;
    const renderTime = performance.now() - startTime.current;

    // Update metrics
    const existing = renderMetrics.get(componentName);
    renderMetrics.set(componentName, {
      componentName,
      renderCount: renderCount.current,
      renderTime: existing ? existing.renderTime + renderTime : renderTime,
      lastRenderTimestamp: Date.now(),
    });

    // Log warnings for excessive renders
    if (renderCount.current > 10) {
      console.warn(
        `⚠️ [Performance] ${componentName} rendered ${renderCount.current} times. Consider using React.memo or useMemo.`
      );
    }

    // Log slow renders (>16ms = 1 frame)
    if (renderTime > 16) {
      console.warn(
        `⚠️ [Performance] ${componentName} render took ${renderTime.toFixed(2)}ms. Consider optimization.`
      );
    }

    // Reset start time for next render
    startTime.current = performance.now();
  });

  return {
    renderCount: renderCount.current,
    getMetrics: () => renderMetrics.get(componentName),
  };
};

/**
 * Get all render metrics for analysis
 * Useful for debugging performance issues
 */
export const getAllRenderMetrics = () => {
  return Array.from(renderMetrics.values()).sort((a, b) => b.renderCount - a.renderCount);
};

/**
 * Clear all render metrics
 */
export const clearRenderMetrics = () => {
  renderMetrics.clear();
};

/**
 * Log render metrics to console
 */
export const logRenderMetrics = () => {
  const metrics = getAllRenderMetrics();
  
  console.group('📊 Render Performance Metrics');
  console.table(
    metrics.map(m => ({
      Component: m.componentName,
      'Render Count': m.renderCount,
      'Total Time (ms)': m.renderTime.toFixed(2),
      'Avg Time (ms)': (m.renderTime / m.renderCount).toFixed(2),
    }))
  );
  console.groupEnd();
};
