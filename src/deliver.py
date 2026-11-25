"""Merge draft + review into the final findings document.

usage: python src/deliver.py chie 2026-11-25

A fail verdict does not delete a finding; it annotates it. The document that leaves this
kit is the one you read in any product repo — quote pointers intact, unknowns declared,
the two human questions named at the end.
"""

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).parent.parent


def main(subject, date):
    draft = (ROOT / "findings" / f"{subject}-{date}.draft.md").read_text()
    review = json.loads((ROOT / "findings" / f"{subject}-{date}.review.json").read_text())

    lines = [f"# Interview findings ({date})", "",
             "> **n=1.** One conversation with one person. Every finding here is a hypothesis, "
             "not a prevalence claim — do not read one habit as the organisation's.", ""]
    fails = []
    for title, res in review.items():
        if res.get("verdict") != "pass":
            fails.append(f"- **{title}**: {res.get('verdict')} — "
                         + "; ".join(str(f) for f in res.get("findings", [])[:4]))
    body = draft
    for note in re.findall(r"^## .*$", draft, flags=re.M):
        pass  # section headers survive verbatim
    lines += ["## Review status", "", *(fails or ["All reviewers passed."]), "",
              "---", "", draft, ""]
    r4 = review.get(next((k for k in review if k.startswith("R4")), ""), {})
    items = [str(i) for i in (r4.get("findings") or [])]
    questions = [i for i in items if not i.startswith("VERIFY:")]
    verifications = [i[len("VERIFY:"):].strip() for i in items if i.startswith("VERIFY:")]
    if questions:
        lines += ["## For the founder to ask personally", ""]
        for q in questions:
            lines.append(f"- {q}")
        lines.append("")
    if verifications:
        lines += ["## Second-hand claims to check elsewhere", "",
                  "Attributed to people who were not in the room — the mill, the sewing line. This is her",
                  "report, not an observation; somebody outside the interview has to confirm it.", ""]
        for v in verifications:
            lines.append(f"- {v}")
        lines.append("")
    out = ROOT / "findings" / f"{subject}-{date}.md"
    out.write_text("\n".join(lines))
    print(f"wrote {out}")
    print("carriers: read this file from any repo; transcripts stay here.")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
