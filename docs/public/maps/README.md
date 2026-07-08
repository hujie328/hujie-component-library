# 地图数据来源

## 赣州单文件

- ganzhou.json：赣州市区县级行政边界 GeoJSON。
- 行政区划代码：360700。
- 数据来源：DataV GeoAtlas，https://geo.datav.aliyun.com/areas_v3/bound/360700_full.json。

## 中国离线下钻数据

- 目录：docs/public/maps/china/。
- 根地图：100000_full.json。
- 索引：map-index.json。
- 覆盖层级：中国 -> 省级 -> 地市级 -> 区县级边界展示。
- 区县级为当前离线预览的最小可拆分区域，不再下载下一层。
- 如果某个区域在数据源中没有 _full.json（例如当前源的 710000_full.json），预览中会作为叶子节点处理。
- 数据来源：DataV GeoAtlas，https://geo.datav.aliyun.com/areas_v3/bound/{adcode}_full.json。
