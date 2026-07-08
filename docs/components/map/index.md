<script setup>
import BasicDemo from '../../examples/map/basic.vue'
</script>

# 地图 HjMap

`HjMap` 基于 ECharts geo/map 封装，支持地图注册、散点、飞线、图例、完整 option 兼容模式，以及通过外部 loader 实现的自动下钻。

## 离线中国地图下钻预览

<div class="preview-panel preview-panel--map">
  <BasicDemo />
</div>

::: tip 地图数据说明
当前预览完全使用本地离线 GeoJSON：`docs/public/maps/china/`。根地图是 `100000_full.json`，索引是 `map-index.json`，数据来源记录见 `docs/public/maps/README.md`。
:::

## 下钻规则

- 初始显示中国地图。
- 点击省级区域后切换到该省。
- 点击地市级区域后切换到该市。
- 点击区县级区域后停止下钻，并触发 `leafClick`。
- 如果某个区域本地没有下一层 GeoJSON，也会作为叶子节点处理。
- 返回按钮逐级返回；暴露方法 `backToMainMap()` 可一次回到根地图。

## 基础用法

```vue
<template>
  <HjMap
    map-name="china"
    :map-data="chinaGeoJson"
    :enable-drill-down="true"
    :drill-data-loader="loadDrillMap"
    @leaf-click="handleLeafClick"
  />
</template>

<script setup lang="ts">
import { HjMap } from 'hujie-component-library'
import type { DrillDataLoader, MapLeafData } from 'hujie-component-library'
import chinaGeoJson from './100000_full.json'
import mapIndex from './map-index.json'

const loadDrillMap: DrillDataLoader = async (region) => {
  const adcode = region.adcode ? String(region.adcode) : ''
  const item = adcode && mapIndex.items[adcode]
  return item ? import(`./${item.file}`).then((module) => module.default) : null
}

const handleLeafClick = (data: MapLeafData) => {
  // 区县或缺少下一层数据的区域会进入这里
}
</script>
```

## 主要 Props

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `option` | 完整 ECharts option，传入后走兼容模式 | `any` | `undefined` |
| `mapName` | 地图名称，需要和注册名称一致 | `string` | `'china'` |
| `mapData` | GeoJSON 地图数据 | `any` | `undefined` |
| `data` | 散点数据 | `MapDataPoint[]` | `[]` |
| `zoom` | 缩放级别 | `number` | `1.6` |
| `roam` | 是否允许缩放和平移 | `boolean \| string` | `true` |
| `showLegend` | 是否显示图例 | `boolean` | `false` |
| `legendItems` | 图例项 | `LegendItem[]` | `[]` |
| `enableDrillDown` | 是否启用自动下钻 | `boolean` | `false` |
| `drillDataLoader` | 下一层 GeoJSON 加载函数 | `DrillDataLoader` | `undefined` |
| `drillMapNamePrefix` | 下钻地图注册名前缀 | `string` | `'hj-map-drill'` |
| `linesConfig` | 飞线配置 | `LinesConfig` | 内置配置 |
| `linesData` | 飞线数据 | `any[]` | `[]` |
| `loading` | 是否显示加载状态 | `boolean` | `false` |

## 事件

| 事件 | 说明 |
| --- | --- |
| `click` | 地图或系列点击时触发 |
| `regionClick` | 点击地图区域时触发 |
| `dataPointClick` | 点击散点或系列数据时触发 |
| `drillDown` | 成功切换到下一层地图后触发 |
| `leafClick` | 点击最小可拆分区域或没有下一层数据时触发 |
| `back` | 返回上一层或根地图时触发 |
| `ready` | 图表初始化完成时触发 |
| `error` | 初始化或下钻异常时触发 |

## 暴露方法

| 方法 | 说明 |
| --- | --- |
| `resize()` | 重算地图尺寸 |
| `setOption(option)` | 设置 ECharts option |
| `getInstance()` | 获取 ECharts 实例 |
| `registerMap(mapName, geoJson)` | 手动注册地图 |
| `getRegisteredMaps()` | 获取组件已注册地图列表 |
| `backToPreviousMap()` | 返回上一层地图 |
| `backToMainMap()` | 返回根地图 |
| `showLoading()` | 显示加载状态 |
| `hideLoading()` | 隐藏加载状态 |
