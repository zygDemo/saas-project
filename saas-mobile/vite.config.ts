import { createRequire } from 'node:module'
import process from 'node:process'
import { fileURLToPath, URL } from 'node:url'

import Components from '@uni-helper/vite-plugin-uni-components'
import { uViewProResolver, ZPagingResolver } from '@uni-helper/vite-plugin-uni-components/resolvers'
import UniRoot from '@uni-ku/root'
import UnoCSS from 'unocss/vite'
import { defineConfig } from 'vite'

const require = createRequire(import.meta.url)

/**
 * uni-app 在 Windows 下会把 easycom 组件解析成 `D:/...` 形式的绝对路径，
 * Node ESM loader 会把它误判为 `d:` 协议并拒绝加载。
 * 这里在 Vite 配置加载阶段修正 DCloud 生成的 easycom import source，
 * 将 `D:/xxx.vue` 转为 Vite/Rollup 可识别的 `/D:/xxx.vue`，避免 H5 构建失败。
 */
function patchUniEasycomWindowsImport() {
  if (process.platform !== 'win32') return

  const shared = require('@dcloudio/uni-cli-shared/dist/easycom.js')
  if (!shared || shared.__saasWinEasycomPatchApplied) return

  const originalAddImportDeclaration = shared.addImportDeclaration
  shared.addImportDeclaration = (importDeclarations: string[], local: string, source: string, imported: string) => {
    if (typeof source === 'string' && /^[A-Za-z]:\//.test(source)) {
      source = `/${source}`
    }
    return originalAddImportDeclaration(importDeclarations, local, source, imported)
  }

  shared.__saasWinEasycomPatchApplied = true
}

patchUniEasycomWindowsImport()

const Uni = require('@dcloudio/vite-plugin-uni').default

export default defineConfig({
  base: '/saas/mobile/',
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  define: {
    __VUE_I18N_FULL_INSTALL__: true,
    __VUE_I18N_LEGACY_API__: false,
    __VUE_I18N_PROD_DEVTOOLS__: false,
    __INTLIFY_PROD_DEVTOOLS__: false,
  },
  plugins: [
    // https://github.com/uni-ku/root
    UniRoot(),
    // https://uni-helper.js.org/vite-plugin-uni-components
    Components({
      dts: true,
      resolvers: [ZPagingResolver(), uViewProResolver()],
    }),
    // https://uni-helper.js.org/plugin-uni
    Uni(),
    UnoCSS(),
  ],
  server: {
    host: true,
    proxy: {
      '/saas/api': {
        target: 'https://www.yugui.store',
        changeOrigin: true,
      },
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: '@import "uview-pro/theme.scss";',
      },
    },
  },
  optimizeDeps: {
    exclude: process.env.UNI_PLATFORM === 'h5' && process.env.NODE_ENV === 'development' ? ['uview-pro'] : [],
  },
})
