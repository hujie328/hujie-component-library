// 地图配置常量
export interface MapConfig {
	ZOOM?: number; // 默认缩放级别
	CENTER?: [string, string]; // 中心点
}

// 主题配置
export interface ThemeConfig {
	backgroundColor?: string;
	textColor?: string;
	axisLineColor?: string;
	splitLineColor?: string;
}

// 颜色配置
export interface ColorConfig {
	areaColor?: string | object; // 区域颜色
	borderColor?: string; // 边框颜色
	borderWidth?: number; // 边框宽度
	shadowColor?: string; // 阴影颜色
	shadowBlur?: number; // 阴影模糊度
	hoverAreaColor?: string | object; // 悬浮区域颜色
	hoverBorderWidth?: number; // 悬浮边框宽度
}

// 加载配置
export interface LoadingConfig {
	text?: string;
	color?: string;
	maskColor?: string;
	textColor?: string;
	fontSize?: number;
	spinnerRadius?: number;
	lineWidth?: number;
}

// 高亮配置
export interface HighlightConfig {
	primaryColor?: string;
	secondaryColor?: string;
}

// 地图数据点
export interface MapDataPoint {
	name: string; // 名称
	value: [number, number]; // 经纬度 [经度, 纬度]
	id?: string | number; // 唯一标识
	[key: string]: any; // 其他自定义属性
}

// 图例配置
export interface LegendItem {
	color?: string;
	label: string;
	icon?: string; // 图标 URL
	flag?: string; // 标记图片 URL
}

// 标注配置（散点图配置）
export interface ScatterConfig {
	symbol?: string | ((value: any, params: any) => string); // 标记样式
	symbolSize?: number | [number, number]; // 标记大小
	showLabel?: boolean; // 是否显示标签
	labelFormatter?: (params: any) => string; // 标签格式化
	labelColor?: string; // 标签颜色
	labelFontSize?: number; // 标签字体大小
	itemColor?: string; // 散点颜色
	emphasisColor?: string; // 强调颜色
}

// 地图点击数据
export interface MapClickData {
	componentType: string; // 组件类型 'geo' | 'series'
	name?: string; // 区域名称或数据点名称
	value?: any; // 数据值
	data?: any; // 完整数据对象
	regionName?: string; // 地图区域名称
}

// GeoJSON 区域属性
export interface MapRegionProperties {
	name?: string; // 区域名称
	adcode?: string | number; // 行政区划代码
	level?: string; // 行政级别
	[key: string]: any; // GeoJSON 中的其他属性
}

// 下钻栈条目，用于逐级返回
export interface DrillStackItem {
	mapName: string;
	regionName: string;
	adcode?: string;
	geoJson: any;
}

// 叶子节点点击数据
export interface MapLeafData {
	region: MapRegionProperties;
	reason: 'missing-adcode' | 'no-loader' | 'no-data';
}

// 下钻数据加载器，组件只关心拿到下一层 GeoJSON，不绑定具体数据源
export type DrillDataLoader = (
	region: MapRegionProperties,
	context: {
		currentMapName: string;
		currentMapData: any;
		stack: DrillStackItem[];
	}
) => any | null | Promise<any | null>;

// 下钻配置
export interface DrillDownConfig {
	enable?: boolean; // 是否启用下钻
	showBackButton?: boolean; // 是否显示返回按钮
	backButtonPosition?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'; // 返回按钮位置
	backButtonColor?: string; // 返回按钮颜色
	onDrillDown?: (regionName: string) => void; // 下钻回调
	onBack?: () => void; // 返回回调
}

// 地图线条配置
export interface LinesConfig {
	show?: boolean; // 是否显示线条
	color?: string; // 线条颜色
	width?: number; // 线条宽度
	opacity?: number; // 线条透明度
	curveness?: number; // 线条弯曲度
	effect?: {
		show?: boolean; // 是否显示动画效果
		period?: number; // 动画周期
		trailLength?: number; // 尾迹长度
		symbol?: string; // 动画标记
		symbolSize?: number; // 动画标记大小
		color?: string; // 动画颜色
	};
}
