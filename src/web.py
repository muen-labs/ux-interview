"""The interview page — one Japanese chat, standard library only.

usage:
  python src/web.py --new chie-2026-11-25          # mint a session, print the URL
  python src/web.py --session chie-2026-11-25      # serve it (default port 8765)

Deliberately small: no framework, no build step, no dependency that can break the night
before a session. One process, one writer, append-only transcript.

Her words are appended to the transcript *before* the model is called, so a provider
failure cannot lose what she typed.
"""

import argparse
import hashlib
import json
import os
import secrets
import sys
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

sys.path.insert(0, str(Path(__file__).parent))
import turn as turnmod
from transcript import Transcript

ROOT = Path(__file__).parent.parent
SESSIONS = ROOT / "sessions"
STATIC = Path(__file__).parent
EXPLAINER = ROOT / "interviewer" / "explainer.md"

# The React app, built from the vendored Claire primitives. If it has been built, the Python
# server serves it; otherwise the dependency-free page.html still works, which is what a fresh
# clone without node gets.
DIST = ROOT / "web" / "dist"
MIME = {".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
        ".woff2": "font/woff2", ".svg": "image/svg+xml", ".png": "image/png",
        ".json": "application/json", ".map": "application/json"}

INTRO_JP = ("これから、いくつか質問します。正解はありませんので、思い出したままに話してください。"
            "途中でやめたいときは「やめたい」と言ってください。")

ALLOWED_ORIGIN = os.environ.get("KIT_ALLOW_ORIGIN", "http://localhost:5173")


# ---- session plumbing -------------------------------------------------------

def session_file(sid):
    return SESSIONS / f"{sid}.json"


def load_cfg(sid):
    return json.loads(session_file(sid).read_text())


def transcript_path(sid):
    return ROOT / "transcripts" / f"{sid}.jsonl"


def hash_token(token):
    return hashlib.sha256(token.encode()).hexdigest()


def find_session(token):
    """Return the session id whose stored hash matches, or None."""
    if not token or not SESSIONS.exists():
        return None
    want = hash_token(token)
    for path in SESSIONS.glob("*.json"):
        try:
            cfg = json.loads(path.read_text())
        except json.JSONDecodeError:
            continue
        if cfg.get("token_hash") and secrets.compare_digest(cfg["token_hash"], want):
            return path.stem
    return None


def agenda_sections(cfg):
    """Section titles come from the session's agenda, so the page never hardcodes a domain."""
    import yaml
    path = ROOT / cfg.get("agenda", "interviewer/agenda.yaml")
    data = yaml.safe_load(path.read_text())
    return [{"id": s.get("id"), "title_jp": s.get("title_jp", s.get("id")),
             "priority": s.get("priority", "core")} for s in data.get("sections", [])]


def core_ids(cfg):
    """The core agenda ids for this session, read from its agenda file."""
    import yaml
    path = ROOT / cfg.get("agenda", "interviewer/agenda.yaml")
    data = yaml.safe_load(path.read_text())
    ids = []
    for section in data.get("sections", []):
        for item in section.get("items", []):
            if item.get("priority", section.get("priority")) == "core":
                ids.append(item["id"])
    return ids


def progress(sid, cfg):
    t = Transcript(transcript_path(sid), subject=cfg["subject"]["id"])
    core = core_ids(cfg)
    covered = sorted(set(core) & t.covered_ids())
    unknown = sorted(set(core) & set(t.unknown_ids()))
    return {"total": len(core), "covered": len(covered), "unknown": len(unknown),
            "revealed": len(covered) + len(unknown),
            "covered_ids": covered, "unknown_ids": unknown}


def client_state(sid, cfg):
    t = Transcript(transcript_path(sid), subject=cfg["subject"]["id"])
    english = bool(cfg["subject"].get("english"))
    events = []
    for e in t.events:
        who, kind = e.get("who"), e.get("kind")
        if who == "system" and kind in ("intro", "consent"):
            events.append({"seq": e["seq"], "who": "system", "kind": kind, "jp": e.get("jp", "")})
        elif who == "agent":
            row = {"seq": e["seq"], "who": "agent", "jp": e.get("reply_jp", "")}
            if english:
                row["en"] = e.get("reply_en", "")
            events.append(row)
        elif who == cfg["subject"]["id"]:
            events.append({"seq": e["seq"], "who": "subject", "jp": e.get("jp", "")})
    last_error = None
    for e in t.events:
        if e.get("who") == "agent" and e.get("provider_error"):
            last_error = "provider"
        elif e.get("who") == "agent":
            last_error = None
    persona = None
    for e in t.events:
        if e.get("who") == "agent" and isinstance(e.get("persona"), dict):
            persona = e["persona"]
    return {"events": events, "progress": progress(sid, cfg),
            "phases": agenda_sections(cfg),
            "persona": persona,
            "last_error": last_error,
            "started": any(e["who"] == "agent" for e in events)}


def md_to_html(text):
    """Just enough markdown for the promise card: paragraphs, bold, bullets."""
    out, in_list = [], False
    for raw in text.splitlines():
        line = raw.strip()
        if line.startswith(">"):
            line = line.lstrip("> ").strip()
        if not line:
            if in_list:
                out.append("</ul>")
                in_list = False
            continue
        if line.startswith("- "):
            if not in_list:
                out.append("<ul>")
                in_list = True
            out.append("<li>" + bold(line[2:]) + "</li>")
            continue
        if in_list:
            out.append("</ul>")
            in_list = False
        out.append("<p>" + bold(line) + "</p>")
    if in_list:
        out.append("</ul>")
    return "\n".join(out)


def bold(text):
    parts = text.split("**")
    return "".join(("<strong>" + p + "</strong>") if i % 2 else p for i, p in enumerate(parts))


def render_page(token, cfg):
    built = DIST / "index.html"
    if built.exists():
        return built.read_text()
    html = (STATIC / "page.html").read_text()
    explainer = md_to_html(EXPLAINER.read_text()) if EXPLAINER.exists() else ""
    return (html
            .replace("__TOKEN__", token)
            .replace("__EXPLAINER__", explainer)
            .replace("__TITLE__", cfg["subject"].get("display_jp", "インタビュー"))
            .replace("__TOTAL__", str(len(core_ids(cfg)))))


# ---- http -------------------------------------------------------------------

class Handler(BaseHTTPRequestHandler):
    server_version = "ux-interview"
    protocol_version = "HTTP/1.1"

    def log_message(self, fmt, *args):
        # Never log the URL: it carries the token. One line per request is enough.
        sys.stderr.write("%s %s\n" % (self.command, getattr(self, "_route", "?")))

    def _body(self):
        length = int(self.headers.get("Content-Length") or 0)
        if not length:
            return {}
        try:
            return json.loads(self.rfile.read(length).decode())
        except (json.JSONDecodeError, UnicodeDecodeError):
            return {}

    def _cors(self):
        # A Claire page served by Vite on another port is a legitimate caller; the token in
        # the URL is still the credential. Restrict to one dev origin rather than *.
        self.send_header("Access-Control-Allow-Origin", ALLOWED_ORIGIN)
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")

    def _send(self, code, body, ctype="application/json; charset=utf-8"):
        data = body if isinstance(body, bytes) else body.encode()
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-store")
        self._cors()
        self.end_headers()
        self.wfile.write(data)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Content-Length", "0")
        self._cors()
        self.end_headers()

    def _json(self, code, obj):
        self._send(code, json.dumps(obj, ensure_ascii=False))

    def do_GET(self):
        parts = urlparse(self.path).path.strip("/").split("/")
        if parts == ["healthz"]:
            self._route = "healthz"
            return self._json(200, {"ok": True, "provider": os.environ.get("KIT_PROVIDER", "ollama")})
        if parts[0] == "assets" and len(parts) >= 2:
            self._route = "asset"
            target = (DIST / "assets" / parts[-1]).resolve()
            if DIST.resolve() not in target.parents or not target.is_file():
                return self._json(404, {"error": "not_found"})
            ctype = MIME.get(target.suffix, "application/octet-stream")
            return self._send(200, target.read_bytes(), ctype)

        if len(parts) == 2 and parts[0] == "s":
            self._route = "page"
            sid = find_session(parts[1])
            if not sid:
                return self._send(404, "このリンクは使えません。", "text/plain; charset=utf-8")
            return self._send(200, render_page(parts[1], load_cfg(sid)), "text/html; charset=utf-8")
        if len(parts) == 4 and parts[0] == "api" and parts[1] == "s" and parts[3] == "state":
            self._route = "state"
            sid = find_session(parts[2])
            if not sid:
                return self._json(404, {"error": "unknown_session"})
            return self._json(200, client_state(sid, load_cfg(sid)))
        self._route = "not_found"
        return self._json(404, {"error": "not_found"})

    def _admin_ok(self):
        """The operator route. Everything subject-facing is guarded by the URL token instead."""
        want = os.environ.get("KIT_ADMIN_TOKEN", "")
        got = (self.headers.get("Authorization") or "")
        got = got[7:].strip() if got.startswith("Bearer ") else ""
        return bool(want) and secrets.compare_digest(want, got)

    def do_POST(self):
        parts = urlparse(self.path).path.strip("/").split("/")

        # Operator: mint a session on a deployed box, where there is no shell to run --new in.
        if parts == ["api", "sessions"]:
            self._route = "admin_sessions"
            if not self._admin_ok():
                return self._json(403, {"error": "forbidden"})
            body = self._body()
            sid = (body.get("session_id") or time.strftime("s-%Y%m%d-%H%M")).strip()
            try:
                token = create_session(sid, body.get("subject") or None,
                                       body.get("agenda") or "interviewer/agenda.yaml")
            except FileExistsError:
                return self._json(409, {"error": "session_exists", "session_id": sid})
            return self._json(200, {"session_id": sid, "path": "/s/" + token})

        if len(parts) != 4 or parts[0] != "api" or parts[1] != "s":
            return self._json(404, {"error": "not_found"})
        action = parts[3]
        self._route = action
        sid = find_session(parts[2])
        if not sid:
            return self._json(404, {"error": "unknown_session"})
        cfg = load_cfg(sid)
        subject_id = cfg["subject"]["id"]
        body = self._body()

        if action == "start":
            t = Transcript(transcript_path(sid), subject=subject_id)
            if t.agent_turns():
                return self._json(200, client_state(sid, cfg))
            t.append({"who": "system", "kind": "consent",
                      "explainer_version": cfg.get("explainer_version", "v1"),
                      "accepted_at": time.strftime("%Y-%m-%dT%H:%M:%S%z")})
            t.append({"who": "system", "kind": "intro", "jp": INTRO_JP,
                      "explainer_version": cfg.get("explainer_version", "v1")})
            ev = turnmod.run_turn(transcript_path(sid))
            return self._json(200, {"reply_jp": ev.get("reply_jp", ""), "progress": progress(sid, cfg)})

        if action == "turns":
            text = (body.get("text") or "").strip()
            if not text:
                return self._json(400, {"error": "empty"})
            t = Transcript(transcript_path(sid), subject=subject_id)
            t.append({"who": subject_id, "kind": "text", "jp": text, "en": ""})
            ev = turnmod.run_turn(transcript_path(sid))
            return self._json(200, {"reply_jp": ev.get("reply_jp", ""),
                                    "reply_en": ev.get("reply_en", ""),
                                    "progress": progress(sid, cfg)})

        if action == "end":
            t = Transcript(transcript_path(sid), subject=subject_id)
            t.append({"who": "system", "kind": "session_end",
                      "reason": body.get("reason") or "subject_stopped"})
            return self._json(200, {"ok": True})

        return self._json(404, {"error": "not_found"})


def create_session(sid, subject=None, agenda="interviewer/agenda.yaml"):
    """Write a session config, return the one URL token it will ever have."""
    if session_file(sid).exists():
        raise FileExistsError(session_file(sid))
    token = secrets.token_urlsafe(32)
    cfg = {
        "session_id": sid,
        "subject": subject or {
            "id": "subject", "display_jp": "インタビューの相手", "role_jp": "この仕事をしている方",
            "language": "ja", "english": False, "tool_jp": "",
        },
        "agenda": agenda,
        "explainer_version": "v1",
        "created_at": time.strftime("%Y-%m-%d"),
        "token_hash": hash_token(token),
    }
    SESSIONS.mkdir(exist_ok=True)
    session_file(sid).write_text(json.dumps(cfg, ensure_ascii=False, indent=2) + "\n")
    return token


def new_session(sid, port=8765, subject=None):
    try:
        token = create_session(sid, subject)
    except FileExistsError:
        raise SystemExit(f"{session_file(sid)} already exists")
    print(f"session {sid} created")
    print(f"http://127.0.0.1:{port}/s/{token}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--new")
    ap.add_argument("--session")
    ap.add_argument("--port", type=int, default=int(os.environ.get("PORT", 8765)))
    ap.add_argument("--host", default=os.environ.get("KIT_HOST", "127.0.0.1"))
    args = ap.parse_args()
    # A fresh clone has no transcripts/ or sessions/ yet: make them before serving, or the
    # first turn fails on a missing directory rather than on anything interesting.
    (ROOT / "transcripts").mkdir(exist_ok=True)
    SESSIONS.mkdir(exist_ok=True)
    if args.new:
        return new_session(args.new, args.port)
    # A deployed server serves whatever sessions exist; a local one is usually one interview.
    if args.session and not session_file(args.session).exists():
        raise SystemExit(f"no such session: {session_file(args.session)}")
    server = ThreadingHTTPServer((args.host, args.port), Handler)
    label = args.session or f"{len(list(SESSIONS.glob('*.json')))} session(s)"
    print(f"serving {label} on http://{args.host}:{args.port}/s/<token>")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
