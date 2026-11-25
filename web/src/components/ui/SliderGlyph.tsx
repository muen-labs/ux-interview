import { COLORS } from '../../tokens'

export interface SliderGlyphProps {
  /** Number of discrete steps (knob positions). 1 = single position. */
  steps: number
  /** Zero-based index of the current step. */
  position: number
  /** Render the knob in the themed "off" state (tertiary, e.g. reasoning Off). */
  isOff?: boolean
  /** Engaged knob color. Token by default (`var(--foreground)` — monochrome
   *  per the Mitsu control rule; EVA tints are explicit opt-ins). */
  engagedColor?: string
}

/** Mini slider preview for a stepped control: a tiny track + knob inside
 *  the button that opens the real slider. Knob position = current level
 *  (`position / (steps - 1)`), color = foreground when engaged, theme
 *  tertiary when `isOff` (0 -> non-zero color change kept; Claire brand
 *  pink removed 2026-08-12). It previews the control itself, so "click to
 *  adjust" needs no explanation — no signal/battery icon needed. */
export function SliderGlyph({ steps, position, isOff = false, engagedColor = 'var(--foreground)' }: SliderGlyphProps) {
  const pct = steps > 1 ? (position / (steps - 1)) * 100 : 0
  return (
    <span
      aria-hidden="true"
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', width: 28, height: 14 }}
    >
      <span
        style={{
          height: 3,
          width: '100%',
          borderRadius: 999,
          background: `color-mix(in srgb, ${COLORS.textMuted} 25%, transparent)`,
        }}
      />
      <span
        style={{
          position: 'absolute',
          top: '50%',
          left: `${pct}%`,
          width: 10,
          height: 10,
          borderRadius: '50%',
          transform: 'translate(-50%, -50%)',
          transition: 'left 160ms ease',
          background: isOff ? 'var(--tertiary)' : engagedColor,
        }}
      />
    </span>
  )
}
