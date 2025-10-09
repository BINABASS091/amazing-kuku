// vite.config.ts
import { defineConfig } from "file:///home/project/node_modules/vite/dist/node/index.js";
import react from "file:///home/project/node_modules/@vitejs/plugin-react/dist/index.js";
import { visualizer } from "file:///home/project/node_modules/rollup-plugin-visualizer/dist/plugin/index.js";
import compression from "file:///home/project/node_modules/vite-plugin-compression/dist/index.mjs";
var vite_config_default = defineConfig(({ mode }) => {
  const isProduction = mode === "production";
  return {
    build: {
      target: "esnext",
      minify: isProduction ? "terser" : false,
      sourcemap: !isProduction,
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            if (id.includes("node_modules")) {
              if (id.includes("react") || id.includes("react-dom") || id.includes("react-router-dom")) {
                return "vendor-react";
              }
              if (id.includes("lucide-react")) {
                return "vendor-ui";
              }
              if (id.includes("@supabase")) {
                return "vendor-supabase";
              }
              return "vendor-other";
            }
            if (id.includes("src/pages/")) {
              const page = id.split("src/pages/")[1].split("/")[0];
              if (page) return `page-${page.toLowerCase()}`;
            }
          },
          chunkFileNames: "assets/[name]-[hash].js",
          entryFileNames: "assets/[name]-[hash].js",
          assetFileNames: "assets/[name]-[hash][extname]"
        }
      },
      chunkSizeWarningLimit: 1e3
    },
    plugins: [
      react({
        jsxRuntime: "automatic",
        babel: {
          plugins: [
            ["@babel/plugin-transform-react-jsx", {
              runtime: "automatic",
              importSource: "react"
            }]
          ]
        }
      }),
      isProduction && compression({
        algorithm: "brotliCompress",
        ext: ".br",
        threshold: 1024
      }),
      isProduction && compression({
        algorithm: "gzip",
        ext: ".gz"
      }),
      process.env.ANALYZE === "true" && visualizer({
        open: true,
        filename: "dist/stats.html",
        gzipSize: true,
        brotliSize: true
      })
    ].filter(Boolean),
    optimizeDeps: {
      include: ["react", "react-dom", "react-router-dom"],
      exclude: ["@babel/plugin-transform-react-jsx"]
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCc7XG5pbXBvcnQgeyB2aXN1YWxpemVyIH0gZnJvbSAncm9sbHVwLXBsdWdpbi12aXN1YWxpemVyJztcbmltcG9ydCBjb21wcmVzc2lvbiBmcm9tICd2aXRlLXBsdWdpbi1jb21wcmVzc2lvbic7XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZygoeyBtb2RlIH0pID0+IHtcbiAgY29uc3QgaXNQcm9kdWN0aW9uID0gbW9kZSA9PT0gJ3Byb2R1Y3Rpb24nO1xuICBcbiAgcmV0dXJuIHtcbiAgICBidWlsZDoge1xuICAgICAgdGFyZ2V0OiAnZXNuZXh0JyxcbiAgICAgIG1pbmlmeTogaXNQcm9kdWN0aW9uID8gJ3RlcnNlcicgOiBmYWxzZSxcbiAgICAgIHNvdXJjZW1hcDogIWlzUHJvZHVjdGlvbixcbiAgICAgIHJvbGx1cE9wdGlvbnM6IHtcbiAgICAgICAgb3V0cHV0OiB7XG4gICAgICAgICAgbWFudWFsQ2h1bmtzOiAoaWQpID0+IHtcbiAgICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnbm9kZV9tb2R1bGVzJykpIHtcbiAgICAgICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdyZWFjdCcpIHx8IGlkLmluY2x1ZGVzKCdyZWFjdC1kb20nKSB8fCBpZC5pbmNsdWRlcygncmVhY3Qtcm91dGVyLWRvbScpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICd2ZW5kb3ItcmVhY3QnO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnbHVjaWRlLXJlYWN0JykpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJ3ZlbmRvci11aSc7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdAc3VwYWJhc2UnKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiAndmVuZG9yLXN1cGFiYXNlJztcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICByZXR1cm4gJ3ZlbmRvci1vdGhlcic7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIFNwbGl0IHBhZ2VzIGludG8gc2VwYXJhdGUgY2h1bmtzXG4gICAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ3NyYy9wYWdlcy8nKSkge1xuICAgICAgICAgICAgICBjb25zdCBwYWdlID0gaWQuc3BsaXQoJ3NyYy9wYWdlcy8nKVsxXS5zcGxpdCgnLycpWzBdO1xuICAgICAgICAgICAgICBpZiAocGFnZSkgcmV0dXJuIGBwYWdlLSR7cGFnZS50b0xvd2VyQ2FzZSgpfWA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSxcbiAgICAgICAgICBjaHVua0ZpbGVOYW1lczogJ2Fzc2V0cy9bbmFtZV0tW2hhc2hdLmpzJyxcbiAgICAgICAgICBlbnRyeUZpbGVOYW1lczogJ2Fzc2V0cy9bbmFtZV0tW2hhc2hdLmpzJyxcbiAgICAgICAgICBhc3NldEZpbGVOYW1lczogJ2Fzc2V0cy9bbmFtZV0tW2hhc2hdW2V4dG5hbWVdJyxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICBjaHVua1NpemVXYXJuaW5nTGltaXQ6IDEwMDAsXG4gICAgfSxcbiAgICBwbHVnaW5zOiBbXG4gICAgICByZWFjdCh7XG4gICAgICAgIGpzeFJ1bnRpbWU6ICdhdXRvbWF0aWMnLFxuICAgICAgICBiYWJlbDoge1xuICAgICAgICAgIHBsdWdpbnM6IFtcbiAgICAgICAgICAgIFsnQGJhYmVsL3BsdWdpbi10cmFuc2Zvcm0tcmVhY3QtanN4Jywge1xuICAgICAgICAgICAgICBydW50aW1lOiAnYXV0b21hdGljJyxcbiAgICAgICAgICAgICAgaW1wb3J0U291cmNlOiAncmVhY3QnXG4gICAgICAgICAgICB9XVxuICAgICAgICAgIF1cbiAgICAgICAgfVxuICAgICAgfSksXG4gICAgICBpc1Byb2R1Y3Rpb24gJiYgY29tcHJlc3Npb24oe1xuICAgICAgICBhbGdvcml0aG06ICdicm90bGlDb21wcmVzcycsXG4gICAgICAgIGV4dDogJy5icicsXG4gICAgICAgIHRocmVzaG9sZDogMTAyNCxcbiAgICAgIH0pLFxuICAgICAgaXNQcm9kdWN0aW9uICYmIGNvbXByZXNzaW9uKHtcbiAgICAgICAgYWxnb3JpdGhtOiAnZ3ppcCcsXG4gICAgICAgIGV4dDogJy5neicsXG4gICAgICB9KSxcbiAgICAgIHByb2Nlc3MuZW52LkFOQUxZWkUgPT09ICd0cnVlJyAmJiB2aXN1YWxpemVyKHtcbiAgICAgICAgb3BlbjogdHJ1ZSxcbiAgICAgICAgZmlsZW5hbWU6ICdkaXN0L3N0YXRzLmh0bWwnLFxuICAgICAgICBnemlwU2l6ZTogdHJ1ZSxcbiAgICAgICAgYnJvdGxpU2l6ZTogdHJ1ZSxcbiAgICAgIH0pLFxuICAgIF0uZmlsdGVyKEJvb2xlYW4pLFxuICAgIG9wdGltaXplRGVwczoge1xuICAgICAgaW5jbHVkZTogWydyZWFjdCcsICdyZWFjdC1kb20nLCAncmVhY3Qtcm91dGVyLWRvbSddLFxuICAgICAgZXhjbHVkZTogWydAYmFiZWwvcGx1Z2luLXRyYW5zZm9ybS1yZWFjdC1qc3gnXVxuICAgIH1cbiAgfTtcbn0pO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUF5TixTQUFTLG9CQUFvQjtBQUN0UCxPQUFPLFdBQVc7QUFDbEIsU0FBUyxrQkFBa0I7QUFDM0IsT0FBTyxpQkFBaUI7QUFFeEIsSUFBTyxzQkFBUSxhQUFhLENBQUMsRUFBRSxLQUFLLE1BQU07QUFDeEMsUUFBTSxlQUFlLFNBQVM7QUFFOUIsU0FBTztBQUFBLElBQ0wsT0FBTztBQUFBLE1BQ0wsUUFBUTtBQUFBLE1BQ1IsUUFBUSxlQUFlLFdBQVc7QUFBQSxNQUNsQyxXQUFXLENBQUM7QUFBQSxNQUNaLGVBQWU7QUFBQSxRQUNiLFFBQVE7QUFBQSxVQUNOLGNBQWMsQ0FBQyxPQUFPO0FBQ3BCLGdCQUFJLEdBQUcsU0FBUyxjQUFjLEdBQUc7QUFDL0Isa0JBQUksR0FBRyxTQUFTLE9BQU8sS0FBSyxHQUFHLFNBQVMsV0FBVyxLQUFLLEdBQUcsU0FBUyxrQkFBa0IsR0FBRztBQUN2Rix1QkFBTztBQUFBLGNBQ1Q7QUFDQSxrQkFBSSxHQUFHLFNBQVMsY0FBYyxHQUFHO0FBQy9CLHVCQUFPO0FBQUEsY0FDVDtBQUNBLGtCQUFJLEdBQUcsU0FBUyxXQUFXLEdBQUc7QUFDNUIsdUJBQU87QUFBQSxjQUNUO0FBQ0EscUJBQU87QUFBQSxZQUNUO0FBR0EsZ0JBQUksR0FBRyxTQUFTLFlBQVksR0FBRztBQUM3QixvQkFBTSxPQUFPLEdBQUcsTUFBTSxZQUFZLEVBQUUsQ0FBQyxFQUFFLE1BQU0sR0FBRyxFQUFFLENBQUM7QUFDbkQsa0JBQUksS0FBTSxRQUFPLFFBQVEsS0FBSyxZQUFZLENBQUM7QUFBQSxZQUM3QztBQUFBLFVBQ0Y7QUFBQSxVQUNBLGdCQUFnQjtBQUFBLFVBQ2hCLGdCQUFnQjtBQUFBLFVBQ2hCLGdCQUFnQjtBQUFBLFFBQ2xCO0FBQUEsTUFDRjtBQUFBLE1BQ0EsdUJBQXVCO0FBQUEsSUFDekI7QUFBQSxJQUNBLFNBQVM7QUFBQSxNQUNQLE1BQU07QUFBQSxRQUNKLFlBQVk7QUFBQSxRQUNaLE9BQU87QUFBQSxVQUNMLFNBQVM7QUFBQSxZQUNQLENBQUMscUNBQXFDO0FBQUEsY0FDcEMsU0FBUztBQUFBLGNBQ1QsY0FBYztBQUFBLFlBQ2hCLENBQUM7QUFBQSxVQUNIO0FBQUEsUUFDRjtBQUFBLE1BQ0YsQ0FBQztBQUFBLE1BQ0QsZ0JBQWdCLFlBQVk7QUFBQSxRQUMxQixXQUFXO0FBQUEsUUFDWCxLQUFLO0FBQUEsUUFDTCxXQUFXO0FBQUEsTUFDYixDQUFDO0FBQUEsTUFDRCxnQkFBZ0IsWUFBWTtBQUFBLFFBQzFCLFdBQVc7QUFBQSxRQUNYLEtBQUs7QUFBQSxNQUNQLENBQUM7QUFBQSxNQUNELFFBQVEsSUFBSSxZQUFZLFVBQVUsV0FBVztBQUFBLFFBQzNDLE1BQU07QUFBQSxRQUNOLFVBQVU7QUFBQSxRQUNWLFVBQVU7QUFBQSxRQUNWLFlBQVk7QUFBQSxNQUNkLENBQUM7QUFBQSxJQUNILEVBQUUsT0FBTyxPQUFPO0FBQUEsSUFDaEIsY0FBYztBQUFBLE1BQ1osU0FBUyxDQUFDLFNBQVMsYUFBYSxrQkFBa0I7QUFBQSxNQUNsRCxTQUFTLENBQUMsbUNBQW1DO0FBQUEsSUFDL0M7QUFBQSxFQUNGO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
