#!/usr/bin/env bash
# Vertical (9:16) hero video for phones, recreated from the horizontal montage.
#
# The source clips are gone; only public/hero/hero-composite.mp4 (864x496,
# ~11 s) exists. A 9:16 window at full frame height is ~1/3 of the frame
# width, so a plain centre crop would lose two thirds of every shot for
# good. Instead the window pans slowly across the whole width: nothing is
# lost, it just passes in front of the viewer.
#
# The montage has no hard cuts (one continuous camera move from the empty
# site to the finished building; ffmpeg scene score never exceeds 0.17, the
# usual cut threshold is 0.3). So the "scenes" are the two halves of the
# loop: left -> right during the first half, right -> left during the
# second, on a cosine curve. The camera eases into each turn (no jump), and
# the window ends where it started, so the loop seam is only the montage's
# own seam.
#
# The clip is slowed to SLOW (default 0.75x) with motion interpolation so
# the pan reads as "slow" and the camera move in the montage stays smooth.
#
# Output:
#   public/hero/hero-mobile.mp4         720x1280, H.264, +faststart, no audio
#   public/hero/hero-poster-mobile.jpg  first frame of the new video
#   public/hero/hero-poster-mobile.webp first frame of the new video
#
# Usage:
#   FFMPEG=/path/to/ffmpeg ./scripts/build-hero-video-mobile.sh
#   (ffmpeg is not a project dependency; e.g. `npm i ffmpeg-static` in a
#    scratch folder and point FFMPEG at node_modules/ffmpeg-static/ffmpeg)
# Optional: SLOW=0.75 CRF=28 W=720 H=1280

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/public/hero"
SRC="$OUT/hero-composite.mp4"
FFMPEG="${FFMPEG:-ffmpeg}"
SLOW="${SLOW:-0.75}"
CRF="${CRF:-28}"
W="${W:-720}"
H="${H:-1280}"

[ -f "$SRC" ] || { echo "Missing $SRC" >&2; exit 1; }

# Source duration -> duration of the slowed clip (the pan period).
SRC_DUR="$({ "$FFMPEG" -hide_banner -i "$SRC" 2>&1 || true; } | sed -n 's/.*Duration: \([0-9:.]*\).*/\1/p' | awk -F: '{print $1*3600+$2*60+$3}')"
DUR="$(awk -v d="$SRC_DUR" -v s="$SLOW" 'BEGIN{printf "%.3f", d/s}')"

# 1) slow down + interpolate to 30 fps, 2) scale to full output height
#    (cropping after the upscale keeps the pan steps sub-source-pixel),
# 3) 9:16 window panning on a cosine: left at t=0, right at DUR/2, left at DUR.
VF="setpts=PTS/${SLOW},minterpolate=fps=30:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1,\
scale=-2:${H}:flags=lanczos,\
crop=${W}:${H}:x='(iw-ow)*(1-cos(2*PI*t/${DUR}))/2':y=0,\
unsharp=5:5:0.4,format=yuv420p"

"$FFMPEG" -hide_banner -y -i "$SRC" -an -vf "$VF" -t "$DUR" \
  -c:v libx264 -preset slow -crf "$CRF" -profile:v high -level 4.0 \
  -g 60 -movflags +faststart \
  "$OUT/hero-mobile.mp4"

# Poster = first frame of the new video (what the phone shows before play
# and with reduced motion).
"$FFMPEG" -hide_banner -y -i "$OUT/hero-mobile.mp4" -frames:v 1 -q:v 3 "$OUT/hero-poster-mobile.jpg"
"$FFMPEG" -hide_banner -y -i "$OUT/hero-mobile.mp4" -frames:v 1 -c:v libwebp -quality 80 "$OUT/hero-poster-mobile.webp"

ls -lh "$OUT/hero-mobile.mp4" "$OUT/hero-poster-mobile.jpg" "$OUT/hero-poster-mobile.webp"
