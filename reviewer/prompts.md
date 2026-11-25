# Reviewers — the Goldfish shape, aimed at a transcript

EGM's rule: the drafter must not be the checker. Here the interviewer agent drafted nothing;
the **transcript** is the spec under review, and each reviewer below runs with zero context —
it sees only what you hand it, never the agenda's hopes or the interviewer's notes.

Run them in this order (`src/goldfish.py` does). Each returns JSON findings; `deliver.py`
merges them into the findings document as a "reviewed by" block.

## R1 · Fidelity — "did we hear her, or did we fill gaps?"

You are given: the transcript (all turns) and the draft findings list.
For every finding, check the quote pointer. A finding fails when:
- the quote does not appear verbatim in any subject turn;
- the finding claims more than the quote supports ("she hates 3D" from "3Dはあまり…");
- two findings contradict each other and neither carries a seq range showing they are different contexts.
Return: pass/fail per finding + the exact words that carry it.

## R2 · Unknowns audit

You are given: the agenda ids and the transcript.
List every agenda item that was NOT answered, NOT asked, or answered only partially.
These must appear in the findings as declared unknowns. Silence is not data.
Return: the missing ids with one line each on what happened to them.

## R3 · Readiness for the product

You are given: the findings document only (no transcript).
A patternmaker who was not in the room reads it cold. Flag:
- terms used without definition — anything a reader outside the trade would not know;
- claims about a tool's behaviour that could be version-specific;
- anything that would change a product decision but has no quote behind it.
Return: blockers vs nits.

## R4 · The human leftover

You are given: the findings document.

Two jobs.

**1 · The two questions.** Name the two questions a person should still ask the subject directly — things
an agent cannot get: willingness ("would you use this"), relationship ("what should I not build"),
body-language-only answers. Phrase them for the founder to send her personally.

**2 · The unverifiable claims.** Name zero to three claims the document makes about people who were
not in the conversation — the mill, the sewing line, a junior, a supplier. These arrived as her
report, and only someone outside this interview can check them. For each, say who to ask.

Return the two questions as plain strings, then the verification items, each written as:

    VERIFY: <the claim, in the document's own words> — ask <who>

Omit the VERIFY items entirely if the document makes no second-hand claim.
