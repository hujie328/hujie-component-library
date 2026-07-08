<template>
  <div class="bar-demo">
    <HjBarChart
      :data="chartData"
      :x-axis="xAxis"
      y-axis-name="数量"
      title="3D 柱形图预览"
      :show-legend="false"
      :grid-config="gridConfig"
      @click="handleClick"
    />
    <div v-if="clickedText" class="demo-event">最近点击：{{ clickedText }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { GridConfig } from '@hujie/components/bar-chart'

const xAxis = ['巡检', '告警', '处置', '复核', '归档']
const chartData = [120, 182, 151, 96, 138]
const gridConfig: GridConfig = {
  top: '24%',
  left: '8%',
  right: '8%',
  bottom: '16%'
}
const clickedText = ref('')

const handleClick = (data: { name: string; value: number; index: number }) => {
  clickedText.value = `${data.name || xAxis[data.index]}：${data.value}`
}
</script>

<style scoped>
.bar-demo {
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
