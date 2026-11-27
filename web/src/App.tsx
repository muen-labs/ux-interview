import { useEffect, useMemo, useRef, useState } from 'react'
import Composer from './components/blocks/Composer'
import MuenLogo from './components/MuenLogo'
import { tokenFromLocation, useInterview, type InterviewEvent } from './useInterview'

/**
 * The interview app.
 *
 * Built from Claire's primitives — the Composer and its shadcn/base-ui dependency tree are
 * vendored here rather than importing the app, so this ships on its own and never touches
 * claire-ai's repo. Her turns are bubbles; the agent speaks as plain text.
 */

function transcript(events: InterviewEvent[]): { who: string; text: string; intro?: boolean }[] {
  const rows: { who: string; text: string; intro?: boolean }[] = []
  for (const e of events) {
    if (e.who === 'system' && e.kind === 'consent') continue
    if (e.who === 'system') rows.push({ who: '', text: e.jp, intro: true })
    else if (e.who === 'agent') rows.push({ who: 'AI', text: e.jp })
    else rows.push({ who: 'あなた', text: e.jp })
  }
  return rows
}

export default function App() {
  const token = useMemo(tokenFromLocation, [])
  const { events, progress, phases, persona, lastError, started, busy, error, start, send, end } =
    useInterview(token)
  const bottom = useRef<HTMLDivElement | null>(null)
  const [showTranscript, setShowTranscript] = useState(false)

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: 'end' })
  }, [events.length, busy])

  const rows = transcript(events)

  if (!token) {
    return (
      <div className="grid min-h-dvh place-items-center p-8 text-center text-sm text-muted-foreground">
        このリンクは使えません。
      </div>
    )
  }

  return (
    <div className="flex h-dvh w-full flex-col bg-background text-foreground">
      <header className="border-b border-border">
        <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            {/* The wordmark is pinned: 313×72 intrinsic, 20px tall in chrome. */}
            <MuenLogo className="h-5 w-[87px] flex-none text-foreground" />
            <span aria-hidden className="hidden h-4 w-px bg-border sm:block" />
            <span className="whitespace-nowrap font-mono text-[10px] tracking-[0.12em] text-muted-foreground">
              UX INTERVIEW
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-3 text-sm text-muted-foreground">
          {lastError ? (
            <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-destructive">
              接続エラー
            </span>
          ) : null}
          {progress ? <span>聞けたこと {progress.revealed} / {progress.total}</span> : null}
          <button type="button" className="underline lg:hidden" onClick={() => setShowTranscript((v) => !v)}>
            {showTranscript ? '会話' : '文字起こし'}
          </button>
          </div>
        </div>
      </header>
      <h1 className="sr-only">UX interview</h1>

      <div className="flex min-h-0 flex-1">
        <main className={'min-w-0 flex-1 flex-col ' + (showTranscript ? 'hidden lg:flex' : 'flex')}>
          <div className="flex-1 overflow-y-auto px-5 py-5">
            {!started ? (
              <div className="mx-auto mt-8 max-w-md text-center">
                <p className="mb-4 text-sm text-muted-foreground">
                  準備ができたら「はじめる」を押してください。所要30〜40分です。
                </p>
                <button
                  type="button"
                  onClick={start}
                  disabled={busy}
                  className="w-full rounded-xl bg-primary px-4 py-3 text-primary-foreground disabled:opacity-50"
                >
                  {busy ? 'はじめます…' : 'はじめる'}
                </button>
              </div>
            ) : null}

            <div className="mx-auto flex w-[92%] max-w-[42rem] flex-col gap-4">
              {rows.map((row, index) => {
                if (row.intro) {
                  return (
                    <p key={index} className="mx-auto text-center text-sm text-muted-foreground">
                      {row.text}
                    </p>
                  )
                }
                if (row.who === 'AI') {
                  return (
                    <p key={index} className="whitespace-pre-wrap leading-relaxed">
                      {row.text}
                    </p>
                  )
                }
                return (
                  <div
                    key={index}
                    className="ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-muted px-4 py-2.5"
                  >
                    <p className="whitespace-pre-wrap leading-relaxed">{row.text}</p>
                  </div>
                )
              })}
              {busy ? <p className="text-sm text-muted-foreground">考えています…</p> : null}
              <div ref={bottom} />
            </div>
          </div>

          <div className="border-t px-4 py-3">
            <div className="mx-auto w-[92%] max-w-[42rem]">
              {error ? <p className="mb-2 text-sm text-destructive">{error}</p> : null}
              <Composer
                onSend={(text: string) => {
                  const trimmed = text.trim()
                  if (trimmed && !busy) void send(trimmed)
                }}
                isStreaming={busy}
                disabled={!started || busy}
                placeholder={started ? 'ここに入力してください' : '「はじめる」を押してください'}
                hideCreative
                hideEnhance
                hideParams
                hideAdd
                hideContext
              />
            </div>
          </div>
        </main>

        <aside
          className={
            'w-full shrink-0 overflow-y-auto border-l px-6 py-6 lg:block lg:w-[42%] ' +
            (showTranscript ? 'block' : 'hidden')
          }
        >
          <h2 className="text-sm font-semibold">文字起こし</h2>
          <p className="mt-1 text-xs text-muted-foreground">n=1 — 一人の聞き取り。ここでの発見は仮説です。</p>
          <div className="mt-5 flex flex-col gap-4 text-[15px] leading-relaxed">
            {rows.map((row, index) => (
              <p key={index} className={row.who === 'AI' ? '' : 'text-muted-foreground'}>
                {row.who ? <span className="mr-2 text-xs font-semibold">{row.who}</span> : null}
                {row.text}
              </p>
            ))}
          </div>

          {persona ? (
            <div className="mt-8 rounded-xl border p-3 text-xs text-muted-foreground">
              <p className="font-semibold">相手の像（AIの作業仮説）</p>
              {[persona.who, persona.makes, persona.with_whom].filter(Boolean).map((line) => (
                <p key={String(line)}>{line}</p>
              ))}
              {persona.vocabulary?.length ? <p>ことば: {persona.vocabulary.join('・')}</p> : null}
            </div>
          ) : null}

          {phases.length ? (
            <div className="mt-6 text-xs text-muted-foreground">
              <p className="font-semibold">いまの段階</p>
              <ol className="mt-1">
                {phases.map((phase, index) => (
                  <li key={phase.id}>
                    {index + 1}. {phase.title_jp}
                    {phase.priority === 'optional' ? '（任意）' : ''}
                  </li>
                ))}
              </ol>
            </div>
          ) : null}

          <button type="button" onClick={end} className="mt-8 text-xs text-muted-foreground underline">
            ここで終わる
          </button>
        </aside>
      </div>
    </div>
  )
}
