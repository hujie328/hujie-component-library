import { defineConfig } from 'vitepress'
import { resolve } from 'node:path'

export default defineConfig({
  title: 'Hujie Component Library',
  description: 'Vue 3 visual component library',
  cleanUrls: true,
  vite: {
    resolve: {
      alias: {
        '@hujie': resolve(__dirname, '../../packages'),
        '@hujie/components': resolve(__dirname, '../../packages/components'),
        '@hujie/utils': resolve(__dirname, '../../packages/utils'),
        '@hujie/theme-chalk': resolve(__dirname, '../../packages/theme-chalk'),
        '@docs': resolve(__dirname, '..')
      }
    }
  },
  themeConfig: {
    nav: [
      { text: '指南', link: '/guide/' },
      { text: '组件', link: '/components/bar-chart/' }
    ],
    sidebar: [
      {
        text: '指南',
        items: [
          { text: '快速开始', link: '/guide/' }
        ]
      },
      {
        text: '数据可视化组件',
        items: [
          { text: '3D 柱形图 HjBarChart', link: '/components/bar-chart/' },
          { text: '3D 饼图 HjPieChart', link: '/components/pie-chart/' },
          { text: '地图 HjMap', link: '/components/map/' }
        ]
      }
    ],
    outline: {
      label: '页面导航',
      level: [2, 3]
    },
    search: {
      provider: 'local'
    }
  }
})
