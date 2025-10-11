import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import compression from 'vite-plugin-compression';
import path from 'path';

export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';
  
  return {
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      target: 'esnext',
      minify: isProduction ? 'terser' : false,
      sourcemap: isProduction ? 'hidden' : true,
      cssCodeSplit: true,
      reportCompressedSize: false,
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            if (id.includes('node_modules')) {
              // Core libraries
              if (id.includes('react') || id.includes('react-dom') || id.includes('scheduler')) {
                return 'vendor-react';
              }
              if (id.includes('react-router-dom')) {
                return 'vendor-router';
              }
              if (id.includes('@supabase')) {
                return 'vendor-supabase';
              }
              // UI libraries
              if (id.includes('lucide-react') || id.includes('@radix-ui')) {
                return 'vendor-ui';
              }
              // Other node modules
              return 'vendor-other';
            }
            
            // Split pages into separate chunks
            if (id.includes('src/pages/')) {
              const page = id.split('src/pages/')[1].split('/')[0];
              if (page) return `page-${page.toLowerCase()}`;
            }
          },
          chunkFileNames: 'assets/[name]-[hash].js',
          entryFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash][extname]',
        },
      },
      chunkSizeWarningLimit: 1000,
      terserOptions: isProduction ? {
        compress: {
          drop_console: true,
          drop_debugger: true,
        },
        format: {
          comments: false,
        },
      } : {},
    },
    plugins: [
      react({
        jsxRuntime: 'automatic',
        babel: {
          plugins: [
            ['@babel/plugin-transform-react-jsx', {
              runtime: 'automatic',
              importSource: 'react'
            }]
          ]
        }
      }),
      isProduction && compression({
        algorithm: 'brotliCompress',
        ext: '.br',
        threshold: 1024,
      }),
      isProduction && compression({
        algorithm: 'gzip',
        ext: '.gz',
      }),
      process.env.ANALYZE === 'true' && visualizer({
        open: true,
        filename: 'dist/stats.html',
        gzipSize: true,
        brotliSize: true,
      }),
    ].filter(Boolean),
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom'],
      exclude: ['@babel/plugin-transform-react-jsx']
    }
  };
});
