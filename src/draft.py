"""Draft the findings document from a finished transcript.

usage: python src/draft.py chie 2026-11-25

The drafter sees ONLY the transcript — agenda progress, signals with their seq pointers,
unknowns. It writes findings/<subject>-<date>.draft.md. The reviewers then attack it;
deliver.py merges. Drafting is deliberately mechanical: every finding must carry quotes.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import model
from transcript import Transcript

ROOT = Path(__file__).parent.parent


def build_draft(subject, date):
    t = Transcript(ROOT / "transcripts" / f"{subject}-{date}.jsonl")
    signals = t.signals()
    unknowns = t.unknowns()
    covered = sorted(t.covered_ids())
    pains = [p for e in t.agent_turns() for p in e.get("pains", [])]
    convo = "\n".join(
        f"[{e['seq']}] {'CHIE' if e['who']=='chie' else 'AGENT'}: " + (e.get('jp') or e.get('reply_jp',''))
        for e in t.events if e.get('who') in ('chie', 'agent'))
    prompt = (
        "You are drafting UX-research findings from an interview transcript. Output markdown only.\n"
        "Rules: every finding cites its quote by [seq]; anything not evidenced stays out; "
        "declared unknowns listed honestly; no invented facts about her tools, her employer or her trade.\n"
        "The PAIN RECORDS below are the only source of pain findings: do not read new ones out of "
        "the conversation. A pain whose severity has no cost_quote_seq renders as \"cost not "
        "established\" -- never guess a severity, and mark any pain she did not confirm as "
        "(stated, unconfirmed).\n"
        "Open the document with one line: this is a single conversation (n=1), so every finding is a "
        "hypothesis, not a prevalence claim. Never let one voice read as the organisation's habit.\n"
        "Write every finding as three labelled lines, never merged: 本人の言葉 -- her verbatim words "
        "with [seq]; 解釈 -- our reading, marked as ours; 含意 -- what it would change in the product. "
        "Findings from the concept-test section must be labelled (concept test - imagined, not "
        "observed). A pain whose source is second-hand is marked 伝聞 and attributed to her: she "
        "reports what the mill does; she did not observe it. Never let it read as a fact about the "
        "mill. The people map is second-hand by nature and says so.\n\n"
        f"COVERED AGENDA IDS: {covered}\n"
        f"DECLARED UNKNOWNS: {unknowns}\n"
        f"SIGNAL QUOTES: {signals}\n"
        f"PAIN RECORDS: {pains or 'none recorded'}\n\nTRANSCRIPT:\n{convo}\n\n"
        "Sections, in this order: ## 痛み (pain points) -- if PAIN RECORDS is empty, say so in one "
        "line and move on / ## 人と伝わり方 (people map) -- who does the work at the last mile, what "
        "is in their hand, how news travels; every claim carries its [seq] / ## Workflow shape / "
        "## Seams between tools / ## What the software refuses / ## Agent readiness / "
        "## Unknowns (deliberate) / ## Quotes worth keeping verbatim. Finish with a ## 統制の境界 "
        "(control map) table: one row per property she named, columns: property | what she checks | "
        "silent if missed (yes/no/unknown) | evidence she would accept in place of looking | implied "
        "autonomy (free / propose-and-glance / must-inspect). Fill it only from what she said; leave "
        "unknown where she did not say, and never invent a row.")
    return model.ask([{"role": "user", "content": prompt}], role="drafter", expect_json=False)


if __name__ == "__main__":
    subject, date = sys.argv[1], sys.argv[2]
    md = build_draft(subject, date)
    out = ROOT / "findings" / f"{subject}-{date}.draft.md"
    out.write_text(md)
    print(f"wrote {out}")
