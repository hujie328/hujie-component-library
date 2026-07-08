<script setup>
import BasicDemo from '../../examples/bar-chart/basic.vue'
</script>

# 3D 柱形图 HjBarChart

`HjBarChart` 基于 ECharts custom series 绘制 3D 柱体，适合大屏和数据看板场景。

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
  <HjBarChart :data="data" :x-axis="xAxis" y-axis-name="数量" />
</template>

<script setup lang="ts">
import { HjBarChart } from 'hujie-component-library'

const xAxis = ['巡检', '告警', '处置']
const data = [120, 182, 151]
</script>
```

## 主要 Props

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `option` | 完整 ECharts option，传入后走兼容模式 | `any` | `undefined` |
| `data` | 单系列柱形图数据 | `number[]` | `[]` |
| `xAxis` | X 轴类目 | `string[]` | `[]` |
| `series` | 多系列配置 | `SeriesConfig[]` | `undefined` |
| `colors` | 单系列渐变颜色 | `ColorConfig` | 内置蓝绿渐变 |
| `theme` | 主题 | `'light' \| 'dark' \| 'custom'` | `'dark'` |
| `gridConfig` | ECharts grid 配置 | `GridConfig` | `undefined` |
| `loading` | 是否显示加载状态 | `boolean` | `false` |
| `highlightIndex` | 高亮数据下标 | `number \| number[]` | `undefined` |

## 事件

| 事件 | 说明 |
| --- | --- |
| `click` | 点击柱体时触发 |
| `dblclick` | 双击柱体时触发 |
| `mouseover` | 鼠标移入柱体时触发 |
| `mouseout` | 鼠标移出柱体时触发 |
| `dataZoom` | 数据缩放时触发 |
| `ready` | 图表初始化完成时触发 |
| `error` | 初始化异常时触发 |

## 暴露方法

| 方法 | 说明 |
| --- | --- |
| `resize()` | 重算图表尺寸 |
| `setOption(option)` | 设置 ECharts option |
| `getInstance()` | 获取 ECharts 实例 |
| `refresh()` | 销毁并重新初始化图表 |
| `clear()` | 清空图表 |
| `dispatchAction(action)` | 调用 ECharts action |
| `exportAsImage(type)` | 导出图片 |
| `exportAsData()` | 导出当前数据 |
