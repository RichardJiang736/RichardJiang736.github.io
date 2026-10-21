/* ==========================================================================
   Native scrolling, as in the app.

   Lenis used to ease the page toward the wheel with a 1.05-second duration.
   The app removed that: the Notes-style native scroll felt immediate, and the
   damped one made every gesture wait a second before it settled. The site now
   uses the browser's own scroll too. There is no frame loop and nothing to
   resize.

   Anchor links still work. `scrollIntoView` without `behavior: 'smooth'` is a
   jump, which is the same native motion as the wheel.
   ========================================================================== */

(function () {
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', event => {
      const href = link.getAttribute('href');
      if (!href || href === '#') return;
      const target = document.querySelector(href);
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ block: 'start' });
    });
  });
})();
