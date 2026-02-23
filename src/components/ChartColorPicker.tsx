import { ACCENT_PALETTES, type AccentId } from '@/lib/accentPalettes'

const SWATCH_HEXES = (Object.keys(ACCENT_PALETTES) as AccentId[]).map(
  (id) => ACCENT_PALETTES[id].primary
)

export interface ChartColorPickerProps {
  /** Current hex or null for default. */
  value: string | null
  /** Called when user selects a color or resets to default. */
  onChange: (hex: string | null) => void
  /** Whether to show "Use default" / "Reset" (e.g. when value is set). */
  allowReset?: boolean
  'aria-label'?: string
}

export function ChartColorPicker({
  value,
  onChange,
  allowReset = true,
  'aria-label': ariaLabel,
}: ChartColorPickerProps) {
  return (
    <div>
      <div className="d-flex flex-wrap gap-2 align-items-center">
        {SWATCH_HEXES.map((hex) => {
          const isSelected = value === hex
          return (
            <button
              key={hex}
              type="button"
              className="border rounded-circle p-0 d-flex align-items-center justify-content-center"
              style={{
                width: 40,
                height: 40,
                background: hex,
                borderWidth: isSelected ? 3 : 1,
                borderColor: isSelected
                  ? 'var(--vantura-text)'
                  : 'var(--vantura-border)',
              }}
              onClick={() => onChange(hex)}
              aria-label={`Select bar color ${hex}`}
              aria-pressed={isSelected}
            >
              {isSelected && (
                <i
                  className="mdi mdi-check"
                  style={{
                    fontSize: '1.25rem',
                    color: 'white',
                    textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                  }}
                  aria-hidden
                />
              )}
            </button>
          )
        })}
        <label className="d-flex align-items-center gap-1 small mb-0">
          <span className="text-muted">Custom</span>
          <input
            type="color"
            value={value && !SWATCH_HEXES.includes(value) ? value : '#b66dff'}
            onChange={(e) => onChange(e.target.value)}
            aria-label={ariaLabel ?? 'Custom bar color'}
            className="rounded border"
            style={{ width: 40, height: 40, padding: 2, cursor: 'pointer' }}
          />
        </label>
      </div>
      {allowReset && value != null && (
        <button
          type="button"
          className="btn btn-link btn-sm p-0 mt-2 text-muted"
          onClick={() => onChange(null)}
          aria-label="Use default color"
        >
          Use default
        </button>
      )}
    </div>
  )
}
