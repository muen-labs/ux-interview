import { Check, ChevronDown, Sparkles } from 'lucide-react'
import { Button } from '../shadcn/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../shadcn/dropdown-menu'
import { cn } from '../../lib/utils'

export interface ContextFolder {
  id: string
  name: string
  /** Subfolders (folder pickers can browse/select folders at any depth). */
  children?: ContextFolder[]
}

/**
 * ContextChip - the single source of truth for Claire's working context.
 * View navigation (folder switchers, opening docs) never changes context;
 * only this control does. Rendered next to where the user talks to Claire.
 */
export function ContextChip({
  folder,
  folders,
  onChange,
}: {
  /** Currently focused folder. */
  folder: ContextFolder | null
  /** All folders the user can focus Claire on. */
  folders: ContextFolder[]
  /** Called with the id of the newly focused folder. */
  onChange?: (id: string) => void
}) {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/60 py-1 pl-3 pr-1">
      <Sparkles className="size-3.5 shrink-0 text-primary" aria-hidden="true" />
      <span className="text-xs text-muted-foreground">Claire is working in</span>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant="ghost" size="xs" />}
          className="gap-1 px-1.5"
          aria-label="Change Claire's working folder"
        >
          <span className="text-xs font-medium">{folder?.name ?? 'No folder'}</span>
          <ChevronDown className="size-3 text-muted-foreground" aria-hidden="true" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-44">
          {folders.map(f => (
            <DropdownMenuItem
              key={f.id}
              onClick={() => onChange?.(f.id)}
              aria-pressed={folder?.id === f.id}
            >
              <Check
                className={cn('size-4', folder?.id === f.id ? 'opacity-100' : 'opacity-0')}
                aria-hidden="true"
              />
              {f.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
