import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import { HjBarChart, HjPieChart, HjMap } from '@hujie/components'
import './custom.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.use(HjBarChart)
    app.use(HjPieChart)
    app.use(HjMap)
  }
} satisfies Theme
