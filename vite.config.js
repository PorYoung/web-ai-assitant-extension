import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import fs from 'fs-extra'

export default defineConfig({
  plugins: [
    vue(),
    {
      name: 'copy-manifest',
      writeBundle() {
        fs.copySync('manifest.json', 'dist/manifest.json')
        fs.copySync('icons', 'dist/icons')
      }
    }
  ],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'popup.html'),
        background: resolve(__dirname, 'src/background.js'),
        content_script: resolve(__dirname, 'src/content-script.js'),
      },
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]'
      }
    }
  }
})