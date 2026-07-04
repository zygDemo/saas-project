import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import { fileURLToPath } from 'url'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@views': path.resolve(__dirname, 'src/views'),
      '@utils': path.resolve(__dirname, 'src/utils'),
      '@stores': path.resolve(__dirname, 'src/store'),
      '@styles': path.resolve(__dirname, 'src/assets/styles'),
    },
  },
  test: {
    environment: 'happy-dom',
    globals: true,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/views/business/**', 'src/utils/**'],
    },
  },
})
