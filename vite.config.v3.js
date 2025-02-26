import { defineConfig, mergeConfig } from 'vite'
import baseConfig from './vite.config.base.js'
import { resolve } from 'path'
import fs from 'fs-extra'

export default defineConfig(mergeConfig(baseConfig, {
    plugins: [
        {
            name: 'copy-manifest',
            writeBundle() {
                const outDir = `dist/web-ai-${process.env.npm_package_version}-v3`
                fs.copySync('manifest.v3.json', `${outDir}/manifest.json`)
                fs.copySync('icons', `${outDir}/icons`)
            }
        }
    ],
    build: {
        rollupOptions: {
            input: {
                ...baseConfig.build.rollupOptions.input,
                sidepanel: resolve(__dirname, 'sidepanel.html'),
                background: resolve(__dirname, 'src/v3/background.js'),
                content_script: resolve(__dirname, 'src/v3/content-script.js')
            }
        }
    }
}))