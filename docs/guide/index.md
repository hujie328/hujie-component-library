# 快速开始

## 安装依赖

```bash
pnpm install
```

## 启动文档预览

```bash
pnpm docs:dev
```

启动后按终端输出的本地地址访问文档站。

## 构建组件库

```bash
pnpm run build
```

## 全量注册

```ts
import { createApp } from 'vue'
import HujieComponentLibrary from 'hujie-component-library'
import App from './App.vue'

const app = createApp(App)
app.use(HujieComponentLibrary)
app.mount('#app')
```

## 按需引入

```vue
<template>
  <HjBarChart :data="data" :x-axis="xAxis" />
</template>

<script setup lang="ts">
import { HjBarChart } from 'hujie-component-library'

const xAxis = ['一月', '二月', '三月']
const data = [120, 200, 150]
</script>
```

<div class="tip-card">
文档中的图表数据仅用于组件预览，业务项目接入时请替换为接口返回的真实数据。
</div>
