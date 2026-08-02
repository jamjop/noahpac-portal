#!/usr/bin/env python3
"""Extracts text from both PDF corpora, chunks it, embeds via Voyage AI, and
upserts into a persistent Chroma collection. Re-run after adding new files to
library/ to pick them up -- does a full rebuild each time (corpus is small
enough that incremental updates aren't worth the complexity)."""
import base64
import io
import os
import sys
import time
from pathlib import Path

import anthropic
import chromadb
import pdfplumber
import voyageai
from pdf2image import convert_from_path

APP_DIR = Path(__file__).parent
CORPUS_A_DIR = Path("/var/www/noahpac-portal/documents/pdfs")
CORPUS_B_DIR = APP_DIR / "library"
CHROMA_DIR = APP_DIR / "chroma_data"

CHUNK_SIZE_CHARS = 3200  # ~800 tokens at ~4 chars/token
CHUNK_OVERLAP_CHARS = 400  # ~100 tokens

VOYAGE_API_KEY = os.environ.get("VOYAGE_API_KEY")
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY")
EMBED_MODEL = "voyage-3"
# Voyage accounts without a payment method on file are capped at 3 RPM /
# 10K TPM (still using the same free token allowance either way). The
# exact behavior didn't match a simple "N requests per rolling 60s"
# model in practice (a batch that should fit under 10K TPM failed on
# every retry regardless of how long we waited), so batches that get
# rate limited are adaptively split smaller and retried rather than
# assuming a fixed size/delay will always work -- see the splitting
# logic below. These are just the starting point before any splitting.
EMBED_BATCH_SIZE = 8
EMBED_BATCH_DELAY_SEC = 30
# Cheap/fast model -- this is plain OCR-style transcription, not reasoning,
# same choice antibiogram's api_server.py makes for its own vision extraction.
OCR_MODEL = "claude-haiku-4-5-20251001"
OCR_PROMPT = (
    "Transcribe all the text visible in this image verbatim, preserving "
    "structure (headings, bullet points, steps) as plain text. Do not "
    "summarize, comment, or add anything not in the image."
)


def image_to_b64(img) -> str:
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return base64.standard_b64encode(buf.getvalue()).decode()


def ocr_page(client: anthropic.Anthropic, img) -> str:
    message = client.messages.create(
        model=OCR_MODEL,
        max_tokens=2048,
        messages=[{
            "role": "user",
            "content": [
                {"type": "image", "source": {"type": "base64",
                                              "media_type": "image/png", "data": image_to_b64(img)}},
                {"type": "text", "text": OCR_PROMPT},
            ],
        }],
    )
    return message.content[0].text.strip()


def extract_text(pdf_path: Path, anthropic_client: anthropic.Anthropic | None) -> str:
    """Per-page: use pdfplumber's text layer if present, otherwise fall back
    to rendering the page as an image and running it through Claude vision --
    several HEP PDFs are scanned images with no embedded text layer at all."""
    text_parts = []
    needs_ocr_pages = []
    with pdfplumber.open(pdf_path) as pdf:
        for i, page in enumerate(pdf.pages):
            t = page.extract_text()
            if t:
                text_parts.append((i, t))
            else:
                needs_ocr_pages.append(i)

    if needs_ocr_pages and anthropic_client:
        images = convert_from_path(str(pdf_path), dpi=200)
        for i in needs_ocr_pages:
            if i >= len(images):
                continue
            try:
                ocr_text = ocr_page(anthropic_client, images[i])
            except Exception as e:
                # A single page tripping Claude's content filter (has
                # happened on exercise-diagram pages) shouldn't drop the
                # whole document -- just that page's text.
                print(f"  WARNING: OCR failed on page {i}, skipping that "
                      f"page only: {e}", file=sys.stderr)
                continue
            if ocr_text:
                text_parts.append((i, ocr_text))

    text_parts.sort(key=lambda x: x[0])
    return "\n\n".join(t for _, t in text_parts)


def chunk_text(text: str, size: int = CHUNK_SIZE_CHARS, overlap: int = CHUNK_OVERLAP_CHARS):
    chunks = []
    start = 0
    n = len(text)
    while start < n:
        end = min(start + size, n)
        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)
        if end == n:
            break
        start = end - overlap
    return chunks


def collect_documents():
    docs = []
    if CORPUS_A_DIR.exists():
        for pdf_path in sorted(CORPUS_A_DIR.glob("*.pdf")):
            docs.append(("existing_hep", pdf_path))
    if CORPUS_B_DIR.exists():
        for pdf_path in sorted(CORPUS_B_DIR.glob("*.pdf")):
            docs.append(("library", pdf_path))
    return docs


def main():
    if not VOYAGE_API_KEY:
        print("ERROR: VOYAGE_API_KEY not set", file=sys.stderr)
        sys.exit(1)

    anthropic_client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY) if ANTHROPIC_API_KEY else None
    if not anthropic_client:
        print("WARNING: ANTHROPIC_API_KEY not set -- scanned/image-only PDFs "
              "will be skipped instead of OCR'd", file=sys.stderr)

    vo = voyageai.Client(api_key=VOYAGE_API_KEY)
    client = chromadb.PersistentClient(path=str(CHROMA_DIR))
    collection = client.get_or_create_collection(name="clinical_docs")

    docs = collect_documents()
    if not docs:
        print("No PDFs found in either corpus -- nothing to index.", file=sys.stderr)
        return

    all_ids = []
    all_chunks = []
    all_metadatas = []

    for corpus, pdf_path in docs:
        print(f"Extracting {pdf_path.name} ({corpus})...")
        try:
            text = extract_text(pdf_path, anthropic_client)
        except Exception as e:
            print(f"  WARNING: failed to extract, skipping: {e}", file=sys.stderr)
            continue
        if not text.strip():
            print("  WARNING: no extractable text, skipping", file=sys.stderr)
            continue
        chunks = chunk_text(text)
        for i, chunk in enumerate(chunks):
            all_ids.append(f"{corpus}:{pdf_path.name}:{i}")
            all_chunks.append(chunk)
            all_metadatas.append({
                "source_filename": pdf_path.name,
                "corpus": corpus,
                "chunk_index": i,
            })

    if not all_chunks:
        print("No text extracted from any document.", file=sys.stderr)
        return

    print(f"Embedding {len(all_chunks)} chunks via Voyage AI...")
    # Adaptive: a fixed batch size + fixed wait turned out not to reliably
    # predict Voyage's actual reduced-tier limiter (observed: a batch that
    # should easily fit under 10K TPM failed on every retry regardless of
    # how long we waited, while a much smaller test batch succeeded fine).
    # Rather than guess the exact undocumented mechanism, split a failing
    # batch in half and retry the halves -- converges to size-1 requests
    # if needed, which should always eventually fit whatever the real
    # constraint is.
    embeddings_by_index = {}
    queue = [(i, min(i + EMBED_BATCH_SIZE, len(all_chunks))) for i in range(0, len(all_chunks), EMBED_BATCH_SIZE)]
    first_call = True

    while queue:
        start, end = queue.pop(0)
        batch = all_chunks[start:end]

        if not first_call:
            time.sleep(EMBED_BATCH_DELAY_SEC)
        first_call = False

        try:
            result = vo.embed(batch, model=EMBED_MODEL, input_type="document")
            for offset, emb in enumerate(result.embeddings):
                embeddings_by_index[start + offset] = emb
            print(f"  Embedded chunks {start}-{end - 1} ({len(embeddings_by_index)}/{len(all_chunks)} done).")
        except voyageai.error.RateLimitError:
            if end - start == 1:
                print(f"  WARNING: chunk {start} rate limited even alone -- "
                      f"skipping it rather than retrying forever.", file=sys.stderr)
                continue
            mid = (start + end) // 2
            print(f"  Chunks {start}-{end - 1} rate limited, splitting into "
                  f"{start}-{mid - 1} and {mid}-{end - 1}.", file=sys.stderr)
            queue.insert(0, (mid, end))
            queue.insert(0, (start, mid))

    all_embeddings = [embeddings_by_index[i] for i in sorted(embeddings_by_index)]
    if len(all_embeddings) != len(all_chunks):
        # Some chunks were skipped (rate limited even alone) -- keep only
        # the ids/metadatas/documents that actually got embedded.
        kept_indices = sorted(embeddings_by_index)
        all_ids = [all_ids[i] for i in kept_indices]
        all_chunks = [all_chunks[i] for i in kept_indices]
        all_metadatas = [all_metadatas[i] for i in kept_indices]

    existing = collection.get()
    if existing["ids"]:
        collection.delete(ids=existing["ids"])

    collection.add(
        ids=all_ids,
        embeddings=all_embeddings,
        documents=all_chunks,
        metadatas=all_metadatas,
    )

    print(f"Indexed {len(all_chunks)} chunks from {len(docs)} documents.")
    print(f"Collection count: {collection.count()}")


if __name__ == "__main__":
    main()
