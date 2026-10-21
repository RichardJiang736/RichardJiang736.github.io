/* ==========================================================================
   Damped scrolling, the same shape as the app.

   Native scroll tracks the wheel exactly, so the page feels like a sheet of
   paper being dragged. Lenis keeps a target position and eases the real one
   toward it; the gap closing over a few frames is the weight.

   The frame loop runs only while something is moving. Starting an rAF loop at
   load would tick forever, easing a position that is not changing.

   `prefers-reduced-motion` disables it entirely, not just shortens it: a
   scroll that keeps coasting after the hand stops is the motion that setting
   asks not to have.
   ========================================================================== */

(function () {
  const DURATION = 1.05;
  const SETTLE_MS = 400;
  const SCROLL_KEYS = new Set([
    'PageUp', 'PageDown', 'Home', 'End', ' ', 'Spacebar',
    'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
  ]);

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (typeof window.Lenis !== 'function') return;

  const lenis = new window.Lenis({ duration: DURATION });

  let frame = 0;
  let settle = 0;
  let running = false;

  const step = time => {
    lenis.raf(time);
    frame = requestAnimationFrame(step);
  };

  const stop = () => {
    if (!running) return;
    running = false;
    cancelAnimationFrame(frame);
    frame = 0;
  };

  const wake = () => {
    if (!running) {
      running = true;
      frame = requestAnimationFrame(step);
    }
    if (settle) window.clearTimeout(settle);
    settle = window.setTimeout(() => {
      settle = 0;
      if (lenis.isScrolling) wake();
      else stop();
    }, SETTLE_MS);
  };

  const onKey = event => {
    if (SCROLL_KEYS.has(event.key)) wake();
  };

  ['wheel', 'touchstart', 'touchmove', 'scroll'].forEach(name => {
    window.addEventListener(name, wake, { passive: true });
  });
  window.addEventListener('keydown', onKey);
  lenis.on('scroll', wake);

  // Images arriving after load change the page height; Lenis needs the new
  // bounds before the next gesture.
  window.addEventListener('load', () => lenis.resize());

  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', event => {
      const href = link.getAttribute('href');
      if (!href || href === '#') return;
      const target = document.querySelector(href);
      if (!target) return;
      event.preventDefault();
      lenis.scrollTo(target);
      wake();
    });
  });
})();
