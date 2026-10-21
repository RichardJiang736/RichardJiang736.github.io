/* ==========================================================================
   Native scrolling, as in the app.

   Lenis used to ease the page toward the wheel with a 1.05-second duration.
   The app removed that: the Notes-style native scroll felt immediate, and the
   damped one made every gesture wait a second before it settled. The site now
   uses the browser's own scroll too. There is no frame loop and nothing to
   resize.

   The archive also uses this file. Its Writing and Usual sections are card
   lists; each card opens a template holding the full article in the reader.
   The article was already in the encrypted document, so opening one is a DOM
   move, not a network request.
   ========================================================================== */

(function () {
  const reader = document.getElementById('archive-reader');
  const index = document.getElementById('archive-index');
  const readerBody = document.getElementById('archive-reader-body');
  const back = document.querySelector('.archive-back');

  if (reader && index && readerBody) {
    const templates = new Map(
      [...document.querySelectorAll('template[data-archive-entry]')]
        .map(template => [template.id, template]),
    );

    const openEntry = id => {
      const template = templates.get(id);
      if (!template) return;
      readerBody.replaceChildren(template.content.cloneNode(true));
      index.hidden = true;
      reader.hidden = false;
      history.replaceState(null, '', `#${id}`);
      window.scrollTo(0, 0);
    };

    const closeEntry = () => {
      reader.hidden = true;
      index.hidden = false;
      readerBody.replaceChildren();
      history.replaceState(null, '', location.pathname);
      window.scrollTo(0, 0);
    };

    document.querySelectorAll('[data-archive-open]').forEach(link => {
      link.addEventListener('click', event => {
        event.preventDefault();
        openEntry(link.getAttribute('data-archive-open'));
      });
    });

    back?.addEventListener('click', closeEntry);

    const fromHash = location.hash.replace(/^#/, '');
    if (templates.has(fromHash)) openEntry(fromHash);
  }

  document.querySelectorAll('a[href^="#"]').forEach(link => {
    if (link.hasAttribute('data-archive-open')) return;
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
