import * as React from 'react'
import {
  ChevronDown,
  CornerDownRight,
  FileText,
  FolderOpen,
  Image as ImageIcon,
  Palette,
  Plus,
  Send,
  Sparkles,
  Square,
  Target,
  X,
} from 'lucide-react'
import { Button } from '../shadcn/button'
import ModelSwitcher, { type ChatModel, variantLabel } from '../ModelSwitcher'
import ReasoningControl, { type ReasoningLevel } from './ReasoningControl'
import { reasoningLevelsFor, REASONING_LABELS } from './reasoningLevels'
import { Textarea } from '../shadcn/textarea'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../shadcn/tooltip'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../shadcn/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../shadcn/dropdown-menu'
import ProgressBorder from '../ui/ProgressBorder'
import WorkflowSelect from './WorkflowSelect'
import { AssetMiniGrid, KreaStylesMiniGrid, KREA_STYLES, MOCK_ASSETS } from './MiniGrid'
import { WORKFLOW_VARIANTS } from './WorkflowControls'
import type { ContextFolder } from '../ui/ContextChip'
import { cn } from '../../lib/utils'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ComposerProps {
  /** Submit prompt text. */
  onSend: (text: string) => void
  /** Stop a streaming generation. */
  onStop?: () => void
  /** Show stop button instead of send. */
  isStreaming?: boolean
  /** Disable all input. */
  disabled?: boolean
  /** Initial textarea value. */
  defaultPrompt?: string
  /** Textarea placeholder. */
  placeholder?: string
  /** Textarea placeholder when a document is attached. */
  docPlaceholder?: string

  // Add menu.
  onAddRefAsset?: () => void
  /** Upload an image from disk. */
  onUploadImage?: () => void
  /** Attach a document. */
  onAddDocument?: () => void
  /** Picked a style from the curated Krea style library (style id). */
  onStyleSelect?: (styleId: string) => void
  /** Add a reference image picked from the asset library. */
  onAddRefImage?: (url: string) => void
  /** Max reference images for the active workflow (undefined = no limit).
   *  Defaults to the variant's refImages cap when the workflow maps to one. */
  maxRefs?: number
  /** Document attached - shows the document badge, blocks other file types. */
  hasDocument?: boolean
  /** Name of the attached document, shown in the document badge. */
  docName?: string
  /** Detach the current document. */
  onClearDocument?: () => void

  // Reference images.
  refImages?: string[]
  onRemoveRefImage?: (index: number) => void
  /** Open the ref manager popover (+N badge). */
  onManageRef?: () => void

  // Style chip - mini thumbnail + label + template prompt; sits with ref images on the left.
  styleChip?: string | { name: string; thumb?: string; prompt?: string } | null
  /** Clear the selected style. */
  onClearStyle?: () => void

  // Workflow selector - explicit choice only (Mitsu; Auto sunset with Claire).
  workflow?: string
  onWorkflowChange?: (workflow: string) => void
  /** Open the workflows lightbox from the picker's Upscale tab footer. */
  onExploreWorkflows?: () => void

  // Parameters button.
  onParamsClick?: () => void
  /** Red dot on the params button (workflow supports style ref). */
  hasStyleRef?: boolean

  // Prompt enhance.
  onEnhance?: () => void
  enhanceActive?: boolean

  // LLM switcher - rendered next to the workflow selector when wired up.
  model?: ChatModel
  onModelChange?: (model: ChatModel) => void
  /** Hide the parameters (workflow controls) button. */
  hideParams?: boolean
  /** Hide the whole creative split (workflow picker + params). */
  hideCreative?: boolean
  /** Hide the prompt-enhance button. */
  hideEnhance?: boolean
  /** Hide the add-attachment button (the interview has nothing to attach). */
  hideAdd?: boolean
  /** Hide the project/context switcher (the interview has no project). */
  hideContext?: boolean

  // Reasoning effort (right half of the LLM split button).
  reasoningLevel?: ReasoningLevel
  onReasoningLevelChange?: (level: ReasoningLevel) => void
  /** Levels the current model supports (others grey out in the popover). */
  reasoningSupported?: ReasoningLevel[]

  // Context (project) selector - top row, left.
  /** Claire's working context - the currently selected project folder. */
  contextFolder?: ContextFolder | null
  /** Top-level project folders the user can focus Claire on (subfolders inherit). */
  folders?: ContextFolder[]
  /** Re-points Claire's working context. */
  onContextChange?: (id: string) => void

  // Edit return (Qwen pattern): a result image being edited loads back into
  // the card as a large thumbnail at the top with a corner-down-right icon.
  /** The result image currently being edited (loaded back into the card). */
  editReturnUrl?: string
  /** Detach the edit-return image. */
  onClearEditReturn?: () => void

  className?: string
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Reference image thumbnail with hover remove. lg = big top-strip variant.
 * Hides the muted placeholder if the image fails to load. */
function RefThumb({ src, onRemove, lg }: { src: string; onRemove?: () => void; lg?: boolean }) {
  const [failed, setFailed] = React.useState(false)
  return (
    <div
      className={cn(
        'group relative flex-none overflow-hidden rounded-md border border-border bg-muted',
        lg ? 'size-16 h-20' : 'size-7 h-9',
        failed && 'hidden'
      )}
    >
      <img
        src={src}
        alt=""
        onError={() => setFailed(true)}
        className="size-full object-cover"
      />
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove reference image"
          className="absolute top-0.5 right-0.5 flex size-3.5 items-center justify-center rounded-full bg-foreground/70 text-background opacity-0 transition-opacity group-hover:opacity-100"
        >
          <X className="size-2.5" aria-hidden="true" />
        </button>
      )}
    </div>
  )
}

/**
 * Edit-return (Qwen pattern): the result image being edited loads back into
 * the card as a large thumbnail with a corner-down-right icon overlaid at its
 * bottom-left (no card wrapper - the icon IS the signal). Hides if the image
 * fails to load.
 */
function EditReturnCard({ src, onRemove }: { src: string; onRemove?: () => void }) {
  const [failed, setFailed] = React.useState(false)
  if (failed) return null
  return (
    <div className="group relative size-16 h-20 flex-none overflow-hidden rounded-md border border-border bg-muted">
      <img
        src={src}
        alt="Editing this result"
        onError={() => setFailed(true)}
        className="size-full object-cover"
      />
      {/* Overlay icon - signals the result is being edited; styled like the
          style label badge (solid card surface + foreground border/icon). */}
      <span className="absolute bottom-1 left-1 z-10 flex size-5 items-center justify-center rounded-md border border-border bg-card text-foreground shadow-sm">
        <CornerDownRight className="size-3" aria-hidden="true" />
      </span>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove editing image"
          title="Remove editing image"
          className="absolute top-1 right-1 z-10 flex size-4 items-center justify-center rounded-full bg-foreground/70 text-background opacity-0 transition-opacity group-hover:opacity-100"
        >
          <X className="size-2.5" aria-hidden="true" />
        </button>
      )}
    </div>
  )
}

/**
 * Style badge - a label-style chip overlaid on the ref image thumbnail
 * (bottom-left). Solid theme surface (card bg + foreground border/text, no
 * opacity), reads as a label sitting on top. The name truncates at a modest
 * width so it can overflow the thumb a little without spilling too far.
 */
function StyleBadge({ name }: { name: string }) {
  return (
    <span className="absolute bottom-1 left-1 z-10 flex items-center gap-1">
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger render={
            <span className="inline-flex max-w-20 items-center rounded-md border border-border bg-card px-1.5 py-0.5 text-[0.65rem] leading-tight font-medium whitespace-nowrap text-foreground shadow-sm">
              <span className="truncate">{name}</span>
            </span>
          } />
          <TooltipContent>{name}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </span>
  )
}

/** Document label - FileText thumb + plain doc name; matches the style badge pattern. */
function DocBadge({ name, onRemove }: { name: string; onRemove?: () => void }) {
  return (
    <span className="group relative flex h-9 items-center">
      <span className="flex size-7 h-9 w-7 shrink-0 items-center justify-center rounded-md border border-border bg-muted">
        <FileText className="size-3.5 text-muted-foreground" aria-hidden="true" />
      </span>
      <span className="ml-1.5 max-w-44 truncate text-xs font-medium">{name}</span>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove document"
          title="Remove document"
          className="ml-1 flex size-3.5 shrink-0 items-center justify-center rounded-full text-muted-foreground opacity-0 transition-opacity hover:bg-muted group-hover:opacity-100"
        >
          <X className="size-2.5" aria-hidden="true" />
        </button>
      )}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Composer - the primary input surface of the chat workspace.
 * Model selector on top (green dot = Auto), prompt textarea, then the bottom
 * bar: add/ref images, style chip, params, workflow selector, enhance, send.
 * Triggered components (ref manager, workflow select, params, asset grid)
 * are popovers owned by the parent and opened via the callbacks here.
 */

/** Workflow menu ids -> variant config keys (variants that accept ref images). */
export const VARIANT_FOR_WORKFLOW: Record<string, string> = {
  krea2: 'krea2',
  qwen2512: 'qwen2512',
}

export default function Composer({
  onSend,
  onStop,
  isStreaming = false,
  disabled = false,
  placeholder = 'Ask the agent...',
  defaultPrompt = '',
  docPlaceholder = 'Summarize, analyze, or ask about this document...',
  onAddRefAsset,
  onUploadImage,
  onAddDocument,
  onStyleSelect,
  onAddRefImage,
  maxRefs: maxRefsProp,
  hasDocument = false,
  docName = 'Document',
  onClearDocument,
  refImages = [],
  onRemoveRefImage,
  onManageRef,
  styleChip = null,
  onClearStyle,
  workflow = 'krea2',
  onWorkflowChange,
  onExploreWorkflows,
  onParamsClick,
  hasStyleRef = false,
  onEnhance,
  enhanceActive = false,
  model,
  onModelChange,
  hideCreative = false,
  hideParams = false,
  hideEnhance = false,
  hideAdd = false,
  hideContext = false,
  reasoningLevel = 'off',
  onReasoningLevelChange,
  reasoningSupported,
  contextFolder,
  folders = [],
  onContextChange,
  editReturnUrl,
  onClearEditReturn,
  className,
}: ComposerProps) {
  const [input, setInput] = React.useState(defaultPrompt)
  const [picker, setPicker] = React.useState<'assets' | 'styles' | null>(null)

  // Escape closes the asset / style picker. Clicking empty space is handled by
  // the dismiss backdrop rendered with the panel.
  React.useEffect(() => {
    if (!picker) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setPicker(null)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [picker])

  // Composed style prompt: "[stylename]prompt" - shown as a paragraph below
  // the textarea and sent as the generation prompt when nothing is typed.
  const styleName = styleChip ? (typeof styleChip === 'string' ? styleChip : styleChip.name) : ''
  const selectedStyleId = KREA_STYLES.find(s => s.title === styleName)?.id
  const refAssetIds = MOCK_ASSETS.filter(a => refImages.includes(a.thumb)).map(a => a.id)
  // Reasoning levels follow the model (catalog map); clamp an unsupported
  // level (e.g. Off on an OpenAI model that only has effort tiers).
  const effectiveReasoningLevels = reasoningSupported ?? reasoningLevelsFor(model)
  const effectiveReasoningLevel = effectiveReasoningLevels.includes(reasoningLevel)
    ? reasoningLevel
    : effectiveReasoningLevels[0]

  const maxRefs = maxRefsProp ?? WORKFLOW_VARIANTS[VARIANT_FOR_WORKFLOW[workflow] ?? '']?.refImages
  const atRefLimit = maxRefs != null && refImages.length >= maxRefs
  const stylePrompt =
    styleChip && typeof styleChip !== 'string' && styleChip.prompt
      ? `[${styleChip.name}]${styleChip.prompt}`
      : ''

  const handleSend = () => {
    const text = (input.trim() || stylePrompt).trim()
    if (!text || isStreaming || disabled) return
    setInput('')
    onSend(text)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const hasContent = !!(input.trim() || stylePrompt)
  // Document references are exclusive: hide the add menu while a document
  // is attached.
  const addItems = hasDocument
    ? []
    : [
        {
          label: 'Select Asset',
          icon: FolderOpen,
          onPick: () => setPicker('assets'),
        },
        {
          label: 'Upload Image',
          icon: ImageIcon,
          onPick: () => onUploadImage?.(),
        },
        {
          label: 'Select Krea Style',
          icon: Palette,
          onPick: () => setPicker('styles'),
        },
        {
          label: 'Upload Document',
          icon: FileText,
          onPick: () => onAddDocument?.(),
        },
      ]

  return (
    <div
      data-slot="ai-card"
      className={cn(
        'relative w-full max-w-2xl rounded-2xl border border-border bg-card shadow-sm transition-shadow lg:max-w-3xl 2xl:max-w-4xl',
        isStreaming && 'glow-ring',
        className
      )}
    >
      {/* ProgressBorder race (primary + secondary dots racing the border) while streaming. */}
      {isStreaming && (
        <ProgressBorder
          mode="race"
          color="var(--primary)"
          color2="var(--secondary)"
          speed={1}
          radius={14.4}
          borderWidth={1}
        />
      )}
      {/* Top attachment strip: edit-return card + ref thumbs + doc + style.
       * Bigger thumbnails than the footer so attachments are readable. */}
      {(editReturnUrl || refImages.length > 0 || hasDocument || styleChip) && (
        <div className="flex flex-wrap items-center gap-2 px-2.5 py-2">
          {editReturnUrl && <EditReturnCard src={editReturnUrl} onRemove={onClearEditReturn} />}
          {/* First ref thumb anchors the style badge overlay (when a style is set). */}
          {refImages.map((src, i) => (
            <div key={i} className="relative">
              <RefThumb src={src} lg onRemove={() => onRemoveRefImage?.(i)} />
              {i === 0 && styleChip && <StyleBadge name={styleName} />}
            </div>
          ))}
          {refImages.length >= 3 && (
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={() => onManageRef?.()}
              title="Manage reference images"
              aria-label="Manage reference images"
              className="size-16 h-20 rounded-md text-xs font-medium"
            >
              +{refImages.length - 2}
            </Button>
          )}
          {hasDocument ? <DocBadge name={docName} onRemove={onClearDocument} /> : null}
          {/* Style without a ref image - plain inline badge (no thumb anchor). */}
          {!hasDocument && styleChip && refImages.length === 0 && (
            <span className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-1.5 py-1 text-xs font-medium text-foreground">
              {styleName}
              {onClearStyle && (
                <button
                  type="button"
                  onClick={onClearStyle}
                  aria-label="Remove style"
                  className="flex size-3.5 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
                >
                  <X className="size-2.5" aria-hidden="true" />
                </button>
              )}
            </span>
          )}
        </div>
      )}

      {/* Prompt */}
      <Textarea
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={hasDocument ? docPlaceholder : placeholder}
        disabled={disabled}
        readOnly={isStreaming}
        aria-label="Prompt"
        className="min-h-16 border-0 bg-transparent px-3 py-2.5 shadow-none caret-primary focus-visible:ring-0"
      />

      {/* Style prompt paragraph - below the textarea, above the bottom bar. */}
      {stylePrompt && (
        <p className="border-t border-border/40 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
          {stylePrompt}
        </p>
      )}

      {/* Bottom bar */}
      <div className="flex items-center gap-1 border-t border-border/60 px-2 py-1.5">
        {/* Left group: big add button (left corner) + context switcher beside it.
         * Attachments (ref thumbs, doc, style, edit-return) live in the top strip. */}
        <div className="mr-auto flex items-center gap-1.5">
          {/* Add attachment - unchanged big default (black) circular button. */}
          {!hasDocument && !hideAdd && (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<Button variant="default" size="icon-2xl" className="rounded-full" />}
                title="Add attachment"
                aria-label="Add attachment"
              >
                <Plus className="size-5" aria-hidden="true" />
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" sideOffset={4} className="min-w-44">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Add</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {addItems.map(item => (
                    <DropdownMenuItem key={item.label} onClick={item.onPick}>
                      <item.icon className="size-4 text-muted-foreground" aria-hidden="true" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Context selector - to the right of the add button. */}
          {hideContext ? null : (
          <Select
            value={contextFolder?.id ?? ''}
            onValueChange={id => id && onContextChange?.(id)}
          >
            <SelectTrigger
              size="sm"
              aria-label="Select project"
              className="h-7 gap-1 rounded-full border-border bg-transparent py-0 pl-1.5 pr-2 text-xs"
            >
              <Target className="size-3.5 text-success" aria-hidden="true" />
              <SelectValue placeholder="No project" />
            </SelectTrigger>
            <SelectContent align="start" side="top" sideOffset={4} alignItemWithTrigger={false}>
              <SelectGroup>
                {folders.map(f => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          )}

          {/* Asset / Krea style picker - plain inverse panel above the card,
           * same primitive + position as WorkflowControls (no popover portal). */}
          {picker !== null && (
            <>
              {/* Dismiss on empty-area click. */}
              <div className="fixed inset-0 z-40" onClick={() => setPicker(null)} aria-hidden="true" />
              <div className="absolute bottom-full left-0 z-50 mb-2 w-full max-w-2xl lg:max-w-3xl 2xl:max-w-4xl">
              {picker === 'styles' && (
                <KreaStylesMiniGrid
                  value={selectedStyleId}
                  onChange={id => {
                    onStyleSelect?.(id)
                    setPicker(null)
                  }}
                  onClose={() => setPicker(null)}
                  cols={7}
                  widthClass="w-full"
                />
              )}
              {picker === 'assets' && (
                <AssetMiniGrid
                  value={refAssetIds}
                  max={maxRefs}
                  onChange={id => {
                    const asset = MOCK_ASSETS.find(a => a.id === id)
                    if (!asset) return
                    if (refAssetIds.includes(id)) {
                      const i = refImages.indexOf(asset.thumb)
                      if (i >= 0) onRemoveRefImage?.(i)
                    } else {
                      if (maxRefs != null && refImages.length >= maxRefs) return
                      onAddRefImage?.(asset.thumb)
                    }
                  }}
                  onClose={() => setPicker(null)}
                  cols={7}
                  widthClass="w-full"
                />
              )}
              </div>
            </>
          )}
        </div>

        {/* LLM button: two buttons that read as one chip —
            "Model Name ▾ | Reasoning ▶". Left opens the flyout, right opens
            the effort slider. No overflow-hidden on the chip container: the
            reasoning popover opens upward and must not be clipped. */}
        {onModelChange && (
          <div className="flex items-center rounded-md bg-muted">
            <ModelSwitcher model={model ?? 'deepseek-v4-flash'} onChange={onModelChange} placement="top" showStatusDot={false} plain>
              <button
                type="button"
                className="flex items-center gap-1.5 rounded-l-md py-1.5 pl-2.5 pr-1 text-xs font-medium whitespace-nowrap text-foreground transition-colors hover:bg-muted/80"
              >
                {variantLabel(model ?? 'deepseek-v4-flash')}
                <ChevronDown className="size-2.5 text-tertiary" aria-hidden="true" />
              </button>
            </ModelSwitcher>
            <ReasoningControl
              level={effectiveReasoningLevel}
              onLevelChange={onReasoningLevelChange ?? (() => {})}
              supported={effectiveReasoningLevels}
              modelLabel={model ?? 'this model'}
              labels={model ? REASONING_LABELS[model] : undefined}
            />
          </div>
        )}

        {/* Creative split button: workflow picker + params (workflow-specific
            controls) — mirrors the LLM split: label half left, icon half
            right, one shared muted chip. */}
        {!hideCreative && (
          <div className="flex items-center rounded-md bg-muted">
            <WorkflowSelect
              selectedVariant={workflow}
              onSelectVariant={id => id && onWorkflowChange?.(id)}
              disabled={hasDocument}
              onExploreWorkflows={onExploreWorkflows}
              showStatusDot={false}
              triggerClassName="rounded-l-md pl-2.5 pr-1 text-foreground"
            />
            <button
              type="button"
              onClick={() => onParamsClick?.()}
              disabled={hasDocument || !onParamsClick}
              title="Parameters"
              aria-label="Parameters"
              className="relative flex items-center py-1.5 pl-1.5 pr-2.5 text-secondary transition-colors hover:bg-muted/80 disabled:pointer-events-none disabled:opacity-50"
            >
              {/* Filled gear built from the lucide "settings" path (lucide has
                  no filled variant): fill the gear silhouette, add the center
                  circle subpath, combine as subtraction via fillRule="evenodd"
                  — the break → subtract recipe. */}
              <svg viewBox="0 0 24 24" fill="currentColor" className="size-4" aria-hidden="true">
                <path
                  fillRule="evenodd"
                  d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z"
                />
              </svg>
              {hasStyleRef && (
                <span
                  className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-destructive ring-2 ring-muted"
                  aria-hidden="true"
                />
              )}
            </button>
          </div>
        )}

        {/* Prompt enhance */}
        {!hideEnhance && (
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          onClick={() => onEnhance?.()}
          title="Enhance prompt"
          aria-label="Enhance prompt"
          className={cn('rounded-[10px] text-foreground', enhanceActive && 'bg-muted text-foreground')}
        >
          <Sparkles className="size-4" aria-hidden="true" />
        </Button>
        )}

        {/* Send / Stop */}
        {isStreaming ? (
          <Button
            type="button"
            variant="destructive"
            size="icon-2xl"
            onClick={() => onStop?.()}
            title="Stop"
            aria-label="Stop generating"
            className="rounded-full"
          >
            <Square className="size-4 fill-current" aria-hidden="true" />
          </Button>
        ) : (
          <Button
            type="button"
            variant={hasContent ? 'default' : 'outline'}
            size="icon-2xl"
            onClick={handleSend}
            disabled={!hasContent || disabled}
            title="Send"
            aria-label="Send prompt"
            className="rounded-full"
          >
            <Send className="size-5" aria-hidden="true" />
          </Button>
        )}
      </div>
    </div>
  )
}
