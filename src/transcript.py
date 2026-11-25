"""Transcript format — one JSONL per session, append-only, kept forever.

Every line is one event:

  {"seq": 1, "who": "system", "kind": "intro", ...}
  {"seq": 2, "who": "chie",   "kind": "voice|text", "jp": "...", "en": "..."}
  {"seq": 3, "who": "agent",  "kind": "turn", "reply_jp": "...", "reply_en": "...",
             "agenda_id": "...", "covers": [...], "unknowns": [...], "signals": [...]}

The agent's structured output IS the transcript record; nothing is re-derived later.
"""

import json
import time
from pathlib import Path


def subject_of(path):
    """The speaker id for this transcript, from its session config.

    Defaulting to "chie" was a real bug: for any other subject, subject_lines() returned nothing
    and as_chatml_for_next_turn() silently dropped every answer — the interviewer kept talking to
    a person it could not hear.
    """
    cfg = Path(path).parent.parent / "sessions" / (Path(path).stem + ".json")
    try:
        return json.loads(cfg.read_text())["subject"]["id"]
    except (OSError, KeyError, ValueError):
        return "chie"


class Transcript:
    def __init__(self, path, subject=None):
        self.path = Path(path)
        self.subject = subject or subject_of(path)
        self.events = []
        if self.path.exists():
            for line in self.path.read_text().splitlines():
                if line.strip():
                    self.events.append(json.loads(line))

    @property
    def seq(self):
        return len(self.events)

    def append(self, event):
        event = {"seq": self.seq + 1, "ts": time.strftime("%Y-%m-%dT%H:%M:%S%z"), **event}
        self.events.append(event)
        with self.path.open("a") as f:
            f.write(json.dumps(event, ensure_ascii=False) + "\n")
        return event

    # ---- views used by the pipeline -------------------------------------

    def subject_lines(self):
        return [e for e in self.events if e.get("who") == self.subject]

    def agent_turns(self):
        return [e for e in self.events if e.get("who") == "agent"]

    def covered_ids(self):
        ids = set()
        for e in self.agent_turns():
            ids.update(e.get("covers", []))
        return ids

    def unknown_ids(self):
        """Declared unknowns as id -> reason."""
        out = {}
        for e in self.agent_turns():
            for u in e.get("unknowns", []):
                if isinstance(u, str):
                    out[u] = "gave up"
                elif isinstance(u, dict):
                    out[u.get("id", "?")] = u.get("reason", "")
        return out

    def signals(self):
        out = []
        for e in self.agent_turns():
            for s in e.get("signals", []):
                out.append({"seq": e["seq"], "quote": s})
        return out

    def as_chatml_for_next_turn(self, prompt_text):
        """Conversation history in the shape the interviewer prompt expects."""
        msgs = [{"role": "system", "content": prompt_text}]
        for e in self.events:
            if e.get("who") == self.subject:
                msgs.append({"role": "user", "content": e.get("jp", "")})
            elif e.get("who") == "agent":
                msgs.append({"role": "assistant",
                             "content": json.dumps({k: v for k, v in e.items() if k in ("reply_jp", "reply_en", "agenda_id", "covers", "unknowns", "signals")}, ensure_ascii=False)})
        return msgs

    # convenience alias used across the pipeline
    def unknowns(self):
        return self.unknown_ids()
