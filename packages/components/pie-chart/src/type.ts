import type { PointOptionsObject } from 'highcharts';

// 定义series数据的类型
export interface SeriesDataItem extends PointOptionsObject {
  y: number;
  name: string;
}

export interface SeriesProp {
  name: string;
  data: SeriesDataItem[];
}

// 定义饼图配置接口
export interface PieConfig {
  size?: number;                 // 饼图大小
  innerSize?: number;            // 内环大小（用于环形图）
  depth?: number;                // 3D深度
  position?: [string | number | null, string | number | null]; // 饼图中心位置
}

// 定义底图配置接口
export interface BaseImageConfig {
  show?: boolean;     // 是否显示底图
  url?: string;       // 底图URL
  width?: number;     // 底图宽度
  height?: number;    // 底图高度
  offsetX?: number;   // X轴偏移量
  offsetY?: number;   // Y轴偏移量
}

// 定义dataLabels配置接口
export interface DataLabelsConfig {
  enabled?: boolean;         // 是否启用数据标签
  distance?: number;         // 标签距离饼图的距离
  connectorPadding?: number; // 连接线内边距
  style?: {                  // 标签样式
    color?: string;
    fontSize?: string;
    fontWeight?: string | number;
    fontFamily?: string;
  };
  formatter?: () => string;  // 标签格式化函数
  [key: string]: any;        // 允许其他自定义属性
}

// 定义legend配置接口
export interface LegendConfig {
  enabled?: boolean;
  layout?: 'horizontal' | 'vertical';
  align?: 'left' | 'center' | 'right';
  verticalAlign?: 'top' | 'middle' | 'bottom';
  itemStyle?: {
    color?: string;
    fontSize?: string;
    fontWeight?: string | number;
    fontFamily?: string;
  };
  itemHoverStyle?: {
    color?: string;
  };
  symbolHeight?: number;
  symbolWidth?: number;
  symbolRadius?: number;
  navigation?: {
    style?: {
      color?: string;
    };
  };
  [key: string]: any;        // 允许其他自定义属性
}