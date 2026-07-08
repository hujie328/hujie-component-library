<template>
	<div class="hj-pie-chart" ref="chartWrapperRef">
		<div class="chart" ref="piechartRef"></div>
	</div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted, watch, computed } from 'vue';
import Highcharts from 'highcharts';
import Highcharts3D from 'highcharts/highcharts-3d';
import HighchartsAccessibility from 'highcharts/modules/accessibility';
import { observeResize, type ResizeCleanup } from '@hujie/utils'
import type { SeriesProp, PieConfig, BaseImageConfig, DataLabelsConfig, LegendConfig } from './type'
import {
  DEFAULT_PIE_CONFIG,
  DEFAULT_BASE_IMAGE_CONFIG,
  DEFAULT_DATA_LABELS_CONFIG,
  DEFAULT_LEGEND_CONFIG,
  colorGroups
} from './config'

let highchartsModulesReady = false;

const ensureHighchartsModules = () => {
  if (highchartsModulesReady) return;

  // VitePress 构建会进行 SSR，Highcharts 3D 模块需要延迟到客户端初始化。
  if (typeof window === 'undefined') return;

  if (typeof Highcharts3D === 'function') {
    Highcharts3D(Highcharts);
  }

  if (typeof HighchartsAccessibility === 'function') {
    HighchartsAccessibility(Highcharts);
  }

  highchartsModulesReady = true;
};

// 禁用自动继承非props属性，避免控制台警告
defineOptions({
  name: 'HjPieChart',
  inheritAttrs: false
});

// 定义事件
const emit = defineEmits(['pieClick'])

// 定义模板引用
const piechartRef = ref<HTMLDivElement | null>(null)
const chartWrapperRef = ref<HTMLDivElement | null>(null)

// 定义组件接收的属性
const props = defineProps({
    series: {
        type: Object as () => SeriesProp,
        default: () => ({ name: '', data: [] }) // 默认空数据
    },
    pie: {
        type: Object as () => PieConfig,
        default: () => ({}) // 默认使用默认配置
    },
    colorGroup: {
        type: String as () => 'A' | 'B' | 'C',
        default: 'A',
        validator: (value: string) => ['A', 'B', 'C'].includes(value) // 颜色组验证
    },
    legend: {
        type: Object as () => LegendConfig,
        default: () => ({})
    },
    showPercentInLegend: {
        type: Boolean,
        default: false // 默认图例不显示百分比
    },
    baseImage: {
        type: Object as () => BaseImageConfig,
        default: () => ({}) // 默认使用默认底图配置
    },
    dataLabels: {
        type: Object as () => DataLabelsConfig,
        default: () => ({}) // 默认使用默认标签配置
    }
});

// 合并饼图配置与默认值
const mergedPieConfig = computed(() => {
  return {
    ...DEFAULT_PIE_CONFIG,
    ...props.pie
  };
});

// 合并底图配置与默认值
const mergedBaseImageConfig = computed(() => {
  return {
    ...DEFAULT_BASE_IMAGE_CONFIG,
    ...props.baseImage
  };
});

// 合并dataLabels配置与默认值
const mergedDataLabelsConfig = computed(() => {
  return {
    ...DEFAULT_DATA_LABELS_CONFIG,
    ...props.dataLabels
  };
});

// 合并legend配置与默认值
const mergedLegendConfig = computed(() => {
  return {
    ...DEFAULT_LEGEND_CONFIG,
    ...props.legend
  };
});

// 根据传入的colorGroup属性选择使用指定的颜色组
const getColorGroup = (): string[] => {
    return colorGroups[props.colorGroup];
}

// 定义全局变量
let myChart: Highcharts.Chart | null = null;         // Highcharts 实例
let backgroundImageElement: any = null;             // 底图元素
let resizeCleanup: ResizeCleanup | null = null;     // ResizeObserver 清理函数

// 监听图表配置变化，统一走 update，避免不同配置分散更新导致状态不同步。
watch(
  () => [
    props.series,
    props.pie,
    props.colorGroup,
    props.legend,
    props.showPercentInLegend,
    props.baseImage,
    props.dataLabels
  ],
  () => {
    update();
  },
  { deep: true }
);

// 提取图表事件处理逻辑
const getChartEvents = () => {
  return {
    load: function() {
      // 图表加载完成后更新背景图片位置
      if (mergedBaseImageConfig.value.show) {
        setTimeout(updateBackgroundImagePosition, 0);
      }
    },
    redraw: function() {
      // 图表重绘时更新背景图片位置
      if (mergedBaseImageConfig.value.show) {
        setTimeout(updateBackgroundImagePosition, 0);
      }
    }
  };
};

const destroyBackgroundImage = () => {
  if (backgroundImageElement) {
    backgroundImageElement.destroy();
    backgroundImageElement = null;
  }
};

// 更新背景图片位置
const updateBackgroundImagePosition = () => {
  if (!myChart) return;

  // 底图可通过 props 动态开关，关闭时要同步销毁 renderer 资源。
  const showBaseImage = mergedBaseImageConfig.value.show;
  if (!showBaseImage) {
    destroyBackgroundImage();
    return;
  }
  
  // 获取第一个series
  const series = myChart.series[0];
  if (!series) return;
  
  // 获取饼图中心点
  const center = (series as any).center;
  if (!center) return;
  
  // 使用合并后的配置值
  const baseImageUrl = mergedBaseImageConfig.value.url || '';
  const baseImageWidth = mergedBaseImageConfig.value.width || 0;
  const baseImageHeight = mergedBaseImageConfig.value.height || 0;
  const baseImageOffsetX = mergedBaseImageConfig.value.offsetX || 0;
  const baseImageOffsetY = mergedBaseImageConfig.value.offsetY || 0;
  
  // 计算背景图片的左上角坐标，使其相对于饼图中心居中
  const x = center[0] - baseImageWidth / 2 + baseImageOffsetX;
  const y = center[1] - baseImageHeight / 2 + baseImageOffsetY;
  
  // 如果背景图片元素已经存在，则更新其位置
  if (backgroundImageElement) {
    // 使用Highcharts的animate方法实现平滑过渡
    backgroundImageElement.animate(
      {
        x: x,
        y: y
      },
      {
        duration: 300,
        easing: 'swing'
      }
    );
  } else {
    // 创建背景图片元素
    backgroundImageElement = myChart.renderer.image(baseImageUrl, x, y, baseImageWidth, baseImageHeight)
      .attr({
        zIndex: 0 // 确保背景图片在最底层
      })
      .add();
      
    // 确保背景图片在最底层，通过将其添加到renderer的底层组
    if (myChart.renderer && myChart.renderer.box) {
      myChart.renderer.box.insertBefore(
        backgroundImageElement.element, 
        myChart.renderer.box.firstChild
      );
    }
  }
};

// 初始化图表
const init = () => {
    try {
        ensureHighchartsModules();

        let dom: HTMLElement | null = piechartRef.value;
        if (!dom) return;
        
        // 如果图表已存在，先销毁，避免 refresh 或配置重建时残留 SVG 节点。
        if (myChart) {
            destroyBackgroundImage();
            myChart.destroy();
        }
        
        // 获取数据长度
        const dataLength = props.series?.data?.length || 0;
        const colors = dataLength > 0 ? getColorGroup() : colorGroups.A;
        
        // 为每个数据点分配颜色
        const seriesDataWithColors = props.series?.data?.map((item, index) => {
            return {
                ...item,
                color: colors[index % colors.length]
            };
        }) || [];
        
        // 创建Highcharts图表实例
        myChart = Highcharts.chart(dom, {
            chart: {
                type: 'pie',                   // 图表类型：饼图
                options3d: {
                    enabled: true,             // 启用3D效果
                    alpha: 65,                 // 3D倾斜角度
                },
                backgroundColor: 'transparent',// 背景透明
                events: getChartEvents()       // 图表事件
            },
            credits: {
                enabled: false                 // 禁用版权信息
            },
            title: {
                text: '',
                enabled: false,                // 禁用标题
            },
            legend: {
                ...mergedLegendConfig.value,
                labelFormatter: function(this: any) {  // 图例标签格式化
                    const percent = parseFloat(this.percentage.toFixed(2));
                    const legendFontSize = mergedLegendConfig.value.itemStyle?.fontSize || '14px';
                    return `${this.name}${props.showPercentInLegend ? `<span style="font-size: ${legendFontSize}; font-family: Microsoft YaHei; color: #00fcff;"> ${percent}%</span>` : ''}`;
                },
            },
            plotOptions: {
                pie: {
                    innerSize: mergedPieConfig.value.innerSize,  // 内环大小
                    depth: mergedPieConfig.value.depth,          // 3D深度
                    center: mergedPieConfig.value.position,      // 饼图中心位置
                    dataLabels: mergedDataLabelsConfig.value,    // 数据标签配置
                    size: mergedPieConfig.value.size,            // 饼图大小
                    colors: colors,                              // 颜色组
                    point: {
                      events: {
                        click: function() {
                          emit('pieClick', this);
                        }
                      }
                    }
                },
            },
            tooltip: {
                backgroundColor: {
                    linearGradient: { x1: 0, x2: 0, y1: 0, y2: 60 },
                    stops: [
                        [0, 'rgba(0, 81, 190, 0.8)'],   // 渐变开始颜色
                        [1, 'rgba(20, 41, 99, 0.8)'],   // 渐变结束颜色
                    ]
                } as any,
                style: {
                    color: '#fff',     // 提示框文字颜色
                    fontSize: '14px'   // 提示框文字大小
                },
                formatter: function() {
                    // 提示框内容格式化，显示名称和数值
                    return `${this.key}&nbsp;&nbsp;&nbsp;&nbsp;${this.y}`;
                },
                borderRadius: 8        // 提示框圆角
            },
            series: [
                {
                    ...props.series,
                    data: seriesDataWithColors,  // 带颜色的数据
                    colors: colors,              // 颜色组
                    showInLegend: mergedLegendConfig.value.enabled // 是否在图例中显示
                } as Highcharts.SeriesPieOptions
            ],
        } as Highcharts.Options);
    } catch (error) {
        console.error('[HjPieChart] 初始化失败:', error);
    }
};

// 处理窗口大小变化
const handleResize = () => {
	let dom: HTMLElement | null = piechartRef.value
	if (!dom) return;
	let width = dom.clientWidth
	let height = dom.clientHeight
	if (myChart) {
		myChart.setSize(width, height);
	}
}

// 监听容器大小变化
const resize = () => {
	let dom: HTMLElement | null = chartWrapperRef.value
	if (!dom) return;

	resizeCleanup?.();
	resizeCleanup = observeResize(dom, () => {
		handleResize()
	}, { delay: 1000 })
}

// 更新图表数据
const update = () => {
    try {
        if (myChart) {
            // 获取数据长度
            const dataLength = props.series?.data?.length || 0;
            const colors = dataLength > 0 ? getColorGroup() : colorGroups.A;
            
            // 为每个数据点分配颜色
            const seriesDataWithColors = props.series?.data?.map((item, index) => {
                return {
                    ...item,
                    color: colors[index % colors.length]
                };
            }) || [];
            
            // 更新图表配置
            myChart.update({
                chart: {
                    events: getChartEvents()
                },
                legend: {
                    ...mergedLegendConfig.value,
                    labelFormatter: function(this: any) {
                        const percent = parseFloat(this.percentage.toFixed(2));
                        const legendFontSize = mergedLegendConfig.value.itemStyle?.fontSize || '14px';
                        return `${this.name}${props.showPercentInLegend ? `<span style="font-size: ${legendFontSize}; font-family: Microsoft YaHei; color: #00fcff;"> ${percent}%</span>` : ''}`;
                    },
                },
                plotOptions: {
                  pie: {
                    colors: colors,
                    point: {
                      events: {
                        click: function() {
                          emit('pieClick', this);
                        }
                      }
                    }
                  }
                }
            } as Highcharts.Options, false);
            
            // 更新series数据
            if (myChart.series[0]) {
              myChart.series[0].setData(seriesDataWithColors, true);
            } else {
              myChart.addSeries({
                ...props.series,
                data: seriesDataWithColors,
                colors: colors,
                showInLegend: mergedLegendConfig.value.enabled
              } as Highcharts.SeriesPieOptions, true);
            }
            
            // 更新或销毁底图，保证 baseImage 配置动态变化时 renderer 状态一致。
            if (mergedBaseImageConfig.value.show) {
              setTimeout(updateBackgroundImagePosition, 0);
            } else {
              destroyBackgroundImage();
            }
        }
    } catch (error) {
        console.error('[HjPieChart] 更新失败:', error)
    }
}

// 组件挂载后初始化图表和监听器
onMounted(() => {
  init();
  resize();
});

// 在组件销毁时清理资源
onUnmounted(() => {
  resizeCleanup?.();
  resizeCleanup = null;
  destroyBackgroundImage();
  if (myChart) {
    myChart.destroy();
    myChart = null;
  }
});
</script>

<style lang="scss" scoped>
.hj-pie-chart {
  width: 100%;
  height: 100%;
  
  .chart {
    width: 100%;
    height: 100%;
  }
}
</style>


