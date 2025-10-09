import { defineConfig, splitVendorChunkPlugin } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    splitVendorChunkPlugin(),
    mode === 'analyze' && visualizer({
      open: true,
      filename: 'dist/stats.html',
      gzipSize: true,
      brotliSize: true,
    })
  ].filter(Boolean),
  
  build: {
    chunkSizeWarningLimit: 1000, // Increase chunk size warning limit (in kbs)
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Create a vendor chunk for node_modules
          if (id.includes('node_modules')) {
            // Group React and React DOM together
            if (id.includes('react') || id.includes('react-dom') || id.includes('scheduler')) {
              return 'vendor-react';
            }
            // Group Supabase related code
            if (id.includes('@supabase')) {
              return 'vendor-supabase';
            }
            // Group UI libraries
            if (id.includes('lucide-react')) {
              return 'vendor-ui';
            }
            // Group other node_modules
            return 'vendor-other';
          }
          // Group code-split pages
          if (id.includes('src/pages/')) {
            const page = id.split('src/pages/')[1].split('/')[0];
            if (page && ['admin', 'farmer'].includes(page)) {
              return `page-${page}`;
            }
          }
        },
      },
    },
  },
  
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
    exclude: ['lucide-react'],
  },
  
  // Enable source maps in development
  esbuild: {
    drop: mode === 'production' ? ['console', 'debugger'] : [],
  },
}));
