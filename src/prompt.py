"""Render the interviewer prompt for one subject.

The prompt is a template: {{display}}, {{role}}, {{tool}}, {{org}}, and {{agenda}}.
A missing key raises, because a prompt that still contains {{...}} would be sent to the model
and would quietly mis-name the subject — the one error this kit cannot afford.

The agenda is injected as text. The model has no file access, so a prompt that says
"the agenda is in interviewer/agenda.yaml" is a prompt that names a file the model cannot read:
it will invent ids, and the stepper, the unknowns audit and the control map all key off those ids.
"""

import re

import yaml

# Neutral by default: a missing subject field must never make the interviewer claim to be
# researching someone else's company. Sessions supply the specifics.
DEFAULTS = {
    "display": "インタビューの相手",
    "role": "この仕事をしている方",
    "tool": "ふだん使っている道具",
    "org": "その会社",
}

# Session files are written for humans (display_jp, role_jp, tool_jp); the prompt template wants
# short names. Both spellings are accepted so a session cannot silently fall back to a default.
ALIASES = {"display_jp": "display", "role_jp": "role", "tool_jp": "tool", "org_jp": "org"}

TOKEN = re.compile(r"\{\{(\w+)\}\}")


def render_agenda(path):
    """The agenda as compact text: sections, ids, questions, probes."""
    data = yaml.safe_load(path.read_text())
    lines = ["## アジェンダ（コンパス。順番は目安）", ""]
    opening = data.get("opening") or []
    if opening:
        lines.append("### 開き方（最初に一度だけ）")
        for item in opening:
            lines.append("- " + str(item.get("id", "?")) + " 「" + str(item.get("jp", "")).strip() + "」")
        lines.append("")
    for index, section in enumerate(data.get("sections") or [], start=1):
        priority = section.get("priority", "core")
        lines.append("### " + str(index) + ". " + str(section.get("id")) + "（" + priority + "）")
        goal = section.get("goal")
        if goal:
            lines.append("ねらい: " + str(goal))
        for item in section.get("items") or []:
            mark = "・" if item.get("priority", priority) == "core" else "（任意）"
            lines.append("- " + str(item.get("id")) + " " + mark + " 「" + str(item.get("jp", "")).strip() + "」")
            for probe in item.get("probes") or []:
                lines.append("    - 深掘り: 「" + str(probe.get("jp", "")).strip() + "」")
        lines.append("")
    lines.append("covers には、上の id だけを書く。開き方の op-1 / op-2 は covers に入れない。")
    return "\n".join(lines)


def render(text, subject=None, agenda_path=None):
    values = dict(DEFAULTS)
    for key, value in (subject or {}).items():
        if value is None or value == "":
            continue
        values[ALIASES.get(key, key)] = value
    if agenda_path is not None:
        values["agenda"] = render_agenda(agenda_path)

    def sub(match):
        key = match.group(1)
        if key not in values:
            raise KeyError("prompt needs {{" + key + "}} and no value was given")
        return str(values[key])

    return TOKEN.sub(sub, text)
