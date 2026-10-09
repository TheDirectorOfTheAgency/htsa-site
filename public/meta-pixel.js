/* HTSA Meta Pixel: PageView + CTA clicks. Set PIXEL_ID to turn on; empty = off. */
(function () {
  var PIXEL_ID = '1065760993458907';
  if (!PIXEL_ID) return;
  !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
  n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
  document,'script','https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', PIXEL_ID);
  fbq('track', 'PageView');

  // Door buttons carry data-door; href and label text are fallbacks.
  // "See the three ways in" links only scroll to #pricing, so they never count as a checkout.
  function ctaFor(a) {
    var href = a.getAttribute('href') || '';
    if (a.hasAttribute('data-cta-scroll') || href === '#pricing') return { door: 'see_three_ways', value: 0 };
    if (href.indexOf('skool.com/high-ticket-home-services-2405') === -1) return null;
    var door = a.getAttribute('data-door') || '';
    var text = (a.textContent || '').replace(/\s+/g, ' ');
    if (door === 'sixweek') return { door: 'sixweek_1997', value: 1997 };
    if (door === 'course' || href.indexOf('/classroom/') !== -1) return { door: 'course_497', value: 497 };
    if (door === 'premium' || text.indexOf('$1,997') !== -1) return { door: 'premium_1997', value: 1997 };
    if (door === 'standard' || /\$1\/month/.test(text)) return { door: 'standard_1', value: 1 };
    return null;
  }

  document.addEventListener('click', function (ev) {
    var a = ev.target && ev.target.closest ? ev.target.closest('a[href]') : null;
    if (!a) return;
    var d = ctaFor(a);
    if (!d) return;
    var section = (a.closest('section[id]') || {}).id || (a.closest('.mbar') ? 'sticky_bar' : '');
    fbq('trackCustom', 'HTSA_CTA_Click', { door: d.door, section: section, cta_text: (a.textContent || '').trim().slice(0, 60) });
    if (d.value > 0) {
      fbq('track', 'InitiateCheckout', { content_name: d.door, value: d.value, currency: 'USD' });
    }
  }, true);
})();
