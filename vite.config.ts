import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Core React (100KB)
          if (id.includes('node_modules/react') || 
              id.includes('node_modules/react-dom') || 
              id.includes('node_modules/react-router')) {
            return 'react-vendor';
          }
          
          // React Query (50KB)
          if (id.includes('@tanstack/react-query')) {
            return 'query-vendor';
          }
          
          // Supabase (80KB)
          if (id.includes('@supabase/supabase-js')) {
            return 'supabase-vendor';
          }
          
          // Radix UI - Core components usados em quase toda página
          if (id.includes('@radix-ui/react-dialog') ||
              id.includes('@radix-ui/react-dropdown-menu') ||
              id.includes('@radix-ui/react-popover') ||
              id.includes('@radix-ui/react-select') ||
              id.includes('@radix-ui/react-tabs')) {
            return 'radix-core';
          }
          
          // Radix UI - Forms (lazy)
          if (id.includes('@radix-ui/react-checkbox') ||
              id.includes('@radix-ui/react-label') ||
              id.includes('@radix-ui/react-radio') ||
              id.includes('@radix-ui/react-slider') ||
              id.includes('@radix-ui/react-switch')) {
            return 'radix-forms';
          }
          
          // Radix UI - Extended (lazy)
          if (id.includes('@radix-ui')) {
            return 'radix-extended';
          }
          
          // Charts (lazy load)
          if (id.includes('recharts')) {
            return 'charts-vendor';
          }
          
          // Forms & Validation
          if (id.includes('react-hook-form') || 
              id.includes('zod') || 
              id.includes('@hookform/resolvers')) {
            return 'forms-vendor';
          }
          
          // Utilities
          if (id.includes('date-fns') ||
              id.includes('clsx') ||
              id.includes('tailwind-merge') ||
              id.includes('class-variance-authority') ||
              id.includes('zustand')) {
            return 'utils-vendor';
          }
          
          // Admin routes (lazy)
          if (id.includes('src/pages/admin/')) {
            return 'admin-pages';
          }
          
          // Other node_modules
          if (id.includes('node_modules/')) {
            return 'vendor-other';
          }
        },
        // Nomenclatura otimizada para cache
        chunkFileNames: (chunkInfo) => {
          const name = chunkInfo.name;
          // Vendor chunks com hash estável
          if (name.includes('vendor')) {
            return 'assets/vendor/[name].[hash].js';
          }
          // Admin chunks separados
          if (name.includes('admin')) {
            return 'assets/admin/[name].[hash].js';
          }
          // Outros chunks
          return 'assets/[name].[hash].js';
        },
        // Otimizar imports de entrada
        entryFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]',
      },
    },
    // Aumentar limite de warning para chunks grandes esperados
    chunkSizeWarningLimit: 600,
    // Otimizações de minificação
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: mode === 'production',
        drop_debugger: mode === 'production',
      },
    },
  },
}));
