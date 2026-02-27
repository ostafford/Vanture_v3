import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getSaverChartColors,
  setSaverChartColor,
  clearSaverChartColor,
  getInsightsCategoryColors,
  setInsightsCategoryColor,
  clearInsightsCategoryColor,
} from './chartColors'

vi.mock('@/db', () => ({
  getAppSetting: vi.fn(),
  setAppSetting: vi.fn(),
}))

describe('chartColors', () => {
  beforeEach(async () => {
    const db = await import('@/db')
    vi.mocked(db.getAppSetting).mockReturnValue(null)
    vi.mocked(db.setAppSetting).mockReset()
  })

  describe('getSaverChartColors', () => {
    it('returns empty object when not set', async () => {
      const db = await import('@/db')
      vi.mocked(db.getAppSetting).mockReturnValue(null)
      expect(getSaverChartColors()).toEqual({})
    })

    it('returns empty object for empty JSON', async () => {
      const db = await import('@/db')
      vi.mocked(db.getAppSetting).mockReturnValue('{}')
      expect(getSaverChartColors()).toEqual({})
    })

    it('returns parsed map for valid JSON', async () => {
      const db = await import('@/db')
      vi.mocked(db.getAppSetting).mockReturnValue(
        '{"id1":"#ff0000","id2":"#00ff00"}'
      )
      expect(getSaverChartColors()).toEqual({
        id1: '#ff0000',
        id2: '#00ff00',
      })
    })

    it('returns empty object for malformed JSON', async () => {
      const db = await import('@/db')
      vi.mocked(db.getAppSetting).mockReturnValue('not json')
      expect(getSaverChartColors()).toEqual({})
    })

    it('ignores non-string values in JSON', async () => {
      const db = await import('@/db')
      vi.mocked(db.getAppSetting).mockReturnValue(
        '{"a":"#fff","b":123,"c":null}'
      )
      expect(getSaverChartColors()).toEqual({ a: '#fff' })
    })

    it('ignores array and null parsed value', async () => {
      const db = await import('@/db')
      vi.mocked(db.getAppSetting).mockReturnValue('[]')
      expect(getSaverChartColors()).toEqual({})
      vi.mocked(db.getAppSetting).mockReturnValue('null')
      expect(getSaverChartColors()).toEqual({})
    })
  })

  describe('setSaverChartColor', () => {
    it('calls setAppSetting with JSON string when adding color', async () => {
      const db = await import('@/db')
      vi.mocked(db.getAppSetting).mockReturnValue('{}')
      setSaverChartColor('saver-1', '#b66dff')
      expect(db.setAppSetting).toHaveBeenCalledWith(
        'saver_chart_colors',
        '{"saver-1":"#b66dff"}'
      )
    })

    it('calls setAppSetting with key removed when passing null', async () => {
      const db = await import('@/db')
      vi.mocked(db.getAppSetting).mockReturnValue('{"saver-1":"#b66dff"}')
      setSaverChartColor('saver-1', null)
      expect(db.setAppSetting).toHaveBeenCalledWith('saver_chart_colors', '{}')
    })
  })

  describe('clearSaverChartColor', () => {
    it('calls setSaverChartColor with null', async () => {
      const db = await import('@/db')
      vi.mocked(db.getAppSetting).mockReturnValue('{"saver-1":"#b66dff"}')
      clearSaverChartColor('saver-1')
      expect(db.setAppSetting).toHaveBeenCalledWith('saver_chart_colors', '{}')
    })
  })

  describe('getInsightsCategoryColors', () => {
    it('returns empty object when not set', async () => {
      const db = await import('@/db')
      vi.mocked(db.getAppSetting).mockImplementation((key) =>
        key === 'insights_category_colors' ? null : null
      )
      expect(getInsightsCategoryColors()).toEqual({})
    })

    it('returns parsed map for valid JSON', async () => {
      const db = await import('@/db')
      vi.mocked(db.getAppSetting).mockImplementation((key) =>
        key === 'insights_category_colors' ? '{"cat-1":"#da8cff"}' : null
      )
      expect(getInsightsCategoryColors()).toEqual({ 'cat-1': '#da8cff' })
    })
  })

  describe('setInsightsCategoryColor', () => {
    it('calls setAppSetting with JSON string when adding color', async () => {
      const db = await import('@/db')
      vi.mocked(db.getAppSetting).mockReturnValue('{}')
      setInsightsCategoryColor('cat-1', '#da8cff')
      expect(db.setAppSetting).toHaveBeenCalledWith(
        'insights_category_colors',
        '{"cat-1":"#da8cff"}'
      )
    })
  })

  describe('clearInsightsCategoryColor', () => {
    it('calls setInsightsCategoryColor with null', async () => {
      const db = await import('@/db')
      vi.mocked(db.getAppSetting).mockReturnValue('{"cat-1":"#da8cff"}')
      clearInsightsCategoryColor('cat-1')
      expect(db.setAppSetting).toHaveBeenCalledWith(
        'insights_category_colors',
        '{}'
      )
    })
  })
})
