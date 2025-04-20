import path from "path" 
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), 
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: { 
    rollupOptions: {
      preserveEntrySignatures: 'strict' 
    }
  },
  optimizeDeps: {
     include: [
       '@radix-ui/react-popover',
       '@radix-ui/react-dropdown-menu',
       '@radix-ui/react-dialog',
     ],
   }
})