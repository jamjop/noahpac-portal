#!/usr/bin/env python3
"""
api_server.py — local Flask API for antibiogram PDF extraction.

Exposes POST /extract: downloads a PDF URL, runs Claude vision extraction,
returns facility JSON for the antibiogram app frontend.

Runs on 127.0.0.1:8765 behind nginx.
API key read from ANTHROPIC_API_KEY env var (set in systemd unit).
"""

import base64
import io
import json
import os
import re
import sys
import tempfile
import urllib.request
from pathlib import Path
from urllib.parse import urlparse

import anthropic
from flask import Flask, jsonify, request
from pdf2image import convert_from_path

# ── reuse extraction logic from pdf_to_js.py ──────────────────────────────
sys.path.insert(0, str(Path(__file__).parent))
from pdf_to_js import EXTRACT_PROMPT, ABX_MAP, merge_results, slugify

app = Flask(__name__)

MAX_PDF_BYTES = 30 * 1024 * 1024  # 30 MB
ALLOWED_EXTENSIONS = {".pdf"}
TIMEOUT_DOWNLOAD = 30
MODEL = os.environ.get("EXTRACT_MODEL", "claude-haiku-4-5-20251001")


def validate_url(url: str) -> str | None:
    """Return error string if URL is not acceptable, else None."""
    try:
        p = urlparse(url)
    except Exception:
        return "Invalid URL"
    if p.scheme not in ("https", "http"):
        return "URL must use http or https"
    ext = Path(p.path).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        return f"URL must point to a PDF file (got '{ext}')"
    return None


def download_pdf(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": "nd-antibiogram-import/1.0"})
    with urllib.request.urlopen(req, timeout=TIMEOUT_DOWNLOAD) as resp:
        content_type = resp.headers.get("Content-Type", "")
        data = resp.read(MAX_PDF_BYTES + 1)
    if len(data) > MAX_PDF_BYTES:
        raise ValueError(f"PDF exceeds {MAX_PDF_BYTES // 1024 // 1024} MB limit")
    return data


def image_to_b64(img) -> str:
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return base64.standard_b64encode(buf.getvalue()).decode()


def extract_page(client: anthropic.Anthropic, img, page_num: int) -> dict:
    b64 = image_to_b64(img)
    message = client.messages.create(
        model=MODEL,
        max_tokens=4096,
        messages=[{
            "role": "user",
            "content": [
                {"type": "image", "source": {"type": "base64",
                                              "media_type": "image/png", "data": b64}},
                {"type": "text", "text": EXTRACT_PROMPT},
            ],
        }],
    )
    raw = message.content[0].text.strip()
    raw = re.sub(r"^```(?:json)?\s*", "", raw)
    raw = re.sub(r"\s*```$", "", raw)
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return {"organisms": []}


def clean_organisms(organisms: list) -> list:
    """Validate susceptibility values; drop unknown antibiotic IDs."""
    cleaned = []
    for org in organisms:
        raw_s = org.get("s", {})
        s = {}
        for abx_id, val in raw_s.items():
            if abx_id not in ABX_MAP:
                continue
            if val is None or val == "nr":
                s[abx_id] = val
            else:
                try:
                    iv = int(val)
                    s[abx_id] = max(0, min(100, iv))
                except (TypeError, ValueError):
                    pass
        cleaned.append({
            "name":     org.get("name", "Unknown"),
            "gram":     org.get("gram", "unknown"),
            "isolates": int(org.get("isolates") or 0),
            "note":     org.get("note") or None,
            "s":        s,
        })
    return cleaned


@app.route("/extract", methods=["POST"])
def extract():
    api_key = os.environ.get("ANTHROPIC_API_KEY", "").strip()
    if not api_key:
        return jsonify({"error": "Server not configured (missing API key)"}), 503

    body = request.get_json(silent=True) or {}
    url = (body.get("url") or "").strip()
    if not url:
        return jsonify({"error": "Missing 'url' field"}), 400

    err = validate_url(url)
    if err:
        return jsonify({"error": err}), 400

    # Optional overrides from client
    name_override     = (body.get("name") or "").strip()
    location_override = (body.get("location") or "").strip()
    period_override   = (body.get("period") or "").strip()

    try:
        pdf_bytes = download_pdf(url)
    except Exception as exc:
        return jsonify({"error": f"Could not download PDF: {exc}"}), 400

    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
        tmp.write(pdf_bytes)
        tmp_path = tmp.name

    try:
        images = convert_from_path(tmp_path, dpi=200)
    except Exception as exc:
        Path(tmp_path).unlink(missing_ok=True)
        return jsonify({"error": f"PDF render failed: {exc}"}), 400

    client = anthropic.Anthropic(api_key=api_key)
    page_results = []
    for i, img in enumerate(images, 1):
        result = extract_page(client, img, i)
        page_results.append(result)

    Path(tmp_path).unlink(missing_ok=True)

    data = merge_results(page_results)

    name     = name_override     or data.get("facility") or Path(urlparse(url).path).stem
    location = location_override or data.get("location") or ""
    period   = period_override   or data.get("period")   or ""
    fac_id   = slugify(name + "_" + period)

    facility = {
        "id":         fac_id,
        "name":       name,
        "location":   location,
        "period":     period,
        "sourceNote": f"Imported · {name} {period} · % susceptible, 1st isolate/patient/year · {url}",
        "organisms":  clean_organisms(data.get("organisms", [])),
    }

    gpos = sum(1 for o in facility["organisms"] if o["gram"] == "positive")
    gneg = sum(1 for o in facility["organisms"] if o["gram"] == "negative")

    return jsonify({
        "facility": facility,
        "stats": {
            "pages": len(images),
            "organisms": len(facility["organisms"]),
            "gram_positive": gpos,
            "gram_negative": gneg,
        }
    })


@app.route("/health")
def health():
    return jsonify({"ok": True})


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=8765, debug=False)
