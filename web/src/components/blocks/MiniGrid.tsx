import * as React from 'react'
import { Check, Search, X } from 'lucide-react'
import { ScrollArea } from '../shadcn/scroll-area'
import { ToggleGroup, ToggleGroupItem } from '../shadcn/toggle-group'
import { cn } from '../../lib/utils'
import krea2StyleThumbs from '../../data/krea2-style-thumbs.json'

// ---------------------------------------------------------------------------
// Shared mini grid pattern - header (title / search / close), category tabs,
// square thumbnail cards. Used by the asset library (AssetMiniGrid) and the
// Krea style library (KreaStylesMiniGrid) - both are the same pattern with
// different data.
// ---------------------------------------------------------------------------

export interface MiniGridItem {
  id: string
  title: string
  thumb: string
  /** Optional tab id (defaults to 'all'). */
  tab?: string
  subtitle?: string
}

export interface MiniGridTab {
  id: string
  label: string
}

export interface MiniGridProps {
  items: MiniGridItem[]
  /** Tab ids, e.g. [{id:'all',label:'All'},...]. Defaults to a single All tab. */
  tabs?: MiniGridTab[]
  /** Selected id (single) or ids (multiple). */
  value?: string | string[]
  onChange?: (id: string) => void
  multiple?: boolean
  searchPlaceholder?: string
  emptyLabel?: string
  /** Header title. */
  title: string
  /** Close button (closes the popover). */
  onClose?: () => void
  /** Grid columns for the thumbnails. */
  cols?: 2 | 3 | 4 | 5 | 6 | 7
  /** Width class (default w-72; the Composer usage passes w-full max-w-2xl). */
  widthClass?: string
  /** Explicit scroll height in px (inherited from the triggering card).
   *  Falls back to the h-64 class when unset. */
  height?: number
  /** Max selectable items (multi-select). Unselected tiles disable at the limit. */
  max?: number
  className?: string
}

/** Columns class per `cols`. */
const GRID_COLS: Record<number, string> = {
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  5: 'grid-cols-5',
  6: 'grid-cols-6',
  7: 'grid-cols-7',
}

/** Selected-state fill for the category toggles. */
const PRESSED =
  'data-pressed:border-foreground data-pressed:bg-foreground data-pressed:text-background'

/** Resolve the ambient theme from the html class set by applyTheme / Storybook. */
function ambientTheme(): 'light' | 'dark' {
  if (typeof document === 'undefined') return 'light'
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

/**
 * Live ambient theme - re-renders when the html class changes. The Storybook
 * theme addon applies the class in an effect AFTER render, so reading it once
 * at mount leaves the inverse compound stale until the next render. Watching
 * the class closes that gap.
 */
export function useAmbientTheme(): 'light' | 'dark' {
  const [theme, setTheme] = React.useState<'light' | 'dark'>(ambientTheme)
  React.useEffect(() => {
    const el = document.documentElement
    const update = () => setTheme(ambientTheme())
    update()
    const mo = new MutationObserver(update)
    mo.observe(el, { attributes: true, attributeFilter: ['class'] })
    return () => mo.disconnect()
  }, [])
  return theme
}

export function MiniGrid({
  items,
  tabs,
  value,
  onChange,
  multiple = false,
  searchPlaceholder = 'Search',
  emptyLabel = 'Nothing found',
  title,
  onClose,
  cols = 2,
  widthClass = 'w-72',
  height,
  max,
  className,
}: MiniGridProps) {
  const theme = useAmbientTheme()
  const [tab, setTab] = React.useState(tabs?.[0]?.id ?? 'all')
  const [searching, setSearching] = React.useState(false)
  const [query, setQuery] = React.useState('')
  const selected = Array.isArray(value) ? value : value ? [value] : []

  const filtered = items.filter(
    item =>
      (tab === 'all' || item.tab === tab) &&
      (query.trim() === '' || item.title.toLowerCase().includes(query.trim().toLowerCase()))
  )

  return (
    <div
      className={cn(
        'flex flex-col gap-2 rounded-lg border border-border bg-background p-2 text-foreground shadow-md ring-1 ring-foreground/10',
        theme === 'light' ? 'dark' : 'light',
        widthClass,
        className
      )}
    >
      {/* Header - title + search/close; search bar takes over when active. */}
      {searching ? (
        <div className="relative">
          <Search className="absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Escape' && setSearching(false)}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            autoFocus
            className="h-7 w-full rounded-md border border-border bg-transparent pr-7 pl-7 text-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring"
          />
          <button
            type="button"
            onClick={() => (query ? setQuery('') : setSearching(false))}
            aria-label={query ? 'Clear search' : 'Close search'}
            className="absolute top-1/2 right-1.5 -translate-y-1/2 text-muted-foreground/60 transition-colors hover:text-foreground"
          >
            <X className="size-3" aria-hidden="true" />
          </button>
        </div>
      ) : (
        <div className="flex h-7 items-center justify-between">
          <span className="text-xs font-semibold">{title}</span>
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => setSearching(true)}
              aria-label="Search"
              className="flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Search className="size-3.5" aria-hidden="true" />
            </button>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="size-3.5" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Category tabs - size to label width. */}
      {tabs && tabs.length > 1 && (
        <ToggleGroup
          value={[tab]}
          onValueChange={(v) => v[0] && setTab(v[0])}
          variant="outline"
          size="sm"
          spacing={4}
        >
          {tabs.map(t => (
            <ToggleGroupItem
              key={t.id}
              value={t.id}
              className={`px-2 py-0.5 text-[0.65rem] ${PRESSED}`}
            >
              {t.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      )}

      {/* Grid of square mini cards */}
      <ScrollArea className={cn('pr-1', !height && 'h-64')} style={height ? { height } : undefined}>
        <div className={cn('grid gap-1.5', GRID_COLS[cols])}>
        {filtered.map(item => {
          const isSelected = selected.includes(item.id)
          const atLimit = multiple && max != null && !isSelected && selected.length >= max
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChange?.(item.id)}
              aria-pressed={isSelected}
              disabled={atLimit}
              className={cn(
                'group relative flex flex-col gap-1 overflow-hidden rounded-md p-1 text-left transition-all duration-150 hover:scale-105 hover:bg-muted disabled:pointer-events-none disabled:opacity-40',
                isSelected && 'bg-muted'
              )}
            >
              <span className="relative aspect-square w-full overflow-hidden rounded-md bg-muted">
                <img src={item.thumb} alt="" className="size-full object-cover" />
                {/* Hover overlay - darken + show the label. */}
                <span className="absolute inset-0 flex items-end bg-black/0 transition-colors duration-150 group-hover:bg-black/45">
                  <span className="truncate px-1.5 pb-1 text-[0.6rem] font-medium text-white opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                    {item.title}
                  </span>
                </span>
                {isSelected && (
                  <span className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-foreground text-background shadow">
                    <Check className="size-2.5" aria-hidden="true" />
                  </span>
                )}
              </span>
            </button>
          )
        })}
        {filtered.length === 0 && (
          <p className="col-span-2 py-4 text-center text-xs text-muted-foreground">{emptyLabel}</p>
        )}
        </div>
      </ScrollArea>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Krea style library - the real curated catalog (src/data/krea2-style-thumbs.json,
// 285 styles, english categories, real thumbnail paths).
// ---------------------------------------------------------------------------

export interface KreaStyle extends MiniGridItem {}

interface KreaStyleThumbEntry {
  id: string
  name: string
  file: string
  thumb: string
  category: string
  desc?: string
}

/** The real Krea style catalog (285 styles) as MiniGrid items. */
export const KREA_STYLES: KreaStyle[] = (krea2StyleThumbs as KreaStyleThumbEntry[]).map(s => ({
  id: s.id,
  title: s.name,
  thumb: s.thumb,
  tab: s.category,
}))

const titleCase = (s: string) => s.replace(/\b\w/g, c => c.toUpperCase())

/** Categories from the catalog (english), plus All. */
export const KREA_STYLE_TABS: MiniGridTab[] = [
  { id: 'all', label: 'All' },
  ...[...new Set(KREA_STYLES.map(s => s.tab ?? '').filter(Boolean))].map(id => ({ id, label: titleCase(id) })),
]

/** Pick one Krea style (single select). */
export function KreaStylesMiniGrid({
  value,
  onChange,
  onClose,
  cols,
  widthClass,
  height,
  className,
}: {
  value?: string
  onChange?: (id: string) => void
  onClose?: () => void
  cols?: 2 | 3 | 4 | 5 | 6 | 7
  widthClass?: string
  height?: number
  className?: string
}) {
  return (
    <MiniGrid
      items={KREA_STYLES}
      tabs={KREA_STYLE_TABS}
      value={value}
      onChange={onChange}
      searchPlaceholder="Search styles"
      emptyLabel="No style matches"
      title="Krea Styles"
      onClose={onClose}
      cols={cols}
      widthClass={widthClass}
      height={height}
      className={className}
    />
  )
}

// ---------------------------------------------------------------------------
// Asset library - same pattern, different data (mock until the asset API is
// wired; the real flow opens AssetBrowserBlock).
// ---------------------------------------------------------------------------

export interface AssetGridItem extends MiniGridItem {}

export const MOCK_ASSETS: AssetGridItem[] = [
  { id: 'asset-1', title: 'Lookbook 01', tab: 'image', thumb: 'https://picsum.photos/seed/asset-photo-1/160/160', subtitle: 'Photo' },
  { id: 'asset-2', title: 'Runway 02', tab: 'image', thumb: 'https://picsum.photos/seed/asset-photo-2/160/160', subtitle: 'Photo' },
  { id: 'asset-3', title: 'Flat lay 03', tab: 'image', thumb: 'https://picsum.photos/seed/asset-photo-3/160/160', subtitle: 'Photo' },
  { id: 'asset-4', title: 'Detail 04', tab: 'image', thumb: 'https://picsum.photos/seed/asset-photo-4/160/160', subtitle: 'Photo' },
  { id: 'asset-5', title: 'Satin 01', tab: 'image', thumb: 'https://picsum.photos/seed/asset-tex-1/160/160', subtitle: 'Texture' },
  { id: 'asset-6', title: 'Knit 02', tab: 'image', thumb: 'https://picsum.photos/seed/asset-tex-2/160/160', subtitle: 'Texture' },
  { id: 'asset-7', title: 'Denim 03', tab: 'image', thumb: 'https://picsum.photos/seed/asset-tex-3/160/160', subtitle: 'Texture' },
  { id: 'asset-8', title: 'Tote mock', tab: 'image', thumb: 'https://picsum.photos/seed/asset-mock-1/160/160', subtitle: 'Mockup' },
  { id: 'asset-9', title: 'Campaign 01', tab: 'video', thumb: 'https://picsum.photos/seed/asset-video-1/160/160', subtitle: 'Video' },
  { id: 'asset-10', title: 'Lookbook reel', tab: 'video', thumb: 'https://picsum.photos/seed/asset-video-2/160/160', subtitle: 'Video' },
  { id: 'asset-11', title: 'Behind the scenes', tab: 'video', thumb: 'https://picsum.photos/seed/asset-video-3/160/160', subtitle: 'Video' },
]

export const ASSET_GRID_TABS: MiniGridTab[] = [
  { id: 'all', label: 'All' },
  { id: 'image', label: 'Image' },
  { id: 'video', label: 'Video' },
]

/** Pick reference images from the asset library (multi select). */
export function AssetMiniGrid({
  value,
  onChange,
  onClose,
  cols,
  widthClass,
  height,
  max,
  className,
}: {
  value?: string[]
  onChange?: (id: string) => void
  onClose?: () => void
  cols?: 2 | 3 | 4 | 5 | 6 | 7
  widthClass?: string
  height?: number
  max?: number
  className?: string
}) {
  return (
    <MiniGrid
      items={MOCK_ASSETS}
      tabs={ASSET_GRID_TABS}
      value={value}
      onChange={onChange}
      multiple
      searchPlaceholder="Search assets"
      emptyLabel="No assets match"
      title="Assets"
      onClose={onClose}
      cols={cols}
      widthClass={widthClass}
      height={height}
      max={max}
      className={className}
    />
  )
}
