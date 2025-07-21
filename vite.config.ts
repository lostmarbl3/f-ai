import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path' // ✅ required for alias resolution

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.API_KEY': JSON.stringify(process.env.VITE_GEMINI_API_KEY),
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'), // ✅ tells Vite what @ means
    },
  },
})
