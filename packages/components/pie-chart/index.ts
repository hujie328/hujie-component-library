import PieChart from './src/pie-chart.vue'
import { withInstall } from '@hujie/utils'

export * from './src/type'
export * from './src/config'

export const HjPieChart = withInstall(PieChart)
export default HjPieChart
