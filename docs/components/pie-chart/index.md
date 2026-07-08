<script setup>
import BasicDemo from '../../examples/pie-chart/basic.vue'
</script>

# 3D 饼图 HjPieChart

`HjPieChart` 基于 Highcharts 3D Pie 封装，支持颜色组、图例百分比、底图定位和点击事件。

## 基础预览

<div class="preview-panel">
  <BasicDemo />
</div>

::: tip 数据说明
当前示例数据仅用于文档预览，业务使用时请替换为接口返回的真实数据。
:::

## 基础用法

```vue
<template>
  <HjPieChart :series="series" color-group="B" :show-percent-in-legend="true" />
</template>

<script setup lang="ts">
import { HjPieChart } from 'hujie-component-library'
import type { SeriesProp } from 'hujie-component-library'

const series: SeriesProp = {
  name: '设备状态',
  data: [
    { name: '在线', y: 46 },
    { name: '离线', y: 18 }
  ]
}
</script>
```

## 主要 Props

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `series` | 饼图系列数据 | `SeriesProp` | `{ name: '', data: [] }` |
| `pie` | 饼图尺寸、深度、中心点配置 | `PieConfig` | 内置配置 |
| `colorGroup` | 颜色组 | `'A' \| 'B' \| 'C'` | `'A'` |
| `legend` | Highcharts 图例配置 | `LegendConfig` | 内置配置 |
| `showPercentInLegend` | 图例中是否显示百分比 | `boolean` | `false` |
| `baseImage` | 饼图底图配置 | `BaseImageConfig` | 内置底图配置 |
| `dataLabels` | 数据标签配置 | `DataLabelsConfig` | 内置配置 |

## 事件

| 事件 | 说明 |
| --- | --- |
| `pieClick` | 点击饼图扇区时触发，返回 Highcharts point 对象 |

## 资源说明

默认底图位于：`packages/components/pie-chart/src/assets/images/pie_base_bg.png`。如果业务项目不需要底图，可以传入：

```vue
<HjPieChart :base-image="{ show: false }" />
```
