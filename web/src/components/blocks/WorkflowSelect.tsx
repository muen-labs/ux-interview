import * as React from 'react'
import {
  Bookmark,
  Check,
  ChevronDown,
  Image as ImageIcon,
  List,
  Package,
  Power,
  SquareArrowOutUpRight,
  Video,
  X,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '../shadcn/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../shadcn/tooltip'
import { ScrollArea } from '../shadcn/scroll-area'
import { WORKFLOWS, isStubWorkflow, isRhWorkflow, type WorkflowId } from '../../services/workflows'
import { cn } from '../../lib/utils'

/** True when the picker item has no API route yet (stub in the registry). */
const stubOf = (id: string): boolean =>
  id in WORKFLOWS && isStubWorkflow(id as WorkflowId)

/** True when the workflow is a RunningHub custom workflow. */
const rhOf = (id: string): boolean =>
  id in WORKFLOWS && isRhWorkflow(id as WorkflowId)

/** localStorage key for bookmarked workflow IDs. */
const BOOKMARKS_KEY = 'claire-bookmarked-workflows'

/** Read bookmarked workflow IDs from localStorage. */
const loadBookmarks = (): Set<string> => {
  try {
    const raw = localStorage.getItem(BOOKMARKS_KEY)
    return raw ? new Set(JSON.parse(raw)) : new Set()
  } catch {
    return new Set()
  }
}

/** Persist bookmarked workflow IDs to localStorage. */
const saveBookmarks = (ids: Set<string>) => {
  try {
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify([...ids]))
  } catch { /* ignore quota errors */ }
}

// ---------------------------------------------------------------------------
// Types & workflow data
// ---------------------------------------------------------------------------

export interface WorkflowVariant {
  id: string
  label: string
}

export interface WorkflowFamily {
  id: string
  label: string
  variants: WorkflowVariant[]
}

/** Image model families with flyout variants (FO = flyout), per product spec.
 *  Ids are the canonical workflow-registry keys (src/services/workflows.ts).
 *  Confirmed workflows only (2 provider sources: Krea API + RH apps);
 *  krea2ControlNet is excluded until its RH node ids land. */
export const WORKFLOW_FAMILIES: WorkflowFamily[] = [
  {
    id: 'krea2',
    label: 'Krea 2',
    variants: [
      { id: 'krea2', label: 'Krea 2 Turbo' },
      { id: 'krea2Raw', label: 'Raw Realism' },
      { id: 'krea2Edit', label: 'Edit' },
    ],
  },
]

/** Image single-select workflows without a flyout — confirmed RH apps. */
export const SINGLE_WORKFLOWS: WorkflowVariant[] = [
  { id: 'krea2StyleRef', label: 'Krea 2 Style' },
  { id: 'sketchToImage', label: 'Art to Real' },
  { id: 'imageToSketch', label: 'Image to Line Art' },
  { id: 'qwenImageReversePrompt', label: 'Qwen Reverse Prompt' },
  { id: 'flux2DevEdit', label: 'Flux 2 Dev Edit' },
  { id: 'extractorPlus', label: 'Extractor+' },
]

/** Video model families - EMPTY: no video workflow ships until a provider
 *  route is confirmed (fal banned 2026-08-09; catalog video section is the
 *  plan). Qwen video (Wan 2.2) returns here as a static chip when wired. */
export const VIDEO_FAMILIES: WorkflowFamily[] = []

/** Video single-select workflows - empty (see VIDEO_FAMILIES). */
export const VIDEO_SINGLES: WorkflowVariant[] = []

/** Every selectable workflow for the AI card. Mitsu: no Auto (that was a
 *  Claire feature, sunset 2026-08-09) - workflow is always an explicit choice.
 *  Upscale (SeedVR2) is intentionally NOT here - its entry point is the asset
 *  card (image compare), not the AI card picker. */
export const ALL_WORKFLOW_OPTIONS: WorkflowVariant[] = [
  ...WORKFLOW_FAMILIES.flatMap(f => f.variants),
  ...VIDEO_FAMILIES.flatMap(f => f.variants),
  ...VIDEO_SINGLES,
  ...SINGLE_WORKFLOWS,
]

/** Map from variant ID to its family label for the Custom tab prefix. */
const FAMILY_MAP: Record<string, string> = {}
for (const f of [...WORKFLOW_FAMILIES, ...VIDEO_FAMILIES]) {
  for (const v of f.variants) {
    FAMILY_MAP[v.id] = f.label
  }
}

/** Format a workflow label with family prefix for the Custom tab. */
const customLabel = (w: WorkflowVariant): string => {
  const family = FAMILY_MAP[w.id]
  if (!family) return w.label
  // Avoid doubling: "Krea 2 AIO" already contains "Krea 2"
  if (w.label.toLowerCase().startsWith(family.toLowerCase())) return w.label
  return `${family} ${w.label}`
}

export interface WorkflowSelectProps {
  /** Currently selected variant id (null when Auto). */
  selectedVariant: string | null
  /** Select a variant - the caller applies it. */
  onSelectVariant: (id: string) => void
  /** Open on mount (story demo). */
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  /** Disable the trigger (e.g. a document is attached). */
  disabled?: boolean
  /** Show the leading status dot (default on; the composer's creative split
   *  hides it so the chip reads label + chevron, like the LLM split). */
  showStatusDot?: boolean
  /** Extra trigger classes - matches the AI card's control styling. */
  triggerClassName?: string
  /** Open the workflows lightbox from the menu footer. */
  onExploreWorkflows?: () => void
}

/** Default hover/selected color instead of the accent (brand) tint. */
const MENU_ITEM_CLASSES =
  'focus:!bg-muted focus:!text-foreground data-popup-open:!bg-muted data-popup-open:!text-foreground data-open:!bg-muted data-open:!text-foreground'

/**
 * Placeholder avatar for a workflow family - rounded-square 28x28 with the
 * initial. Replaced by real company logos later (Krea, OpenAI, Google...).
 * The shadcn Avatar primitive is circle-only, so this is a styled span.
 */
function FamilyAvatar({ label }: { label: string }) {
  return (
    <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-semibold text-muted-foreground">
      {label.slice(0, 1).toUpperCase()}
    </span>
  )
}

/** Family flyout group (image or video families) + direct singles. */
function FamilyMenu({
  families,
  singles,
  selectedVariant,
  onSelectVariant,
  bookmarks,
  onToggleBookmark,
}: {
  families: WorkflowFamily[]
  singles: WorkflowVariant[]
  selectedVariant: string | null
  onSelectVariant: (id: string) => void
  bookmarks: Set<string>
  onToggleBookmark: (id: string) => void
}) {
  return (
    <DropdownMenuGroup>
      {families.map(family => (
        <DropdownMenuSub key={family.id}>
          <DropdownMenuSubTrigger className={cn('gap-2 py-1.5 text-sm', MENU_ITEM_CLASSES)}>
            <FamilyAvatar label={family.label} />
            {family.label}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent sideOffset={4} alignOffset={-4} className="min-w-44 p-1">
            {family.variants.map(variant => {
              const active = selectedVariant === variant.id
              const bookmarked = bookmarks.has(variant.id)
              return (
                <DropdownMenuItem
                  key={variant.id}
                  onClick={() => onSelectVariant(variant.id)}
                  className={cn(
                    'gap-2 py-1.5 text-sm',
                    MENU_ITEM_CLASSES,
                    active && 'bg-muted font-medium'
                  )}
                >
                  <span className="min-w-0 flex-1 truncate">{variant.label}</span>
                  {stubOf(variant.id) && (
                    <span className="rounded-full bg-muted px-1.5 py-0.5 text-[0.6rem] font-medium text-muted-foreground">
                      TODO
                    </span>
                  )}
                  {rhOf(variant.id) && (
                    <span className="flex size-4 shrink-0 items-center justify-center rounded bg-blue-500/10 text-[0.6rem] font-semibold text-blue-500 dark:bg-blue-400/10 dark:text-blue-400">
                      C
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={e => { e.stopPropagation(); onToggleBookmark(variant.id) }}
                    className={cn(
                      'flex size-5 shrink-0 items-center justify-center rounded transition-colors hover:bg-muted',
                      bookmarked ? 'text-amber-400' : 'text-muted-foreground/30'
                    )}
                    aria-label={bookmarked ? `Unbookmark ${variant.label}` : `Bookmark ${variant.label}`}
                  >
                    <Bookmark className="size-3" fill={bookmarked ? 'currentColor' : 'none'} aria-hidden="true" />
                  </button>
                  {active && <Check className="size-3.5 shrink-0 text-success" aria-hidden="true" />}
                </DropdownMenuItem>
              )
            })}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      ))}
      {singles.map(workflow => {
        const active = selectedVariant === workflow.id
        const bookmarked = bookmarks.has(workflow.id)
        return (
          <DropdownMenuItem
            key={workflow.id}
            onClick={() => onSelectVariant(workflow.id)}
            className={cn(
              'gap-2 py-1.5 text-sm',
              MENU_ITEM_CLASSES,
              active && 'bg-muted font-medium'
            )}
          >
            <FamilyAvatar label={workflow.label} />
            <span className="min-w-0 flex-1 truncate">{workflow.label}</span>
            {stubOf(workflow.id) && (
              <span className="rounded-full bg-muted px-1.5 py-0.5 text-[0.6rem] font-medium text-muted-foreground">
                TODO
              </span>
            )}
            {rhOf(workflow.id) && (
              <span className="flex size-4 shrink-0 items-center justify-center rounded bg-blue-500/10 text-[0.6rem] font-semibold text-blue-500 dark:bg-blue-400/10 dark:text-blue-400">
                C
              </span>
            )}
            <button
              type="button"
              onClick={e => { e.stopPropagation(); onToggleBookmark(workflow.id) }}
              className={cn(
                'flex size-5 shrink-0 items-center justify-center rounded transition-colors hover:bg-muted',
                bookmarked ? 'text-amber-400' : 'text-muted-foreground/30'
              )}
              aria-label={bookmarked ? `Unbookmark ${workflow.label}` : `Bookmark ${workflow.label}`}
            >
              <Bookmark className="size-3" fill={bookmarked ? 'currentColor' : 'none'} aria-hidden="true" />
            </button>
            {active && <Check className="size-3.5 shrink-0 text-success" aria-hidden="true" />}
          </DropdownMenuItem>
        )
      })}
    </DropdownMenuGroup>
  )
}

/**
 * Workflow picker - dropdown above the AI card. Icon-only tabs:
 * Image/Video (flyout menus), List (all flattened). Upscale lives on the
 * asset card (image compare), not here. Content per product spec; ids
 * pending krea.ai / RunningHub API.
 */
export function WorkflowSelect({
  selectedVariant,
  onSelectVariant,
  defaultOpen = false,
  onOpenChange,
  disabled = false,
  showStatusDot = true,
  triggerClassName,
  onExploreWorkflows,
}: WorkflowSelectProps) {
  const [tab, setTab] = React.useState<'image' | 'video' | 'custom' | 'bookmarked' | 'list'>('image')
  const [bookmarks, setBookmarks] = React.useState<Set<string>>(loadBookmarks)

  const toggleBookmark = React.useCallback((id: string) => {
    setBookmarks(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      saveBookmarks(next)
      return next
    })
  }, [])

  const bookmarkedWorkflows = React.useMemo(
    () => ALL_WORKFLOW_OPTIONS.filter(w => bookmarks.has(w.id)),
    [bookmarks]
  )

  const customWorkflows = React.useMemo(
    () => ALL_WORKFLOW_OPTIONS.filter(w => rhOf(w.id)),
    []
  )

  /** The composer always resolves an unset workflow to the image default
   *  (ChatBlock: `variantId ?? 'krea2'`), so the trigger shows that
   *  variant's label rather than a placeholder that can never appear. */
  const selectedLabel =
    ALL_WORKFLOW_OPTIONS.find(w => w.id === selectedVariant)?.label ??
    ALL_WORKFLOW_OPTIONS.find(w => w.id === 'krea2')?.label ??
    'Select workflow'

  /** Trigger styled like the header LLM switcher: status dot + label + chevron. */
  const trigger = (
    <button
      type="button"
      aria-label="Select workflow"
      disabled={disabled}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md bg-muted px-2.5 py-1.5 text-xs font-medium whitespace-nowrap text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground disabled:pointer-events-none disabled:opacity-50',
        triggerClassName
      )}
    >
      {showStatusDot && (
        <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-muted-foreground/60" />
      )}
      {selectedLabel}
      <ChevronDown className="size-2.5 text-muted-foreground" aria-hidden="true" />
    </button>
  )

  if (disabled) return trigger

  const tabs = [
    { id: 'image' as const, label: 'Image', icon: ImageIcon },
    { id: 'video' as const, label: 'Video', icon: Video },
    { id: 'custom' as const, label: 'Custom', icon: Package },
    { id: 'bookmarked' as const, label: 'Bookmarked', icon: Bookmark },
    { id: 'list' as const, label: 'Show all', icon: List },
  ]

  /** Compact selectable row - no icon (used by the flat list). */
  const renderRow = (workflow: WorkflowVariant, extraClass?: string, centered = false) => {
    const active = selectedVariant === workflow.id
    const bookmarked = bookmarks.has(workflow.id)
    return (
      <div
        key={workflow.id}
        className={cn(
          'flex items-center gap-1.5 rounded-md px-2 py-1 text-left text-sm transition-colors hover:bg-muted',
          active && 'bg-muted font-medium',
          extraClass
        )}
      >
        <button
          type="button"
          onClick={() => onSelectVariant(workflow.id)}
          className={cn('min-w-0 truncate text-left', !centered && 'flex-1')}
        >
          {workflow.label}
        </button>
        {stubOf(workflow.id) && (
          <span className="rounded-full bg-muted px-1.5 py-0.5 text-[0.6rem] font-medium text-muted-foreground">
            TODO
          </span>
        )}
        {rhOf(workflow.id) && (
          <span className="flex size-4 shrink-0 items-center justify-center rounded bg-blue-500/10 text-[0.6rem] font-semibold text-blue-500 dark:bg-blue-400/10 dark:text-blue-400">
            C
          </span>
        )}
        <button
          type="button"
          onClick={e => { e.stopPropagation(); toggleBookmark(workflow.id) }}
          className={cn(
            'flex size-5 shrink-0 items-center justify-center rounded transition-colors hover:bg-muted',
            bookmarked ? 'text-amber-400' : 'text-muted-foreground/30'
          )}
          aria-label={bookmarked ? `Unbookmark ${workflow.label}` : `Bookmark ${workflow.label}`}
        >
          <Bookmark className="size-3" fill={bookmarked ? 'currentColor' : 'none'} aria-hidden="true" />
        </button>
        {active && <Check className="size-3.5 shrink-0 text-success" aria-hidden="true" />}
      </div>
    )
  }

  return (
    <DropdownMenu defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger render={trigger} />
      <DropdownMenuContent
        side="top"
        align="start"
        sideOffset={8}
        className="w-64 rounded-lg p-1"
      >
        {/* Header */}
        <div className="flex items-start justify-between px-2 pt-1.5 pb-1">
          <div>
            <h2 className="text-sm font-semibold">Select Workflow</h2>
            <p className="text-xs text-muted-foreground">Choose the right workflow</p>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange?.(false)}
            title="Close"
            aria-label="Close workflow picker"
            className="flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="size-3.5" aria-hidden="true" />
          </button>
        </div>

        {/* Icon-only Image / Video / Custom / List tabs */}

        {/* Icon-only Image / Video / Custom / List tabs */}
        <div className="px-2 py-2">
          <div className="inline-flex items-center gap-0.5 rounded-lg bg-muted p-0.5">
            <TooltipProvider delayDuration={200}>
              {tabs.map(t => {
                const Icon = t.icon
                const active = tab === t.id
                return (
                  <Tooltip key={t.id}>
                    <TooltipTrigger
                      render={
                        <button
                          type="button"
                          aria-label={t.label}
                          onClick={() => setTab(t.id)}
                          className={cn(
                            'flex size-6 items-center justify-center rounded-md transition-colors',
                            active
                              ? 'bg-popover text-popover-foreground shadow-sm'
                              : 'text-muted-foreground hover:text-foreground'
                          )}
                        />
                      }
                    >
                      <Icon className="size-3.5" aria-hidden="true" />
                    </TooltipTrigger>
                    <TooltipContent side="bottom" showArrow={false}>
                      {t.label}
                    </TooltipContent>
                  </Tooltip>
                )
              })}
            </TooltipProvider>
          </div>
        </div>

        {/* Separator between the tab switcher and the menu content. */}
        <div className="-mx-1 border-t border-border/60" />

        {/* Tab content - compact wrapped rows, not stretched cells. */}
        {tab === 'custom' ? (
          <ScrollArea className="h-80">
            <div className="p-1">
              {customWorkflows.map(w => {
              const active = selectedVariant === w.id
              const bookmarked = bookmarks.has(w.id)
              const label = customLabel(w)
              return (
                <div
                  key={w.id}
                  className={cn(
                    'flex items-center gap-1.5 rounded-md px-2 py-1 text-left text-sm transition-colors hover:bg-muted',
                    active && 'bg-muted font-medium'
                  )}
                >
                  <button
                    type="button"
                    onClick={() => onSelectVariant(w.id)}
                    className="min-w-0 flex-1 truncate text-left"
                  >
                    {label}
                  </button>
                  {stubOf(w.id) && (
                    <span className="rounded-full bg-muted px-1.5 py-0.5 text-[0.6rem] font-medium text-muted-foreground">
                      TODO
                    </span>
                  )}
                  {rhOf(w.id) && (
                    <span className="flex size-4 shrink-0 items-center justify-center rounded bg-blue-500/10 text-[0.6rem] font-semibold text-blue-500 dark:bg-blue-400/10 dark:text-blue-400">
                      C
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={e => { e.stopPropagation(); toggleBookmark(w.id) }}
                    className={cn(
                      'flex size-5 shrink-0 items-center justify-center rounded transition-colors hover:bg-muted',
                      bookmarked ? 'text-amber-400' : 'text-muted-foreground/30'
                    )}
                    aria-label={bookmarked ? `Unbookmark ${label}` : `Bookmark ${label}`}
                  >
                    <Bookmark className="size-3" fill={bookmarked ? 'currentColor' : 'none'} aria-hidden="true" />
                  </button>
                  {active && <Check className="size-3.5 shrink-0 text-success" aria-hidden="true" />}
                </div>
              )
            })}
            </div>
          </ScrollArea>
        ) : tab === 'bookmarked' ? (
          bookmarkedWorkflows.length > 0 ? (
            <ScrollArea className="h-80">
              <div className="p-1">{bookmarkedWorkflows.map(w => renderRow(w))}</div>
            </ScrollArea>
          ) : (
            <div className="px-3 py-5 text-center text-xs text-muted-foreground">
              No bookmarked workflows yet
              <br />
              Tap the{' '}
              <Bookmark className="inline size-3 text-muted-foreground/30" aria-hidden="true" />{' '}
              bookmark to save frequently used workflows.
            </div>
          )
        ) : tab === 'video' ? (
          <FamilyMenu
            families={VIDEO_FAMILIES}
            singles={VIDEO_SINGLES}
            selectedVariant={selectedVariant}
            onSelectVariant={onSelectVariant}
            bookmarks={bookmarks}
            onToggleBookmark={toggleBookmark}
          />
        ) : tab === 'list' ? (
          <ScrollArea className="h-80">
            <div className="p-1">
              {WORKFLOW_FAMILIES.map(family => (
              <div key={family.id} className="mb-1">
                <p className="flex items-center gap-1.5 px-2 pt-1.5 pb-0.5 text-xs font-medium text-muted-foreground">
                  <FamilyAvatar label={family.label} />
                  {family.label}
                </p>
                <div className="pl-4">
                  {family.variants.map(variant => renderRow(variant))}
                </div>
              </div>
            ))}
            <div className="my-1 border-t border-border/60" />
            {VIDEO_FAMILIES.map(family => (
              <div key={family.id} className="mb-1">
                <p className="flex items-center gap-1.5 px-2 pt-1.5 pb-0.5 text-xs font-medium text-muted-foreground">
                  <FamilyAvatar label={family.label} />
                  {family.label}
                </p>
                <div className="pl-4">
                  {family.variants.map(variant => renderRow(variant))}
                </div>
              </div>
            ))}
            {VIDEO_SINGLES.map(w => renderRow(w))}
            <div className="my-1 border-t border-border/60" />
            {SINGLE_WORKFLOWS.map(w => renderRow(w))}
            </div>
          </ScrollArea>
        ) : (
          <FamilyMenu
            families={WORKFLOW_FAMILIES}
            singles={SINGLE_WORKFLOWS}
            selectedVariant={selectedVariant}
            onSelectVariant={onSelectVariant}
            bookmarks={bookmarks}
            onToggleBookmark={toggleBookmark}
          />
        )}


        {/* Menu-wide footer - opens the workflows lightbox. */}
        {onExploreWorkflows && (
          <div className="-mx-1 border-t border-border/60 px-2 py-1.5">
            <button
              type="button"
              onClick={onExploreWorkflows}
              className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              Explore Workflows
              <SquareArrowOutUpRight className="size-3.5" aria-hidden="true" />
            </button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default WorkflowSelect
