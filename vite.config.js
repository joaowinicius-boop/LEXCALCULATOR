import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // O modelo .docx do escritório (timbrado NG) é embutido no bundle como asset —
  // o download da petição não depende de arquivo no servidor (nem de deploy/caching).
  assetsInclude: ['**/*.docx'],
})
