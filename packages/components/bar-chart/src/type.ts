export type RenderItem = {
	offset?: number; // 偏移距离
	color1?: string; // 渐变颜色1
	color2?: string; // 渐变颜色2
	showValue?: boolean; // 是否在顶部显示数字
	topColor?: string; // 顶部颜色
	isBg?: boolean; // 是否是背景
	barWidth?: number | 'auto'; // 柱条宽度
	barMaxWidth?: number; // 柱条的最大宽度
	barMinHeight?: number; // 柱条的最小高度
};

// 主题配置
export interface ThemeConfig {
	backgroundColor?: string;
	textColor?: string;
	axisLineColor?: string;
	splitLineColor?: string;
}

export interface ColorConfig {
	primary?: string;
	secondary?: string;
}

export interface LoadingConfig {
	text?: string;
	color?: string;
	maskColor?: string;
	textColor?: string;
	fontSize?: number;
	spinnerRadius?: number;
	lineWidth?: number;
}

export interface HighlightConfig {
	primaryColor?: string;
	secondaryColor?: string;
}

// 图例配置
export interface LegendConfig {
	icon?: 'circle' | 'rect' | 'roundRect' | 'triangle' | 'diamond' | 'pin' | 'arrow' | 'none' | string; // 图例图标类型，支持 ECharts 内置类型或自定义 SVG path
	itemWidth?: number; // 图例标记的图形宽度
	itemHeight?: number; // 图例标记的图形高度
	itemGap?: number; // 图例每项之间的间隔
	align?: 'auto' | 'left' | 'right'; // 图例标记和文本的水平对齐
	orient?: 'horizontal' | 'vertical'; // 图例的布局朝向
	padding?: number[]; // 图例内边距 [上, 右, 下, 左]
	textStyle?: {
		color?: string;
		fontSize?: number;
		fontWeight?: string | number;
		lineHeight?: number; // 行高，用于垂直对齐
		padding?: number[]; // 文字内边距 [上, 右, 下, 左]
	}; // 图例文字样式
}

// Grid网格配置
export interface GridConfig {
	top?: string | number; // 网格组件离容器上侧的距离
	bottom?: string | number; // 网格组件离容器下侧的距离
	left?: string | number; // 网格组件离容器左侧的距离
	right?: string | number; // 网格组件离容器右侧的距离
	width?: string | number; // 网格组件的宽度
	height?: string | number; // 网格组件的高度
	containLabel?: boolean; // 网格区域是否包含坐标轴的刻度标签
	backgroundColor?: string; // 网格的背景颜色
	borderColor?: string; // 网格的边框颜色
	borderWidth?: number; // 网格的边框线宽
	shadowBlur?: number; // 阴影的模糊大小
	shadowColor?: string; // 阴影颜色
	shadowOffsetX?: number; // 阴影水平方向上的偏移距离
	shadowOffsetY?: number; // 阴影垂直方向上的偏移距离
}

// Tooltip配置
export interface TooltipConfig {
	axisPointerType?: 'line' | 'shadow' | 'cross'; // 坐标轴指示器类型
	axisPointerColor?: string; // 坐标轴指示器颜色
	axisPointerLineStyle?: {
		color?: string;
		type?: 'solid' | 'dashed' | 'dotted';
		width?: number;
	}; // 线型指示器样式
	axisPointerShadowStyle?: {
		color?: string;
		opacity?: number;
	}; // 阴影型指示器样式
}

export interface ChartClickData {
	name: string;
	value: number;
	index: number;
}

// 多系列配置
export interface SeriesConfig {
	name: string; // 系列名称
	data: number[]; // 数据数组
	colors?: {
		color1?: string; // 渐变颜色1（底部）
		color2?: string; // 渐变颜色2（顶部）
		topColor?: string; // 顶部颜色
	}; // 颜色配置，不传则使用默认颜色
	offset?: number; // 水平偏移量，用于并排显示多个系列
	barWidth?: number | 'auto'; // 柱条宽度
	barMaxWidth?: number; // 柱条的最大宽度
	barMinHeight?: number; // 柱条的最小高度
	barCategoryGap?: string | number; // 类目轴上不同类目之间的间距，可以是百分比或像素值
	barGap?: string | number; // 同一类目轴上，不同系列的柱间距离，可以是百分比或像素值
}