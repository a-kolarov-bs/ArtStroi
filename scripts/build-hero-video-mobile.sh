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
# usual cut threshold is 0.3). So the "scenes" are whole passes of the
# montage: it plays PASSES times (default 2); the window goes left -> right
# during the first pass and right -> left during the second, on a cosine
# curve. The camera eases into each turn (no jump) and ends where it
# started, so the loop seam is only the montage's own seam.
#
# Speed (owner: "slow"): peak pan speed is pi * travel / period. With the
# defaults the travel is 1510 px of 720 and the period ~29.3 s, i.e. ~162
# video px/s, ~109 px/s on a 390x844 phone screen (~0.28 screen widths/s).
#
# The montage is slowed to SLOW (default 0.75x) with motion interpolation so
# the camera move inside it stays smooth.
#
# Output:
#   public/hero/hero-mobile.mp4         720x1280, H.264, +faststart, no audio
#   public/hero/hero-poster-mobile.webp first frame of the new video
#
# Usage:
#   FFMPEG=/path/to/ffmpeg ./scripts/build-hero-video-mobile.sh
#   (ffmpeg is not a project dependency; e.g. `npm i ffmpeg-static` in a
#    scratch folder and point FFMPEG at node_modules/ffmpeg-static/ffmpeg)
# Optional: SLOW=0.75 PASSES=2 FPS=24 CRF=33 W=720 H=1280

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/public/hero"
SRC="$OUT/hero-composite.mp4"
FFMPEG="${FFMPEG:-ffmpeg}"
SLOW="${SLOW:-0.75}"
PASSES="${PASSES:-2}"
FPS="${FPS:-24}"
CRF="${CRF:-33}"
W="${W:-720}"
H="${H:-1280}"

[ -f "$SRC" ] || { echo "Missing $SRC" >&2; exit 1; }

# Source duration -> length of the output (= one pan period: there and back).
SRC_DUR="$({ "$FFMPEG" -hide_banner -i "$SRC" 2>&1 || true; } | sed -n 's/.*Duration: \([0-9:.]*\).*/\1/p' | awk -F: '{print $1*3600+$2*60+$3}')"
DUR="$(awk -v d="$SRC_DUR" -v s="$SLOW" -v p="$PASSES" 'BEGIN{printf "%.3f", d*p/s}')"

# 1) slow down + interpolate to FPS, 2) scale to full output height
#    (cropping after the upscale keeps the pan steps sub-source-pixel),
# 3) 9:16 window panning on a cosine: left at t=0, right at DUR/2, left at DUR.
VF="setpts=PTS/${SLOW},minterpolate=fps=${FPS}:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1:scd=fdiff,\
scale=-2:${H}:flags=lanczos,\
crop=${W}:${H}:x='(iw-ow)*(1-cos(2*PI*t/${DUR}))/2':y=0,\
unsharp=5:5:0.4,format=yuv420p"

"$FFMPEG" -hide_banner -y -stream_loop "$((PASSES - 1))" -i "$SRC" -an -vf "$VF" -t "$DUR" \
  -c:v libx264 -preset veryslow -tune film -crf "$CRF" -profile:v high -level 4.0 \
  -g 72 -movflags +faststart \
  "$OUT/hero-mobile.mp4"

# Poster = first frame of the new video (what the phone shows before play
# and with reduced motion).
"$FFMPEG" -hide_banner -y -i "$OUT/hero-mobile.mp4" -frames:v 1 -c:v libwebp -quality 80 "$OUT/hero-poster-mobile.webp"

ls -lh "$OUT/hero-mobile.mp4" "$OUT/hero-poster-mobile.webp"
