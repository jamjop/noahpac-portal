"""Pre-transmission safety checks for Clinical Assistant prompts."""
import re


IDENTIFIER_PATTERNS = [
    ("email address", re.compile(r"\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b", re.I)),
    ("phone number", re.compile(r"\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}\b")),
    ("Social Security number", re.compile(r"\b\d{3}-\d{2}-\d{4}\b")),
    ("medical record number", re.compile(r"\b(?:MRN|medical record(?: number)?|patient ID)\s*[:#-]?\s*[A-Z0-9-]{4,}\b", re.I)),
    ("date of birth", re.compile(r"\b(?:DOB|date of birth)\s*[:#-]?\s*\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b", re.I)),
    ("street address", re.compile(r"\b\d{1,6}\s+[A-Za-z0-9.'-]+(?:\s+[A-Za-z0-9.'-]+){0,4}\s+(?:street|st|avenue|ave|road|rd|boulevard|blvd|drive|dr|lane|ln|court|ct)\b", re.I)),
]


def detected_identifier(text):
    for label, pattern in IDENTIFIER_PATTERNS:
        if pattern.search(text):
            return label
    return None
