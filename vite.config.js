import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/qgdaPRFWILSON/',
  server: {
    port: 5173,
    strictPort: true
  },
  build: {
    chunkSizeWarningLimit: 900,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: 'vendor-three', test: /node_modules[\\/]three[\\/]/ },
            { name: 'vendor-recharts', test: /node_modules[\\/]recharts[\\/]/ },
            { name: 'vendor-motion', test: /node_modules[\\/]framer-motion[\\/]/ },
            { name: 'vendor-supabase', test: /node_modules[\\/]@supabase[\\/]/ },
            { name: 'bank-ctb', test: /leiSecaCTB\.json/ },
            { name: 'bank-contran', test: /leiSecaCONTRAN\.json/ }
          ]
        }
      }
    }
  }
})
