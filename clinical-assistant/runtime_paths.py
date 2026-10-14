"""Filesystem locations for Clinical Assistant runtime state.

Development keeps the historical in-tree defaults. Production sets the
environment variables from its systemd unit so mutable and executable runtime
artifacts live outside the Nginx document root.
"""
import os
from pathlib import Path

APP_DIR = Path(__file__).resolve().parent
STATE_DIR = Path(os.environ.get("CLINICAL_ASSISTANT_STATE_DIR", APP_DIR))
CHROMA_DIR = Path(
    os.environ.get("CLINICAL_ASSISTANT_CHROMA_DIR", STATE_DIR / "chroma_data")
)
LIBRARY_DIR = Path(
    os.environ.get("CLINICAL_ASSISTANT_LIBRARY_DIR", APP_DIR / "library")
)
