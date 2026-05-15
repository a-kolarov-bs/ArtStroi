#!/usr/bin/env python3
"""
Smart white-background removal for partner logos.
- Detects if image has a white-ish background by sampling corners.
- Maps white -> transparent with smooth falloff (anti-aliased).
- Leaves images with non-white backgrounds untouched (preserves brand gradients).

Usage: python3 scripts/bg-remove.py <input> <output>
"""
import sys
from pathlib import Path
from PIL import Image

WHITE_THRESHOLD = 235          # pixel is "near-white" if min channel >= this
CORNER_THRESHOLD = 230         # corners must be at least this bright to consider bg "white"
FALLOFF_START = 200            # below this brightness pixels stay opaque
FALLOFF_END = 245              # at/above this pixels become fully transparent


def is_white_bg(img: Image.Image) -> bool:
    w, h = img.size
    corners = [(2, 2), (w - 3, 2), (2, h - 3), (w - 3, h - 3)]
    px = img.convert("RGB").load()
    bright = 0
    for x, y in corners:
        r, g, b = px[x, y]
        if min(r, g, b) >= CORNER_THRESHOLD:
            bright += 1
    return bright >= 3  # at least 3 of 4 corners near-white


def remove_white(img: Image.Image) -> Image.Image:
    img = img.convert("RGBA")
    pixels = img.load()
    w, h = img.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            brightness = min(r, g, b)
            if brightness >= FALLOFF_END:
                pixels[x, y] = (r, g, b, 0)
            elif brightness >= FALLOFF_START:
                # smooth alpha falloff: 0 at FALLOFF_END, full at FALLOFF_START
                t = (brightness - FALLOFF_START) / (FALLOFF_END - FALLOFF_START)
                new_a = int(a * (1 - t))
                pixels[x, y] = (r, g, b, new_a)
    return img


def main():
    if len(sys.argv) != 3:
        print("usage: bg-remove.py <input> <output>", file=sys.stderr)
        sys.exit(1)
    src = Path(sys.argv[1])
    dst = Path(sys.argv[2])
    img = Image.open(src)
    if is_white_bg(img):
        result = remove_white(img)
        result.save(dst, "PNG", optimize=True)
        print(f"{src.name}: white bg removed -> {dst.name}")
    else:
        # keep gradient/brand bg, just convert to PNG if input is JPG
        img.convert("RGBA").save(dst, "PNG", optimize=True)
        print(f"{src.name}: non-white bg, kept as-is -> {dst.name}")


if __name__ == "__main__":
    main()
