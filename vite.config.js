import process from 'node:process'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? '/qgdaPRFWILSON/' : '/',
  server: {
    port: 3000,
    host: '0.0.0.0',
    hmr: process.env.DISABLE_HMR !== 'true',
    watch: {
      ignored: ['**/.github/**', '**/scripts/**', '**/extensao*/**', '**/.playwright-cli/**']
    }
  },
  build: {
    chunkSizeWarningLimit: 900,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: 'vendor-three', test: /node_modules[\\/]three[\\/]/ },
            { name: 'vendor-recharts', test: /node_modules[\\/]recharts[\\/]/ },
            { name: 'vendor-tesseract', test: /node_modules[\\/]tesseract\.js[\\/]/ },
            { name: 'vendor-motion', test: /node_modules[\\/]framer-motion[\\/]/ },
            { name: 'vendor-supabase', test: /node_modules[\\/]@supabase[\\/]/ },
            { name: 'bank-ctb', test: /leiSecaCTB\.json/ },
            { name: 'bank-contran', test: /leiSecaCONTRAN\.json/ }
          ]
        }
      }
    }
  }
}))
