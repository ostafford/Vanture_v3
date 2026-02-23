/**
 * Per-chart color preferences stored in app_settings as JSON.
 * Safe JSON read; supports reset (clear key so chart falls back to theme/palette).
 */

import { getAppSetting, setAppSetting } from '@/db'

const SAVER_CHART_COLORS_KEY = 'saver_chart_colors'
const INSIGHTS_CATEGORY_COLORS_KEY = 'insights_category_colors'

function parseJsonMap(key: string): Record<string, string> {
  try {
    const raw = getAppSetting(key) ?? '{}'
    const parsed = JSON.parse(raw) as unknown
    if (
      parsed !== null &&
      typeof parsed === 'object' &&
      !Array.isArray(parsed)
    ) {
      const out: Record<string, string> = {}
      for (const [k, v] of Object.entries(parsed)) {
        if (typeof k === 'string' && typeof v === 'string') out[k] = v
      }
      return out
    }
  } catch {
    // ignore corrupted or invalid JSON
  }
  return {}
}

export function getSaverChartColors(): Record<string, string> {
  return parseJsonMap(SAVER_CHART_COLORS_KEY)
}

export function setSaverChartColor(saverId: string, hex: string | null): void {
  const map = parseJsonMap(SAVER_CHART_COLORS_KEY)
  if (hex == null || hex === '') {
    delete map[saverId]
  } else {
    map[saverId] = hex
  }
  setAppSetting(SAVER_CHART_COLORS_KEY, JSON.stringify(map))
}

export function clearSaverChartColor(saverId: string): void {
  setSaverChartColor(saverId, null)
}

export function getInsightsCategoryColors(): Record<string, string> {
  return parseJsonMap(INSIGHTS_CATEGORY_COLORS_KEY)
}

export function setInsightsCategoryColor(
  categoryId: string,
  hex: string | null
): void {
  const map = parseJsonMap(INSIGHTS_CATEGORY_COLORS_KEY)
  if (hex == null || hex === '') {
    delete map[categoryId]
  } else {
    map[categoryId] = hex
  }
  setAppSetting(INSIGHTS_CATEGORY_COLORS_KEY, JSON.stringify(map))
}

export function clearInsightsCategoryColor(categoryId: string): void {
  setInsightsCategoryColor(categoryId, null)
}
