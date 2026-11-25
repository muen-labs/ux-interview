import * as React from 'react'
import { Dices, ImagePlus, X } from 'lucide-react'
import { Slider } from '../shadcn/slider'
import { Tabs, TabsList, TabsTrigger } from '../shadcn/tabs'
import { ToggleGroup, ToggleGroupItem } from '../shadcn/toggle-group'
import { cn } from '../../lib/utils'
import { KreaStylesMiniGrid, KREA_STYLES, useAmbientTheme } from './MiniGrid'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CreativityId = 'raw' | 'low' | 'medium' | 'high'

/** Aspect control kind per workflow. */
export type AspectMode = 'enum' | 'widthHeight' | 'none'
/** Resolution control kind per workflow. */
export type ResolutionMode = 'fixed' | 'enum' | 'none'

/** Video-specific controls (duration / resolution / audio). */
export interface VideoVariantConfig {
  /** Durations in seconds, e.g. [4, 6, 8]. */
  durations: number[]
  /** Resolution tiers, e.g. ['720p', '1080p', '4K']. Empty hides the row (LTX). */
  resolutions: string[]
  /** Aspect ratios offered (video models default 16:9 / 9:16). */
  aspectOptions?: string[]
  /** Show the generate_audio toggle. */
  audio?: boolean
}

/**
 * Manifest for one workflow's control panel. Which rows render is driven by
 * this config - most workflows are far simpler than Krea 2 AIO (no creativity,
 * no sliders, no model tabs). See DESIGN.md "Krea API: OOTB workflow control
 * panels" for the per-model parameter map this was built from.
 */
export interface WorkflowVariantConfig {
  id: string
  label: string
  /** Model tabs (Krea 2: turbo/medium/large). Hidden when omitted. */
  models?: { id: string; label: string; hint?: string }[]
  /** Default model id (first when omitted). */
  defaultModel?: string
  aspect: AspectMode
  /** Enum ratios (when aspect === 'enum'). */
  aspectOptions?: string[]
  /** Real output pixels per ratio (fixed resolution models like Krea 2). */
  outputSizes?: Record<string, { w: number; h: number }>
  /** Explicit grid cell per ratio - only used when a layout needs empty cells (Krea 2). */
  gridPos?: Record<string, string>
  /** Pixel cap for the widthHeight aspect (long edge). */
  maxDimension?: number
  resolution: ResolutionMode
  /** Chip label for fixed resolution (e.g. '1K'). */
  fixedResolution?: string
  /** Tiers for enum resolution (e.g. ['1K', '2K', '4K']). */
  resolutionOptions?: string[]
  /** Long edge px per tier (enum resolution readout). */
  resolutionPx?: Record<string, number>
  seed?: boolean
  creativity?: boolean
  /** Intensity / complexity / movement sliders (Krea 2 only). */
  sliders?: boolean
  /** Quality tiers (ChatGPT: low/medium/high/auto). */
  quality?: boolean
  /** Steps + CFG/guidance scale inputs (Qwen, Flux). */
  stepsCfg?: boolean
  /** Negative prompt input (Qwen). */
  negativePrompt?: boolean
  /** Krea 2 style-transfer feature - strength slider + custom image (style
   *  library picking happens in the AI card's Krea styles picker). */
  styleTransfer?: boolean
  /** Reference image uploader, max count from the API (style_images). */
  refImages?: number
  video?: VideoVariantConfig
}

export interface WorkflowControlsState {
  variantId: string
  model?: string
  aspectRatio?: string
  width?: number
  height?: number
  resolution?: string
  creativity?: CreativityId
  intensity?: number
  complexity?: number
  movement?: number
  quality?: string
  steps?: number
  guidanceScale?: number
  negativePrompt?: string
  seed?: string
  duration?: number
  videoResolution?: string
  audio?: boolean
  /** Krea 2 style transfer active (style chosen or image loaded). */
  styleTransfer?: boolean
  /** Style transfer strength 0-1 (Krea 2). */
  styleStrength?: number
  /** Single ref / start image (Krea 2 style transfer, video). */
  refImage?: string
  /** Uploaded reference images (style_images models) - max per variant. */
  refImages?: string[]
}

export interface WorkflowControlsProps {
  /** Registry workflow id - controls vary per workflow. */
  workflowId: string
  /** Display label, e.g. "Krea 2 AIO". */
  workflowLabel: string
  /** Manifest that drives which control rows render. Defaults to Krea 2 AIO. */
  variant?: WorkflowVariantConfig
  /** Currently selected Krea style (picked in the AI card) - shown in the style transfer row. */
  style?: { name: string; thumb?: string } | null
  /** Picked a style from the library in the controls panel. */
  onStyleSelect?: (styleId: string) => void
  onClose: () => void
  /** Apply the controls (closes + fires). */
  onUse?: (state: WorkflowControlsState) => void
  /** Ambient theme - the panel renders with the OPPOSITE theme's primaries. */
  theme?: 'light' | 'dark'
}

// ---------------------------------------------------------------------------
// Shared helpers & constants
// ---------------------------------------------------------------------------

const ASPECTS: Record<string, { w: number; h: number }> = {
  '1:1': { w: 1, h: 1 },
  '4:3': { w: 4, h: 3 },
  '3:2': { w: 3, h: 2 },
  '16:9': { w: 16, h: 9 },
  '2.35:1': { w: 2.35, h: 1 },
  '4:5': { w: 4, h: 5 },
  '2:3': { w: 2, h: 3 },
  '9:16': { w: 9, h: 16 },
  '21:9': { w: 21, h: 9 },
  '5:4': { w: 5, h: 4 },
  '3:4': { w: 3, h: 4 },
  '1:2': { w: 1, h: 2 },
  '2:1': { w: 2, h: 1 },
  '4:1': { w: 4, h: 1 },
  '1:4': { w: 1, h: 4 },
  '1:8': { w: 1, h: 8 },
  '9:21': { w: 9, h: 21 },
}

const CREATIVITY: CreativityId[] = ['raw', 'low', 'medium', 'high']
const QUALITY = ['low', 'medium', 'high', 'auto']

/** Selected-state fill shared by all toggles. */
const PRESSED =
  'data-pressed:border-foreground data-pressed:bg-foreground data-pressed:text-background'

/** Mini aspect rectangle - 2px border + 1px 9-square grid. Long edge stays at `size` so portrait and landscape occupy the same area. */
function AspectRect({
  w,
  h,
  size = 14,
  className,
}: {
  w: number
  h: number
  size?: number
  className?: string
}) {
  const long = Math.max(w, h)
  return (
    <span
      className={cn('relative block overflow-hidden rounded-[2px] border-2 border-current', className)}
      style={{ width: size * (w / long), height: size * (h / long) }}
    >
      <span className="absolute inset-y-0 left-1/3 right-1/3 border-x border-current opacity-25" />
      <span className="absolute inset-x-0 top-1/3 bottom-1/3 border-y border-current opacity-25" />
    </span>
  )
}

/** Labeled control row - label top, control below. */
function ControlRow({
  label,
  children,
  hint,
}: {
  label: string
  children: React.ReactNode
  hint?: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        {hint && <span className="text-[0.65rem] text-muted-foreground/70">{hint}</span>}
      </div>
      {children}
    </div>
  )
}

/** Small numeric input used by width/height, steps, cfg and seed. */
function NumInput({
  value,
  onChange,
  placeholder,
  max,
  ariaLabel,
  className,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  max?: number
  ariaLabel: string
  className?: string
}) {
  return (
    <input
      type="text"
      inputMode="numeric"
      value={value}
      onChange={e => {
        const digits = e.target.value.replace(/[^0-9]/g, '')
        onChange(max && Number(digits) > max ? String(max) : digits)
      }}
      placeholder={placeholder}
      aria-label={ariaLabel}
      className={cn(
        'h-7 rounded-md border border-border bg-transparent px-2 text-sm tabular-nums outline-none placeholder:text-muted-foreground focus-visible:border-ring',
        className
      )}
    />
  )
}

/** On/off pill button (audio, style transfer). */
function PillToggle({
  label,
  on,
  onToggle,
}: {
  label: string
  on: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        'flex h-7 items-center rounded-lg border border-border px-3 text-xs font-medium text-foreground transition-colors hover:bg-muted',
        on && 'bg-muted'
      )}
    >
      {label}
    </button>
  )
}

// ---------------------------------------------------------------------------
// Reusable row components (one per control group - see DESIGN.md)
// ---------------------------------------------------------------------------

/** txt2img / img2img / video - enum ratio grid + animated preview. */
function AspectEnumRow({
  options,
  gridPos,
  value,
  onChange,
}: {
  options: string[]
  gridPos?: Record<string, string>
  value: string
  onChange: (v: string) => void
}) {
  const ratio = ASPECTS[value]
  return (
    <ControlRow label="Aspect ratio">
      <div className="flex flex-col gap-3 rounded-lg border border-border/60 p-2 sm:flex-row sm:items-stretch">
        <ToggleGroup
          value={[value]}
          onValueChange={(v) => v[0] && onChange(v[0])}
          variant="outline"
          size="sm"
          spacing={4}
          className="grid grid-cols-2"
        >
          {options.map(id => (
            <ToggleGroupItem
              key={id}
              value={id}
              className={`w-full px-2.5 py-1.5 text-xs tabular-nums ${gridPos?.[id] ?? ''} ${PRESSED}`}
            >
              {id}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        {/* Animated preview - morphs to the selected ratio. */}
        <div className="flex min-h-28 flex-1 items-center justify-center">
          <AspectRect
            w={ratio?.w ?? 1}
            h={ratio?.h ?? 1}
            size={80}
            className="text-foreground transition-all duration-300 ease-out"
          />
        </div>
      </div>
    </ControlRow>
  )
}

/** Free-pixel models (Qwen, Seedream, Flux, Ideogram) - W x H inputs. */
function SizeInputsRow({
  width,
  height,
  onWidth,
  onHeight,
  maxDimension,
  readout,
}: {
  width: string
  height: string
  onWidth: (v: string) => void
  onHeight: (v: string) => void
  maxDimension?: number
  readout: string
}) {
  return (
    <ControlRow label="Size" hint={`max ${maxDimension ?? 4096}px long edge`}>
      <div className="flex items-center gap-2 rounded-lg border border-border/60 p-2">
        <NumInput value={width} onChange={onWidth} max={maxDimension} ariaLabel="Width" className="w-24" />
        <span className="text-xs text-muted-foreground">×</span>
        <NumInput value={height} onChange={onHeight} max={maxDimension} ariaLabel="Height" className="w-24" />
        <span className="ml-auto text-xs tabular-nums text-muted-foreground">{readout}</span>
      </div>
    </ControlRow>
  )
}

/** Fixed resolution (Krea 2 / Z Image - 1K only) - chip + pixel readout. */
function ResolutionFixedRow({
  tier,
  variantLabel,
  aspectRatio,
  readout,
}: {
  tier: string
  variantLabel: string
  aspectRatio: string
  readout: string
}) {
  return (
    <ControlRow label="Resolution" hint={`${tier} only on ${variantLabel}`}>
      <div className="flex items-center justify-between gap-3 rounded-lg border border-border/60 p-2">
        <span className="rounded-md bg-muted px-2.5 py-1 text-xs font-medium">{tier}</span>
        <span className="text-xs tabular-nums text-muted-foreground">
          {aspectRatio} · {readout}
        </span>
      </div>
    </ControlRow>
  )
}

/** Resolution tiers (Nano Banana / ChatGPT 2 - 1K/2K/4K) - toggles + readout. */
function ResolutionEnumRow({
  options,
  value,
  onChange,
  aspectRatio,
  readout,
}: {
  options: string[]
  value: string
  onChange: (v: string) => void
  aspectRatio: string
  readout: string
}) {
  return (
    <ControlRow label="Resolution">
      <div className="flex items-center justify-between gap-3 rounded-lg border border-border/60 p-2">
        <ToggleGroup value={[value]} onValueChange={(v) => v[0] && onChange(v[0])} variant="outline" size="sm">
          {options.map(r => (
            <ToggleGroupItem key={r} value={r} className={`px-2.5 py-1 text-xs ${PRESSED}`}>
              {r}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <span className="text-xs tabular-nums text-muted-foreground">
          {aspectRatio} · {readout}
        </span>
      </div>
    </ControlRow>
  )
}

/** Seed input + dice. */
function SeedRow({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <ControlRow label="Seed">
      <div className="flex items-center gap-1.5">
        <NumInput value={value} onChange={onChange} placeholder="Auto" ariaLabel="Seed" className="w-24" />
        <button
          type="button"
          onClick={() => onChange(String(Math.floor(Math.random() * 999999)))}
          title="Random seed"
          aria-label="Random seed"
          className="flex size-7 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Dices className="size-3.5" aria-hidden="true" />
        </button>
      </div>
    </ControlRow>
  )
}

/** Negative prompt (Qwen). */
function NegativePromptRow({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <ControlRow label="Negative prompt">
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="What to avoid"
        aria-label="Negative prompt"
        className="h-7 w-full rounded-md border border-border bg-transparent px-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring"
      />
    </ControlRow>
  )
}

/** Steps + CFG (Qwen, Flux). */
function SamplingRow({
  steps,
  onSteps,
  cfg,
  onCfg,
}: {
  steps: string
  onSteps: (v: string) => void
  cfg: string
  onCfg: (v: string) => void
}) {
  return (
    <ControlRow label="Sampling">
      <div className="flex items-center gap-2 rounded-lg border border-border/60 p-2">
        <NumInput value={steps} onChange={onSteps} ariaLabel="Steps" className="w-16" />
        <span className="text-xs text-muted-foreground">steps</span>
        <NumInput value={cfg} onChange={onCfg} ariaLabel="Guidance scale" className="ml-auto w-16" />
        <span className="text-xs text-muted-foreground">cfg</span>
      </div>
    </ControlRow>
  )
}

/** Model tabs (Krea 2 variants). */
function ModelTabsRow({
  models,
  value,
  onChange,
}: {
  models: { id: string; label: string; hint?: string }[]
  value: string
  onChange: (v: string) => void
}) {
  return (
    <ControlRow label="Model" hint={models.find(m => m.id === value)?.hint}>
      <Tabs value={value} onValueChange={(v: string | null) => v && onChange(v)}>
        <TabsList className="w-full">
          {models.map(m => (
            <TabsTrigger key={m.id} value={m.id} className="px-2 py-0.5 text-xs capitalize">
              {m.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </ControlRow>
  )
}

/** Quality tiers (ChatGPT). */
function QualityRow({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <ControlRow label="Quality">
      <ToggleGroup value={[value]} onValueChange={(v) => v[0] && onChange(v[0])} variant="outline" size="sm">
        {QUALITY.map(q => (
          <ToggleGroupItem key={q} value={q} className={`px-2.5 py-1 text-xs capitalize ${PRESSED}`}>
            {q}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </ControlRow>
  )
}

/** Creativity tiers (Krea 2). */
function CreativityRow({ value, onChange }: { value: CreativityId; onChange: (v: CreativityId) => void }) {
  return (
    <ControlRow label="Creativity" hint="prompt expansion">
      <ToggleGroup
        value={[value]}
        onValueChange={(v) => v[0] && onChange(v[0] as CreativityId)}
        variant="outline"
        size="sm"
      >
        {CREATIVITY.map(c => (
          <ToggleGroupItem key={c} value={c} className={`px-2.5 py-1 text-xs capitalize ${PRESSED}`}>
            {c}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </ControlRow>
  )
}

/** Intensity / complexity / movement (Krea 2). */
function SliderGroup({
  intensity,
  complexity,
  movement,
  setIntensity,
  setComplexity,
  setMovement,
}: {
  intensity: number
  complexity: number
  movement: number
  setIntensity: (v: number) => void
  setComplexity: (v: number) => void
  setMovement: (v: number) => void
}) {
  const slider = (label: string, value: number, onChange: (v: number) => void) => (
    <div className="flex items-center gap-2">
      <span className="w-24 shrink-0 text-xs text-muted-foreground">{label}</span>
      <Slider
        value={[value]}
        onValueChange={v => {
          const next = Array.isArray(v) ? v[0] : v
          onChange(next ?? 0)
        }}
        min={-100}
        max={100}
        className="flex-1"
      />
      <span className="w-8 shrink-0 text-right text-xs tabular-nums text-foreground">
        {value > 0 ? `+${value}` : value}
      </span>
    </div>
  )
  return (
    <div className="mt-2 flex flex-col gap-2">
      {slider('Intensity', intensity, setIntensity)}
      {slider('Complexity', complexity, setComplexity)}
      {slider('Movement', movement, setMovement)}
    </div>
  )
}

/** Video controls - duration / resolution / audio. */
function VideoControlsRow({
  config,
  duration,
  resolution,
  audio,
  setDuration,
  setResolution,
  setAudio,
}: {
  config: VideoVariantConfig
  duration: number
  resolution: string
  audio: boolean
  setDuration: (v: number) => void
  setResolution: (v: string) => void
  setAudio: (v: boolean) => void
}) {
  return (
    <>
      {config.durations.length > 1 && (
        <ControlRow label="Duration">
          <ToggleGroup
            value={[String(duration)]}
            onValueChange={(v) => v[0] && setDuration(Number(v[0]))}
            variant="outline"
            size="sm"
          >
            {config.durations.map(d => (
              <ToggleGroupItem key={d} value={String(d)} className={`px-2.5 py-1 text-xs tabular-nums ${PRESSED}`}>
                {d}s
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </ControlRow>
      )}
      {config.resolutions.length > 0 && (
        <ControlRow label="Video resolution">
          <ToggleGroup
            value={[resolution]}
            onValueChange={(v) => v[0] && setResolution(v[0])}
            variant="outline"
            size="sm"
          >
            {config.resolutions.map(r => (
              <ToggleGroupItem key={r} value={r} className={`px-2.5 py-1 text-xs ${PRESSED}`}>
                {r}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </ControlRow>
      )}
      {config.audio && (
        <ControlRow label="Audio">
          <PillToggle label={audio ? 'On' : 'Off'} on={audio} onToggle={() => setAudio(!audio)} />
        </ControlRow>
      )}
    </>
  )
}

/** Read an image file into a data URL (disk -> ref image). */
function toDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

/** Stand-in asset from the library (real flow opens the asset browser). */
const MOCK_ASSET = 'https://picsum.photos/seed/claire-asset/120/160'

/** Disk / assets image source buttons - the shared "load image" flow. */
function ImageSourceButtons({
  onPick,
  addLabel = 'Load image',
}: {
  onPick: (url: string) => void
  addLabel?: string
}) {
  const fileRef = React.useRef<HTMLInputElement>(null)
  return (
    <div className="flex items-center gap-1.5">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async e => {
          const file = e.target.files?.[0]
          if (file) onPick(await toDataUrl(file))
          e.target.value = ''
        }}
      />
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        title="Load from disk"
        className="flex h-8 items-center gap-1.5 rounded-md border border-border px-2 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <ImagePlus className="size-3.5" aria-hidden="true" />
        {addLabel}
      </button>
      <button
        type="button"
        onClick={() => onPick(MOCK_ASSET)}
        title="Load from assets"
        className="flex h-8 items-center rounded-md border border-border px-2 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        Assets
      </button>
    </div>
  )
}

/** Single ref image slot - thumb + clear, or the load-image buttons. */
function RefImageSlot({
  refImage,
  onChange,
}: {
  refImage?: string
  onChange: (url: string | undefined) => void
}) {
  return refImage ? (
    <div className="flex items-center gap-2">
      <span className="flex size-7 h-9 w-7 items-center justify-center overflow-hidden rounded-md border border-border bg-muted">
        <img src={refImage} alt="" className="size-full object-cover" />
      </span>
      <button
        type="button"
        onClick={() => onChange(undefined)}
        className="rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        Clear
      </button>
    </div>
  ) : (
    <ImageSourceButtons onPick={onChange} />
  )
}

/** Krea 2 style transfer - selected style summary + library picker + custom image + strength. */
function StyleTransferRow({
  selectedStyle,
  refImage,
  onChange,
  strength,
  onStrength,
  onStyleSelect,
  pickerOpen,
  onTogglePicker,
  pickerHeight,
}: {
  selectedStyle?: { name: string; thumb?: string } | null
  refImage?: string
  onChange: (url: string | undefined) => void
  strength: number
  onStrength: (v: number) => void
  onStyleSelect?: (id: string) => void
  pickerOpen: boolean
  onTogglePicker: (open: boolean) => void
  pickerHeight?: number
}) {
  return (
    <ControlRow label="Style transfer" hint="Krea style library or your own image">
      <div className="flex flex-col gap-2 rounded-lg border border-border/60 p-2">
        {selectedStyle ? (
          <div className="flex items-center gap-2 rounded-md border border-border/60 p-1">
            <span className="size-9 flex-none overflow-hidden rounded-md bg-muted">
              {selectedStyle.thumb && (
                <img src={selectedStyle.thumb} alt="" className="size-full object-cover" />
              )}
            </span>
            <span className="truncate text-xs font-medium">{selectedStyle.name}</span>
          </div>
        ) : (
          <span className="text-[0.65rem] text-muted-foreground">
            No style selected - pick from the library or use your own image below.
          </span>
        )}
        <button
          type="button"
          onClick={() => onTogglePicker(!pickerOpen)}
          className="flex h-7 items-center justify-center rounded-md border border-border px-2 text-xs font-medium text-foreground transition-colors hover:bg-muted"
        >
          {pickerOpen ? 'Close style library' : selectedStyle ? 'Change style' : 'Choose style'}
        </button>
        {pickerOpen && (
          <div className="relative z-50">
            <KreaStylesMiniGrid
              value={KREA_STYLES.find(s => s.title === selectedStyle?.name)?.id}
              onChange={id => {
                onStyleSelect?.(id)
                onTogglePicker(false)
              }}
              onClose={() => onTogglePicker(false)}
              cols={7}
              widthClass="w-full"
              height={pickerHeight}
            />
          </div>
        )}
        <RefImageSlot refImage={refImage} onChange={onChange} />
        <div className="flex items-center gap-2">
          <span className="w-12 shrink-0 text-xs text-muted-foreground">Strength</span>
          <Slider
            value={[strength]}
            onValueChange={v => onStrength(Array.isArray(v) ? v[0] ?? 0.5 : v)}
            min={0}
            max={1}
            step={0.05}
            className="flex-1"
          />
          <span className="w-10 shrink-0 text-right text-xs tabular-nums text-foreground">
            {strength.toFixed(2)}
          </span>
        </div>
      </div>
    </ControlRow>
  )
}

/** Multiple reference images with per-image remove (style_images models). */
function RefImagesRow({
  images,
  max,
  onAdd,
  onRemove,
}: {
  images: string[]
  max: number
  onAdd: (url: string) => void
  onRemove: (i: number) => void
}) {
  return (
    <ControlRow label="Reference images" hint={`${images.length}/${max} max`}>
      <div className="flex flex-wrap items-center gap-2">
        {images.map((url, i) => (
          <span key={i} className="relative size-9 overflow-hidden rounded-md border border-border">
            <img src={url} alt="" className="size-full object-cover" />
            <button
              type="button"
              onClick={() => onRemove(i)}
              aria-label="Remove reference image"
              className="absolute -top-1.5 -right-1.5 flex size-4 items-center justify-center rounded-full bg-foreground text-background shadow"
            >
              <X className="size-2.5" aria-hidden="true" />
            </button>
          </span>
        ))}
        {images.length < max && <ImageSourceButtons onPick={onAdd} />}
      </div>
    </ControlRow>
  )
}

// ---------------------------------------------------------------------------
// Workflow variant presets (from the Krea API parameter map, DESIGN.md)
// ---------------------------------------------------------------------------

export const KREA2_AIO_VARIANT: WorkflowVariantConfig = {
  id: 'krea2',
  label: 'Krea 2 Turbo',
  models: [
    { id: 'turbo', label: 'Turbo', hint: 'fast · low cost' },
    { id: 'medium', label: 'Medium', hint: 'stable · $0.04/img' },
    { id: 'large', label: 'Large', hint: 'photoreal · $0.07/img' },
  ],
  aspect: 'enum',
  aspectOptions: ['1:1', '4:3', '4:5', '3:2', '2:3', '16:9', '9:16', '2.35:1'],
  outputSizes: {
    '1:1': { w: 1024, h: 1024 },
    '4:3': { w: 1184, h: 896 },
    '3:2': { w: 1248, h: 832 },
    '16:9': { w: 1376, h: 768 },
    '2.35:1': { w: 1568, h: 672 },
    '4:5': { w: 928, h: 1152 },
    '2:3': { w: 832, h: 1248 },
    '9:16': { w: 768, h: 1376 },
  },
  gridPos: {
    '1:1': 'col-start-1 row-start-1',
    '4:3': 'col-start-1 row-start-2',
    '4:5': 'col-start-2 row-start-2',
    '3:2': 'col-start-1 row-start-3',
    '2:3': 'col-start-2 row-start-3',
    '16:9': 'col-start-1 row-start-4',
    '9:16': 'col-start-2 row-start-4',
    '2.35:1': 'col-start-1 row-start-5',
  },
  resolution: 'fixed',
  fixedResolution: '1K',
  seed: true,
  creativity: true,
  sliders: true,
  styleTransfer: true,
}

export const WORKFLOW_VARIANTS: Record<string, WorkflowVariantConfig> = {
  krea2: KREA2_AIO_VARIANT,

}


// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Workflow controls - INVERSE compound above the AI card (Epic 62 Story 6 /
 * DESIGN.md "Workflow Controls"). Renders per `variant` manifest; Krea 2 AIO
 * is the most complex set (model tabs, creativity, sliders), every other
 * workflow is a subset. Built with standard tokens, wrapped in the forced
 * opposite-theme class.
 *
 * Scope constraint: moodboards are NOT offered in-app (krea.ai dashboard,
 * BYOK only). Krea styles ARE offered via the curated style library
 * (KREA_STYLES in MiniGrid.tsx - mock stands in for the 180+ catalog);
 * custom style transfer uses image_style_references with strength 0-1.
 */
export function WorkflowControls({
  workflowId,
  workflowLabel,
  variant: variantProp,
  style,
  onStyleSelect,
  onClose,
  onUse,
  theme: themeProp,
}: WorkflowControlsProps) {
  const theme = themeProp ?? useAmbientTheme()
  const variant = variantProp ?? KREA2_AIO_VARIANT

  const aspectOptions = variant.aspectOptions ?? []
  const defaultAspect = aspectOptions[0] ?? '1:1'
  const defaultModel = variant.defaultModel ?? variant.models?.[0]?.id ?? 'medium'
  const defaultResolution = variant.fixedResolution ?? variant.resolutionOptions?.[0] ?? '1K'
  const defaultDuration = variant.video?.durations[0] ?? 5
  const defaultVideoRes = variant.video?.resolutions[0] ?? '720p'

  const [aspectRatio, setAspectRatio] = React.useState(defaultAspect)
  const [model, setModel] = React.useState(defaultModel)
  const [creativity, setCreativity] = React.useState<CreativityId>('medium')
  const [intensity, setIntensity] = React.useState(0)
  const [complexity, setComplexity] = React.useState(0)
  const [movement, setMovement] = React.useState(0)
  const [resolution, setResolution] = React.useState(defaultResolution)
  const [quality, setQuality] = React.useState('medium')
  const [steps, setSteps] = React.useState('25')
  const [guidanceScale, setGuidanceScale] = React.useState('3')
  const [negativePrompt, setNegativePrompt] = React.useState('')
  const [width, setWidth] = React.useState('1024')
  const [height, setHeight] = React.useState('1024')
  const [duration, setDuration] = React.useState(defaultDuration)
  const [videoResolution, setVideoResolution] = React.useState(defaultVideoRes)
  const [audio, setAudio] = React.useState(false)
  const [seed, setSeed] = React.useState('')
  const [styleStrength, setStyleStrength] = React.useState(0.5)
  const [refImage, setRefImage] = React.useState<string | undefined>()
  const [refImages, setRefImages] = React.useState<string[]>([])
  const [stylePickerOpen, setStylePickerOpen] = React.useState(false)
  const [stylePickerHeight, setStylePickerHeight] = React.useState<number>()
  const rootRef = React.useRef<HTMLDivElement>(null)

  // Escape closes the style library picker. Clicking empty space is handled by
  // the dismiss backdrop rendered with the panel.
  React.useEffect(() => {
    if (!stylePickerOpen) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && toggleStylePicker(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [stylePickerOpen])

  /** Open/close the style library in the controls; inherit the card's height. */
  const toggleStylePicker = (open: boolean) => {
    setStylePickerOpen(open)
    if (open && rootRef.current) setStylePickerHeight(rootRef.current.offsetHeight)
  }

  /** Restore every control to the variant's default value. */
  const reset = () => {
    setAspectRatio(defaultAspect)
    setModel(defaultModel)
    setCreativity('medium')
    setIntensity(0)
    setComplexity(0)
    setMovement(0)
    setResolution(defaultResolution)
    setQuality('medium')
    setSteps('25')
    setGuidanceScale('3')
    setNegativePrompt('')
    setWidth('1024')
    setHeight('1024')
    setDuration(defaultDuration)
    setVideoResolution(defaultVideoRes)
    setAudio(false)
    setSeed('')
    setStyleStrength(0.5)
    setRefImage(undefined)
    setRefImages([])
  }

  /** Pixel readout: real buckets when known, else long-edge scaled. */
  const ratio = ASPECTS[aspectRatio]
  const computedSize = (() => {
    if (variant.aspect === 'widthHeight')
      return `${width || 0}×${height || 0}`
    if (!ratio) return ''
    const known = variant.outputSizes?.[aspectRatio]
    if (known) return `${known.w}x${known.h}`
    const longEdge = variant.resolutionPx?.[resolution] ?? 1024
    if (longEdge >= ratio.w)
      return `${longEdge}x${Math.round((longEdge * ratio.h) / ratio.w)}`
    return `${Math.round((longEdge * ratio.w) / ratio.h)}x${longEdge}`
  })()

  const state: WorkflowControlsState = {
    variantId: variant.id,
    model: variant.models ? model : undefined,
    aspectRatio: variant.aspect === 'enum' ? aspectRatio : undefined,
    width: variant.aspect === 'widthHeight' ? Number(width) || 1024 : undefined,
    height: variant.aspect === 'widthHeight' ? Number(height) || 1024 : undefined,
    resolution: variant.resolution !== 'none' ? resolution : undefined,
    creativity: variant.creativity ? creativity : undefined,
    intensity: variant.sliders ? intensity : undefined,
    complexity: variant.sliders ? complexity : undefined,
    movement: variant.sliders ? movement : undefined,
    quality: variant.quality ? quality : undefined,
    steps: variant.stepsCfg ? Number(steps) || undefined : undefined,
    guidanceScale: variant.stepsCfg ? Number(guidanceScale) || undefined : undefined,
    negativePrompt: variant.negativePrompt ? negativePrompt : undefined,
    seed: variant.seed ? seed : undefined,
    duration: variant.video ? duration : undefined,
    videoResolution: variant.video && variant.video.resolutions.length ? videoResolution : undefined,
    audio: variant.video?.audio ? audio : undefined,
    styleTransfer: variant.styleTransfer ? Boolean(style) || Boolean(refImage) : undefined,
    styleStrength: variant.styleTransfer ? styleStrength : undefined,
    refImage: variant.styleTransfer || variant.video ? refImage : undefined,
    refImages: variant.refImages ? refImages : undefined,
  }

  return (
    <div
      ref={rootRef}
      className={cn(
        'w-full max-w-2xl rounded-2xl border border-border bg-background text-foreground shadow-sm',
        theme === 'light' ? 'dark' : 'light'
      )}
    >
      {/* Dismiss on empty-area click while the style library is open. */}
      {stylePickerOpen && (
        <div className="fixed inset-0 z-40" onClick={() => toggleStylePicker(false)} aria-hidden="true" />
      )}
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/60 px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{variant.label || workflowLabel}</span>
          <span className="rounded-full bg-muted px-1.5 py-0.5 text-[0.65rem] font-medium text-muted-foreground">
            Controls
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          title="Close"
          aria-label="Close workflow controls"
          className="flex size-7 items-center justify-center rounded-[10px] text-foreground/70 transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="size-3.5" aria-hidden="true" />
        </button>
      </div>

      {/* Controls - left / right columns, stacks on mobile. */}
      <div className="grid grid-cols-1 gap-y-3 px-3 py-2.5 sm:grid-cols-2 sm:gap-x-4">
        {/* LEFT column */}
        <div className="flex flex-col gap-3">
          {variant.aspect === 'enum' && (
            <AspectEnumRow options={aspectOptions} gridPos={variant.gridPos} value={aspectRatio} onChange={setAspectRatio} />
          )}

          {variant.aspect === 'widthHeight' && (
            <SizeInputsRow
              width={width}
              height={height}
              onWidth={setWidth}
              onHeight={setHeight}
              maxDimension={variant.maxDimension}
              readout={computedSize}
            />
          )}

          {variant.resolution === 'fixed' && (
            <ResolutionFixedRow
              tier={variant.fixedResolution ?? '1K'}
              variantLabel={variant.label}
              aspectRatio={aspectRatio}
              readout={computedSize}
            />
          )}

          {variant.resolution === 'enum' && (
            <ResolutionEnumRow
              options={variant.resolutionOptions ?? []}
              value={resolution}
              onChange={setResolution}
              aspectRatio={aspectRatio}
              readout={computedSize}
            />
          )}

          {variant.negativePrompt && <NegativePromptRow value={negativePrompt} onChange={setNegativePrompt} />}

          {variant.stepsCfg && (
            <SamplingRow steps={steps} onSteps={setSteps} cfg={guidanceScale} onCfg={setGuidanceScale} />
          )}

          {variant.seed && <SeedRow value={seed} onChange={setSeed} />}
        </div>

        {/* RIGHT column */}
        <div className="flex flex-col gap-3">
          {variant.models && <ModelTabsRow models={variant.models} value={model} onChange={setModel} />}

          {variant.quality && <QualityRow value={quality} onChange={setQuality} />}

          {variant.creativity && <CreativityRow value={creativity} onChange={setCreativity} />}

          {variant.video && (
            <VideoControlsRow
              config={variant.video}
              duration={duration}
              resolution={videoResolution}
              audio={audio}
              setDuration={setDuration}
              setResolution={setVideoResolution}
              setAudio={setAudio}
            />
          )}

          {variant.sliders && (
            <SliderGroup
              intensity={intensity}
              complexity={complexity}
              movement={movement}
              setIntensity={setIntensity}
              setComplexity={setComplexity}
              setMovement={setMovement}
            />
          )}

          {variant.video && (
            <ControlRow label="Start image" hint="image-to-video">
              <RefImageSlot refImage={refImage} onChange={setRefImage} />
            </ControlRow>
          )}

          {variant.styleTransfer && (
            <div className="mt-2">
              <StyleTransferRow
                selectedStyle={style}
                refImage={refImage}
                onChange={setRefImage}
                strength={styleStrength}
                onStrength={setStyleStrength}
                onStyleSelect={onStyleSelect}
                pickerOpen={stylePickerOpen}
                onTogglePicker={toggleStylePicker}
                pickerHeight={stylePickerHeight}
              />
            </div>
          )}

          {variant.refImages && (
            <RefImagesRow
              images={refImages}
              max={variant.refImages}
              onAdd={url =>
                setRefImages(prev => (prev.length >= (variant.refImages ?? 1) ? prev : [...prev, url]))
              }
              onRemove={i => setRefImages(prev => prev.filter((_, j) => j !== i))}
            />
          )}
        </div>
      </div>

      {/* Footer - reset + apply on the right. */}
      <div className="flex items-center justify-end gap-2 border-t border-border/60 px-3 py-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={reset}
            title="Reset to defaults"
            className="flex h-7 items-center rounded-lg border border-border px-3 text-xs font-medium text-foreground transition-colors hover:bg-muted"
          >
            Reset
          </button>
          {onUse && (
            <button
              type="button"
              onClick={() => onUse(state)}
              className="flex h-7 items-center rounded-lg bg-foreground px-3 text-xs font-medium text-background transition-opacity hover:opacity-90"
            >
              Use
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default WorkflowControls
