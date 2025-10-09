import { defineConfig, splitVendorChunkPlugin } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import compression from 'vite-plugin-compression';
import type { PluginOption } from 'vite';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';
  
  return {
    base: '/',
    plugins: [
      react(),
      splitVendorChunkPlugin(),
      process.env.ANALYZE === 'true' && visualizer({
        open: true,
        filename: 'dist/stats.html',
        gzipSize: true,
        brotliSize: true,
      }),
      // Enable gzip & brotli compression
      compression({
        algorithm: 'brotliCompress',
        ext: '.br',
        threshold: 1024, // 1KB
      }) as PluginOption,
      compression({
        algorithm: 'gzip',
        ext: '.gz',
      }) as PluginOption,
    ].filter(Boolean) as PluginOption[],
    
    build: {
      target: 'esnext',
      minify: isProduction ? 'esbuild' : false,
      chunkSizeWarningLimit: 1000, // 1MB
      sourcemap: isProduction ? 'hidden' : 'inline',
      rollupOptions: {
        output: {
          manualChunks: (id: string) => {
            if (id.includes('node_modules')) {
              const match = id.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/);
              if (match) {
                const packageName = match[1];
                
                // Core React packages
                if (['react', 'react-dom', 'react-router-dom'].includes(packageName)) {
                  return 'vendor-react';
                }
                
                // Supabase packages
                if (packageName.startsWith('@supabase/')) {
                  const submodule = packageName.split('/')[1];
                  return `supabase-${submodule}`;
                }
                
                // UI libraries
                if (['lucide-react'].includes(packageName)) {
                  return 'vendor-ui';
                }
                
                return 'vendor-other';
              }
            }
            
            // Code-split pages
            if (id.includes('src/pages/')) {
              const page = id.split('src/pages/')[1].split('/')[0];
              if (page && ['admin', 'farmer'].includes(page)) {
                return `page-${page}`;
              }
            }
            
            return null;
          },
          chunkFileNames: 'assets/[name]-[hash].js',
          entryFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash][extname]',
        },
      },
      modulePreload: {
        polyfill: false,
      },
    },
    
    // Configure environment variables
    envPrefix: 'VITE_',
    
    // Optimize dependencies
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        '@supabase/supabase-js/dist/module/index.js',
      ],
      exclude: [
        'lucide-react',
        '@supabase/realtime-js',
        '@supabase/storage-js',
        '@supabase/functions-js',
      ],
      esbuildOptions: {
        target: 'es2020',
      },
    },
    
    // ESBuild configuration
    esbuild: {
      drop: isProduction ? ['console', 'debugger'] : [],
      pure: isProduction ? ['console.log', 'console.info'] : [],
    },
    
    // Development server configuration
    server: {
      hmr: {
        overlay: true,
      },
      fs: {
        allow: ['..'],
      },
      port: 3000,
      strictPort: true,
    },
    
    // Preview server configuration
    preview: {
      port: 3001,
      strictPort: true,
    },
  };
});
