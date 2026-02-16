/**
 * Format helpers for display.
 */

export function formatMoney(cents: number): string {
  return (cents / 100).toFixed(2)
}

export function formatDate(isoDate: string): string {
  try {
    const d = new Date(isoDate + (isoDate.length === 10 ? 'T12:00:00Z' : ''))
    return d.toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return isoDate
  }
}

export function formatShortDate(isoDate: string): string {
  try {
    const d = new Date(isoDate + (isoDate.length === 10 ? 'T12:00:00Z' : ''))
    return d.toLocaleDateString(undefined, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    })
  } catch {
    return isoDate
  }
}
