import { describe, expect, it } from 'vitest'
import { createDrillMapName, findRegionProperties, normalizeAdcode } from './drill'

const geoJson = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        name: '江西省',
        adcode: 360000,
        level: 'province'
      },
      geometry: null
    },
    {
      type: 'Feature',
      properties: {
        name: '广东省',
        adcode: '440000',
        level: 'province'
      },
      geometry: null
    }
  ]
}

describe('map drill helpers', () => {
  it('normalizes numeric and string adcode values', () => {
    expect(normalizeAdcode(360000)).toBe('360000')
    expect(normalizeAdcode('440000')).toBe('440000')
    expect(normalizeAdcode(null)).toBe('')
  })

  it('creates stable drill map names from prefix and adcode', () => {
    expect(createDrillMapName('hj-map', '360000')).toBe('hj-map-360000')
  })

  it('finds region properties by name from GeoJSON features', () => {
    expect(findRegionProperties(geoJson, '江西省')).toEqual({
      name: '江西省',
      adcode: 360000,
      level: 'province'
    })
    expect(findRegionProperties(geoJson, '不存在')).toBeNull()
  })
})
