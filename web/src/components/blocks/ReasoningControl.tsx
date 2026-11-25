import * as React from 'react'
import { Slider } from '../shadcn/slider'
import { SliderGlyph } from '../ui/SliderGlyph'

/**
 * Reasoning effort control — the right half of the LLM split button.
 *
 * Mini-slider glyph (`SliderGlyph`) in the button: knob position = current
 * effort, brand primary when engaged, theme tertiary at Off. Opens a popover with a
 * horizontal slider + level
 * labels. Per-provider mapping happens upstream (OpenAI: low/medium/high/
 * xhigh; Gemini/Claude/DeepSeek/Qwen: on/off or budget) — the component only
 * renders the level list it is given and greys out unsupported levels.
 */

// Mitsu design: Auto was a Claire feature and is sunset with it (2026-08-09).
// Reasoning is always explicit: Off/On for on/off models, effort tiers for
// OpenAI-style models.
// 'auto' here is provider-native (Qwen exposes Auto/Thinking/Fast) — distinct
// from Claire's sunset Auto model selection.
export type ReasoningLevel = 'auto' | 'off' | 'minimal' | 'low' | 'medium' | 'high' | 'ultra'

export const REASONING_LEVELS: { id: ReasoningLevel; label: string }[] = [
  { id: 'auto', label: 'Auto' },
  { id: 'off', label: 'Off' },
  { id: 'minimal', label: 'Minimal' },
  { id: 'low', label: 'Low' },
  { id: 'medium', label: 'Medium' },
  { id: 'high', label: 'High' },
  { id: 'ultra', label: 'Ultra' },
]

interface ReasoningControlProps {
  level: ReasoningLevel
  onLevelChange: (level: ReasoningLevel) => void
  /** Levels the current model actually supports (others render greyed). */
  supported?: ReasoningLevel[]
  /** Model label shown in the popover header. */
  modelLabel?: string
  /** Per-level label overrides (e.g. Claude's top tier = "Extra"). */
  labels?: Partial<Record<ReasoningLevel, string>>
}

export default function ReasoningControl({ level, onLevelChange, supported = REASONING_LEVELS.map(l => l.id), modelLabel, labels }: ReasoningControlProps) {
  const [open, setOpen] = React.useState(false)
  /** On/off models (2 states): Off/On labels, destructive X when off. */
  const dotMode = supported.length <= 2
  const levelLabel = (id: ReasoningLevel) => dotMode ? (id === 'off' ? 'Off' : 'On') : labels?.[id] ?? REASONING_LEVELS.find(l => l.id === id)?.label ?? id
  /** Levels shown in the popover + icon: the model's own supported list
   *  (2-5 steps), not the full universe. */
  const shownLevels = REASONING_LEVELS.filter(l => supported.includes(l.id))
  const panelRef = React.useRef<HTMLDivElement>(null)

  // Close on outside click.
  React.useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!panelRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  const currentIndex = shownLevels.findIndex(l => l.id === level)

  // Animate the trigger width when the slider grows/shrinks the label.
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const [triggerWidth, setTriggerWidth] = React.useState<number | undefined>(undefined)
  const reducedMotion = React.useMemo(
    () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
    []
  )
  React.useLayoutEffect(() => {
    const el = triggerRef.current
    if (!el) return
    el.style.width = 'auto'
    setTriggerWidth(el.scrollWidth)
  }, [level, dotMode, labels])

  return (
    <div className="relative" ref={panelRef}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(v => !v)}
        title={`Reasoning: ${levelLabel(level)}`}
        aria-label="Reasoning effort"
        aria-expanded={open}
        className="flex items-center gap-2 py-1.5 pl-1.5 pr-2.5 text-xs font-medium whitespace-nowrap text-muted-foreground hover:bg-muted/80 hover:text-foreground"
        style={{
          width: triggerWidth ?? 'auto',
          ...(reducedMotion ? {} : { transition: 'width 160ms ease, color 160ms ease, background-color 160ms ease' }),
        }}
      >
        {levelLabel(level)}
        <SliderGlyph steps={shownLevels.length} position={currentIndex} isOff={level === 'off'} />
      </button>

      {open && (
        <div
          data-side="top"
          className="absolute bottom-full right-0 z-50 mb-2 w-52 rounded-xl border border-border bg-popover p-2.5 shadow-lg"
          onPointerDown={e => e.stopPropagation()}
          onMouseDown={e => e.stopPropagation()}
        >
          <div className="px-1 pb-2 text-xs font-semibold text-foreground">
            Reasoning
            {modelLabel && <span className="ml-1 font-normal text-muted-foreground">· {modelLabel}</span>}
          </div>

          {/* Horizontal slider (Base UI primitive) — snapped to the model's
              own level list; thumb stays vertically centered on the track. */}
          <div className="px-2 py-1">
            <Slider
              min={0}
              max={shownLevels.length - 1}
              step={1}
              value={[Math.max(0, currentIndex)]}
              onValueChange={value => {
                const idx = Math.round(Array.isArray(value) ? value[0] : value)
                const next = shownLevels[idx]
                if (next) onLevelChange(next.id)
              }}
              aria-label="Reasoning effort"
            />
          </div>

          {/* Reasoning name centered below the slider */}
          <div className="flex items-center justify-center pt-2.5 text-xs font-medium text-foreground">
            {levelLabel(level)}
          </div>
        </div>
      )}
    </div>
  )
}
