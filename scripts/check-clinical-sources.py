#!/usr/bin/env python3
"""Validate and periodically check authoritative links in clinical-review.json."""

import argparse
import concurrent.futures
import datetime
import json
import os
import tempfile
import urllib.error
import urllib.request
from pathlib import Path
from urllib.parse import urlparse


REPO = Path(os.environ.get("NOAHPAC_REPO", "/var/www/noahpac-portal")).resolve()
DEFAULT_MANIFEST = REPO / "clinical-review.json"
DEFAULT_OUTPUT = Path(os.environ.get(
    "NOAHPAC_SOURCE_STATUS", "/var/lib/noahpac-monitor/source-links.json"
))
SOFT_HTTP_CODES = {401, 403, 405, 406, 429}


def validate_manifest(path: Path) -> tuple[dict, list[str]]:
    errors: list[str] = []
    try:
        manifest = json.loads(path.read_text())
    except (OSError, json.JSONDecodeError) as exc:
        return {}, [f"Cannot read manifest: {exc}"]
    if manifest.get("schema_version") != 1:
        errors.append("schema_version must be 1")
    sources = manifest.get("sources")
    tools = manifest.get("tools")
    if not isinstance(sources, dict) or not sources:
        errors.append("sources must be a non-empty object")
        sources = {}
    if not isinstance(tools, list) or not tools:
        errors.append("tools must be a non-empty array")
        tools = []

    seen: set[str] = set()
    for source_id, source in sources.items():
        url = source.get("url", "") if isinstance(source, dict) else ""
        parsed = urlparse(url)
        if parsed.scheme != "https" or not parsed.netloc:
            errors.append(f"source {source_id} must use an absolute HTTPS URL")
    for tool in tools:
        tool_id = tool.get("id", "") if isinstance(tool, dict) else ""
        if not tool_id or tool_id in seen:
            errors.append(f"missing or duplicate tool id: {tool_id!r}")
            continue
        seen.add(tool_id)
        route = tool.get("path", "")
        if not route.startswith("/") or not route.endswith("/"):
            errors.append(f"tool {tool_id} has invalid path {route!r}")
        elif not (REPO / route.strip("/") / "index.html").is_file():
            errors.append(f"tool {tool_id} route does not exist: {route}")
        monitor = tool.get("monitor")
        if monitor and not (REPO / monitor).is_file():
            errors.append(f"tool {tool_id} monitor does not exist: {monitor}")
        for source_id in tool.get("source_ids", []):
            if source_id not in sources:
                errors.append(f"tool {tool_id} references unknown source {source_id}")
    return manifest, errors


def check_source(item: tuple[str, dict], timeout: int) -> dict:
    source_id, source = item
    request = urllib.request.Request(
        source["url"],
        headers={"User-Agent": "Mozilla/5.0 (compatible; NoahPACSourceMonitor/1.0)"},
        method="GET",
    )
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            response.read(1024)
            return {
                "id": source_id, "title": source["title"], "url": source["url"],
                "status": "ok", "http_status": response.status,
                "final_url": response.geturl(),
            }
    except urllib.error.HTTPError as exc:
        status = "reachable_restricted" if exc.code in SOFT_HTTP_CODES else "failed"
        return {
            "id": source_id, "title": source["title"], "url": source["url"],
            "status": status, "http_status": exc.code, "error": str(exc),
        }
    except Exception as exc:
        return {
            "id": source_id, "title": source["title"], "url": source["url"],
            "status": "failed", "http_status": None, "error": str(exc),
        }


def write_atomic(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    descriptor, temporary = tempfile.mkstemp(dir=path.parent, prefix=path.name, suffix=".tmp")
    try:
        with os.fdopen(descriptor, "w") as handle:
            json.dump(payload, handle, indent=2)
            handle.write("\n")
        os.chmod(temporary, 0o644)
        os.replace(temporary, path)
    except Exception:
        Path(temporary).unlink(missing_ok=True)
        raise


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--manifest", type=Path, default=DEFAULT_MANIFEST)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--check-config", action="store_true")
    parser.add_argument("--timeout", type=int, default=30)
    parser.add_argument("--workers", type=int, default=6)
    args = parser.parse_args()

    manifest, errors = validate_manifest(args.manifest)
    if errors:
        for error in errors:
            print(f"ERROR: {error}")
        return 2
    if args.check_config:
        print(f"Clinical source configuration valid: {len(manifest['tools'])} tools, {len(manifest['sources'])} sources.")
        return 0

    with concurrent.futures.ThreadPoolExecutor(max_workers=max(1, args.workers)) as executor:
        results = list(executor.map(
            lambda item: check_source(item, args.timeout), manifest["sources"].items()
        ))
    results.sort(key=lambda result: result["id"])
    failures = [result for result in results if result["status"] == "failed"]
    payload = {
        "checked_at": datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds"),
        "source_count": len(results),
        "failure_count": len(failures),
        "results": results,
    }
    write_atomic(args.output, payload)
    for result in failures:
        print(f"FAILED {result['id']}: {result.get('http_status') or result.get('error')}")
    print(f"Clinical source check complete: {len(results) - len(failures)} reachable, {len(failures)} failed.")
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
