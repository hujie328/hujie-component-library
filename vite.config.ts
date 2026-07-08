import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'node:path'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [
    vue(),
    dts({
      entryRoot: './packages',
      tsconfigPath: './tsconfig.app.json',
      outDir: './dist',
      pathsToAliases: true,
      insertTypesEntry: false,
      rollupTypes: true,
      exclude: [
        resolve('./packages/theme-chalk')
      ]
    })
  ],
  css: {
    preprocessorOptions: {
      scss: {
        silenceDeprecations: ['import']
      }
    }
  },
  resolve: {
    alias: {
      '@hujie': resolve(__dirname, 'packages'),
      '@hujie/components': resolve(__dirname, 'packages/components'),
      '@hujie/utils': resolve(__dirname, 'packages/utils'),
      '@hujie/theme-chalk': resolve(__dirname, 'packages/theme-chalk')
    }
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'packages/hujie-component-library/index.ts'),
      name: 'HujieComponentLibrary',
      fileName: (format) => `index.${format}.js`
    },
    rollupOptions: {
      external: [
        'vue',
        'echarts',
        'highcharts',
        'highcharts/highcharts-3d',
        'highcharts/modules/accessibility'
      ],
      output: {
        globals: {
          vue: 'Vue',
          echarts: 'echarts',
          highcharts: 'Highcharts',
          'highcharts/highcharts-3d': 'Highcharts3D',
          'highcharts/modules/accessibility': 'HighchartsAccessibility'
        }
      }
    }
  }
})
