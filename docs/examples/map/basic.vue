<template>
  <div class="map-demo">
    <HjMap
      v-if="chinaGeoJson"
      map-name="china"
      :map-data="chinaGeoJson"
      :zoom="1.15"
      :roam="true"
      :show-legend="false"
      :enable-drill-down="true"
      :drill-data-loader="loadDrillMap"
      @drill-down="handleDrillDown"
      @leaf-click="handleLeafClick"
      @back="handleBack"
    />
    <div v-else class="map-empty">正在加载离线中国 GeoJSON 地图数据...</div>
    <div class="demo-toolbar">
      <div>当前层级：{{ currentLabel }}</div>
      <div class="demo-tip">点击省、市可继续下钻；区县为最小可拆分区域。</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { withBase } from 'vitepress'
import type { DrillDataLoader, MapLeafData } from '@hujie/components/map'

interface MapIndexItem {
  adcode: string
  name: string
  level: string
  file: string
}

interface MapIndex {
  rootAdcode: string
  rootFile: string
  items: Record<string, MapIndexItem>
}

const chinaGeoJson = ref<Record<string, any> | null>(null)
const mapIndex = ref<MapIndex | null>(null)
const currentLabel = ref('中国')

const loadLocalMap = async (file: string) => {
  const response = await fetch(withBase(`/maps/china/${file}`))
  if (!response.ok) {
    return null
  }

  return response.json()
}

onMounted(async () => {
  const indexResponse = await fetch(withBase('/maps/china/map-index.json'))
  mapIndex.value = await indexResponse.json()
  chinaGeoJson.value = await loadLocalMap(mapIndex.value?.rootFile || '100000_full.json')
})

const loadDrillMap: DrillDataLoader = async (region) => {
  const adcode = region.adcode ? String(region.adcode) : ''
  const item = adcode && mapIndex.value?.items?.[adcode]

  if (!item) {
    return null
  }

  return loadLocalMap(item.file)
}

const handleDrillDown = (regionName: string) => {
  currentLabel.value = regionName
}

const handleLeafClick = (data: MapLeafData) => {
  currentLabel.value = `${data.region.name || '未知区域'}（已到最小区域）`
}

const handleBack = () => {
  currentLabel.value = '已返回上一层'
}
</script>

<style scoped>
.map-demo {
  position: relative;
  width: 100%;
  height: 100%;
}

.map-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: rgba(255, 255, 255, 0.82);
  text-align: center;
}

.demo-toolbar {
  position: absolute;
  left: 12px;
  bottom: 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-width: 320px;
  padding: 8px 10px;
  border: 1px solid rgba(0, 252, 255, 0.28);
  border-radius: 6px;
  color: #d9ffff;
  background: rgba(0, 0, 0, 0.32);
  font-size: 12px;
}

.demo-tip {
  color: rgba(217, 255, 255, 0.72);
}
</style>
