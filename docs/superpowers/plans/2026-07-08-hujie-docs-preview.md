# Hujie Docs Preview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 `hujie-component-library` 增加 VitePress 文档站，用于预览 `HjBarChart`、`HjPieChart`、`HjMap` 组件效果和使用说明。

**Architecture:** 文档站放在 `docs` 目录，`.vitepress` 负责站点配置和全局主题注册，`docs/examples` 放可运行示例，`docs/components` 放组件文档页。根 `package.json` 增加 `docs:dev/docs:build/docs:preview` 脚本。

**Tech Stack:** Vue 3、TypeScript、VitePress、Vite、ECharts、Highcharts。

---

### Task 1: VitePress 配置

**Files:**
- Create: `docs/.vitepress/config.ts`
- Create: `docs/.vitepress/theme/index.ts`
- Create: `docs/.vitepress/theme/custom.css`

- [ ] **Step 1: 创建站点配置**

配置标题、导航、侧边栏，覆盖首页、快速开始、三个组件文档入口。

- [ ] **Step 2: 创建主题入口**

导入默认主题、注册 `HjBarChart`、`HjPieChart`、`HjMap`，引入自定义文档样式。

### Task 2: 文档页面和示例

**Files:**
- Create: `docs/index.md`
- Create: `docs/guide/index.md`
- Create: `docs/components/bar-chart/index.md`
- Create: `docs/components/pie-chart/index.md`
- Create: `docs/components/map/index.md`
- Create: `docs/examples/bar-chart/basic.vue`
- Create: `docs/examples/pie-chart/basic.vue`
- Create: `docs/examples/map/basic.vue`

- [ ] **Step 1: 创建首页和快速开始**

说明安装、全量注册、按需引入、文档启动方式。

- [ ] **Step 2: 创建三个组件文档页**

每个页面展示可运行示例、基础用法、主要 props、事件和暴露方法。

- [ ] **Step 3: 创建可运行示例组件**

柱形图和饼图使用文档预览演示数据；地图示例默认展示空状态，同时给出传入真实 GeoJSON 的入口说明。

### Task 3: 脚本和验证

**Files:**
- Modify: `package.json`

- [ ] **Step 1: 增加 VitePress 依赖和脚本**

新增 `vitepress` devDependency，新增 `docs:dev/docs:build/docs:preview` 脚本。

- [ ] **Step 2: 安装依赖并验证**

执行 `pnpm install`、`pnpm run type-check`、`pnpm docs:build`，确认文档站和组件库类型可用。
