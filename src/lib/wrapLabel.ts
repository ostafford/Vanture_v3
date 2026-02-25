/**
 * Splits a label into lines by max characters per line (word-boundary aware).
 * Used for chart axis labels so wrapped text fits a fixed width.
 */
export function wrapLabel(text: string, maxCharsPerLine: number): string[] {
  if (!text || maxCharsPerLine < 1) return [text || '']
  const trimmed = text.trim()
  if (trimmed.length <= maxCharsPerLine) return [trimmed]
  const words = trimmed.split(/\s+/)
  const lines: string[] = []
  let current = ''
  for (const word of words) {
    const next = current ? `${current} ${word}` : word
    if (next.length <= maxCharsPerLine) {
      current = next
    } else {
      if (current) lines.push(current)
      if (word.length > maxCharsPerLine) {
        for (let i = 0; i < word.length; i += maxCharsPerLine) {
          lines.push(word.slice(i, i + maxCharsPerLine))
        }
        current = ''
      } else {
        current = word
      }
    }
  }
  if (current) lines.push(current)
  return lines
}
