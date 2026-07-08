<template>
  <div class="hj-bar-chart">
    <!-- 空数据状态 -->
    <div v-if="isEmpty" class="hj-empty-bar">
      <slot name="empty">
        <div class="hj-empty-content">暂无数据</div>
      </slot>
    </div>
    <!-- 错误状态 -->
    <div v-else-if="chartError" class="hj-error-bar">
      {{ chartError }}
    </div>
    <!-- 图表容器 -->
    <div v-else class="chart" ref="barchartRef"></div>
  </div>
</template>

<script setup lang="ts">
import * as echarts from "echarts";
import type { EChartsType } from "echarts";
import { onMounted, onUnmounted, ref, computed, watchEffect, watch, shallowRef } from "vue";
import type { RenderItem } from "./type";
import { observeResize } from "@hujie/utils";

defineOptions({
  name: "HjBarChart",
});

// 图表配置常量
const CHART_CONFIG = {
  SIDE_WIDTH: 6,
  OBLIQUE_HEIGHT: 4,
  BOTTOM_ANGLE_HEIGHT: 4,
} as const;

const DEFAULT_SERIES_COLORS = [
  { color1: '#00FCFF', color2: '#008AFF', topColor: '#50C6FF' },
  { color1: '#FF9C00', color2: '#FFF000', topColor: '#FFBA00' },
  { color1: '#FF4200', color2: '#FFAE00', topColor: '#FF8A00' },
  { color1: '#863FFF', color2: '#00FCFF', topColor: '#00ACFF' },
  { color1: '#00FCFF', color2: '#FFF000', topColor: '#FDFFDC' },
  { color1: '#3695FF', color2: '#1D43F3', topColor: '#0084FF' }
] as const;

// 导入类型定义
import type { ThemeConfig, ColorConfig, LoadingConfig, HighlightConfig, ChartClickData, SeriesConfig, LegendConfig, TooltipConfig, GridConfig } from './type';

const props = withDefaults(defineProps<{
  // 兼容模式：支持直接传入完整 ECharts option（类似 v-cab-chart）
  option?: any;
  // 简单模式：使用 props 构建配置
  data?: number[];
  xAxis?: string[];
  yAxisName?: string;
  loading?: boolean;
  loadingConfig?: LoadingConfig;
  // P2 功能
  animationDuration?: number;
  animationEasing?: string;
  colors?: ColorConfig;
  valueFormatter?: (value: number) => string;
  tooltipFormatter?: (params: any) => string;
  tooltipConfig?: TooltipConfig; // Tooltip配置，可设置axisPointer类型等
  // P3 功能
  theme?: 'light' | 'dark' | 'custom';
  customTheme?: ThemeConfig;
  enableDataZoom?: boolean;
  dataZoomStart?: number;
  dataZoomEnd?: number;
  showToolbox?: boolean;
  toolboxFeatures?: ('saveAsImage' | 'dataView' | 'restore')[];
  highlightIndex?: number | number[];
  highlightColors?: HighlightConfig;
  title?: string;
  subtitle?: string;
  showLegend?: boolean;
  legendPosition?: 'top' | 'bottom' | 'left' | 'right';
  legendConfig?: LegendConfig; // 图例配置，可设置形状、大小等
  barWidth?: number | 'auto';
  barMaxWidth?: number;
  barMinWidth?: number;
  sampling?: 'average' | 'max' | 'min' | 'sum';
  series?: SeriesConfig[];  // 多系列模式：传入多个系列数据
  showBackground?: boolean; // 是否显示背景系列（仅在多系列模式下有效）
  gridConfig?: GridConfig; // 网格配置
}>(), {
  data: () => [],
  xAxis: () => [],
  yAxisName: '万元',
  loading: false,
  animationDuration: 1000,
  animationEasing: 'cubicOut',
  colors: () => ({
    primary: '#00FCFF',
    secondary: '#008AFF'
  }),
  loadingConfig: () => ({
    text: '加载中...',
    color: '#00FCFF',
    maskColor: 'rgba(0, 0, 0, 0.4)',
    textColor: '#fff',
    fontSize: 14
  }),
  highlightColors: () => ({
    primaryColor: '#FFD700',
    secondaryColor: '#FFA500'
  }),
  theme: 'dark',
  enableDataZoom: false,
  dataZoomStart: 0,
  dataZoomEnd: 100,
  showToolbox: false,
  toolboxFeatures: () => ['saveAsImage'],
  showLegend: false,
  legendPosition: 'top',
  legendConfig: undefined,
  barWidth: 'auto',
  sampling: 'average',
  gridConfig: undefined,
  series: undefined,
  showBackground: false,
});

// 定义事件
const emit = defineEmits<{
  click: [data: ChartClickData];
  dblclick: [data: ChartClickData];
  mouseover: [data: ChartClickData];
  mouseout: [data: ChartClickData];
  dataZoom: [params: { start: number; end: number }];
  error: [error: Error];
  ready: [];
}>();

let myChart: EChartsType | null = null;
let observerCleanup: (() => void) | null = null;
const barchartRef = ref(null);
const chartError = ref<string | null>(null);

// 颜色处理工具函数 - 增加亮度
const lightenColor = (color: string, percent: number): string => {
  // 简单的颜色增亮处理
  const hex = color.replace('#', '');
  const num = parseInt(hex, 16);
  const r = Math.max(0, Math.min(255, ((num >> 16) & 0xff) + percent));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0xff) + percent));
  const b = Math.max(0, Math.min(255, (num & 0xff) + percent));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
};

const hslToHex = (h: number, s: number, l: number): string => {
  s /= 100;
  l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;

  if (h >= 0 && h < 60) {
    r = c; g = x; b = 0;
  } else if (h >= 60 && h < 120) {
    r = x; g = c; b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0; g = c; b = x;
  } else if (h >= 180 && h < 240) {
    r = 0; g = x; b = c;
  } else if (h >= 240 && h < 300) {
    r = x; g = 0; b = c;
  } else {
    r = c; g = 0; b = x;
  }

  const toHex = (val: number) =>
    Math.round((val + m) * 255)
      .toString(16)
      .padStart(2, '0');

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

const getRandomSeriesColors = (index: number) => {
  const hue = ((index + 1) * 47) % 360;
  const baseColor = hslToHex(hue, 70, 45);
  return {
    color1: baseColor,
    color2: lightenColor(baseColor, 30),
    topColor: lightenColor(baseColor, 60)
  };
};

const getSeriesColors = (seriesConfig: SeriesConfig, index: number) => {
  const palette =
    index >= 0 && index < DEFAULT_SERIES_COLORS.length
      ? DEFAULT_SERIES_COLORS[index]
      : undefined;

  const fallback = palette ?? getRandomSeriesColors(index);

  return {
    color1: seriesConfig.colors?.color1 || fallback.color1,
    color2: seriesConfig.colors?.color2 || fallback.color2,
    topColor: seriesConfig.colors?.topColor || fallback.topColor
  };
};

// 主题颜色配置
const getThemeColors = computed(() => {
  const themes = {
    light: {
      backgroundColor: '#fff',
      textColor: '#333',
      axisLineColor: '#e0e0e0',
      splitLineColor: '#f0f0f0'
    },
    dark: {
      backgroundColor: 'transparent',
      textColor: '#d1d1d1',
      axisLineColor: 'rgba(0, 91, 223, 1)',
      splitLineColor: 'rgba(17, 50, 126, 1)'
    }
  };

  return props.theme === 'custom'
    ? props.customTheme || themes.dark
    : themes[props.theme || 'dark'];
});

// 默认格式化函数
const defaultFormatter = (value: number) => {
  return value.toLocaleString('zh-CN');
};

const formatValue = computed(() =>
  props.valueFormatter || defaultFormatter
);

// 响应式数据处理
const seriesData = computed(() => props.data || []);
const maxValue = computed(() =>
  seriesData.value.length ? Math.max(...seriesData.value) : 0
);
const bgArr = computed(() => seriesData.value.map(() => maxValue.value));

// 空数据判断
const isEmpty = computed(() => {
  // option 模式下，不显示空状态（由 option 自己控制）
  if (props.option) {
    return false;
  }
  // 多系列模式下，检查 series 是否为空
  if (props.series && props.series.length > 0) {
    return props.series.every(s => !s.data?.length || s.data.every(v => v === 0));
  }
  // 简单模式下，检查 data 是否为空
  return !props.data?.length || props.data.every(v => v === 0);
});

// 高亮索引的响应式状态
const currentHighlightIndexes = shallowRef<Set<number>>(new Set());

// 应用高亮效果的统一方法
const applyHighlight = (indexes: number | number[] | undefined | null) => {
  if (!myChart) return;

  const indexArray = indexes !== undefined && indexes !== null
    ? (Array.isArray(indexes) ? indexes : [indexes])
    : [];

  currentHighlightIndexes.value = new Set(indexArray);

  // option 模式下，使用 ECharts 原生的 highlight/downplay
  if (props.option) {
    const option = myChart.getOption();
    const series = option?.series as any[] | undefined;
    const seriesCount = Array.isArray(series) ? series.length : 0;

    // 先取消所有系列的高亮
    for (let i = 0; i < seriesCount; i++) {
      myChart.dispatchAction({ type: 'downplay', seriesIndex: i });
    }

    // 高亮指定索引
    if (indexArray.length > 0) {
      for (let i = 0; i < seriesCount; i++) {
        indexArray.forEach(index => {
          myChart?.dispatchAction({
            type: 'highlight',
            seriesIndex: i,
            dataIndex: index
          });
        });
      }
    }
  } else {
    // 简单模式：custom 类型不支持原生 highlight，需要重新渲染
    // 通过重新 setOption 来触发 renderItem，在 renderItem 中根据 currentHighlightIndexes 改变样式
    myChart.setOption({
      series: [
        { data: bgArr.value },
        { data: seriesData.value }
      ]
    });
  }
};

onMounted(() => {
  if (!isEmpty.value && !myChart) {
    initChart();
  }
  if (barchartRef.value) {
    const cleanup = observeResize(
      barchartRef.value,
      () => myChart?.resize(),
      { delay: 300 }
    );
    observerCleanup = typeof cleanup === 'function' ? cleanup : null;
  }
});

// 内存清理
onUnmounted(() => {
  observerCleanup?.();
  myChart?.dispose();
  myChart = null;
});

const initChart = () => {
  try {
    if (!barchartRef.value) {
      throw new Error('图表容器未找到');
    }

    myChart = echarts.init(barchartRef.value, "svg", { devicePixelRatio: 3 });

    if (!myChart) {
      throw new Error('图表初始化失败');
    }

    myChart.setOption(getOption(), false);
    myChart.resize();
    chartError.value = null;

    // 绑定交互事件
    bindChartEvents();

    // 初始化后检查 loading 状态
    if (props.loading) {
      const loadingOpts = {
        text: props.loadingConfig?.text || '加载中...',
        color: props.loadingConfig?.color || props.colors?.primary || '#00FCFF',
        maskColor: props.loadingConfig?.maskColor || 'rgba(0, 0, 0, 0.4)',
        textColor: props.loadingConfig?.textColor || '#fff',
        fontSize: props.loadingConfig?.fontSize || 14,
        spinnerRadius: props.loadingConfig?.spinnerRadius,
        lineWidth: props.loadingConfig?.lineWidth
      };
      myChart.showLoading('default', loadingOpts);
    }

    // 初始化后检查高亮索引
    if (props.highlightIndex !== undefined && props.highlightIndex !== null) {
      applyHighlight(props.highlightIndex);
    }

    // 触发 ready 事件
    emit('ready');
  } catch (error) {
    chartError.value = error instanceof Error ? error.message : '未知错误';
    console.error('[BarChart] 初始化失败:', error);
    emit('error', error instanceof Error ? error : new Error('未知错误'));
  }
};

// 绑定图表事件
const bindChartEvents = () => {
  if (!myChart) return;

  myChart.on('click', (params: any) => {
    if (params.componentType === 'series') {
      emit('click', {
        name: params.name,
        value: params.value,
        index: params.dataIndex
      });
    }
  });

  myChart.on('dblclick', (params: any) => {
    if (params.componentType === 'series') {
      emit('dblclick', {
        name: params.name,
        value: params.value,
        index: params.dataIndex
      });
    }
  });

  myChart.on('mouseover', (params: any) => {
    if (params.componentType === 'series') {
      emit('mouseover', {
        name: params.name,
        value: params.value,
        index: params.dataIndex
      });
    }
  });

  myChart.on('mouseout', (params: any) => {
    if (params.componentType === 'series') {
      emit('mouseout', {
        name: params.name,
        value: params.value,
        index: params.dataIndex
      });
    }
  });

  myChart.on('dataZoom', (params: any) => {
    emit('dataZoom', {
      start: params.start || 0,
      end: params.end || 100
    });
  });
};

// 构建图表配置
const getOption = () => {
  // 兼容模式：如果传入了完整的 option，需要合并一些功能配置
  if (props.option) {
    const mergedOption = { ...props.option };

    // 合并 toolbox 配置
    if (props.showToolbox) {
      mergedOption.toolbox = {
        ...mergedOption.toolbox,
        feature: {
          ...(mergedOption.toolbox?.feature || {}),
          saveAsImage: props.toolboxFeatures?.includes('saveAsImage') ? {
            title: '保存为图片',
            pixelRatio: 2
          } : undefined,
          dataView: props.toolboxFeatures?.includes('dataView') ? {
            title: '数据视图',
            readOnly: true
          } : undefined,
          restore: props.toolboxFeatures?.includes('restore') ? {
            title: '还原'
          } : undefined
        },
        iconStyle: {
          ...(mergedOption.toolbox?.iconStyle || {}),
          borderColor: props.colors?.primary || '#00FCFF'
        }
      };
    }

    return mergedOption;
  }

  // 简单模式：使用 props 构建配置
  const themeColors = getThemeColors.value;

  const option: any = {
  // 标题配置
  title: props.title ? {
    text: props.title,
    subtext: props.subtitle,
    left: 'center',
    textStyle: {
      color: themeColors.textColor,
      fontSize: 18
    },
    subtextStyle: {
      color: themeColors.textColor
    }
  } : undefined,

  // 图例配置
  legend: props.showLegend ? {
    [props.legendPosition || 'top']: props.title ? 60 : 10,
    icon: props.legendConfig?.icon || 'rect', // 默认矩形
    itemWidth: props.legendConfig?.itemWidth || 8,
    itemHeight: props.legendConfig?.itemHeight || 8,
    itemGap: props.legendConfig?.itemGap || 10,
    borderWidth: 0,
    textStyle: {
      color: props.legendConfig?.textStyle?.color || themeColors.textColor,
      fontSize: props.legendConfig?.textStyle?.fontSize || 14,
      fontWeight: props.legendConfig?.textStyle?.fontWeight || 'normal',
      padding:props.legendConfig?.textStyle?.padding|| [0,0,-2,0],  //[上、右、下、左]配置居中
      rich: {
        a: {
          verticalAlign: 'middle',
        }
      },
      ...props.legendConfig?.textStyle
    }
  } : undefined,

  // 网格配置
  grid: (() => {
    // 默认配置
    const defaultGrid = {
      bottom: props.enableDataZoom ? "20%" : "14%",
      top: props.title ? "25%" : "20%",
      right: "5%",
      left: "5%",
    };

    // 如果用户提供了自定义grid配置，则合并配置
    if (props.gridConfig) {
      return {
        ...defaultGrid,
        ...props.gridConfig
      };
    }

    return defaultGrid;
  })(),

  // 动画配置
  animation: true,
  animationDuration: props.animationDuration,
  animationEasing: props.animationEasing,

  // Tooltip 配置
  tooltip: {
    trigger: "axis",
    axisPointer: (() => {
      const axisPointerType = props.tooltipConfig?.axisPointerType || "line";
      const baseConfig: any = {
        type: axisPointerType,
      };

      // 根据不同类型设置样式
      switch (axisPointerType) {
        case "line":
          baseConfig.lineStyle = {
            color: props.tooltipConfig?.axisPointerLineStyle?.color || props.tooltipConfig?.axisPointerColor || props.colors?.primary || "#00FCFF",
            type: props.tooltipConfig?.axisPointerLineStyle?.type || "solid",
            width: props.tooltipConfig?.axisPointerLineStyle?.width || 1,
            ...props.tooltipConfig?.axisPointerLineStyle
          };
          break;
        case "shadow":
          baseConfig.shadowStyle = {
            color: props.tooltipConfig?.axisPointerShadowStyle?.color || props.tooltipConfig?.axisPointerColor || "rgba(0, 252, 255, 0.2)",
            opacity: props.tooltipConfig?.axisPointerShadowStyle?.opacity || 0.3,
            ...props.tooltipConfig?.axisPointerShadowStyle
          };
          break;
        case "cross":
          baseConfig.lineStyle = {
            color: props.tooltipConfig?.axisPointerLineStyle?.color || props.tooltipConfig?.axisPointerColor || props.colors?.primary || "#00FCFF",
            type: props.tooltipConfig?.axisPointerLineStyle?.type || "solid",
            width: props.tooltipConfig?.axisPointerLineStyle?.width || 1,
            ...props.tooltipConfig?.axisPointerLineStyle
          };
          baseConfig.crossStyle = {
            color: props.tooltipConfig?.axisPointerLineStyle?.color || props.tooltipConfig?.axisPointerColor || props.colors?.primary || "#00FCFF",
            type: props.tooltipConfig?.axisPointerLineStyle?.type || "solid",
            width: props.tooltipConfig?.axisPointerLineStyle?.width || 1
          };
          break;
      }

      return baseConfig;
    })(),
    formatter: props.tooltipFormatter || ((params: any) => {
      // 多系列模式：显示所有系列的数据
      if (props.series && props.series.length > 0) {
        let result = `<div style="text-align: left; margin-bottom: 5px;">${params[0].name}</div>`;
        params.forEach((item: any) => {
          if (item.seriesName && !item.seriesName.includes('series')) {
            result += `<div style="display: flex; justify-content: space-between;">
              <span>${item.seriesName}</span>
              <span style="margin-left: 10px; color: #00FFFD; font-weight: 900">${formatValue.value(item.value)}</span>
            </div>`;
          }
        });
        return result;
      }
      // 单系列模式
      let paramsObj = params[1];
      const value = formatValue.value(paramsObj.data);
      return `<div>
                <div style="text-align: left;">${paramsObj.name}</div>
                <div style="display: flex; justify-content: space-between;">
                    <span>数值</span>
                    <span style="margin-left: 10px; color: #00FFFD; font-weight: 900">${value}</span>
                </div>
            </div>`;
    }),
    backgroundColor: "transparent",
    extraCssText: `
					background: linear-gradient(to top, rgba(20, 41, 99, 0.8), rgba(0, 81, 190, 0.8));
					padding: 10px;
					border-radius: 5px;
					box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
					border: 0;
			 	`,
    textStyle: {
      color: "#fff",
      fontSize: 12,
    },
  },

  // 工具栏配置
  toolbox: props.showToolbox ? {
    feature: {
      saveAsImage: props.toolboxFeatures?.includes('saveAsImage') ? {
        title: '保存为图片',
        pixelRatio: 2
      } : undefined,
      dataView: props.toolboxFeatures?.includes('dataView') ? {
        title: '数据视图',
        readOnly: true
      } : undefined,
      restore: props.toolboxFeatures?.includes('restore') ? {
        title: '还原'
      } : undefined
    },
    iconStyle: {
      borderColor: props.colors?.primary || '#00FCFF'
    }
  } : undefined,

  // 数据缩放配置
  dataZoom: props.enableDataZoom ? [
    {
      type: 'slider',
      start: props.dataZoomStart,
      end: props.dataZoomEnd,
      xAxisIndex: 0,
      backgroundColor: 'rgba(47, 69, 84, 0.3)',
      dataBackground: {
        lineStyle: { color: props.colors?.primary || '#00FCFF' },
        areaStyle: { color: `rgba(0, 252, 255, 0.3)` }
      },
      fillerColor: 'rgba(0, 252, 255, 0.2)',
      textStyle: {
        color: themeColors.textColor
      }
    },
    {
      type: 'inside',
      xAxisIndex: 0
    }
  ] : undefined,

  nameTextStyle: {
    color: "#7284AD",
    padding: [0, 30, 10, 0],
    fontSize: 14,
  },
  xAxis: {
    type: "category",
    nameGap: 5,
    data: [],
    axisTick: {
      show: false,
    },
    axisLine: {
      lineStyle: {
        color: themeColors.axisLineColor,
      },
    },
    axisLabel: {
      color: themeColors.textColor,
    },
  },
  yAxis: {
    name: props.yAxisName,
    nameGap: 12,
    type: "value",
    nameTextStyle:{
      padding: props.yAxisName && props.yAxisName.length >= 3 ? [0, 0, 0, 15] : [0, 0, 0, 0]
    },
    splitLine: {
      lineStyle: {
        color: themeColors.splitLineColor,
      },
    },
    axisLabel: {
      color: themeColors.textColor,
      formatter: (value: number) => formatValue.value(value)
    },
    axisLine: {
      show: true,
      lineStyle: {
        color: themeColors.axisLineColor,
      },
    },
  },
  series: (() => {
    

    // 多系列模式
    if (props.series && props.series.length > 0) {
      const seriesList: any[] = [];
      const seriesConfigs = props.series;

      // 计算所有系列的最大值，用于背景系列
      const allData = seriesConfigs.flatMap(s => s.data);
      const maxValue = allData.length > 0 ? Math.max(...allData) : 0;
      // 注意：背景系列的处理在后面的循环中统一处理，避免重复添加
      
      // 计算每个系列的偏移量（考虑柱体宽度和间距）
      const seriesCount = seriesConfigs.length;
      
      // 计算动态偏移量
      const calculateOffsets = () => {
        const offsets: number[] = [];
        
        if (seriesCount === 1) {
          offsets.push(0);
          return offsets;
        }
        
        // 计算每个系列的实际宽度
        const seriesWidths = seriesConfigs.map((seriesConfig) => {
          if (seriesConfig.barWidth && typeof seriesConfig.barWidth === 'number') {
            return seriesConfig.barWidth;
          }
          if (seriesConfig.barMaxWidth) {
            return Math.min(CHART_CONFIG.SIDE_WIDTH * 2, seriesConfig.barMaxWidth);
          }
          return CHART_CONFIG.SIDE_WIDTH * 2; // 默认宽度
        });
        
        // 计算间距
        const getGapValue = (gap: string | number | undefined, defaultValue: number): number => {
          if (gap === undefined) return defaultValue;
          if (typeof gap === 'number') return gap;
          if (typeof gap === 'string' && gap.endsWith('%')) {
            const percent = parseFloat(gap) / 100;
            return defaultValue * percent;
          }
          return parseFloat(gap.toString()) || defaultValue;
        };
        
        // 从第一个系列获取barGap配置，或使用默认值
        const firstSeriesBarGap = seriesConfigs[0]?.barGap;
        const barGap = getGapValue(firstSeriesBarGap, 4); // 系列间距
        
        // 计算总宽度
        const totalSeriesWidth = seriesWidths.reduce((sum, width) => sum + width, 0);
        const totalGapWidth = (seriesCount - 1) * barGap;
        const totalWidth = totalSeriesWidth + totalGapWidth;
        
        // 计算起始位置（居中对齐）
        let currentPosition = -totalWidth / 2;
        
        for (let i = 0; i < seriesCount; i++) {
          // 每个系列的中心位置
          const seriesWidth = seriesWidths[i] || CHART_CONFIG.SIDE_WIDTH * 2;
          const seriesCenter = currentPosition + seriesWidth / 2;
          offsets.push(seriesCenter);
          
          // 移动到下一个系列的起始位置
          currentPosition += seriesWidth + barGap;
        }
        
        return offsets;
      };
      
      const calculatedOffsets = calculateOffsets();
      const offsets = seriesConfigs.map((seriesConfig, index) =>
        seriesConfig.offset !== undefined
          ? seriesConfig.offset
          : calculatedOffsets[index]
      );
      
      // 背景系列（若开启，则为每个系列生成一条背景）
      if (props.showBackground) {
        seriesConfigs.forEach((seriesConfig, index) => {
          const offset = offsets[index];
          const bgDataBySeries = seriesConfig.data.map(() => maxValue);

          seriesList.push({
            data: bgDataBySeries,
            type: "custom",
            sampling: props.sampling,
            renderItem: (params: any, api: any) =>
              renderItem(params, api, bgDataBySeries, {
                offset,
                showValue: false,
                isBg: true,
                topColor: "rgba(29, 67, 243, 0.4)",
                barWidth: seriesConfig.barWidth,
                barMaxWidth: seriesConfig.barMaxWidth,
                barMinHeight: seriesConfig.barMinHeight,
              }),
            silent: true,
            z: 0,
          });
        });
      }

      // 为每个系列创建配置
      seriesConfigs.forEach((seriesConfig, index) => {
        const offset = offsets[index];

        const { color1, color2, topColor } = getSeriesColors(seriesConfig, index);

        seriesList.push({
          name: seriesConfig.name,
          data: seriesConfig.data,
          type: "custom",
          sampling: props.sampling,
          // 为图例设置颜色，使用渐变的中间色调，更好地代表柱体颜色
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: color2 },
              { offset: 1, color: color1 }
            ])
          },
          renderItem: (params: any, api: any) =>
            renderItem(params, api, seriesConfig.data, {
              offset,
              color1,
              color2,
              topColor,
              showValue: false,
              barWidth: seriesConfig.barWidth,
              barMaxWidth: seriesConfig.barMaxWidth,
              barMinHeight: seriesConfig.barMinHeight,
            }),
          z: 1,
        });
      });
      
      return seriesList;
    }
    
    // 单系列模式（原有逻辑）
    return [
      {
        data: bgArr.value,
        type: "custom",
        sampling: props.sampling,
        renderItem: (params: any, api: any) =>
          renderItem(params, api, props.xAxis || [], {
            offset: 0,
            showValue: false,
            isBg: true,
            topColor: "rgba(29, 67, 243, 0.4)",
          }),
      },
      {
        data: seriesData.value,
        type: "custom",
        sampling: props.sampling,
        // 为图例设置渐变颜色，与柱体颜色对应
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: props.colors?.secondary || "#008AFF" },
            { offset: 1, color: props.colors?.primary || "#00FCFF" }
          ])
        },
        renderItem: (params: any, api: any) =>
          renderItem(params, api, seriesData.value, {
            offset: 0,
            color1: props.colors?.primary || "#00FCFF",
            color2: props.colors?.secondary || "#008AFF",
            showValue: false,
          }),
      },
    ];
  })(),
  };

  option.xAxis.data = props.xAxis || [];

  return option;
};

const renderItem = (
  params: any,
  api: any,
  data: any[],
  otherParams?: RenderItem
) => {
  const basicsCoord = api.coord([api.value(0), api.value(1)]);
  let topBasicsYAxis = basicsCoord[1];
  const basicsXAxis = basicsCoord[0] + (otherParams?.offset || 0);
  const bottomYAxis = api.coord([api.value(0), 0])[1];

  // 检查当前数据项是否应该高亮
  const isHighlighted = currentHighlightIndexes.value.has(params.dataIndex);

  let value = data[params.dataIndex]; // 当前的值
  
  // 动态计算柱体宽度
  let sideWidth: number = CHART_CONFIG.SIDE_WIDTH;
  if (otherParams?.barWidth && typeof otherParams.barWidth === 'number') {
    sideWidth = otherParams.barWidth / 2;
  } else if (otherParams?.barMaxWidth) {
    const maxSideWidth = otherParams.barMaxWidth / 2;
    sideWidth = Math.min(sideWidth, maxSideWidth);
  }
  
  // 处理最小高度
  if (otherParams?.barMinHeight && value > 0) {
    const currentHeight = bottomYAxis - topBasicsYAxis;
    if (currentHeight < otherParams.barMinHeight) {
      topBasicsYAxis = bottomYAxis - otherParams.barMinHeight;
    }
  }
  
  const { OBLIQUE_HEIGHT, BOTTOM_ANGLE_HEIGHT } = CHART_CONFIG;

  // 左边
  const left_p1 = [basicsXAxis - sideWidth, topBasicsYAxis - OBLIQUE_HEIGHT];
  const left_p2 = [basicsXAxis - sideWidth, bottomYAxis - BOTTOM_ANGLE_HEIGHT];
  const left_p3 = [basicsXAxis, bottomYAxis];
  const left_p4 = [basicsXAxis, topBasicsYAxis];

  // 右边
  const right_p1 = [basicsXAxis, topBasicsYAxis];
  const right_p2 = [basicsXAxis, bottomYAxis];
  const right_p3 = [basicsXAxis + sideWidth, bottomYAxis - BOTTOM_ANGLE_HEIGHT];
  const right_p4 = [basicsXAxis + sideWidth, topBasicsYAxis - OBLIQUE_HEIGHT];

  // 右边上层
  const right_p1_top = [basicsXAxis, topBasicsYAxis];
  const right_p2_top = [basicsXAxis, bottomYAxis];
  const right_p3_top = [basicsXAxis + sideWidth, bottomYAxis - BOTTOM_ANGLE_HEIGHT];
  const right_p4_top = [
    basicsXAxis + sideWidth,
    topBasicsYAxis - OBLIQUE_HEIGHT,
  ];

  // 顶部
  const top_p1 = [basicsXAxis, topBasicsYAxis];
  const top_p2 = [basicsXAxis + sideWidth, topBasicsYAxis - OBLIQUE_HEIGHT];
  const top_p3 = [basicsXAxis, topBasicsYAxis - OBLIQUE_HEIGHT * 2];
  const top_p4 = [basicsXAxis - sideWidth, topBasicsYAxis - OBLIQUE_HEIGHT];

  let startColor = otherParams?.color1 || "#863FFF";
  let endColor = otherParams?.color2 || "#00FCFF";

  // 如果是高亮状态，使用配置的高亮颜色
  if (isHighlighted && !otherParams?.isBg) {
    startColor = props.highlightColors?.secondaryColor || "#FFD700";
    endColor = props.highlightColors?.primaryColor || "#FFA500";
  }

  let fillColor = otherParams?.isBg
    ? "rgba(29,67,243, 0.25)"
    : new echarts.graphic.LinearGradient(0, 0, 0, 1, [
        { offset: 0, color: endColor },
        { offset: 1, color: startColor },
      ]);
  let obj: any = {
    type: "group",
    children: [
      // 左边
      {
        type: "path",
        shape: {
          pathData: `
					M${left_p1[0]}, ${left_p1[1]} 
					L${left_p2[0]}, ${left_p2[1]}
					L${left_p3[0]}, ${left_p3[1]} 
					L${left_p4[0]}, ${left_p4[1]} Z`,
        },
        style: {
          fill: fillColor,
        },
      },
      // 右边
      {
        type: "path",
        shape: {
          pathData: `
					M${right_p1[0]}, ${right_p1[1]} 
					L${right_p2[0]}, ${right_p2[1]}
					L${right_p3[0]}, ${right_p3[1]} 
					L${right_p4[0]}, ${right_p4[1]} Z`,
        },
        style: {
          fill: fillColor,
        },
      },
      // 右边上层
      {
        type: "path",
        shape: {
          pathData: `
					M${right_p1_top[0]}, ${right_p1_top[1]} 
					L${right_p2_top[0]}, ${right_p2_top[1]}
					L${right_p3_top[0]}, ${right_p3_top[1]} 
					L${right_p4_top[0]}, ${right_p4_top[1]} Z`,
        },
        style: {
          fill: "rgba(0, 108, 255, 0.2)",
        },
      },
    ],
  };
  if (value) {
    let topPath = {
      type: "path",
      shape: {
        pathData: `
				M${top_p1[0]}, ${top_p1[1]} 
				L${top_p2[0]}, ${top_p2[1]}
				L${top_p3[0]}, ${top_p3[1]} 
				L${top_p4[0]}, ${top_p4[1]} Z`,
      },
      style: {
        fill: otherParams?.topColor || fillColor,
      },
    };
    let valueStr = value + "";
    let valueLength = valueStr.length;
    let width = valueLength * 6;

    let textOp = {
      type: "text",
      style: {
        text: value,
        fill: "rgba(0, 252, 255, 1)",
      },
      x: basicsXAxis - width / 2,
      y: topBasicsYAxis - 24,
      textConfig: {
        position: ["left"],
      },
    };

    obj.children.push(topPath);
    otherParams?.showValue && obj.children.push(textOp);
  }
  return {
    type: "group",
    children: [obj],
  };
};

// 监听 props 变化，自动更新图表
watchEffect(() => {
  const currentEmpty = isEmpty.value;
  
  if (myChart && !currentEmpty) {
    // option 模式：直接使用传入的 option
    if (props.option) {
      myChart.setOption(props.option, true);
    } else {
      // 多系列模式或简单模式：完整更新图表配置
      myChart.setOption(getOption(), false);
    }
  }
});

// 添加对 series 的深度监听
watch(() => props.series, (newSeries) => {
  if (myChart && !isEmpty.value && newSeries) {
    myChart.setOption(getOption(), false);
  }
}, { deep: true });

// 监听 loading 状态
watchEffect(() => {
  if (myChart) {
    if (props.loading) {
      const loadingOpts = {
        text: props.loadingConfig?.text || '加载中...',
        color: props.loadingConfig?.color || props.colors?.primary || '#00FCFF',
        maskColor: props.loadingConfig?.maskColor || 'rgba(0, 0, 0, 0.4)',
        textColor: props.loadingConfig?.textColor || '#fff',
        fontSize: props.loadingConfig?.fontSize || 14,
        spinnerRadius: props.loadingConfig?.spinnerRadius,
        lineWidth: props.loadingConfig?.lineWidth
      };
      myChart.showLoading('default', loadingOpts);
    } else {
      myChart.hideLoading();
    }
  }
});

// 监听高亮索引变化
watch(() => props.highlightIndex, (indexes) => {
  applyHighlight(indexes);
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

// 导出为图片
const exportAsImage = (type: 'png' | 'jpeg' = 'png') => {
  if (!myChart) return;
  const url = myChart.getDataURL({
    type,
    pixelRatio: 2,
    backgroundColor: '#fff'
  });

  const link = document.createElement('a');
  link.href = url;
  link.download = `chart.${type}`;
  link.click();
};

// 导出数据
const exportAsData = () => {
  return {
    xAxis: props.xAxis,
    data: props.data
  };
};

defineExpose({
  resize,
  setOption: setChartOption,
  getInstance,
  refresh,
  clear,
  dispatchAction,
  exportAsImage,
  exportAsData,
});
</script>

<style scoped>
@import '@hujie/theme-chalk/src/bar-chart.scss';
</style>



