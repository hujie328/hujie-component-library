# Offline China Map Drilldown Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将地图文档预览扩展为完全离线的中国地图逐级下钻，支持中国 -> 省 -> 市 -> 区县，区县作为最小可拆分层级。

**Architecture:** 文档资源目录保存离线 GeoJSON：`docs/public/maps/china/{adcode}_full.json` 和 `map-index.json`。`HjMap` 组件不绑定具体数据源，只通过 `drillDataLoader` prop 获取下一层 GeoJSON；文档示例提供本地静态文件 loader。组件内部维护当前地图、当前 GeoJSON、下钻栈和逐级返回。

**Tech Stack:** Vue 3、TypeScript、ECharts、VitePress、Vitest、DataV GeoAtlas 离线 GeoJSON。

---

### Task 1: 离线地图资源

**Files:**
- Create: `docs/public/maps/china/100000_full.json`
- Create: `docs/public/maps/china/{adcode}_full.json`
- Create: `docs/public/maps/china/map-index.json`
- Modify: `docs/public/maps/README.md`

- [ ] **Step 1: 下载中国、省、市层级 GeoJSON**

从 DataV GeoAtlas 下载 `100000_full.json`，递归下载 feature level 为 `province` 或 `city` 的 `{adcode}_full.json`，不下载 `district` 的下一层。

- [ ] **Step 2: 生成本地索引**

生成 `map-index.json`，记录每个已下载 adcode 的文件、名称、层级、子级 adcode，用于文档 loader 避免请求不存在的区县文件。

### Task 2: TDD 添加下钻辅助工具

**Files:**
- Create: `packages/components/map/src/drill.test.ts`
- Create: `packages/components/map/src/drill.ts`
- Modify: `package.json`

- [ ] **Step 1: 增加 Vitest 依赖和测试脚本**

添加 `vitest` 到 devDependencies，新增 `test` 脚本。

- [ ] **Step 2: 写失败测试**

测试 `normalizeAdcode`、`createDrillMapName`、`findRegionProperties`，先运行 `pnpm exec vitest run packages/components/map/src/drill.test.ts`，预期因为实现缺失失败。

- [ ] **Step 3: 实现最小工具函数**

实现 adcode 规范化、下钻 mapName 生成、按区域名称从 GeoJSON feature 中读取 properties。

### Task 3: 扩展 HjMap 自动下钻

**Files:**
- Modify: `packages/components/map/src/type.ts`
- Modify: `packages/components/map/src/map.vue`

- [ ] **Step 1: 增加类型**

新增 `MapRegionProperties`、`DrillStackItem`、`DrillDataLoader`、`MapLeafData` 类型。

- [ ] **Step 2: 接入自动下钻**

新增 `drillDataLoader`、`drillMapNamePrefix` props。点击 geo 区域时查找当前 GeoJSON 的 feature properties，调用 loader 获取下一层 GeoJSON；成功则注册并切换，失败则触发 `leafClick`。

- [ ] **Step 3: 实现逐级返回**

返回按钮改为回到上一层地图；保留 `backToMainMap` 方法用于一次性回根地图，新增 `backToPreviousMap` 暴露方法。

### Task 4: 更新文档示例

**Files:**
- Modify: `docs/examples/map/basic.vue`
- Modify: `docs/components/map/index.md`

- [ ] **Step 1: 文档示例加载本地中国地图**

示例先读取 `/maps/china/map-index.json` 和 `/maps/china/100000_full.json`，再通过 `drillDataLoader` 从本地 `/maps/china/{adcode}_full.json` 加载下一层。

- [ ] **Step 2: 更新 API 文档**

说明离线数据位置、下钻到区县停止、返回按钮逐级返回和新增 props/events/methods。

### Task 5: 验证

**Files:**
- Test: `packages/components/map/src/drill.test.ts`

- [ ] **Step 1: 运行单测**

执行 `pnpm exec vitest run packages/components/map/src/drill.test.ts`，预期通过。

- [ ] **Step 2: 类型检查和文档构建**

执行 `pnpm run type-check` 和 `pnpm docs:build`，预期都通过；chunk 体积警告允许存在。
