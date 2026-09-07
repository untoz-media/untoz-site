import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // Relative asset URLs make the build work both on GitHub Pages
  // (/untoz-site/) and on a future custom domain without another rebuild.
  base: './',
  plugins: [react()],
})
