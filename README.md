# UX interview

An AI researcher that runs a discovery interview in the subject's own language, then produces a
findings document in which **every claim carries a quote pointer** — or is listed as a declared
unknown.

It is one Python process plus one React page. No accounts, no analytics, no third-party scripts. A
subject opens a link, answers in Japanese (or any language you set), and the transcript is written
to disk as append-only JSONL from the first turn.

---

## Why an agent rather than a call

Three problems a human interviewer has and a careful agent does not:

1. **Language.** A subject answering in their second language spends the interview translating, and
   the vocabulary that carries their expertise never appears.
2. **Asymmetry.** Interviewing someone you used to manage, or a client who is doing you a favour,
   suppresses exactly the detail worth having. A polite synthetic junior does not carry that history.
3. **Discipline.** Humans stop asking the awkward follow-up at minute forty. The method below is
   enforced turn by turn, not remembered.

## The method, in five rules

1. **The agenda is a compass, not a script.** It exists for coverage and for permission. Conversation
   outranks order; a skipped item is recorded as an unknown, never filled in.
2. **One open question per turn, and no candidate answers.** 「DXF or a tech pack?」 lets the subject
   answer your list instead of their work.
3. **Digressions are the channel, not the noise.** The best material arrives beside a question. The
   interview is built so a throwaway question has room to be asked.
4. **n=1 is declared.** One conversation produces hypotheses, not prevalence claims. The findings
   document says so at the top, every time.
5. **Her words and our reading never share a line.** Every finding renders as 本人の言葉 (verbatim,
   with `seq`), 解釈 (ours, marked), 含意 (what it would change).

See [METHOD.md](METHOD.md) for the tatemae problem, the follow-up ladder, the aside door, and why the
deliverable is a **control map** rather than a verdict.

## What's in here

| Path | What it is |
|---|---|
| `interviewer/agenda.yaml` | 6 sections, 11 core items, probes. Domain-neutral: swap it for your subject's world |
| `interviewer/prompt.md` | the interviewer prompt — a template (`{{display}}`, `{{tool}}`, `{{agenda}}`) |
| `interviewer/explainer.md` | the promise card the subject reads before the first question |
| `src/web.py` | the server: the built UI at `/s/<token>`, the JSON API, sessions, six routes |
| `src/turn.py` | one agent turn: history, the JSON contract, the guards |
| `src/model.py` | provider seam — DeepSeek (pro for the interviewer, flash for reviewers), Ollama, stub |
| `src/transcript.py` | append-only JSONL; `seq`, `covers`, `unknowns`, `pains`, `persona` |
| `src/{draft,goldfish,deliver}.py` | findings draft → zero-context reviews → the delivered document |
| `src/{prompt,page}.py` | prompt rendering; the dependency-free fallback page |
| `web/` | the React UI. Its Composer and primitives are vendored from Claire, so this builds alone |
| `reviewer/prompts.md` | R1 fidelity, R2 unknowns audit, R3 readiness, R4 the human leftover |
| `sessions/` | one JSON per session; `example.json` shows the shape |

## Run it

**Local, no build of the UI:**

```sh
python -m venv .venv && .venv/bin/pip install -r requirements.txt
export DEEPSEEK_API_KEY=...            # or KIT_PROVIDER=stub to run with no network
.venv/bin/python src/web.py --new my-session          # prints a URL
.venv/bin/python src/web.py --host 0.0.0.0 --port 8770
```

**With the React UI:**

```sh
cd web && npm install && npm run build   # writes web/dist; src/web.py serves it if present
```

**Container:** `docker build -t ux-interview .` — the Dockerfile builds the UI in a node stage, then
serves UI and API from one Python process on one origin.

**Fly:** `./deploy.sh` (needs `fly auth login` once). It creates the app and volume, sets
`DEEPSEEK_API_KEY` and a generated `KIT_ADMIN_TOKEN`, and deploys. The admin token mints sessions on
the deployed box, because there is no shell there:

```sh
curl -X POST https://ux-interview.fly.dev/api/sessions \
  -H "Authorization: Bearer $ADMIN" -H "Content-Type: application/json" \
  -d '{"session_id":"subject-1","subject":{"id":"subject","display_jp":"田中さん","language":"ja"}}'
```

## Data policy

Transcripts and live session configs are **personal data** and are gitignored. They live on the
machine or the volume and nowhere else. There is no analytics SDK, no error-reporting SaaS, no
third-party asset on the page — so nothing leaks the subject's words through a referrer.

What the subject must be told, and the promise card says: her answers are processed by an AI service
outside her country.

## What this is not

- not a survey tool, not a panel, not multi-tenant
- no streaming tokens; a whole turn comes back in 2–4 seconds and that is fine for a conversation
- the reviewers check the **document**, not the person; do not mistake R1–R4 for a judgement of her

## License

None yet. Add one before others depend on this.
