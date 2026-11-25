"""Append the subject's turns to the transcript from text or voice memos.

usage:
  python src/record.py transcripts/chie-2026-11-25.jsonl --text "はい、わかりました…"
  python src/record.py transcripts/chie-2026-11-25.jsonl --audio ~/Downloads/memo.m4a

Audio path: ffmpeg → wav → whisper large-v3 (Japanese). The English gloss is produced by
the same whisper pass when language=japanese auto-translate is available; otherwise left
empty and filled by the draft step. First run downloads ~3 GB of model weights.
"""

import argparse
import json
import subprocess
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from transcript import Transcript

MODEL_NAME = "large-v3"


def transcribe(audio):
    try:
        import whisper  # openai-whisper, pip-installed in .venv
    except ImportError:
        print("pip install openai-whisper into the kit venv first", file=sys.stderr)
        sys.exit(2)
    m = whisper.load_model(MODEL_NAME)
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        subprocess.run(["ffmpeg", "-y", "-i", str(audio), "-ar", "16000", tmp.name],
                       check=True, capture_output=True)
        res = m.transcribe(tmp.name, language="japanese")
    return res["text"].strip()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("transcript")
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument("--text")
    g.add_argument("--audio")
    ap.add_argument("--en", default="", help="optional English gloss")
    args = ap.parse_args()

    jp = args.text or transcribe(args.audio)
    t = Transcript(args.transcript)
    ev = t.append({"who": "chie", "kind": "voice" if args.audio else "text", "jp": jp, "en": args.en})
    print(json.dumps(ev, ensure_ascii=False))


if __name__ == "__main__":
    main()
