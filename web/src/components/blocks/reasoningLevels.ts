import type { ChatModel } from '../ModelSwitcher'
import type { ReasoningLevel } from './ReasoningControl'

/**
 * Reasoning effort per LLM — mirrors the Reasoning column in
 * `product/strategy/provider-catalog.md` (LLM slot). Auto is always offered
 * (Claire feature); the remaining levels follow what the provider exposes:
 * OpenAI = effort tiers (low/medium/high/xhigh → ultra), everyone else =
 * on/off thinking.
 */
export const REASONING_LEVELS_BY_MODEL: Record<string, ReasoningLevel[]> = {
  // OpenAI (ChatGPT) — user-observed levels: Light / Medium / High /
  // Extra High (no off).
  'gpt-4o-mini': ['low', 'medium', 'high', 'ultra'],
  'o4-mini': ['low', 'medium', 'high', 'ultra'],

  // DeepSeek — off / high / max (Reasonix-observed; API docs confirm the
  // reasoning_effort param but don't enumerate values. Kun's "ultra" is
  // presumed to be its label for max.)
  'deepseek-v4-flash': ['off', 'high', 'ultra'],
  'deepseek-v4-pro': ['off', 'high', 'ultra'],

  // MiMo — on/off.
  'mimo-v2.5': ['off', 'high'],
  'mimo-v2.5-pro': ['off', 'high'],
  'mimo-v2-flash': ['off', 'high'],

  // Aliyun Qwen — provider modes: Auto / Thinking / Fast (user-observed,
  // 2026-08-09). Auto is Qwen-native, not Claire's auto.
  'qwen3-vl-plus': ['auto', 'high', 'minimal'],
  'qwen3-vl-235b': ['auto', 'high', 'minimal'],
  'qwen-max': ['auto', 'high', 'minimal'],
  'qwen-plus': ['auto', 'high', 'minimal'],
  'qwen-vl-plus': ['auto', 'high', 'minimal'],
  'qwen-vl-turbo': ['auto', 'high', 'minimal'],

  // Anthropic — 5 levels: off / low / medium / high / extra (user-observed
  // in Kun settings, 2026-08-09). Extra maps to the top tier.
  'claude-sonnet-5': ['off', 'low', 'medium', 'high', 'ultra'],
  'claude-haiku-4-5': ['off', 'low', 'medium', 'high', 'ultra'],

  // Google Gemini — user-observed: Minimal / Low / Medium / High (no off;
  // AI Studio also exposes temperature).
  'gemini-2.5-pro': ['minimal', 'low', 'medium', 'high'],
  'gemini-2.5-flash': ['minimal', 'low', 'medium', 'high'],
  'gemini-2.0-flash': ['minimal', 'low', 'medium', 'high'],

  // Moonshot (Kimi) — reasoning on/off (user-observed in Kun settings).
  'kimi-k2': ['off', 'high'],
}

/** Provider-specific level labels (naming differs per provider). */
export const REASONING_LABELS: Record<string, Partial<Record<ReasoningLevel, string>>> = {
  // ChatGPT: Light / Medium / High / Extra High.
  'gpt-4o-mini': { low: 'Light', ultra: 'Extra High' },
  'o4-mini': { low: 'Light', ultra: 'Extra High' },
  // Claude: Off / Low / Medium / High / Extra.
  'claude-sonnet-5': { ultra: 'Extra' },
  'claude-haiku-4-5': { ultra: 'Extra' },
  // DeepSeek: Off / High / Max.
  'deepseek-v4-flash': { ultra: 'Max' },
  'deepseek-v4-pro': { ultra: 'Max' },
  // Qwen: Auto / Thinking / Fast.
  'qwen3-vl-plus': { auto: 'Auto', high: 'Thinking', minimal: 'Fast' },
  'qwen3-vl-235b': { auto: 'Auto', high: 'Thinking', minimal: 'Fast' },
  'qwen-max': { auto: 'Auto', high: 'Thinking', minimal: 'Fast' },
  'qwen-plus': { auto: 'Auto', high: 'Thinking', minimal: 'Fast' },
  'qwen-vl-plus': { auto: 'Auto', high: 'Thinking', minimal: 'Fast' },
  'qwen-vl-turbo': { auto: 'Auto', high: 'Thinking', minimal: 'Fast' },
}

/** Levels for an unknown/unmapped model — fall back to the full list. */
export function reasoningLevelsFor(model: ChatModel | undefined): ReasoningLevel[] {
  if (!model) return ['low', 'medium', 'high', 'ultra']
  return REASONING_LEVELS_BY_MODEL[model] ?? ['low', 'medium', 'high', 'ultra']
}
