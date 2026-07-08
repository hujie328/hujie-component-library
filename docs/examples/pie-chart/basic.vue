<template>
  <div class="pie-demo">
    <HjPieChart
      :series="series"
      color-group="B"
      :show-percent-in-legend="true"
      :base-image="baseImage"
      @pie-click="handlePieClick"
    />
    <div v-if="clickedName" class="demo-event">最近点击：{{ clickedName }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { BaseImageConfig, SeriesProp } from '@hujie/components/pie-chart'

const series: SeriesProp = {
  name: '预览数据',
  data: [
    { name: '在线', y: 46 },
    { name: '离线', y: 18 },
    { name: '告警', y: 12 },
    { name: '维护', y: 8 }
  ]
}

const baseImage: BaseImageConfig = {
  show: true
}
const clickedName = ref('')

const handlePieClick = (point: { name?: string; y?: number }) => {
  clickedName.value = `${point.name || ''} ${point.y ?? ''}`.trim()
}
</script>

<style scoped>
.pie-demo {
  position: relative;
  width: 100%;
  height: 100%;
}

.demo-event {
  position: absolute;
  right: 12px;
  bottom: 8px;
  padding: 4px 8px;
  border-radius: 4px;
  color: #d9ffff;
  background: rgba(0, 0, 0, 0.28);
  font-size: 12px;
}
</style>
