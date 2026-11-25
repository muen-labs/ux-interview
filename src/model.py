"""The model seam.

One function, ask(messages, role=...) -> dict | str. Everything else in the kit is channel and
plumbing. Swap this one file to move from a laptop to a phone:

    KIT_PROVIDER=deepseek   api.deepseek.com, roles split by tier (the default for a real session)
    KIT_PROVIDER=ollama     local, offline, for dry-runs on a plane
    KIT_PROVIDER=stub       no network at all — for tests and for looking at the page

Roles, not model names, at every call site:

    interviewer  deepseek-v4-pro    the turn she is talking to
    drafter      deepseek-v4-pro    the findings draft
    reviewer     deepseek-flash     R1-R3, mechanical audits
    empath       deepseek-v4-pro    R4, the human leftover

Thinking mode is off by default: a conversational turn should not wait for a chain of thought.
KIT_DEEPSEEK_THINKING=1 turns it on for every role — that is the A/B the PRD asks for, and the
default should change only if the measurement says so.

Verified against api-docs.deepseek.com on 2026-11-25: thinking is toggled with
{"thinking": {"type": "enabled|disabled"}} in the OpenAI-format body, and thinking mode ignores
temperature (no error), so temperature is sent only when thinking is off.
"""

import json
import os
import time
import urllib.error
import urllib.request

OLLAMA_URL = os.environ.get("KIT_OLLAMA_URL", "http://localhost:11434/api/chat")
OLLAMA_MODEL = os.environ.get("KIT_MODEL", "qwen2.5:14b")

DEEPSEEK_BASE = os.environ.get("KIT_DEEPSEEK_BASE", "https://api.deepseek.com").rstrip("/")
DEEPSEEK_KEY_ENV = "DEEPSEEK_API_KEY"

ROLES = {
    "interviewer": {"model": "deepseek-v4-pro", "thinking": False},
    "drafter": {"model": "deepseek-v4-pro", "thinking": False},
    "reviewer": {"model": "deepseek-flash", "thinking": False},
    "empath": {"model": "deepseek-v4-pro", "thinking": False},
}

# The last call's shape, for the transcript and the logs. Single-writer app: one process, one
# conversation, so a module-level record is honest here and a lock would be theatre.
LAST_CALL = {}


def _stub(messages, expect_json):
    """No network, no model. Obvious in the transcript, so nobody mistakes it for an answer."""
    text = "（スタブ）ありがとうございます。もう少し聞かせてください。"
    if not expect_json:
        return text
    return {"reply_jp": text, "reply_en": "(stub)", "agenda_id": "wf-1",
            "covers": [], "unknowns": [], "signals": [], "pains": []}


def _role(name):
    spec = dict(ROLES.get(name, ROLES["reviewer"]))
    override = os.environ.get("KIT_DEEPSEEK_MODEL")
    if override:
        spec["model"] = override
    if os.environ.get("KIT_DEEPSEEK_THINKING") == "1":
        spec["thinking"] = True
    return spec


def _decode(text, expect_json):
    if not expect_json:
        return text
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        start, end = text.find("{"), text.rfind("}")
        if start < 0 or end <= start:
            raise
        return json.loads(text[start:end + 1])


def _ollama(messages, expect_json):
    payload = {"model": OLLAMA_MODEL, "messages": messages, "stream": False,
               "options": {"temperature": 0.4}}
    if expect_json:
        payload["format"] = "json"
    req = urllib.request.Request(OLLAMA_URL, data=json.dumps(payload).encode(),
                                 headers={"Content-Type": "application/json"})
    started = time.time()
    with urllib.request.urlopen(req, timeout=300) as resp:
        body = json.load(resp)
    LAST_CALL.clear()
    LAST_CALL.update({"provider": "ollama", "model": OLLAMA_MODEL, "role": "ollama",
                      "latency_ms": int((time.time() - started) * 1000)})
    return _decode(body["message"]["content"].strip(), expect_json)


def _deepseek(messages, role, expect_json):
    key = os.environ.get(DEEPSEEK_KEY_ENV)
    if not key:
        raise RuntimeError(DEEPSEEK_KEY_ENV + " is not set")
    spec = _role(role)
    payload = {"model": spec["model"], "messages": messages, "stream": False,
               "thinking": {"type": "enabled" if spec["thinking"] else "disabled"}}
    if expect_json:
        payload["response_format"] = {"type": "json_object"}
    if not spec["thinking"]:
        payload["temperature"] = 0.4
    req = urllib.request.Request(
        DEEPSEEK_BASE + "/chat/completions",
        data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json", "Authorization": "Bearer " + key})
    started = time.time()
    try:
        with urllib.request.urlopen(req, timeout=300) as resp:
            body = json.load(resp)
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", "replace")[:400]
        raise RuntimeError("deepseek " + str(exc.code) + ": " + detail) from exc
    text = (body.get("choices") or [{}])[0].get("message", {}).get("content") or ""
    decoded = _decode(text.strip(), expect_json)
    LAST_CALL.clear()
    LAST_CALL.update({"provider": "deepseek", "role": role, "model": spec["model"],
                      "thinking": spec["thinking"],
                      "latency_ms": int((time.time() - started) * 1000),
                      "json_ok": isinstance(decoded, dict),
                      "usage": body.get("usage", {})})
    return decoded


def ask(messages, *, role="reviewer", expect_json=True):
    """Send the conversation; return the assistant turn (parsed dict when expect_json)."""
    provider = os.environ.get("KIT_PROVIDER", "ollama").strip().lower()
    if provider == "stub":
        return _stub(messages, expect_json)
    if provider == "deepseek":
        return _deepseek(messages, role, expect_json)
    return _ollama(messages, expect_json)


def probe():
    """True when the configured provider answers. Used before a session starts."""
    try:
        ask([{"role": "user", "content": "Say OK."}], expect_json=False)
        return True
    except Exception:
        return False
