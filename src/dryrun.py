"""You play the subject against the real interviewer prompt, in your terminal.

usage: python src/dryrun.py [--say]   (transcript lands in transcripts/dryrun-<date>.jsonl)

Purpose before anything touches LINE: does the agent handle Japanese deflection
(「うーん、まあ…」), topic drift, partial answers, and does it refuse to fill guesses?
Type her turns as text; Ctrl-D ends. Then run draft/goldfish on the dry-run transcript
to exercise the whole pipeline with fake data.
"""

import datetime
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import model
import turn as T
from transcript import Transcript

SAY = "--say" in sys.argv


def main():
    date = datetime.date.today().isoformat()
    path = Path(__file__).parent.parent / "transcripts" / f"dryrun-{date}.jsonl"
    t = Transcript(path)
    intro = ("リサーチのAIインタビュー担当です。音声ではなくテキストでやり取りします。"
             "日本語でどうぞ。所要30〜40分、内容は記録してツール作りに使います。"
             "では最初から——スケッチが承認されてからの流れを教えていただけますか？")
    t.append({"who": "system", "kind": "intro", "reply_jp": intro})
    print("[agent]", intro)
    if SAY:
        import subprocess; subprocess.run(["say", "-v", "Kyoko", intro])
    while True:
        try:
            line = input("[chie] ").strip()
        except EOFError:
            break
        if not line:
            continue
        t.append({"who": "subject", "kind": "text", "jp": line, "en": ""})
        out = model.ask(t.as_chatml_for_next_turn(T.PROMPT), role="interviewer")
        ev = t.append({"who": "agent", "kind": "turn", **out})
        print(f"[agent seq{ev['seq']} agenda={out.get('agenda_id')}] {out['reply_jp']}")
        if SAY:
            import subprocess; subprocess.run(["say", "-v", "Kyoko", out["reply_jp"]])
    print(f"\ndry-run transcript: {path}")
    print(f"next: python src/draft.py dryrun {date} && python src/goldfish.py dryrun {date}")


if __name__ == "__main__":
    main()
