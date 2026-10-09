(function () {
  var row = document.getElementById('moneypenny');

  // The mic click must happen inside the user's click so the browser allows microphone and audio.
  document.querySelectorAll('[data-start-hero-voice]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (!row) return;
      row.scrollIntoView({ behavior: 'smooth', block: 'center' });
      var mic = row.querySelector('[data-panel="idle"] .btn-mic');
      if (mic) mic.click();
    });
  });

  if (window.matchMedia('(min-width: 768px)').matches) {
    document.querySelectorAll('details.lessons').forEach(function (d) { d.open = true; });
  }

  var bar = document.querySelector('.mbar');
  var trigger = document.querySelector('.hero-cta');
  if (!bar || !trigger) return;
  var link = bar.querySelector('a');
  var hideFor = ['#pricing', '#join', 'footer']
    .map(function (sel) { return document.querySelector(sel); })
    .filter(Boolean);
  var queued = false;

  function inView(el) {
    var r = el.getBoundingClientRect();
    return r.top < window.innerHeight && r.bottom > 0;
  }

  // Scroll-based rather than IntersectionObserver: anchor jumps can skip past the hero without an intersection change.
  function update() {
    queued = false;
    var on = trigger.getBoundingClientRect().bottom < 0 && !hideFor.some(inView);
    bar.classList.toggle('is-on', on);
    bar.setAttribute('aria-hidden', on ? 'false' : 'true');
    if (link) link.tabIndex = on ? 0 : -1;
  }

  function queue() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(update);
  }

  window.addEventListener('scroll', queue, { passive: true });
  window.addEventListener('resize', queue);
  update();
})();
