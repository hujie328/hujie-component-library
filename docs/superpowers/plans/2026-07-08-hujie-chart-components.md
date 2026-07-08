# Hujie Chart Components Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 `hujie-component-library` 中搭建最小 Vue3 组件库工程，并迁入优化 3D 柱形图、3D 饼图和地图组件。

**Architecture:** 采用目标 md 中建议的 monorepo 结构：`packages/components` 存组件、`packages/utils` 存公共工具、`packages/theme-chalk` 存可复用样式、`packages/hujie-component-library` 存库入口和安装器。组件按目录独立导出，主包提供全量安装和按需导出。

**Tech Stack:** Vue 3.5+、TypeScript、Vite、pnpm workspace、ECharts、Highcharts、Sass、vite-plugin-dts。

---

### Task 1: 基础工程结构

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `tsconfig.json`
- Create: `tsconfig.app.json`
- Create: `vite.config.ts`
- Create: `.gitignore`
- Create: `packages/components/package.json`
- Create: `packages/utils/package.json`
- Create: `packages/theme-chalk/package.json`
- Create: `packages/hujie-component-library/package.json`

- [ ] **Step 1: 创建 root package 和 workspace 配置**

写入 pnpm workspace、构建入口、依赖和脚本，依赖包含 `vue`、`echarts`、`highcharts`，开发依赖包含 Vite、TypeScript、Sass、vite-plugin-dts。

- [ ] **Step 2: 创建 TypeScript 和 Vite 配置**

配置 `@hujie/*`、`@hujie/components`、`@hujie/utils`、`@hujie/theme-chalk` 路径别名，库入口指向 `packages/hujie-component-library/index.ts`。

### Task 2: 公共工具与安装器

**Files:**
- Create: `packages/utils/dom.ts`
- Create: `packages/utils/install.ts`
- Create: `packages/utils/index.ts`
- Create: `packages/hujie-component-library/index.ts`
- Create: `packages/hujie-component-library/defaults.ts`
- Create: `packages/hujie-component-library/make-installer.ts`
- Create: `packages/hujie-component-library/version.ts`

- [ ] **Step 1: 实现 ResizeObserver 工具**

实现 `observeResize`，返回清理函数，内部清理定时器和 observer，替代源组件散落的 `domObserver`。

- [ ] **Step 2: 实现组件安装工具**

实现 `withInstall` 和 `makeInstaller`，支持 `app.use(Component)` 和全量 `app.use(HujieComponentLibrary)`。

### Task 3: 迁移 3D 柱形图

**Files:**
- Create: `packages/components/bar-chart/src/bar-chart.vue`
- Create: `packages/components/bar-chart/src/type.ts`
- Create: `packages/components/bar-chart/index.ts`
- Create: `packages/theme-chalk/src/bar-chart.scss`

- [ ] **Step 1: 迁入类型和样式**

从源项目 `barchart` 迁入类型，样式改名为 `hj-bar-chart`，保留空状态和错误状态。

- [ ] **Step 2: 迁入组件并优化封装**

组件名改为 `HjBarChart`，导入改为 `@hujie/utils` 和 `@hujie/theme-chalk`，补充 custom series 渲染、option 兼容模式、事件绑定、生命周期清理注释。

### Task 4: 迁移 3D 饼图

**Files:**
- Create: `packages/components/pie-chart/src/pie-chart.vue`
- Create: `packages/components/pie-chart/src/type.ts`
- Create: `packages/components/pie-chart/src/config.ts`
- Create: `packages/components/pie-chart/src/assets/images/pie_base_bg.png`
- Create: `packages/components/pie-chart/src/assets/images/images.d.ts`
- Create: `packages/components/pie-chart/index.ts`

- [ ] **Step 1: 迁入资源、类型和默认配置**

复制源项目底图资源，默认配置保持兼容，类型保留 Highcharts 扩展能力。

- [ ] **Step 2: 迁入组件并优化资源释放**

组件名改为 `HjPieChart`，保存 resize 清理函数，销毁背景图片元素和 Highcharts 实例，补充配置合并和底图定位逻辑注释。

### Task 5: 迁移地图组件

**Files:**
- Create: `packages/components/map/src/map.vue`
- Create: `packages/components/map/src/type.ts`
- Create: `packages/components/map/index.ts`

- [ ] **Step 1: 迁入类型**

保留地图数据点、散点、线条、图例、加载、主题等配置类型。

- [ ] **Step 2: 迁入组件并优化扩展点**

组件名改为 `HjMap`，保留 option 兼容模式、mapData 注册、散点/线条系列、下钻返回、图例 slot、返回按钮 slot，补充关键注释。

### Task 6: 组件出口与验证

**Files:**
- Create: `packages/components/index.ts`
- Modify: `package.json`

- [ ] **Step 1: 汇总导出组件**

`packages/components/index.ts` 默认导出组件数组，并命名导出 `HjBarChart`、`HjPieChart`、`HjMap`。

- [ ] **Step 2: 安装依赖并验证类型**

执行 `pnpm install`。若依赖安装成功，执行 `pnpm exec vue-tsc --noEmit -p tsconfig.app.json` 做类型验证；不主动执行 `npm run build`。
