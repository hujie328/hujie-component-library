import type { PieConfig, BaseImageConfig, DataLabelsConfig, LegendConfig } from './type';
import pieBg from './assets/images/pie_base_bg.png';

// 定义默认的饼图配置
export const DEFAULT_PIE_CONFIG: PieConfig = {
  size: 140,           // 饼图直径
  innerSize: 80,       // 内环直径（形成环形图）
  depth: 60,           // 3D效果深度
  position: ['50%', '50%'] // 饼图中心位置（居中）
};

// 定义默认的底图配置
export const DEFAULT_BASE_IMAGE_CONFIG: BaseImageConfig = {
  show: false,         // 默认不显示底图
  url: pieBg,             // 默认底图资源
  width: 192,          // 底图宽度
  height: 118,         // 底图高度
  offsetX: 10,         // X轴偏移量
  offsetY: 66          // Y轴偏移量
};

// 定义默认的dataLabels配置
export const DEFAULT_DATA_LABELS_CONFIG: DataLabelsConfig = {
  enabled: true,       // 启用数据标签
  distance: 1,         // 标签距离饼图边缘的距离
  connectorPadding: 5, // 连接线内边距
  style: {
    color: '#fff',     // 字体颜色
    fontSize: '16px',  // 字体大小
    fontWeight: 'bold',// 字体粗细
    fontFamily: 'Microsoft YaHei' // 字体族
  },
  formatter: function () {
    // 格式化标签显示内容，颜色与数据点一致，显示数值
    // @ts-ignore
    return `<span style="color: ${this.color};">${this.y}</span>`;
  }
};

// 定义默认的legend配置
export const DEFAULT_LEGEND_CONFIG: LegendConfig = {
  enabled: true,
  layout: "vertical",
  align: "right",
  verticalAlign: "middle",
  itemStyle: {
    color: '#fff',
    fontSize: '14px',
    fontWeight: 400,
    fontFamily: 'Microsoft YaHei'
  },
  itemHoverStyle: {
    color: '#fff',
  },
  symbolHeight: 8,
  symbolWidth: 8,
  symbolRadius: 0,
  navigation: {
    style: {
      color: '#888',
    }
  }
};

// 颜色映射表（10种预定义颜色）
export const colorMap: Record<number, string> = {
    1: '#feef00',
    2: '#ffd100',
    3: '#ff9600',
    4: '#ff4c4b',
    5: '#3dffbc',
    6: '#36fb4c',
    7: '#00deff',
    8: '#00b3fe',
    9: '#236bff',
    10: '#a656ff',
}

// 颜色组定义（三种不同的颜色排列组合）
export const colorGroups: Record<'A' | 'B' | 'C', string[]> = {
    A: [colorMap[2]!, colorMap[8]!, colorMap[7]!, colorMap[5]!, colorMap[4]!, colorMap[6]!, colorMap[3]!, colorMap[1]!, colorMap[10]!, colorMap[9]!], // A组: 2,8,7,5,4,6,3,1,10,9
    B: [colorMap[8]!, colorMap[2]!, colorMap[4]!, colorMap[5]!, colorMap[7]!, colorMap[6]!, colorMap[3]!, colorMap[1]!, colorMap[10]!, colorMap[9]!], // B组: 8,2,4,5,7,6,3,1,10,9
    C: [colorMap[2]!, colorMap[4]!, colorMap[5]!, colorMap[8]!, colorMap[7]!, colorMap[6]!, colorMap[3]!, colorMap[1]!, colorMap[10]!, colorMap[9]!]  // C组: 2,4,5,8,7,6,3,1,10,9
}