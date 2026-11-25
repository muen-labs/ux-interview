"""One agent turn from the transcript so far.

usage: python src/turn.py transcripts/chie-2026-11-25.jsonl [--say]

Reads the JSONL, builds the conversation for the interviewer prompt, asks the model,
appends the agent event. --say speaks reply_jp with macOS Kyoko (dry-run convenience;
the LINE channel will send a voice memo instead).
"""

import argparse
import json
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import model
import prompt as prompt_template
from transcript import Transcript

ROOT = Path(__file__).parent.parent
PROMPT_TEMPLATE = (ROOT / "interviewer" / "prompt.md").read_text()

# Rendered with the default subject and agenda so the CLI and dryrun keep working unchanged.
PROMPT = prompt_template.render(PROMPT_TEMPLATE, agenda_path=ROOT / "interviewer" / "agenda.yaml")


def prompt_for(transcript_path):
    """Subject fields come from sessions/<stem>.json when it exists; the agenda is inlined."""
    cfg = ROOT / "sessions" / f"{Path(transcript_path).stem}.json"
    subject, agenda = {}, ROOT / "interviewer" / "agenda.yaml"
    if cfg.exists():
        data = json.loads(cfg.read_text())
        subject = data.get("subject", {})
        agenda = ROOT / data.get("agenda", "interviewer/agenda.yaml")
    return prompt_template.render(PROMPT_TEMPLATE, subject, agenda_path=agenda)


# Two different failures, two different things to say to her.
# A parse failure is the model's problem and a re-ask is honest. A provider failure is ours —
# asking her to repeat wastes her turn, and she did nothing wrong.
FALLBACK_JP = "すみません、うまく整理できませんでした。もう一度だけ、短く教えてもらえますか"
PROVIDER_JP = "すみません、いま少しつながりが悪いようです。少しだけ待ってもらえますか"


PERSONA_NUDGE = (
    "\n\n## 今日の必須事項\n"
    "persona を今回の出力に必ず含めること（who / makes / with_whom / vocabulary）。"
    "まだ書けないなら、分かっている範囲で書いて、あとで直せばよい。"
)


def needs_persona(t):
    """The model treats an optional field as optional. After two answers, make it required."""
    if len(t.subject_lines()) < 2:
        return False
    return not any(isinstance(e.get("persona"), dict) for e in t.agent_turns())


def run_turn(transcript_path, retries=1):
    """One agent turn, with the JSON guard. Returns the appended agent event.

    A parse failure never reaches the page as an error: it retries once, then records a
    system error and speaks a plain re-ask instead.
    """
    t = Transcript(transcript_path)
    persona_required = needs_persona(t)
    prompt_text = prompt_for(transcript_path)
    if persona_required:
        prompt_text += PERSONA_NUDGE
    msgs = t.as_chatml_for_next_turn(prompt_text)
    last = None
    for attempt in range(retries + 1):
        try:
            out = model.ask(msgs, role="interviewer")
        except Exception as exc:
            out = {"exception": str(exc)}
        if isinstance(out, dict) and out.get("reply_jp"):
            # A missing persona is not a parse failure, but JSON mode does not enforce fields:
            # the model will happily omit an optional one. One repair attempt, then accept —
            # a stuck persona must never cost her a turn.
            if persona_required and not isinstance(out.get("persona"), dict) and attempt == 0:
                last = out
                msgs = msgs + [{"role": "user",
                                "content": "persona が入っていません。who / makes / with_whom / "
                                           "vocabulary を含めて、もう一度JSONで返してください。"}]
                continue
            if model.LAST_CALL:
                out = {**out, "meta": dict(model.LAST_CALL)}
            return t.append({"who": "agent", "kind": "turn", **out})
        last = out
        msgs = msgs + [{"role": "user",
                        "content": "JSONのみで返してください。reply_jp は必須です。"}]
    provider = isinstance(last, dict) and "exception" in last
    t.append({"who": "system", "kind": "error", "detail": str(last)[:2000],
              "provider": provider})
    return t.append({"who": "agent", "kind": "turn",
                     "reply_jp": PROVIDER_JP if provider else FALLBACK_JP,
                     "reply_en": "(provider error)" if provider else "(fallback)",
                     "agenda_id": "error", "provider_error": provider,
                     "covers": [], "unknowns": [], "signals": [], "pains": []})


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("transcript")
    ap.add_argument("--say", action="store_true")
    args = ap.parse_args()

    t = Transcript(args.transcript)
    if not t.subject_lines():
        print("no subject lines yet — record or append her turn first", file=sys.stderr)
        sys.exit(1)

    out = model.ask(t.as_chatml_for_next_turn(prompt_for(args.transcript)))
    ev = t.append({"who": "agent", "kind": "turn", **out})
    print(f"[seq {ev['seq']}] agenda={out.get('agenda_id')} covers={out.get('covers')} unknowns={out.get('unknowns')}")
    print("JP:", out["reply_jp"])
    print("EN:", out.get("reply_en", ""))
    if args.say:
        subprocess.run(["say", "-v", "Kyoko", out["reply_jp"]])


if __name__ == "__main__":
    main()
