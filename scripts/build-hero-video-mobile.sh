#!/usr/bin/env bash
# Vertical (9:16) hero video for phones, recreated from the horizontal montage.
#
# The source clips are gone; only public/hero/hero-composite.mp4 (864x496,
# ~11 s) exists. A 9:16 window at full frame height is ~1/3 of the frame
# width, so a plain centre crop would lose two thirds of every shot for
# good. Instead the window moves slowly across the whole width: nothing is
# lost, it just passes in front of the viewer.
#
# The montage has no hard cuts (one continuous camera move from the empty
# site to the finished building; ffmpeg scene score never exceeds 0.17, the
# usual cut threshold is 0.3), so the whole montage is one "scene".
#
# Speed (owner: "slow", then "slow it down more"). On a phone only ~1/3 of
# the frame is visible, so the montage's own camera move looks ~3x faster
# than on desktop. Therefore:
#   1) the montage itself is slowed to SLOW (default 0.4x, ~27.6 s) with
#      motion-compensated interpolation (MI_MODE, default mci) so it stays
#      smooth instead of stuttering;
#   2) the window makes ONE pass per loop, right -> left on a half-cosine
#      (eases in and out), only while the montage's camera moves right
#      (content drifts left, PAN_FROM..PAN_TO), so the two partly cancel
#      instead of adding up. The jump back to the right edge falls on the
#      montage's own loop seam (finished building -> empty site), so it
#      adds no cut.
#
# Owner: "slow". The audit measures horizontal content speed on a 390x844
# screen frame by frame; target mean <= 80 px/s, peak (0.5 s) <= 150 px/s.
# Re-measure after changing SLOW or the PAN_* values.
#
# Output:
#   public/hero/hero-mobile.mp4         720x1280, H.264, +faststart, no audio
#   public/hero/hero-poster-mobile.webp first frame of the new video
#
# Usage:
#   FFMPEG=/path/to/ffmpeg ./scripts/build-hero-video-mobile.sh
#   (ffmpeg is not a project dependency; e.g. `npm i ffmpeg-static` in a
#    scratch folder and point FFMPEG at node_modules/ffmpeg-static/ffmpeg)
# Optional: SLOW=0.4 MI_MODE=mci|blend FPS=24 CRF=33 W=720 H=1280 OUT_FILE=...

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/public/hero"
SRC="$OUT/hero-composite.mp4"
FFMPEG="${FFMPEG:-ffmpeg}"
SLOW="${SLOW:-0.4}"
MI_MODE="${MI_MODE:-mci}"
FPS="${FPS:-24}"
CRF="${CRF:-33}"
W="${W:-720}"
H="${H:-1280}"
OUT_FILE="${OUT_FILE:-$OUT/hero-mobile.mp4}"
# Window move timed to the stretch where the montage's camera drifts the
# content left (~29%-80% of the slowed clip), so the two cancel out.
PAN_FROM="${PAN_FROM:-0.29}"
PAN_TO="${PAN_TO:-0.80}"

[ -f "$SRC" ] || { echo "Missing $SRC" >&2; exit 1; }

# Source duration -> length of the output (= one window pass).
SRC_DUR="$({ "$FFMPEG" -hide_banner -i "$SRC" 2>&1 || true; } | sed -n 's/.*Duration: \([0-9:.]*\).*/\1/p' | awk -F: '{print $1*3600+$2*60+$3}')"
DUR="$(awk -v d="$SRC_DUR" -v s="$SLOW" 'BEGIN{printf "%.3f", d/s}')"

if [ "$MI_MODE" = "mci" ]; then
  MI="minterpolate=fps=${FPS}:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1:scd=none"
else
  MI="minterpolate=fps=${FPS}:mi_mode=blend"
fi

# 0) the montage is 25 fps footage stored at 24 fps: one frame per second
#    is missing (just before frames 24, 48, ...), which shows as a jolt each
#    second. Re-time the frames to their real 25 fps instants so the gap is
#    filled by the interpolation below.
# 1) slow down + interpolate to FPS, 2) scale to full output height
#    (cropping after the upscale keeps the window steps sub-source-pixel),
# 3) 9:16 window: holds at the right edge, moves to the left edge between
#    PAN_FROM and PAN_TO (fractions of DUR) on a half-cosine, then holds.
VF="setpts='(N+floor(N/24))/(25*${SLOW})/TB',${MI},\
scale=-2:${H}:flags=lanczos,\
crop=${W}:${H}:x='(iw-ow)*(1+cos(PI*clip((t/${DUR}-${PAN_FROM})/(${PAN_TO}-${PAN_FROM}),0,1)))/2':y=0,\
unsharp=5:5:0.4,format=yuv420p"

"$FFMPEG" -hide_banner -y -i "$SRC" -an -vf "$VF" -t "$DUR" \
  -c:v libx264 -preset veryslow -tune film -crf "$CRF" -profile:v high -level 4.0 \
  -g 72 -movflags +faststart \
  "$OUT_FILE"

# Poster = first frame of the new video (what the phone shows before play
# and with reduced motion). Only for the real output.
if [ "$OUT_FILE" = "$OUT/hero-mobile.mp4" ]; then
  "$FFMPEG" -hide_banner -y -i "$OUT_FILE" -frames:v 1 -c:v libwebp -quality 80 "$OUT/hero-poster-mobile.webp"
fi

ls -lh "$OUT_FILE"
