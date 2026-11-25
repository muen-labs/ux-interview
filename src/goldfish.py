"""Zero-context reviewers over the draft. See reviewer/prompts.md.

usage: python src/goldfish.py chie 2026-11-25

Each reviewer gets exactly what its prompt says and nothing else — no agenda, no notes,
no other reviewer's output. Findings land in findings/<subject>-<date>.review.json.
"""

import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import model
from transcript import Transcript

ROOT = Path(__file__).parent.parent


def reviewer_prompts():
    text = (ROOT / "reviewer" / "prompts.md").read_text()
    blocks = re.split(r"^## (R\d[^\n]*)$", text, flags=re.M)
    out = []
    for i in range(1, len(blocks), 2):
        out.append((blocks[i].strip(), blocks[i + 1].strip()))
    return out


def main(subject, date):
    draft = (ROOT / "findings" / f"{subject}-{date}.draft.md").read_text()
    t = Transcript(ROOT / "transcripts" / f"{subject}-{date}.jsonl")
    results = {}
    for title, body in reviewer_prompts():
        # R1 needs transcript + draft; R2 needs agenda ids + transcript; R3/R4 draft only.
        if title.startswith("R1"):
            user = f"DRAFT:\n{draft}\n\nTRANSCRIPT:\n" + "\n".join(
                f"[{e['seq']}] {e.get('jp') or e.get('reply_jp','')}" for e in t.events if e.get('who')=='chie')
        elif title.startswith("R2"):
            agenda_ids = sorted(set(re.findall(r"id: ([a-z]+-[0-9]+)", (ROOT/'interviewer'/'agenda.yaml').read_text())))
            user = f"AGENDA IDS: {agenda_ids}\n\nTRANSCRIPT:\n" + "\n".join(
                f"[{e['seq']}] {(e.get('jp') or '')[:80]}" for e in t.events if e.get('who')=='chie')
        else:
            user = f"FINDINGS DOCUMENT:\n{draft}"
        msg = [{"role": "system", "content": body + '\nReturn JSON: {"verdict": "pass|fail", "findings": [...]}'}]
        msg.append({"role": "user", "content": user})
        try:
            role = "empath" if title.startswith("R4") else "reviewer"
            results[title] = model.ask(msg, role=role)
        except Exception as e:
            results[title] = {"verdict": "error", "detail": str(e)}
        print(title, "→", results[title].get("verdict"))
    out = ROOT / "findings" / f"{subject}-{date}.review.json"
    out.write_text(json.dumps(results, ensure_ascii=False, indent=2))
    print(f"wrote {out}")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
