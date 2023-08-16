import path from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@@': path.resolve(__dirname, './'),
    },
  },
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.js'),
      name: 'piniaIDBPersist',
      fileName: (format) => `pinia-persist.${format}.js`,
    },
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    coverage: {
      all: true,
      include: ['src/**/*.js'],
      reporter: ['text', 'json', 'html'],
    },
  },
})
