/* LineApp R3 kit · marks2.js — designed tick and cross icons (replaces the R2 hand-drawn scribbles for yes/no lists).
   <i data-mark2="tick"></i> · <i data-mark2="cross" data-mark2-style="badge"></i> · <i data-mark2="tick" data-mark2-draw aria-label="Yes"></i>
   One 24-unit grid, one stroke weight, round caps and joins. No dependencies. */
(function () {
  'use strict';
  if (window.KitMarks2) return;
  var reduce = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };

  // Geometry on a 24 × 24 grid. Plain glyphs carry 2.4 units of stroke; inside a circle the glyph shrinks and the
  // stroke drops to 2.2 so the visual weight matches. Cross arms are shorter than the tick so both read the same size.
  var G = {
    plain: { tick: ['M4.75 12.6 9.6 17.25 19.25 7.1'], cross: ['M6.6 6.6 17.4 17.4', 'M17.4 6.6 6.6 17.4'], sw: 2.4 },
    badge: { tick: ['M7.35 12.35 10.55 15.5 16.75 8.95'], cross: ['M8.85 8.85 15.15 15.15', 'M15.15 8.85 8.85 15.15'], sw: 2.2 },
    ring: { tick: ['M7.35 12.35 10.55 15.5 16.75 8.95'], cross: ['M8.85 8.85 15.15 15.15', 'M15.15 8.85 8.85 15.15'], sw: 2.1 }
  };

  function svg(type, style) {
    type = type === 'cross' || type === 'x' ? 'cross' : 'tick';
    style = G[style] ? style : 'plain';
    var g = G[style], out = '<svg class="km2__svg" viewBox="0 0 24 24" width="24" height="24" fill="none" focusable="false" aria-hidden="true">';
    if (style === 'badge') out += '<circle class="km2__bg" cx="12" cy="12" r="12"/>';
    if (style === 'ring') out += '<circle class="km2__ring" cx="12" cy="12" r="11.1" stroke-width="1.5"/>';
    g[type].forEach(function (d, i) {
      out += '<path class="km2__glyph" d="' + d + '" pathLength="1" stroke-width="' + g.sw + '" stroke-linecap="round" stroke-linejoin="round" style="--i:' + i + '"/>';
    });
    return out + '</svg>';
  }

  var io = null;
  function observer() {
    if (io || !('IntersectionObserver' in window)) return io;
    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target, d = parseInt(el.getAttribute('data-mark2-delay') || '0', 10) || 0;
        io.unobserve(el);
        setTimeout(function () { el.classList.add('is-drawn'); }, d);
      });
    }, { threshold: 0.6 });
    return io;
  }

  function render(el) {
    var type = el.getAttribute('data-mark2') || 'tick';
    var style = el.getAttribute('data-mark2-style') || 'plain';
    var t = type === 'x' ? 'cross' : (type === 'cross' ? 'cross' : 'tick');
    el.classList.add('km2', 'km2--' + t, 'km2--' + (G[style] ? style : 'plain'));
    el.innerHTML = svg(t, style);
    var label = el.getAttribute('aria-label');
    if (label) { el.setAttribute('role', 'img'); } else { el.setAttribute('aria-hidden', 'true'); }
    if (el.hasAttribute('data-mark2-draw') && !reduce.matches) {
      el.classList.add('km2--draw');
      var o = observer();
      if (o) o.observe(el); else el.classList.add('is-drawn');
    } else {
      el.classList.add('is-drawn');
    }
    el.setAttribute('data-mark2-ready', '');
  }

  function init(scope) {
    (scope || document).querySelectorAll('[data-mark2]:not([data-mark2-ready])').forEach(render);
  }
  function draw(el) { el.classList.add('is-drawn'); }
  function reset(el) { if (!reduce.matches && el.classList.contains('km2--draw')) { el.classList.remove('is-drawn'); void el.offsetWidth; } }

  window.KitMarks2 = { init: init, svg: svg, draw: draw, reset: reset, _geometry: G };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { init(); });
  else init();
})();
