#!/usr/bin/env python3
"""Parse all artstroismolian.com project pages into a structured JSON."""
import json
import re
import sys
from html import unescape
from pathlib import Path
from urllib.parse import quote, urljoin, urlsplit, urlunsplit

ROOT = Path(__file__).parent
SRC = ROOT / "projects"
OUT = ROOT / "projects.json"

BASE = "https://www.artstroismolian.com/projects/"

TITLE_RE = re.compile(
    r'<h1[^>]*class="main-title[^"]*"[^>]*>\s*<a[^>]*>(.*?)</a>\s*</h1>',
    re.DOTALL,
)
COVER_RE = re.compile(
    r'<div class="avia-image-container-inner">\s*<a[^>]+href="([^"]+)"[^>]*>\s*<img[^>]+src="([^"]+)"',
    re.DOTALL,
)
TEXTBLOCK_RE = re.compile(
    r'<div class="avia_textblock[^"]*"[^>]*>(.*?)</div>\s*</section>',
    re.DOTALL,
)
GALLERY_RE = re.compile(
    r'<a href="([^"]+)"\s+class="av-masonry-entry[^"]*fancybox"[^>]*data-fancybox-group="gallery"',
    re.DOTALL,
)
IFRAME_RE = re.compile(r'<iframe[^>]+src="([^"]+)"', re.DOTALL)
PARTNER_LOGO_RE = re.compile(r'<a[^>]+href="([^"]+)"[^>]*target="_blank"[^>]*>\s*<img[^>]+src="(\.\./part/[^"]+)"', re.DOTALL)


def strip_tags(s: str) -> str:
    s = re.sub(r"<br\s*/?>", "\n", s)
    s = re.sub(r"</p>", "\n", s)
    s = re.sub(r"<[^>]+>", "", s)
    s = unescape(s).replace(" ", " ")
    s = re.sub(r"\s+\n", "\n", s)
    s = re.sub(r"\n\s+", "\n", s)
    s = re.sub(r"[ \t]+", " ", s)
    return s.strip()


FIELD_LABELS = [
    ("location", "Местоположение"),
    ("client", "Възложител"),
    ("scope", "Част"),
    ("description", "КРАТКО ОПИСАНИЕ"),
]


def parse_details(textblock_html: str) -> dict:
    """Parse the 'ДЕТАЙЛИ' textblock into structured fields.

    The textblock has labels inside <strong>LABEL:</strong> markers. Order
    varies (some projects put Част after КРАТКО ОПИСАНИЕ). We anchor on
    the strong-tagged label so we don't match Част as a prefix of Частно.
    """
    # Find each label's position by looking for "<strong>LABEL" inside the html
    positions = []
    for key, label in FIELD_LABELS:
        # Match <strong>LABEL or <strong> LABEL (with possible spaces, optional colon)
        m = re.search(rf"<strong>\s*{re.escape(label)}\b[^<]*</strong>", textblock_html)
        if m:
            positions.append((m.start(), m.end(), key, label))
    positions.sort()

    fields = {}
    for i, (start, end, key, label) in enumerate(positions):
        next_start = positions[i + 1][0] if i + 1 < len(positions) else len(textblock_html)
        chunk_html = textblock_html[end:next_start]
        chunk_text = strip_tags(chunk_html)
        # Drop a leading colon if present
        chunk_text = chunk_text.lstrip(":").strip()
        if chunk_text:
            fields[key] = chunk_text

    fields["raw_text"] = strip_tags(textblock_html)
    return fields


def parse_project(html: str, n: int) -> dict:
    title_m = TITLE_RE.search(html)
    title = strip_tags(title_m.group(1)) if title_m else None

    cover_m = COVER_RE.search(html)
    cover = cover_m.group(2) if cover_m else None

    textblock_m = TEXTBLOCK_RE.search(html)
    details = parse_details(textblock_m.group(1)) if textblock_m else {}

    gallery = GALLERY_RE.findall(html)
    # Dedupe preserving order
    seen = set()
    gallery_unique = []
    for g in gallery:
        if g not in seen:
            seen.add(g)
            gallery_unique.append(g)

    iframe_m = IFRAME_RE.search(html)
    map_iframe = iframe_m.group(1) if iframe_m else None

    partner_m = PARTNER_LOGO_RE.search(html)
    partner_url = partner_m.group(1) if partner_m else None
    partner_logo = partner_m.group(2) if partner_m else None

    def _abs(rel):
        if not rel:
            return None
        absolute = urljoin(BASE, rel)
        # URL-encode path (spaces, parentheses) while preserving / : ? & =
        parts = urlsplit(absolute)
        return urlunsplit((parts.scheme, parts.netloc, quote(parts.path, safe="/"), parts.query, parts.fragment))

    cover_abs = _abs(cover)
    gallery_abs = [_abs(g) for g in gallery_unique]
    partner_logo_abs = _abs(partner_logo)

    return {
        "id": n,
        "source_url": f"{BASE}progect{n}.html",
        "title": title,
        "location": details.get("location"),
        "client": details.get("client"),
        "scope": details.get("scope"),
        "description": details.get("description"),
        "cover_image_url": cover_abs,
        "gallery_image_urls": gallery_abs,
        "map_embed_url": map_iframe,
        "partner_url": partner_url,
        "partner_logo_url": partner_logo_abs,
        "_raw_details_text": details.get("raw_text"),
    }


def main():
    projects = []
    missing_titles = []
    for n in range(1, 56):
        path = SRC / f"progect{n}.html"
        if not path.exists():
            print(f"missing: {path}", file=sys.stderr)
            continue
        html = path.read_text(encoding="utf-8", errors="replace")
        project = parse_project(html, n)
        if not project["title"]:
            missing_titles.append(n)
        projects.append(project)

    OUT.write_text(json.dumps(projects, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"wrote {len(projects)} projects → {OUT}")
    if missing_titles:
        print(f"missing titles: {missing_titles}", file=sys.stderr)


if __name__ == "__main__":
    main()
