import { useCallback, useEffect, useState } from 'react'

/**
 * The interview loop, over the Python kit's JSON API.
 *
 * Same origin in production (the Python app serves the built files), proxied in dev.
 * Not useChat: that carries Claire's generation and asset plumbing an interview has no use for.
 */

const API = (import.meta.env.VITE_INTERVIEW_API as string | undefined) || ''

export interface InterviewEvent {
  seq: number
  who: 'system' | 'agent' | 'subject'
  kind?: string
  jp: string
  en?: string
}

export interface InterviewProgress {
  total: number
  covered: number
  unknown: number
  revealed: number
}

export interface InterviewPhase {
  id: string
  title_jp: string
  priority: 'core' | 'optional'
}

export interface InterviewPersona {
  who?: string
  makes?: string
  with_whom?: string
  vocabulary?: string[]
}

interface InterviewState {
  events: InterviewEvent[]
  progress: InterviewProgress
  phases: InterviewPhase[]
  persona: InterviewPersona | null
  last_error: string | null
  started: boolean
}

async function request<T>(token: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(API + '/api/s/' + encodeURIComponent(token) + path, {
    method: body === undefined ? 'GET' : 'POST',
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  if (!res.ok) throw new Error(path + ' ' + res.status)
  return (await res.json()) as T
}

/** The token comes from /s/<token> in production, or ?s=<token> against the dev server. */
export function tokenFromLocation(): string {
  const match = window.location.pathname.match(/\/s\/([A-Za-z0-9_-]+)/)
  if (match) return match[1]
  return new URLSearchParams(window.location.search).get('s') || ''
}

export function useInterview(token: string) {
  const [events, setEvents] = useState<InterviewEvent[]>([])
  const [progress, setProgress] = useState<InterviewProgress | null>(null)
  const [phases, setPhases] = useState<InterviewPhase[]>([])
  const [persona, setPersona] = useState<InterviewPersona | null>(null)
  const [lastError, setLastError] = useState<string | null>(null)
  const [started, setStarted] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    const state = await request<InterviewState>(token, '/state')
    setEvents(state.events)
    setProgress(state.progress)
    setPhases(state.phases ?? [])
    setPersona(state.persona ?? null)
    setLastError(state.last_error ?? null)
    setStarted(state.started)
  }, [token])

  useEffect(() => {
    refresh().catch((err) => setError(String(err)))
  }, [refresh])

  const run = useCallback(
    async (path: string, body: unknown) => {
      setBusy(true)
      setError(null)
      try {
        await request(token, path, body)
        await refresh()
      } catch (err) {
        setError('つながりませんでした。もう一度お試しください。')
        console.error(err)
      } finally {
        setBusy(false)
      }
    },
    [token, refresh]
  )

  return {
    events, progress, phases, persona, lastError, started, busy, error,
    start: () => run('/start', {}),
    send: (text: string) => run('/turns', { text }),
    end: () => run('/end', { reason: 'subject_stopped' }),
  }
}
