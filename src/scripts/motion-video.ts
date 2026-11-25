// Shared playback for decorative looping videos (hero, services).
//
// Markup: <video data-motion-video muted loop playsinline poster="…"> with NO
// `autoplay` attribute — the browser would start it before any script could
// honour the visitor's settings. This module starts it only when the visitor
// has not asked for reduced motion; otherwise the poster (first frame) stays.
// Toggling the OS setting while the page is open pauses / resumes it.
//
// Page-wide listeners are registered ONCE and always act on the videos that
// are in the current document. With ClientRouter the previous page's videos
// are detached on navigation; they are paused on `astro:before-swap` and
// `play()` refuses detached elements, so nothing keeps decoding off-screen.

const reduceQuery = '(prefers-reduced-motion: reduce)';
const prepared = new WeakSet<HTMLVideoElement>();
let hooked = false;

const currentVideos = () =>
  document.querySelectorAll<HTMLVideoElement>('video[data-motion-video]');

function play(video: HTMLVideoElement) {
  if (!video.isConnected) return;
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

const kickAll = () => currentVideos().forEach(play);

function hookPageListeners() {
  if (hooked) return;
  hooked = true;
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) kickAll();
  });
  window.addEventListener('pageshow', kickAll);
  window.addEventListener('pointerdown', kickAll, { passive: true });
  window.addEventListener('touchstart', kickAll, { passive: true });
  window
    .matchMedia(reduceQuery)
    .addEventListener('change', (e) => (e.matches ? currentVideos().forEach(rest) : kickAll()));
  // Runs while the old page is still in the document.
  document.addEventListener('astro:before-swap', () => currentVideos().forEach((v) => v.pause()));
}

export function initMotionVideos() {
  hookPageListeners();
  const reduce = window.matchMedia(reduceQuery).matches;
  currentVideos().forEach((video) => {
    if (prepared.has(video)) return;
    prepared.add(video);
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;

    if (reduce) {
      rest(video);
      return;
    }
    if (video.readyState >= 2) play(video);
    else video.addEventListener('canplay', () => play(video), { once: true });
    window.requestAnimationFrame(() => play(video));
    window.setTimeout(() => play(video), 450);
  });
}
