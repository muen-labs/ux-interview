# Method

The parts that are transferable to any discovery interview, with the reasoning rather than the rules.

---

## 1 · The failure mode is 建前

In a Japanese discovery interview the first answer is usually the documented process and the
comfortable opinion, delivered briefly. This is not dishonesty and not evasion; it is the correct
social answer to a question shaped like a request for an opinion.

Three countermeasures, all mechanical rather than cultural:

- **Ask about events, not opinions.** 「ふだんどうしていますか」 returns a summary; 「最後にあった
  のはいつで、何をしましたか」 returns the work.
- **Ask about other people, not her.** People describe a newcomer's problems precisely and their own
  politely.
- **Ask where the paperwork and reality diverge.** 「書類ではこうなっているけど、実際は違う、という
  ことは」 grants permission to name the gap without accusing anyone.

A short answer is not refusal. It usually means the question was too big. Ask something smaller and
more concrete; never repeat the same question louder.

## 2 · The follow-up ladder

When the subject touches something that hurts, climb one rung per turn and stop when a rung returns
nothing:

1. **incident** — 「それがいちばん最近起きたのはいつですか」
2. **sequence** — 「その時、実際に何をしましたか。順番に」
3. **cost** — 「それで何分、何時間かかりましたか。やり直しは何回ありましたか」
4. **workaround** — 「それを避けるために、裏でやっていることはありますか」
5. **relational cost** — 「それが理由で、誰かに説明したり、謝ったりしたことは」
6. **trade** — 「もしその手間がなくなったら、浮いた時間で何をしますか」

Two rules bind it. **Never name the pain first** — 「〜で困っていませんか」 manufactures the answer it
pretends to discover. **A number comes from her, or the pain has no severity**: without rung 3 the
finding says *cost not established* rather than guessing.

## 3 · The aside door

The most useful sentence in an interview is usually not an answer. It is the aside — the detail
offered while talking about something else, often as a joke about a third party.

So the interview schedules the conditions for it: after each settled item, one cheap invitation
(「ほかに、これは関係ないかもしれないんですけど」), one displacement question (「これから入る人が、
いちばん最初につまずくのはどこだと思いますか」), and permission to complain (「そういうの、現場では
笑い話になりますか」). The agent never makes the joke itself — an outsider satirising people inside the
room lands wrong.

## 4 · Where review stops paying

If you are building an agent that drafts work for a human to check, the question is not "how much do
they trust it" but **at what point does checking cost more than doing**.

Two variables, and one modifier:

| | failure visible on screen | failure silent until much later |
|---|---|---|
| **cheap to check** | agent may decide; she glances | agent must prove it checked, and show the proof |
| **expensive to check** | agent proposes; she spot-checks the risky part | she keeps the pencil; the agent assists |

Silent failure overrides cost. A mistake that surfaces three weeks later is worth far more control
than a visible one, even when checking would take thirty seconds.

Human factors has the same structure at four stages rather than one dial — information acquisition,
information analysis, decision, action execution — each somewhere between "the human does it" and
"the machine does it and tells no one" (Parasuraman, Sheridan & Wickens 2000, on Sheridan &
Verplank's ten levels). "How much control" is four questions, not one.

Hence the deliverable: a **control map**, one row per property — what she checks, whether the failure
is silent, what evidence she would accept instead of looking, and the autonomy that implies.

**Ask her to describe checking, never to estimate how much control she wants.** Asked directly, the
polite answer is "I would check everything" — true in that she would like to, false in that she does.

## 5 · n=1, said out loud

One conversation with one person. At n=1 you can say *this person did this, and here is what it cost
her*. You cannot say *people in this role do this*. The findings document opens by declaring the
sample size, so nobody downstream mistakes a vivid story for a pattern.

Count a pattern as an insight only after three independent mentions, and flag single voices. A
confirmation from the subject is not a second voice.

## 6 · Second-hand claims

Some of the most useful material is about people who were not in the room — the mill, the sewing line,
the junior. That is a **report**, not an observation. It is recorded as 伝聞, attributed to her, and it
never carries a severity unless the cost is hers too.

The reviewer R4 ends the delivered document with the claims only someone outside the interview can
verify, and who to ask. An unverifiable claim that is never marked as one becomes a product decision.

## 7 · The people map

Ask who touches the work at the last mile, and what is in their hand. Constraints usually live there —
in a phone, in a language, in a person who does not use email — and they are invisible in the
requirements, because nobody thinks of the operator as a stakeholder.

Record them as a section of the findings, not as an aside in someone's memory.
