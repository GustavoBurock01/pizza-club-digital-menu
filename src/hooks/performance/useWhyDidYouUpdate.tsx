// ===== HOOK PARA DEBUG DE RE-RENDERS - FASE 3 =====

import { useEffect, useRef } from 'react';

/**
 * Hook para entender por que um componente re-renderizou
 * Mostra quais props mudaram e causaram o re-render
 * 
 * @example
 * function MyComponent({ data, callback, config }) {
 *   useWhyDidYouUpdate('MyComponent', { data, callback, config });
 *   return <div>Content</div>
 * }
 */
export const useWhyDidYouUpdate = (
  componentName: string,
  props: Record<string, any>,
  enabled = process.env.NODE_ENV === 'development'
) => {
  const previousProps = useRef<Record<string, any>>({});

  useEffect(() => {
    if (!enabled) return;

    if (previousProps.current) {
      const allKeys = Object.keys({ ...previousProps.current, ...props });
      const changedProps: Record<string, { from: any; to: any }> = {};

      allKeys.forEach((key) => {
        if (previousProps.current[key] !== props[key]) {
          changedProps[key] = {
            from: previousProps.current[key],
            to: props[key],
          };
        }
      });

      if (Object.keys(changedProps).length > 0) {
        console.log(`🔄 [${componentName}] Re-render caused by:`, changedProps);
      }
    }

    previousProps.current = props;
  });
};
