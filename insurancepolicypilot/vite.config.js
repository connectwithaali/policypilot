import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Replace 'insurecomp' below with your GitHub repository name if different
export default defineConfig({
  plugins: [react()],
  base: '/insurecomp/',
})
