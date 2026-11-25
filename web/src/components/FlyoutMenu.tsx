import { type ReactNode } from 'react'
import { Check, Lock, Eye } from 'lucide-react'

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuSeparator,
} from './shadcn/dropdown-menu'
import { cn } from '@/lib/utils'

// ── Types (public API unchanged) ──

export type FlyoutMenuSize = 'sm' | 'md'

export interface FlyoutMenuItem {
  id: string
  label: string
  badge?: string
  badgeIcon?: 'text' | 'vision'
  disabled?: boolean
  locked?: boolean
}

export interface FlyoutMenuGroup {
  id: string
  label: string
  items: FlyoutMenuItem[]
  flyoutHeader?: ReactNode
  footer?: ReactNode
}

export type FlyoutMenuPlacement = 'bottom' | 'top'

export interface FlyoutMenuProps {
  groups: FlyoutMenuGroup[]
  selectedId?: string
  onSelect?: (itemId: string) => void
  children: ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  size?: FlyoutMenuSize
  placement?: FlyoutMenuPlacement
  panelHeader?: ReactNode
  fullWidth?: boolean
}

// ── Badge ──

function Badge({ item, compact }: { item: FlyoutMenuItem; compact: boolean }) {
  if (!item.badge) return null
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 font-medium whitespace-nowrap',
        compact ? 'text-[9px]' : 'text-[10px]',
        item.badgeIcon === 'vision'
          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'
          : 'bg-muted text-muted-foreground'
      )}
    >
      {item.badgeIcon === 'vision' ? (
        <Eye className="size-3" />
      ) : (
        <span className="font-mono font-bold">T</span>
      )}
      {item.badge}
    </span>
  )
}

// ── Item row ──

interface FlyoutItemRowProps {
  item: FlyoutMenuItem
  selected: boolean
  compact: boolean
  onSelect?: (itemId: string) => void
}

function FlyoutItemRow({ item, selected, compact, onSelect }: FlyoutItemRowProps) {
  const locked = !!item.locked
  const disabled = locked || !!item.disabled
  return (
    <DropdownMenuItem
      disabled={disabled}
      onClick={() => !disabled && onSelect?.(item.id)}
      className={cn(
        'gap-2',
        compact ? 'py-1 text-xs' : 'py-1.5',
        locked && 'cursor-not-allowed opacity-60',
        selected && 'bg-primary/10 font-medium text-foreground'
      )}
    >
      {locked && <Lock className="size-3.5 shrink-0 text-muted-foreground/60" />}
      <span className="min-w-0 flex-1 truncate whitespace-nowrap">{item.label}</span>
      <Badge item={item} compact={compact} />
      {selected && <Check className="size-3.5 shrink-0 text-primary" />}
    </DropdownMenuItem>
  )
}

// ── FlyoutMenu ──

/**
 * FlyoutMenu — data-driven grouped menu with per-group hover flyouts.
 * Composed over the shadcn/Base UI menu primitives: each group is a Sub menu
 * whose flyout opens on hover; positioning, portals, focus and keyboard
 * navigation are handled by the primitive.
 */
export default function FlyoutMenu({
  groups,
  selectedId,
  onSelect,
  children,
  open: controlledOpen,
  onOpenChange,
  size = 'md',
  placement = 'bottom',
  panelHeader,
  fullWidth,
}: FlyoutMenuProps) {
  const compact = size === 'sm'
  return (
    <DropdownMenu open={controlledOpen} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger render={<span className={fullWidth ? 'block' : 'inline-block'} />} nativeButton={false}>
        {children}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side={placement === 'top' ? 'top' : 'bottom'}
        align="start"
        sideOffset={6}
        className={cn('p-1.5', compact ? 'min-w-40 p-1' : 'min-w-60')}
      >
        {panelHeader}
        {groups.map((group) => (
          <DropdownMenuSub key={group.id}>
            <DropdownMenuSubTrigger
              openOnHover
              delay={0}
              className={cn('gap-2', compact ? 'py-1 text-xs' : 'py-1.5')}
            >
              <span className="min-w-0 flex-1 truncate font-medium">{group.label}</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent
              sideOffset={4}
              className={cn('p-1.5', compact ? 'min-w-36 p-1' : 'min-w-48')}
            >
              {group.flyoutHeader}
              <DropdownMenuGroup>
                {group.items.length === 0 ? (
                  <div className="px-3 py-2 text-center text-xs text-muted-foreground">
                    No options
                  </div>
                ) : (
                  group.items.map((item) => (
                    <FlyoutItemRow
                      key={item.id}
                      item={item}
                      selected={selectedId === item.id}
                      compact={compact}
                      onSelect={onSelect}
                    />
                  ))
                )}
              </DropdownMenuGroup>
              {group.footer && (
                <>
                  <DropdownMenuSeparator />
                  {group.footer}
                </>
              )}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
