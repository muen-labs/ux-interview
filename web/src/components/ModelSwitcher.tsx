import { type ReactNode } from 'react'
import { ChevronDown, } from 'lucide-react'
import FlyoutMenu, { type FlyoutMenuGroup } from './FlyoutMenu'
import { cn } from '../lib/utils'

export type ChatModel =
  | 'deepseek-v4-flash' | 'deepseek-v4-pro'
  | 'mimo-v2-flash' | 'mimo-v2.5' | 'mimo-v2.5-pro'
  | 'qwen-max' | 'qwen-plus' | 'qwen-vl-plus' | 'qwen-vl-turbo'
  | 'qwen3-vl-plus' | 'qwen3-vl-235b'
  | 'claude-sonnet-5' | 'claude-haiku-4-5'
  | 'kimi-k2'
  | 'gemini-2.5-pro' | 'gemini-2.5-flash' | 'gemini-2.0-flash'
  | 'gpt-4o-mini' | 'o4-mini'

interface ModelVariant {
  id: ChatModel
  label: string
}

interface ModelProvider {
  name: string
  enabled: boolean
  variants: ModelVariant[]
}

const MODEL_GROUPS: ModelProvider[] = [
  {
    name: 'DeepSeek', enabled: true,
    variants: [
      { id: 'deepseek-v4-flash', label: 'V4 Flash 0731' },
      { id: 'deepseek-v4-pro', label: 'V4 Pro' },
    ],
  },
  {
    name: 'MiMo', enabled: true,
    variants: [
      { id: 'mimo-v2.5', label: 'MiMo V2.5' },
      { id: 'mimo-v2.5-pro', label: 'MiMo V2.5 Pro' },
      { id: 'mimo-v2-flash', label: 'MiMo V2 Flash' },
    ],
  },
  {
    name: 'Aliyun Qwen', enabled: true,
    variants: [
      { id: 'qwen3-vl-plus', label: 'Qwen 3 VL Plus' },
      { id: 'qwen3-vl-235b', label: 'Qwen 3 VL 235B' },
      { id: 'qwen-max', label: 'Qwen Max' },
      { id: 'qwen-plus', label: 'Qwen Plus' },
      { id: 'qwen-vl-plus', label: 'Qwen VL Plus' },
      { id: 'qwen-vl-turbo', label: 'Qwen VL Turbo' },
    ],
  },
  {
    name: 'Moonshot', enabled: true,
    variants: [
      { id: 'kimi-k2', label: 'Kimi K2' },
    ],
  },
  {
    name: 'Claude', enabled: false,
    variants: [
      { id: 'claude-sonnet-5', label: 'Sonnet 5' },
      { id: 'claude-haiku-4-5', label: 'Haiku 4.5' },
    ],
  },
  {
    name: 'Google Gemini', enabled: false,
    variants: [
      { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
      { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
      { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
    ],
  },
  {
    name: 'OpenAI', enabled: false,
    variants: [
      { id: 'gpt-4o-mini', label: 'GPT-4o Mini' },
      { id: 'o4-mini', label: 'o4-mini' },
    ],
  },
]

export interface ModelSwitcherProps {
  model: ChatModel
  onChange: (model: ChatModel) => void
  children?: ReactNode
  placement?: 'bottom' | 'top'
  assistantEnabled?: boolean
  onAssistantToggle?: () => void
  status?: 'idle' | 'ready' | 'streaming' | 'error' | 'degraded'
  showStatusDot?: boolean
  /** Render without bg/radius — for use inside a shared split-button chip. */
  plain?: boolean
}

export function variantLabel(id: ChatModel): string {
  for (const g of MODEL_GROUPS) {
    const v = g.variants.find(v => v.id === id)
    if (v) return v.label
  }
  return id
}

export const VISION_MODELS = new Set<string>([
    'mimo-v2.5',
    'qwen-vl-plus', 'qwen-vl-turbo',
    'qwen3-vl-plus', 'qwen3-vl-235b',
    'claude-sonnet-5', 'claude-haiku-4-5',
    'gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.0-flash',
    'gpt-4o-mini', 'o4-mini',
  ])

  function buildGroups(): FlyoutMenuGroup[] {
  return [
    ...MODEL_GROUPS.map(group => ({
      id: group.name,
      label: group.name,
      items: group.variants.map(v => ({
        id: v.id,
        label: v.label,
        badge: VISION_MODELS.has(v.id) ? 'Vision' : 'Text',
        badgeIcon: (VISION_MODELS.has(v.id) ? 'vision' : 'text') as 'text' | 'vision',
        locked: !group.enabled,
      })),
    })),
  ]
}

export default function ModelSwitcher({ model, onChange, children, placement = 'bottom', status, showStatusDot = true, plain = false }: ModelSwitcherProps) {
  const statusDot = () => {
    if (status === 'streaming') {
      return (
        <span
          aria-hidden="true"
          className="inline-block size-2 shrink-0 animate-spin rounded-full border-2 border-muted-foreground border-t-primary"
        />
      )
    }
    const colors: Record<string, string> = { idle: 'bg-emerald-500', ready: 'bg-emerald-500', error: 'bg-destructive', degraded: 'bg-amber-500' }
    return <span aria-hidden="true" className={cn('size-2 shrink-0 rounded-full', colors[status || 'idle'] || 'bg-emerald-500')} />
  }

  return (
    <FlyoutMenu
      groups={buildGroups()}
      selectedId={model}
      onSelect={(id) => onChange(id as ChatModel)}
      size="md"
      placement={placement}
    >
      {children ?? (
        <button
          className={plain
            ? 'inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground'
            : 'inline-flex items-center gap-1.5 rounded-md bg-muted px-2.5 py-1 text-xs font-medium whitespace-nowrap text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground'}
        >
          {showStatusDot && statusDot()}
          {variantLabel(model)}
          <ChevronDown className="size-2.5 text-muted-foreground" />
        </button>
      )}
    </FlyoutMenu>
  )
}
