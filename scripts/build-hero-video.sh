#!/usr/bin/env bash
# Build placeholder composite hero video from free stock construction clips.
#
# Prerequisites:
#   - ffmpeg (brew install ffmpeg)
#   - 3-5 stock clips in scripts/raw-clips/ (manually downloaded from
#     https://www.pexels.com/search/videos/construction/ — CC0 license)
#
# Output:
#   - public/hero/hero-composite.mp4 (~8-12 MB, 1920x1080, ~25s loop)
#   - public/hero/hero-poster.jpg (first frame)
#
# Usage:  ./scripts/build-hero-video.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
RAW="$ROOT/scripts/raw-clips"
OUT="$ROOT/public/hero"

if [ ! -d "$RAW" ]; then
  echo "Missing $RAW. Download 3-5 stock construction mp4 clips there first." >&2
  exit 1
fi

mkdir -p "$OUT"

# 1. Build a concat list (each clip 5-7s)
LIST="$ROOT/scripts/.concat.txt"
> "$LIST"
for f in "$RAW"/*.mp4; do
  echo "file '$f'" >> "$LIST"
done

# 2. Concat with crossfade transitions, normalize FPS 30, scale 1920x1080, no audio
ffmpeg -y -f concat -safe 0 -i "$LIST" \
  -vf "fps=30,scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080" \
  -c:v libx264 -preset slow -crf 24 -pix_fmt yuv420p -movflags +faststart \
  -an \
  "$OUT/hero-composite.mp4"

# 3. Extract first frame for poster
ffmpeg -y -i "$OUT/hero-composite.mp4" -vf "select=eq(n\,0)" -frames:v 1 -q:v 2 "$OUT/hero-poster.jpg"

# 4. Stats
ls -lh "$OUT/hero-composite.mp4" "$OUT/hero-poster.jpg"

rm -f "$LIST"
echo "Done. Reload localhost:4321 to see the new hero."
