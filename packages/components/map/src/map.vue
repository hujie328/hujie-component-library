<template>
  <div class="hj-map">
    <!-- 空数据状态 -->
    <div v-if="isEmpty" class="empty-state">
      <slot name="empty">
        <div class="empty-content">暂无数据</div>
      </slot>
    </div>
    <!-- 错误状态 -->
    <div v-else-if="chartError" class="error-state">
      {{ chartError }}
    </div>
    <!-- 地图容器 -->
    <div v-else class="map-container">
      <!-- 返回按钮 -->
      <div
        v-if="showBackButton && drillStack.length > 0"
        class="back-btn-wrapper"
        :class="`back-btn-${backButtonPosition}`"
      >
        <span class="region-name">{{ currentRegionName }}</span>
        <slot name="backButton" :back="backToPreviousMap" :back-to-main="backToMainMap">
          <svg
            @click="backToPreviousMap"
            class="back-icon"
            viewBox="0 0 1024 1024"
            width="24"
            height="24"
          >
            <path
              :fill="backButtonColor"
              d="M341.333333 298.666667v170.666666L85.333333 256l256-213.333333v170.666666h213.333334a341.333333 341.333333 0 1 1 0 682.666667H170.666667v-85.333333h384a256 256 0 0 0 0-512H341.333333z"
            ></path>
          </svg>
        </slot>
      </div>

      <!-- 图例 -->
      <div v-if="showLegend && legendItems.length > 0" class="legend" :class="`legend-${legendPosition}`">
        <slot name="legend" :items="legendItems">
          <ul>
            <li v-for="(item, index) in legendItems" :key="index">
              <div class="legend-icon">
                <img v-if="item.flag || item.icon" :src="item.flag || item.icon" alt="" />
                <div v-else class="color-box" :style="{ background: item.color }"></div>
              </div>
              <span class="legend-label">{{ item.label }}</span>
            </li>
          </ul>
        </slot>
      </div>

      <!-- 图表 -->
      <div class="chart" ref="mapRef"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import * as echarts from 'echarts';
import type { EChartsType } from 'echarts';
import { onMounted, onUnmounted, ref, computed, watchEffect, watch, shallowRef } from 'vue';
import { observeResize } from '@hujie/utils';
import type {
  MapDataPoint,
  LegendItem,
  ColorConfig,
  ScatterConfig,
  MapClickData,
  LinesConfig,
  LoadingConfig,
  ThemeConfig,
  MapRegionProperties,
  DrillDataLoader,
  DrillStackItem,
  MapLeafData
} from './type';
import { createDrillMapName, findRegionProperties, normalizeAdcode } from './drill';

defineOptions({
  name: 'HjMap',
});

const props = withDefaults(
  defineProps<{
    // 兼容模式：支持直接传入完整 ECharts option
    option?: any;
    // 简单模式：使用 props 构建配置
    mapName?: string; // 地图名称（需要提前注册）
    mapData?: any; // 地图 GeoJSON 数据
    data?: MapDataPoint[]; // 散点数据
    zoom?: number; // 缩放级别
    center?: [string, string]; // 中心点
    roam?: boolean | string; // 是否开启缩放和平移
    // 颜色配置
    colors?: ColorConfig;
    // 标注配置
    scatterConfig?: ScatterConfig;
    // 图例配置
    showLegend?: boolean;
    legendPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    legendItems?: LegendItem[];
    // 下钻配置
    enableDrillDown?: boolean;
    drillDataLoader?: DrillDataLoader;
    drillMapNamePrefix?: string;
    showBackButton?: boolean;
    backButtonPosition?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
    backButtonColor?: string;
    // 线条配置
    linesConfig?: LinesConfig;
    linesData?: any[]; // 线条数据
    // 加载配置
    loading?: boolean;
    loadingConfig?: LoadingConfig;
    // 主题配置
    theme?: 'light' | 'dark' | 'custom';
    customTheme?: ThemeConfig;
  }>(),
  {
    mapName: 'china',
    data: () => [],
    zoom: 1.6,
    roam: true,
    colors: () => ({
      areaColor: {
        type: 'linear',
        x: 1200,
        y: 0,
        x2: 0,
        y2: 0,
        colorStops: [
          { offset: 0, color: 'rgba(3,27,78,0.85)' },
          { offset: 1, color: 'rgba(58,149,253,0.85)' },
        ],
        global: true,
      },
      borderColor: '#00fcff',
      borderWidth: 1,
      shadowColor: 'rgba(65, 214, 255,0.4)',
      shadowBlur: 5,
      hoverAreaColor: 'rgba(0,254,233,0.7)',
      hoverBorderWidth: 2,
    }),
    scatterConfig: () => ({
      symbol: 'circle',
      symbolSize: 10,
      showLabel: false,
      labelColor: 'rgba(0, 255, 134)',
      labelFontSize: 14,
      itemColor: '#f00',
      emphasisColor: 'green',
    }),
    showLegend: false,
    legendPosition: 'bottom-left',
    legendItems: () => [],
    enableDrillDown: false,
    drillMapNamePrefix: 'hj-map-drill',
    showBackButton: true,
    backButtonPosition: 'top-right',
    backButtonColor: 'rgba(242, 255, 0)',
    linesConfig: () => ({
      show: false,
      color: '#00ffff',
      width: 1,
      opacity: 0.6,
      curveness: 0.2,
    }),
    linesData: () => [],
    loading: false,
    loadingConfig: () => ({
      text: '加载中...',
      color: '#00FCFF',
      maskColor: 'rgba(0, 0, 0, 0.4)',
      textColor: '#fff',
      fontSize: 14,
    }),
    theme: 'dark',
  }
);

// 定义事件
const emit = defineEmits<{
  click: [data: MapClickData];
  dblclick: [data: MapClickData];
  mouseover: [data: MapClickData];
  mouseout: [data: MapClickData];
  regionClick: [regionName: string]; // 地图区域点击
  dataPointClick: [data: MapDataPoint]; // 数据点击
  drillDown: [regionName: string, region?: MapRegionProperties]; // 下钻事件
  leafClick: [data: MapLeafData]; // 点击最小可拆分区域
  back: [target?: DrillStackItem]; // 返回事件
  error: [error: Error];
  ready: [];
}>();

let myChart: EChartsType | null = null;
let observerCleanup: (() => void) | null = null;
const mapRef = ref(null);
const chartError = ref<string | null>(null);
const currentRegionName = ref<string>('');
const currentMapName = ref<string>(props.mapName || 'china');
const currentMapData = shallowRef<any>(props.mapData || null);
const drillStack = ref<DrillStackItem[]>([]);
const registeredMaps = shallowRef<Set<string>>(new Set());

// 空数据判断
const isEmpty = computed(() => {
  if (props.option) {
    return false;
  }
  return !props.mapName && !props.mapData && !currentMapData.value;
});

// 主题颜色配置
const getThemeColors = computed(() => {
  const themes = {
    light: {
      backgroundColor: '#fff',
      textColor: '#333',
    },
    dark: {
      backgroundColor: 'transparent',
      textColor: '#d1d1d1',
    },
  };

  return props.theme === 'custom' ? props.customTheme || themes.dark : themes[props.theme || 'dark'];
});

onMounted(() => {
  if (!isEmpty.value && !myChart) {
    initChart();
  }
  if (mapRef.value) {
    observerCleanup = observeResize(mapRef.value, () => myChart?.resize(), { delay: 300 });
  }
});

onUnmounted(() => {
  observerCleanup?.();
  myChart?.dispose();
  myChart = null;
});

const initChart = () => {
  try {
    if (!mapRef.value) {
      throw new Error('地图容器未找到');
    }

    myChart = echarts.init(mapRef.value, 'svg', { devicePixelRatio: 3 });

    if (!myChart) {
      throw new Error('地图初始化失败');
    }

    registerActiveMap(props.mapName || 'customMap', props.mapData);

    myChart.setOption(getOption(), false);
    myChart.resize();
    chartError.value = null;

    // 绑定交互事件
    bindChartEvents();

    // 初始化后检查 loading 状态
    if (props.loading) {
      showLoading();
    }

    // 触发 ready 事件
    emit('ready');
  } catch (error) {
    chartError.value = error instanceof Error ? error.message : '未知错误';
    console.error('[HjMap] 初始化失败:', error);
    emit('error', error instanceof Error ? error : new Error('未知错误'));
  }
};

const registerActiveMap = (mapName: string, geoJson: any) => {
  currentMapName.value = mapName;
  currentMapData.value = geoJson || null;

  if (geoJson) {
    echarts.registerMap(mapName, geoJson);
    registeredMaps.value.add(mapName);
  }
};

// 显示加载状态
const showLoading = () => {
  if (!myChart) return;
  const loadingOpts = {
    text: props.loadingConfig?.text || '加载中...',
    color: props.loadingConfig?.color || '#00FCFF',
    maskColor: props.loadingConfig?.maskColor || 'rgba(0, 0, 0, 0.4)',
    textColor: props.loadingConfig?.textColor || '#fff',
    fontSize: props.loadingConfig?.fontSize || 14,
    spinnerRadius: props.loadingConfig?.spinnerRadius,
    lineWidth: props.loadingConfig?.lineWidth,
  };
  myChart.showLoading('default', loadingOpts);
};

// 隐藏加载状态
const hideLoading = () => {
  myChart?.hideLoading();
};

// 绑定图表事件
const bindChartEvents = () => {
  if (!myChart) return;

  myChart.on('click', (params: any) => {
    const clickData: MapClickData = {
      componentType: params.componentType,
      name: params.name,
      value: params.value,
      data: params.data,
      regionName: params.name,
    };

    emit('click', clickData);

    // 区域点击
    if (params.componentType === 'geo') {
      emit('regionClick', params.name);

      // 下钻功能：通过当前 GeoJSON 的 properties 取得 adcode，再交给外部 loader 获取下一层。
      if (props.enableDrillDown) {
        const region = findRegionProperties(currentMapData.value, params.name) || { name: params.name };
        handleDrillDown(region);
      }
    }

    // 数据点击
    if (params.componentType === 'series') {
      emit('dataPointClick', params.data);
    }
  });

  myChart.on('dblclick', (params: any) => {
    emit('dblclick', {
      componentType: params.componentType,
      name: params.name,
      value: params.value,
      data: params.data,
      regionName: params.name,
    });
  });

  myChart.on('mouseover', (params: any) => {
    emit('mouseover', {
      componentType: params.componentType,
      name: params.name,
      value: params.value,
      data: params.data,
      regionName: params.name,
    });
  });

  myChart.on('mouseout', (params: any) => {
    emit('mouseout', {
      componentType: params.componentType,
      name: params.name,
      value: params.value,
      data: params.data,
      regionName: params.name,
    });
  });
};

// 处理下钻
const handleDrillDown = async (region: MapRegionProperties) => {
  if (!myChart) return;

  try {
    const regionName = region.name || '';
    const adcode = normalizeAdcode(region.adcode);

    if (!adcode) {
      emit('leafClick', { region, reason: 'missing-adcode' });
      return;
    }

    if (!props.drillDataLoader) {
      emit('leafClick', { region, reason: 'no-loader' });
      return;
    }

    showLoading();

    const nextGeoJson = await props.drillDataLoader(region, {
      currentMapName: currentMapName.value,
      currentMapData: currentMapData.value,
      stack: [...drillStack.value],
    });

    hideLoading();

    if (!nextGeoJson) {
      emit('leafClick', { region, reason: 'no-data' });
      return;
    }

    drillStack.value.push({
      mapName: currentMapName.value,
      regionName: currentRegionName.value,
      adcode,
      geoJson: currentMapData.value,
    });

    const nextMapName = createDrillMapName(props.drillMapNamePrefix || 'hj-map-drill', adcode);
    registerActiveMap(nextMapName, nextGeoJson);
    currentRegionName.value = regionName;
    myChart.setOption(getOption(), true);
    emit('drillDown', regionName, region);

  } catch (error) {
    hideLoading();
    console.error('[HjMap] 下钻失败:', error);
    emit('error', error instanceof Error ? error : new Error('下钻失败'));
  }
};

// 返回上一层地图
const backToPreviousMap = () => {
  if (!myChart) return;

  try {
    const previous = drillStack.value.pop();
    if (!previous) return;

    registerActiveMap(previous.mapName, previous.geoJson);
    currentRegionName.value = previous.regionName;
    myChart.setOption(getOption(), true);
    emit('back', previous);
  } catch (error) {
    console.error('[HjMap] 返回失败:', error);
  }
};

// 返回主地图
const backToMainMap = () => {
  if (!myChart || drillStack.value.length === 0) return;

  try {
    const root = drillStack.value[0];
    if (!root) return;

    drillStack.value = [];
    registerActiveMap(root.mapName, root.geoJson);
    currentRegionName.value = '';
    myChart.setOption(getOption(), true);
    emit('back', root);
  } catch (error) {
    console.error('[HjMap] 返回主地图失败:', error);
  }
};

// 获取散点图配置
const getScatterSeries = (data: MapDataPoint[] = []) => {
  const config = props.scatterConfig || {};

  return {
    name: '散点',
    type: 'scatter',
    coordinateSystem: 'geo',
    data: data,
    zlevel: 10,
    symbol: config.symbol || 'circle',
    symbolSize: config.symbolSize || 10,
    label: {
      normal: {
        show: config.showLabel || false,
        formatter: config.labelFormatter || ((params: any) => params.name),
        color: config.labelColor || 'rgba(0, 255, 134)',
        fontSize: config.labelFontSize || 14,
      },
    },
    itemStyle: {
      normal: {
        color: config.itemColor || '#f00',
      },
    },
    emphasis: {
      focus: 'self',
      label: {
        show: true,
        color: config.labelColor || 'rgba(0, 255, 134)',
        fontWeight: 'bold',
        fontSize: config.labelFontSize || 14,
        position: 'top',
      },
      itemStyle: {
        color: config.emphasisColor || 'green',
      },
    },
  };
};

// 获取线条配置
const getLinesSeries = (data: any[] = []) => {
  const config = props.linesConfig || {};

  if (!config.show) {
    return null;
  }

  const series: any = {
    type: 'lines',
    coordinateSystem: 'geo',
    zlevel: 2,
    lineStyle: {
      color: config.color || '#00ffff',
      width: config.width || 1,
      opacity: config.opacity || 0.6,
      curveness: config.curveness || 0.2,
    },
    data: data,
  };

  if (config.effect?.show) {
    series.effect = {
      show: true,
      period: config.effect.period || 6,
      trailLength: config.effect.trailLength || 0.7,
      color: config.effect.color || '#fff',
      symbol: config.effect.symbol || 'circle',
      symbolSize: config.effect.symbolSize || 4,
    };
  }

  return series;
};

// 获取地图配置
const getGeoConfig = () => {
  const colors = props.colors || {};

  return {
    zlevel: 0,
    map: currentMapName.value || props.mapName,
    zoom: props.zoom,
    roam: props.roam,
    center: props.center,
    layoutCenter: ['50%', '50%'],
    layoutSize: '100%',
    label: {
      show: false,
      color: getThemeColors.value.textColor,
    },
    itemStyle: {
      areaColor: colors.areaColor,
      borderColor: colors.borderColor || '#00fcff',
      borderWidth: colors.borderWidth || 1,
      shadowColor: colors.shadowColor || 'rgba(65, 214, 255,0.4)',
      shadowBlur: colors.shadowBlur || 5,
      shadowOffsetX: 0,
      shadowOffsetY: 8,
    },
    emphasis: {
      itemStyle: {
        areaColor: colors.hoverAreaColor || 'rgba(0,254,233,0.7)',
        borderWidth: colors.hoverBorderWidth || 2,
      },
      label: {
        show: true,
        color: getThemeColors.value.textColor,
      },
    },
  };
};

// 构建图表配置
const getOption = () => {
  // 兼容模式：如果传入了完整的 option
  if (props.option) {
    return props.option;
  }

  // 简单模式：使用 props 构建配置
  const series: any[] = [];

  // 添加散点图
  if (props.data && props.data.length > 0) {
    series.push(getScatterSeries(props.data));
  }

  // 添加线条
  const linesSeries = getLinesSeries(props.linesData);
  if (linesSeries) {
    series.push(linesSeries);
  }

  return {
    backgroundColor: getThemeColors.value.backgroundColor,
    geo: [getGeoConfig()],
    series: series,
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        if (params.componentType === 'geo') {
          return params.name;
        }
        return `${params.name}<br/>${params.value}`;
      },
    },
  };
};

// 监听 props 变化；异步传入 mapData 后，组件会自动从空状态切换为地图实例。
watchEffect(() => {
  if (isEmpty.value) {
    return;
  }

  if (!myChart && mapRef.value) {
    initChart();
    return;
  }

  if (myChart) {
    myChart.setOption(props.option || getOption(), Boolean(props.option));
  }
});

// 监听 loading 状态
watchEffect(() => {
  if (myChart) {
    if (props.loading) {
      showLoading();
    } else {
      hideLoading();
    }
  }
});

// 监听地图数据变化
watch(() => props.mapData, (newData) => {
  if (newData && myChart) {
    drillStack.value = [];
    currentRegionName.value = '';
    registerActiveMap(props.mapName || 'customMap', newData);
    myChart.setOption(getOption(), true);
  }
});

// 暴露组件方法
const resize = () => myChart?.resize();
const setChartOption = (opt: any) => myChart?.setOption(opt);
const getInstance = () => myChart;
const refresh = () => {
  if (myChart) {
    myChart.dispose();
    myChart = null;
  }
  initChart();
};
const clear = () => myChart?.clear();
const dispatchAction = (action: any) => myChart?.dispatchAction(action);

// 注册地图
const registerMap = (mapName: string, geoJson: any) => {
  echarts.registerMap(mapName, geoJson);
  registeredMaps.value.add(mapName);
};

// 获取已注册的地图列表
const getRegisteredMaps = () => Array.from(registeredMaps.value);

defineExpose({
  resize,
  setOption: setChartOption,
  getInstance,
  refresh,
  clear,
  dispatchAction,
  registerMap,
  getRegisteredMaps,
  backToPreviousMap,
  backToMainMap,
  showLoading,
  hideLoading,
});
</script>

<style scoped lang="scss">
.hj-map {
  width: 100%;
  height: 100%;
  position: relative;
}

.map-container {
  width: 100%;
  height: 100%;
  position: relative;
}

.chart {
  width: 100%;
  height: 100%;
}

.empty-state,
.error-state {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  min-height: 200px;
  color: rgba(209, 209, 209, 0.8);
  font-size: 14px;
}

.error-state {
  color: #ff6b6b;
}

.empty-content {
  text-align: center;
}

.back-btn-wrapper {
  position: absolute;
  z-index: 1000;
  display: flex;
  align-items: center;
  gap: 10px;

  &.back-btn-top-right {
    top: 20px;
    right: 20px;
  }

  &.back-btn-top-left {
    top: 20px;
    left: 20px;
  }

  &.back-btn-bottom-right {
    bottom: 20px;
    right: 20px;
  }

  &.back-btn-bottom-left {
    bottom: 20px;
    left: 20px;
  }

  .region-name {
    font-size: 18px;
    color: rgba(0, 255, 134);
  }

  .back-icon {
    cursor: pointer;
    transition: all 0.3s;

    &:hover {
      transform: scale(1.1);

      path {
        fill: rgba(0, 255, 134) !important;
      }
    }
  }
}

.legend {
  position: absolute;
  z-index: 1000;
  border: 1px solid rgba(0, 174, 255, 0.3);
  padding: 15px;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.3);

  &.legend-top-left {
    top: 20px;
    left: 40px;
  }

  &.legend-top-right {
    top: 20px;
    right: 40px;
  }

  &.legend-bottom-left {
    bottom: 20px;
    left: 40px;
  }

  &.legend-bottom-right {
    bottom: 20px;
    right: 40px;
  }

  ul {
    list-style: none;
    padding: 0;
    margin: 0;
    color: #fff;
    font-size: 12px;

    li {
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 6px;

      &:last-child {
        margin-bottom: 0;
      }

      .legend-icon {
        display: flex;
        align-items: center;
        justify-content: center;

        img {
          width: 20px;
          height: 20px;
          object-fit: contain;
        }

        .color-box {
          width: 16px;
          height: 16px;
          border-radius: 2px;
        }
      }

      .legend-label {
        max-width: 120px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }
  }
}
</style>



