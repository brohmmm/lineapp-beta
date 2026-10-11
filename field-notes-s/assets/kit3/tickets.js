/* LineApp R3 kit · tickets.js — a strip of festival tickets that switches a quote panel.
   Click (or arrow keys) lights that ticket lime and shows its quote. Until the visitor touches it, it advances by itself
   (paused on hover, off-screen and in hidden tabs; off under reduced motion).
   <div data-tickets data-interval="6000"> <button data-ticket="off">…</button> … <figure data-ticket-panel="off">…</figure> … </div>
   Also: KitTickets.baseline(el) / class "knum-row" keeps a row of numbers on one baseline (see tickets.css). */
(function () {
  'use strict';
  if (window.KitTickets) return;
  var reduce = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  var uid = 0;

  function setup(root) {
    if (root.__ktix) return; root.__ktix = true;
    var id = 'ktix' + (++uid);
    var tabs = Array.prototype.slice.call(root.querySelectorAll('[data-ticket]'));
    var panels = tabs.map(function (t) { return root.querySelector('[data-ticket-panel="' + t.getAttribute('data-ticket') + '"]'); });
    if (!tabs.length) return;
    var interval = Math.max(3000, parseFloat(root.getAttribute('data-interval') || '6000'));
    var strip = tabs[0].parentNode;
    root.classList.add('ktix');
    strip.setAttribute('role', 'tablist');
    if (!strip.getAttribute('aria-label')) strip.setAttribute('aria-label', root.getAttribute('data-label') || 'Festivals');
    root.style.setProperty('--ktix-interval', interval + 'ms');

    tabs.forEach(function (t, i) {
      if (t.tagName !== 'BUTTON') { t.setAttribute('tabindex', '0'); }
      else t.type = 'button';
      t.classList.add('ktix__t');
      t.setAttribute('role', 'tab');
      t.id = t.id || id + '-t' + i;
      var p = panels[i];
      if (p) { p.id = p.id || id + '-p' + i; p.setAttribute('role', 'tabpanel'); p.setAttribute('aria-labelledby', t.id); t.setAttribute('aria-controls', p.id); p.classList.add('ktix__panel'); p.tabIndex = 0; }
      t.addEventListener('click', function () { stopAuto(); select(i, true); });
      t.addEventListener('keydown', function (e) {
        var j = -1, horiz = getComputedStyle(strip).flexDirection !== 'column';
        if (e.key === (horiz ? 'ArrowRight' : 'ArrowDown') || e.key === 'ArrowRight' || e.key === 'ArrowDown') j = (i + 1) % tabs.length;
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') j = (i - 1 + tabs.length) % tabs.length;
        else if (e.key === 'Home') j = 0; else if (e.key === 'End') j = tabs.length - 1;
        else if ((e.key === 'Enter' || e.key === ' ') && t.tagName !== 'BUTTON') { e.preventDefault(); stopAuto(); select(i, true); return; }
        if (j >= 0) { e.preventDefault(); stopAuto(); select(j, true); tabs[j].focus(); }
      });
    });

    var cur = -1, timer = 0, auto = !reduce.matches && root.getAttribute('data-auto') !== 'false', hover = false, inView = false;
    function select(i, user) {
      if (i === cur) return;
      var prev = cur; cur = i;
      tabs.forEach(function (t, k) {
        var on = k === i;
        t.classList.toggle('is-on', on); t.setAttribute('aria-selected', on ? 'true' : 'false'); t.tabIndex = on ? 0 : -1;
      });
      panels.forEach(function (p, k) {
        if (!p) return;
        var on = k === i; p.hidden = !on; p.classList.toggle('is-on', on);
        if (on && prev >= 0 && !reduce.matches && p.animate) p.animate([{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: 360, easing: 'cubic-bezier(.2,.8,.2,1)' });
      });
      // on a phone the strip scrolls sideways: bring the lit ticket into view (inside the strip only, never the page)
      if (strip.scrollWidth > strip.clientWidth + 2) {
        var tl = tabs[i].offsetLeft - strip.offsetLeft, want = Math.max(0, tl - 16);
        if (tl < strip.scrollLeft || tl + tabs[i].offsetWidth > strip.scrollLeft + strip.clientWidth) strip.scrollTo({ left: want, behavior: reduce.matches || prev < 0 ? 'auto' : 'smooth' });
      }
      root.classList.remove('is-ticking'); void root.offsetWidth; if (auto) root.classList.add('is-ticking');
      root.dispatchEvent(new CustomEvent('tickets:change', { bubbles: true, detail: { index: i, id: tabs[i].getAttribute('data-ticket'), user: !!user } }));
      schedule();
    }
    function schedule() {
      clearTimeout(timer);
      if (!auto) return;
      root.classList.toggle('is-paused', hover || !inView || document.hidden);
      if (hover || !inView || document.hidden) return;
      timer = setTimeout(function () { select((cur + 1) % tabs.length); }, interval);
    }
    function stopAuto() { if (!auto) return; auto = false; clearTimeout(timer); root.classList.remove('is-ticking', 'is-paused'); root.classList.add('is-manual'); }
    root.addEventListener('pointerdown', stopAuto);
    root.addEventListener('focusin', function (e) { if (e.target !== root) stopAuto(); });
    root.addEventListener('mouseenter', function () { hover = true; schedule(); });
    root.addEventListener('mouseleave', function () { hover = false; if (auto) { root.classList.remove('is-ticking'); void root.offsetWidth; root.classList.add('is-ticking'); } schedule(); });
    document.addEventListener('visibilitychange', schedule);
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { inView = es[0].isIntersecting; schedule(); }, { threshold: .35 }).observe(root);
    else inView = true;

    var start = tabs.findIndex(function (t) { return t.hasAttribute('data-selected') || t.getAttribute('aria-selected') === 'true'; });
    select(start < 0 ? 0 : start);
    root.__ktixApi = { select: function (i) { stopAuto(); select(i, true); }, current: function () { return cur; }, auto: function () { return auto; } };
  }

  // a row of numbers on one baseline, whatever the label lengths or suffix sizes
  function baseline(el) { el.classList.add('knum-row'); el.style.setProperty('--n', el.children.length); }

  function init(scope) {
    (scope || document).querySelectorAll('[data-tickets]').forEach(setup);
    (scope || document).querySelectorAll('.knum-row, [data-baseline]').forEach(baseline);
  }
  window.KitTickets = {
    init: init, baseline: baseline,
    select: function (el, i) { if (el.__ktixApi) el.__ktixApi.select(i); },
    current: function (el) { return el.__ktixApi ? el.__ktixApi.current() : -1; },
    isAuto: function (el) { return el.__ktixApi ? el.__ktixApi.auto() : false; }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { init(); });
  else init();
})();
