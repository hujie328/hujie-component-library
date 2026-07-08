import type { MapRegionProperties } from './type'

export const normalizeAdcode = (adcode: unknown): string => {
  if (adcode === null || adcode === undefined) {
    return ''
  }

  return String(adcode)
}

export const createDrillMapName = (prefix: string, adcode: unknown): string => {
  return `${prefix}-${normalizeAdcode(adcode)}`
}

export const findRegionProperties = (
  geoJson: any,
  regionName: string
): MapRegionProperties | null => {
  const features = Array.isArray(geoJson?.features) ? geoJson.features : []
  const feature = features.find((item: any) => item?.properties?.name === regionName)

  return feature?.properties || null
}
