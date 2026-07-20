import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import { fileURLToPath } from 'url'
import type { PluginOption } from 'vite'
import vueDevTools from 'vite-plugin-vue-devtools'
import viteCompression from 'vite-plugin-compression'
import Components from 'unplugin-vue-components/vite'
import AutoImport from 'unplugin-auto-import/vite'
import ElementPlus from 'unplugin-element-plus/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import tailwindcss from '@tailwindcss/vite'
// import { visualizer } from 'rollup-plugin-visualizer'

export default ({ mode }: { mode: string }) => {
  const root = process.cwd()
  const env = loadEnv(mode, root)
  const { VITE_VERSION, VITE_PORT, VITE_BASE_URL, VITE_API_URL, VITE_API_PROXY_URL } = env
  const appBase = VITE_BASE_URL || '/saas/'

  console.log(`🚀 API_URL = ${VITE_API_URL}`)
  console.log(`🚀 VERSION = ${VITE_VERSION}`)

  return defineConfig({
    define: {
      __APP_VERSION__: JSON.stringify(VITE_VERSION)
    },
    base: appBase,
    server: {
      port: Number(VITE_PORT),
      proxy: {
        '/saas/api': {
          target: VITE_API_PROXY_URL,
          changeOrigin: true
        }
      },
      host: true
    },
    // 路径别名
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        '@views': resolvePath('src/views'),
        '@imgs': resolvePath('src/assets/images'),
        '@icons': resolvePath('src/assets/icons'),
        '@utils': resolvePath('src/utils'),
        '@stores': resolvePath('src/store'),
        '@styles': resolvePath('src/assets/styles')
      }
    },
    build: {
      target: 'es2015',
      outDir: 'dist',
      chunkSizeWarningLimit: 1000,
      minify: 'esbuild',
      esbuild: {
        drop: ['console', 'debugger'],
      },
      dynamicImportVarsOptions: {
        warnOnError: true,
        exclude: [],
        include: ['src/views/**/*.vue']
      },
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return undefined

            if (id.includes('/echarts@') || id.includes('/zrender@')) return 'vendor-echarts'
            if (id.includes('/element-plus@') || id.includes('/@element-plus+icons-vue@')) {
              return 'vendor-element-plus'
            }
            if (
              id.includes('/vue-router@') ||
              id.includes('/pinia@') ||
              id.includes('/pinia-plugin-persistedstate@') ||
              id.includes('/vue-i18n@')
            ) {
              return 'vendor-vue-router'
            }
            if (id.includes('/vue@') || id.includes('/@vue+')) return 'vendor-vue-core'
            if (id.includes('/@vueuse+')) return 'vendor-vueuse'
            if (id.includes('/xlsx@')) return 'vendor-xlsx'
            if (id.includes('/xgplayer@')) return 'vendor-video'
            if (id.includes('/highlight.js@')) return 'vendor-highlight'
            if (id.includes('/file-saver@')) return 'vendor-file'
            if (id.includes('/qrcode.vue@')) return 'vendor-qrcode'
            if (id.includes('/ohash@')) return 'vendor-ohash'
            if (id.includes('/lodash-es@')) return 'vendor-lodash'
            if (id.includes('/crypto-js@') || id.includes('/axios@')) return 'vendor-utils'
            if (id.includes('/@wangeditor+')) return 'vendor-editor'
            if (id.includes('/@transloadit+')) return 'vendor-upload'
            if (id.includes('/mockjs@')) return 'vendor-mock'
            if (id.includes('/animejs@') || id.includes('/gsap@') || id.includes('/three@')) {
              return 'vendor-visual'
            }
            if (id.includes('/dayjs@') || id.includes('/nprogress@') || id.includes('/mitt@')) {
              return 'vendor-runtime'
            }

            return 'vendor-misc'
          }
        }
      }
    },
    plugins: [
      vue(),
      tailwindcss(),
      // 自动按需导入 API
      AutoImport({
        imports: ['vue', 'vue-router', 'pinia', '@vueuse/core'],
        dts: 'src/types/import/auto-imports.d.ts',
        resolvers: [ElementPlusResolver()],
        eslintrc: {
          enabled: true,
          filepath: './.auto-import.json',
          globalsPropValue: true
        }
      }),
      // 自动按需导入组件
      Components({
        dts: 'src/types/import/components.d.ts',
        resolvers: [ElementPlusResolver()]
      }),
      // 按需定制主题配置
      ElementPlus({
        useSource: true
      }),
      // 压缩
      viteCompression({
        verbose: false,
        disable: false,
        algorithm: 'gzip',
        ext: '.gz',
        threshold: 10240,
        deleteOriginFile: false
      }),
      createVersionFilePlugin(VITE_VERSION),
      mode === 'development' && vueDevTools()
      // 打包分析
      // visualizer({
      //   open: true,
      //   gzipSize: true,
      //   brotliSize: true,
      //   filename: 'dist/stats.html'
      // }),
    ],
    // 依赖预构建
    optimizeDeps: {
      include: [
        'echarts/core',
        'echarts/charts',
        'echarts/components',
        'echarts/renderers',
        'crypto-js',
        'element-plus/es',
        'element-plus/es/components/*/style/css',
        'element-plus/es/components/*/style/index'
      ]
    },
    css: {
      preprocessorOptions: {
        // sass variable and mixin
        scss: {
          additionalData: `
            @use "@styles/core/el-light.scss" as *;
            @use "@styles/core/mixin.scss" as *;
          `
        }
      },
      postcss: {
        plugins: [
          {
            postcssPlugin: 'internal:charset-removal',
            AtRule: {
              charset: (atRule) => {
                if (atRule.name === 'charset') {
                  atRule.remove()
                }
              }
            }
          }
        ]
      }
    }
  })
}

function resolvePath(paths: string) {
  return path.resolve(__dirname, paths)
}

function createVersionFilePlugin(version: string): PluginOption {
  const buildVersion = version || String(Date.now())

  return {
    name: 'saas-version-file',
    apply: 'build',
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'version.json',
        source: JSON.stringify(
          {
            version: buildVersion,
            hash: `${buildVersion}-${Date.now()}`,
            buildTime: new Date().toISOString()
          },
          null,
          2
        )
      })
    }
  }
}
