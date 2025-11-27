# Vue 2 兼容性组件库实现指南

基于现有 Vue 3 组件库架构，实现 Vue 2 项目兼容的完整解决方案

## 概述

本指南将指导你如何将现有的 Vue 3 组件库改造为同时支持 Vue 2 和 Vue 3 的通用组件库。通过使用 Vue Demi 和适配层技术，实现一套代码兼容两个版本。

## 技术方案选择

### 为什么选择 Vue Demi？

**Vue Demi** 是 Vue 生态中的通用工具库，它提供：
- **运行时检测**：自动检测当前 Vue 版本
- **统一 API**：提供兼容 Vue 2 和 Vue 3 的 API
- **零配置**：无需复杂的构建配置
- **类型安全**：完整的 TypeScript 支持

### 兼容性架构设计

```
┌─────────────────┐
│   组件库代码     │
│  (使用 Vue Demi) │
└─────────────────┘
        │
        ▼
┌─────────────────┐
│   Vue Demi 适配层 │
└─────────────────┘
        │
        ▼
┌───────┴───────┐
│ Vue 2 │ Vue 3 │
└───────┴───────┘
```

## 第一步：安装 Vue Demi

### 1.1 安装依赖
```bash
# 安装 Vue Demi
pnpm add -D vue-demi

# 如果需要在 Vue 2 项目中使用，还需要安装 @vue/composition-api
pnpm add -D @vue/composition-api
```

### 1.2 配置 package.json

在组件库的 package.json 中添加 peerDependencies：

```json
{
  "peerDependencies": {
    "vue": ">=2.5 <3.5.0 || >=3.0.0",
    "@vue/composition-api": "^1.0.0"
  },
  "peerDependenciesMeta": {
    "@vue/composition-api": {
      "optional": true
    }
  }
}
```

**配置说明**：
- **peerDependencies**：声明兼容的 Vue 版本范围
- **peerDependenciesMeta**：标记 @vue/composition-api 为可选依赖
- **版本范围**：支持 Vue 2.5+ 和 Vue 3.0+

## 第二步：改造组件库核心架构

### 2.1 修改安装器 (make-installer.ts)

```typescript
import { isVue2, isVue3, Vue2, install } from 'vue-demi'
import type { App, Plugin } from 'vue-demi'

export type SFCWithInstall<T> = T & Plugin

export const withInstall = <T>(comp: T) => {
  const component = comp as any
  
  if (isVue3) {
    // Vue 3 安装逻辑
    component.install = (app: App) => {
      app.component(component.name, comp)
    }
  } else if (isVue2) {
    // Vue 2 安装逻辑
    component.install = (Vue: typeof Vue2) => {
      Vue.component(component.name, comp)
    }
  }
  
  return comp as SFCWithInstall<T>
}

export const makeInstaller = (components: Plugin[] = []) => {
  const install = (app: any) => {
    if (isVue3) {
      components.forEach((component) => {
        if (component.install) {
          app.use(component)
        }
      })
    } else if (isVue2) {
      // Vue 2 需要手动注册组件
      components.forEach((component: any) => {
        if (component.install) {
          component.install(app)
        }
      })
    }
  }

  return {
    install,
  }
}
```

**兼容性关键点**：
- **版本检测**：使用 `isVue2` 和 `isVue3` 进行运行时版本判断
- **安装逻辑分离**：Vue 2 和 Vue 3 使用不同的组件注册方式
- **类型安全**：保持 TypeScript 类型完整性

### 2.2 创建 Vue 2 兼容性工具函数

创建 `packages/utils/compat.ts`：

```typescript
import { isVue2, isVue3, Vue2 } from 'vue-demi'
import type { App, Ref, ComputedRef } from 'vue-demi'

// 统一 ref 函数
export const compatRef = <T>(value: T): Ref<T> => {
  if (isVue3) {
    const { ref } = require('vue')
    return ref(value)
  } else {
    const { ref } = require('@vue/composition-api')
    return ref(value)
  }
}

// 统一 computed 函数
export const compatComputed = <T>(getter: () => T): ComputedRef<T> => {
  if (isVue3) {
    const { computed } = require('vue')
    return computed(getter)
  } else {
    const { computed } = require('@vue/composition-api')
    return computed(getter)
  }
}

// 统一组件注册
export const compatInstall = (component: any, app: any) => {
  if (isVue3) {
    app.component(component.name, component)
  } else if (isVue2) {
    app.component(component.name, component)
  }
}

// 检查是否安装了 Composition API
export const hasCompositionAPI = (): boolean => {
  if (isVue2) {
    try {
      require('@vue/composition-api')
      return true
    } catch {
      return false
    }
  }
  return true
}
```

## 第三步：改造组件实现

### 3.1 修改 Button 组件示例

```vue
<template>
  <button 
    class="my-button"
    :class="buttonClasses"
    :disabled="compatDisabled"
    @click="handleClick"
  >
    <span v-if="loading" class="my-button__loading">
      <i class="my-icon-loading"></i>
    </span>
    <span class="my-button__content">
      <slot></slot>
    </span>
  </button>
</template>

<script>
import { defineComponent } from 'vue-demi'
import { compatRef, compatComputed } from '@my-library/utils/compat'

export default defineComponent({
  name: 'MyButton',
  
  props: {
    type: {
      type: String,
      default: 'primary',
      validator: (value) => {
        return ['primary', 'success', 'warning', 'danger', 'info'].includes(value)
      }
    },
    size: {
      type: String,
      default: 'default',
      validator: (value) => {
        return ['large', 'default', 'small'].includes(value)
      }
    },
    disabled: {
      type: Boolean,
      default: false
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  
  emits: ['click'],
  
  setup(props, { emit }) {
    const buttonClasses = compatComputed(() => [
      `my-button--${props.type}`,
      `my-button--${props.size}`,
      {
        'is-disabled': props.disabled,
        'is-loading': props.loading
      }
    ])
    
    const compatDisabled = compatComputed(() => props.disabled || props.loading)
    
    const handleClick = (event) => {
      if (!props.disabled && !props.loading) {
        emit('click', event)
      }
    }
    
    return {
      buttonClasses,
      compatDisabled,
      handleClick
    }
  }
})
</script>

<style scoped>
/* 样式保持不变 */
.my-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
  font-weight: 500;
  outline: none;
}

.my-button--primary {
  background-color: #409eff;
  color: white;
}

.my-button--primary:hover {
  background-color: #66b1ff;
}

.my-button--large {
  padding: 12px 20px;
  font-size: 16px;
}

.my-button--default {
  padding: 10px 16px;
  font-size: 14px;
}

.my-button--small {
  padding: 8px 12px;
  font-size: 12px;
}

.my-button.is-disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.my-button__loading {
  margin-right: 6px;
}
</style>
```

**组件改造要点**：
- **使用 defineComponent**：替代 `<script setup>` 语法
- **兼容性工具函数**：使用 `compatRef` 和 `compatComputed`
- **Options API 支持**：保留 props 和 emits 的选项式声明

## 第四步：构建配置调整

### 4.1 修改 Vite 配置

```typescript
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { resolve } from "path";
import dts from "vite-plugin-dts";

export default defineConfig({
  plugins: [
    vue({
      // 支持 Vue 2 模板编译
      template: {
        compilerOptions: {
          compatConfig: {
            MODE: 2
          }
        }
      }
    }),
    dts({
      entryRoot: "./packages",
      outDir: "./dist",
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, "packages/my-library/index.ts"),
      name: "my-library",
      formats: ["es", "umd", "cjs"]
    },
    rollupOptions: {
      external: ["vue", "vue-demi", "@vue/composition-api"],
      output: {
        globals: {
          vue: "Vue",
          "vue-demi": "VueDemi",
          "@vue/composition-api": "VueCompositionAPI"
        },
        // 为 UMD 格式提供兼容性
        exports: "named"
      }
    }
  },
  // 为 Vue 2 提供兼容性配置
  define: {
    __VUE_OPTIONS_API__: true,
    __VUE_PROD_DEVTOOLS__: false
  }
});
```

### 4.2 创建 Vue 2 专用构建配置

创建 `vite.config.vue2.ts`：

```typescript
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { resolve } from "path";

export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          compatConfig: {
            MODE: 2
          }
        }
      }
    })
  ],
  build: {
    lib: {
      entry: resolve(__dirname, "packages/my-library/index.ts"),
      name: "my-library",
      fileName: (format) => `index.vue2.${format}.js`
    },
    rollupOptions: {
      external: ["vue", "vue-demi", "@vue/composition-api"],
      output: {
        globals: {
          vue: "Vue",
          "vue-demi": "VueDemi",
          "@vue/composition-api": "VueCompositionAPI"
        }
      }
    }
  },
  define: {
    __VUE_OPTIONS_API__: true,
    __VUE_PROD_DEVTOOLS__: false
  }
});
```

## 第五步：使用指南

### 5.1 在 Vue 3 项目中使用

```javascript
// 安装依赖
npm install my-component-library

// 使用组件
import { createApp } from 'vue'
import MyLibrary from 'my-component-library'
import App from './App.vue'

const app = createApp(App)
app.use(MyLibrary)
app.mount('#app')
```

### 5.2 在 Vue 2 项目中使用

```javascript
// 安装依赖
npm install my-component-library vue-demi @vue/composition-api

// 在 main.js 中配置
import Vue from 'vue'
import VueCompositionAPI from '@vue/composition-api'
import MyLibrary from 'my-component-library'
import App from './App.vue'

// 安装 Composition API
Vue.use(VueCompositionAPI)

// 使用组件库
Vue.use(MyLibrary)

new Vue({
  render: h => h(App)
}).$mount('#app')
```

### 5.3 按需导入（Vue 2）

```javascript
import Vue from 'vue'
import VueCompositionAPI from '@vue/composition-api'
import { MyButton } from 'my-component-library'

Vue.use(VueCompositionAPI)
Vue.use(MyButton)
```

## 第六步：测试兼容性

### 6.1 创建 Vue 2 测试环境

创建 `test/vue2-app` 目录：

```bash
mkdir -p test/vue2-app
cd test/vue2-app
```

创建 Vue 2 测试应用的 package.json：

```json
{
  "name": "vue2-test-app",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite",
    "build": "vite build"
  },
  "dependencies": {
    "vue": "^2.7.0",
    "vue-demi": "latest",
    "@vue/composition-api": "^1.0.0",
    "my-component-library": "../"
  },
  "devDependencies": {
    "vite": "^4.0.0",
    "@vitejs/plugin-vue2": "^2.0.0"
  }
}
```

### 6.2 测试组件

创建测试应用：

```vue
<template>
  <div id="app">
    <h1>Vue 2 兼容性测试</h1>
    <MyButton @click="handleClick">Vue 2 按钮</MyButton>
    <p>点击次数: {{ count }}</p>
  </div>
</template>

<script>
import { MyButton } from 'my-component-library'

export default {
  name: 'App',
  components: {
    MyButton
  },
  data() {
    return {
      count: 0
    }
  },
  methods: {
    handleClick() {
      this.count++
      console.log('按钮被点击', this.count)
    }
  }
}
</script>
```

## 第七步：发布配置

### 7.1 更新 package.json 发布配置

```json
{
  "name": "my-component-library",
  "version": "1.0.0",
  "main": "./dist/index.umd.js",
  "module": "./dist/index.es.js",
  "unpkg": "./dist/index.umd.js",
  "jsdelivr": "./dist/index.umd.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.es.js",
      "require": "./dist/index.umd.js",
      "types": "./dist/index.d.ts"
    },
    "./vue2": {
      "import": "./dist/index.vue2.es.js",
      "require": "./dist/index.vue2.umd.js",
      "types": "./dist/index.d.ts"
    }
  },
  "files": ["dist"],
  "peerDependencies": {
    "vue": ">=2.5 <3.5.0 || >=3.0.0",
    "@vue/composition-api": "^1.0.0"
  },
  "peerDependenciesMeta": {
    "@vue/composition-api": {
      "optional": true
    }
  }
}
```

### 7.2 构建脚本更新

在根目录 package.json 中添加构建脚本：

```json
{
  "scripts": {
    "build": "vite build",
    "build:vue2": "vite build --config vite.config.vue2.ts",
    "build:all": "pnpm run build && pnpm run build:vue2",
    "prepublishOnly": "pnpm run build:all"
  }
}
```

## 注意事项

### 8.1 已知限制

1. **Composition API 依赖**：Vue 2 项目必须安装 @vue/composition-api
2. **Tree Shaking**：Vue 2 版本的 Tree Shaking 效果可能不如 Vue 3
3. **性能差异**：Vue 2 版本可能会有轻微的性能差异

### 8.2 最佳实践

1. **渐进式迁移**：建议新项目直接使用 Vue 3
2. **测试覆盖**：确保在两个版本下都进行充分测试
3. **文档说明**：在文档中明确说明兼容性要求

### 8.3 故障排除

**常见问题**：
- **Vue 2 中 Composition API 未安装**：提示 `Cannot find module '@vue/composition-api'`
- **版本冲突**：确保 Vue 和 Vue Demi 版本兼容
- **构建错误**：检查 Vite 配置中的兼容性设置

## 总结

通过使用 Vue Demi 和适当的构建配置，我们可以实现一套代码同时兼容 Vue 2 和 Vue 3。这种方案的优势在于：

- **代码复用**：避免维护两套代码
- **类型安全**：完整的 TypeScript 支持
- **渐进迁移**：支持项目从 Vue 2 平滑迁移到 Vue 3
- **生态兼容**：与现有 Vue 生态工具良好集成

这种兼容性方案特别适合需要支持现有 Vue 2 项目，同时面向未来 Vue 3 的组件库开发。