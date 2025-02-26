import { defineConfig, mergeConfig } from 'vite'
import baseConfig from './vite.config.base.js'
import { resolve } from 'path'
import fs from 'fs-extra'

export default defineConfig(mergeConfig(baseConfig, {
  plugins: [
    {
      name: 'copy-manifest',
      writeBundle() {
        const outDir = `dist/web-ai-${process.env.npm_package_version}-v2`
        fs.copySync('manifest.json', `${outDir}/manifest.json`)
        fs.copySync('icons', `${outDir}/icons`)
      }
    }
  ],
  build: {
    rollupOptions: {
      input: {
        ...baseConfig.build.rollupOptions.input,
        background: resolve(__dirname, 'src/v2/background.js'),
        content_script: resolve(__dirname, 'src/v2/content-script.js')
      }
    }
  }
}))