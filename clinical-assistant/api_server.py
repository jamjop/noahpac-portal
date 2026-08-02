#!/usr/bin/env python3
"""api_server.py -- local Flask API for the clinical RAG assistant.

Exposes POST /api/ask: embeds the question via Voyage AI, retrieves the
top-k most relevant chunks from the persistent Chroma collection built by
ingest.py, and asks Claude to answer using only those excerpts, citing
which source document(s) it used.

Runs on 127.0.0.1:8766 behind nginx (Authelia-protected).
Keys read from VOYAGE_API_KEY / ANTHROPIC_API_KEY env vars (systemd unit).
"""
import os
from pathlib import Path

import anthropic
import chromadb
import voyageai
from flask import Flask, jsonify, request

APP_DIR = Path(__file__).parent
CHROMA_DIR = APP_DIR / "chroma_data"

VOYAGE_API_KEY = os.environ.get("VOYAGE_API_KEY")
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY")
EMBED_MODEL = "voyage-3"
ANSWER_MODEL = os.environ.get("ANSWER_MODEL", "claude-sonnet-5")
TOP_K = 6
MAX_QUESTION_CHARS = 2000
MAX_HISTORY_TURNS = 10

app = Flask(__name__)

vo = voyageai.Client(api_key=VOYAGE_API_KEY) if VOYAGE_API_KEY else None
anthropic_client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY) if ANTHROPIC_API_KEY else None
chroma_client = chromadb.PersistentClient(path=str(CHROMA_DIR))
collection = chroma_client.get_or_create_collection(name="clinical_docs")

SYSTEM_PROMPT = """You are a clinical reference assistant for a physician assistant's personal practice. Answer questions ONLY using the excerpts provided below -- do not use outside knowledge, and do not guess.

If the provided excerpts don't contain enough information to answer the question, say so plainly rather than filling gaps with your own medical knowledge. When declining, do not describe or speculate about what topics the rest of the document corpus might cover beyond the excerpts you were actually given this turn -- you only see a small retrieved slice, not the whole corpus, so guessing at its contents is itself a form of making things up.

After your answer, on a new line, list which source document(s) you actually used, exactly as: SOURCES: filename1.pdf, filename2.pdf
If you didn't use any of the excerpts, write: SOURCES: none
"""


def build_context_block(chunks, metadatas):
    parts = [f"[Source: {meta['source_filename']}]\n{chunk}" for chunk, meta in zip(chunks, metadatas)]
    return "\n\n---\n\n".join(parts)


def parse_sources(answer_text, retrieved_filenames):
    """Split the model's SOURCES: line out of the answer text. Validated
    against what was actually retrieved -- never trust the model to only
    name real files."""
    lines = answer_text.rstrip().split("\n")
    sources = []
    answer_only = answer_text
    for i, line in enumerate(lines):
        if line.strip().upper().startswith("SOURCES:"):
            named = line.split(":", 1)[1].strip()
            if named.lower() != "none":
                sources = [s.strip() for s in named.split(",") if s.strip() in retrieved_filenames]
            answer_only = "\n".join(lines[:i]).rstrip()
            break
    return answer_only, sources


@app.route("/api/ask", methods=["POST"])
def ask():
    if not vo or not anthropic_client:
        return jsonify({"error": "Server not configured -- missing API key(s)."}), 503

    data = request.get_json(force=True, silent=True) or {}
    question = (data.get("question") or "").strip()
    history = data.get("conversation_history") or []

    if not question:
        return jsonify({"error": "question is required"}), 400
    if len(question) > MAX_QUESTION_CHARS:
        return jsonify({"error": "question too long"}), 400

    try:
        embed_result = vo.embed([question], model=EMBED_MODEL, input_type="query")
        query_embedding = embed_result.embeddings[0]
    except Exception as e:
        return jsonify({"error": f"embedding failed: {e}"}), 502

    results = collection.query(query_embeddings=[query_embedding], n_results=TOP_K)
    chunks = results["documents"][0] if results["documents"] else []
    metadatas = results["metadatas"][0] if results["metadatas"] else []

    if not chunks:
        return jsonify({
            "answer": "I don't have any indexed documents to answer from yet.",
            "sources": [],
        })

    context_block = build_context_block(chunks, metadatas)
    retrieved_filenames = {m["source_filename"] for m in metadatas}

    messages = []
    for turn in history[-MAX_HISTORY_TURNS:]:
        role = turn.get("role")
        content = turn.get("content")
        if role in ("user", "assistant") and content:
            messages.append({"role": role, "content": content})

    messages.append({
        "role": "user",
        "content": f"Excerpts:\n\n{context_block}\n\n---\n\nQuestion: {question}",
    })

    try:
        response = anthropic_client.messages.create(
            model=ANSWER_MODEL,
            max_tokens=1024,
            system=SYSTEM_PROMPT,
            messages=messages,
        )
    except Exception as e:
        return jsonify({"error": f"Claude API call failed: {e}"}), 502

    raw_answer = response.content[0].text
    answer, cited_filenames = parse_sources(raw_answer, retrieved_filenames)

    metadata_by_filename = {m["source_filename"]: m for m in metadatas}
    sources = []
    for fname in cited_filenames:
        meta = metadata_by_filename.get(fname)
        if not meta:
            continue
        if meta["corpus"] == "existing_hep":
            sources.append({"filename": fname, "url": f"/documents/pdfs/{fname}"})
        else:
            sources.append({"filename": fname, "url": None})

    return jsonify({"answer": answer, "sources": sources})


@app.route("/health")
def health():
    return jsonify({"ok": True, "collection_count": collection.count()})


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=8766, debug=False)
