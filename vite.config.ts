import { defineConfig } from 'vite'
import { resolve } from 'path'
export default defineConfig({
  root: 'src',
  build: { outDir: '../dist' },
  resolve: { alias: { '@': resolve(__dirname, 'src') } }
})