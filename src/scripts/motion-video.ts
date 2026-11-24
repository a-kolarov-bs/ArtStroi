// Shared playback for decorative looping videos (hero, services).
//
// Markup: <video data-motion-video muted loop playsinline poster="…"> with NO
// `autoplay` attribute — the browser would start it before any script could
// honour the visitor's settings. This module starts it only when the visitor
// has not asked for reduced motion; otherwise the poster (first frame) stays.
// Toggling the OS setting while the page is open pauses / resumes it.

const reduceQuery = '(prefers-reduced-motion: reduce)';
const bound = new WeakSet<HTMLVideoElement>();

function play(video: HTMLVideoElement) {
  if (window.matchMedia(reduceQuery).matches) return;
  if (!video.paused && video.currentTime > 0) return;
  video.play().catch(() => {
    // iOS Low Power Mode can block playback until the first user input.
  });
}

function rest(video: HTMLVideoElement) {
  video.pause();
  if (video.currentTime > 0) video.currentTime = 0;
}

export function initMotionVideos() {
  const media = window.matchMedia(reduceQuery);
  document.querySelectorAll<HTMLVideoElement>('video[data-motion-video]').forEach((video) => {
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;

    if (media.matches) {
      rest(video);
    } else if (video.readyState >= 2) {
      play(video);
    } else {
      video.addEventListener('canplay', () => play(video), { once: true });
    }

    if (bound.has(video)) return;
    bound.add(video);
    const kick = () => play(video);
    window.requestAnimationFrame(kick);
    window.setTimeout(kick, 450);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) kick();
    });
    window.addEventListener('pageshow', kick);
    window.addEventListener('pointerdown', kick, { once: true, passive: true });
    window.addEventListener('touchstart', kick, { once: true, passive: true });
    media.addEventListener('change', (e) => (e.matches ? rest(video) : kick()));
  });
}
