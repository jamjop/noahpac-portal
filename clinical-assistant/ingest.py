#!/usr/bin/env python3
"""Extracts text from both PDF corpora, chunks it, embeds via Voyage AI, and
upserts into a persistent Chroma collection. Re-run after adding new files to
library/ to pick them up -- does a full rebuild each time (corpus is small
enough that incremental updates aren't worth the complexity)."""
import base64
import io
import os
import sys
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
EMBED_BATCH_SIZE = 128
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
            if i < len(images):
                ocr_text = ocr_page(anthropic_client, images[i])
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
    all_embeddings = []
    for i in range(0, len(all_chunks), EMBED_BATCH_SIZE):
        batch = all_chunks[i:i + EMBED_BATCH_SIZE]
        result = vo.embed(batch, model=EMBED_MODEL, input_type="document")
        all_embeddings.extend(result.embeddings)

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
