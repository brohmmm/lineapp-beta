/* LineApp R3 kit · orbit.js — integrations orbiting a LineApp core.
   Tiles circle slowly on one or two rings. Every tile has a connection line that starts on the core's edge and ends on
   the tile's edge (never its centre). Click a tile: its line glows, data runs along it, and a caption card says what we
   pull from that tool and what we send back. Pauses on hover, on keyboard focus, off-screen and in hidden tabs.
   Reduced motion: still rings. Phones: smaller rings, or data-orbit-mobile="grid" for a grid with the same captions.
   <div class="korb" data-orbit>
     <div data-orbit-core><img src="lineapp-logo.png" alt="LineApp"></div>
     <button data-orbit-item data-ring="1" data-name="Spotify" data-pull="…" data-push="…" data-logo="spotify-color.svg"><img src="spotify-white.svg" alt=""></button>
   </div> */
(function () {
  'use strict';
  if (window.KitOrbit) return;
  var reduce = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  var SVGNS = 'http://www.w3.org/2000/svg';
  var uid = 0;

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function mk(tag, attrs) { var e = document.createElementNS(SVGNS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); return e; }

  function setup(root) {
    if (root.__korb) return; root.__korb = true;
    var id = 'korb' + (++uid);
    var core = root.querySelector('[data-orbit-core]');
    var items = Array.prototype.slice.call(root.querySelectorAll('[data-orbit-item]'));
    if (!core || !items.length) return;
    var hintHTML = root.getAttribute('data-hint') || 'Tap a logo to see what LineApp takes from it and what it sends back.';
    var pullLabel = root.getAttribute('data-pull-label') || 'We pull', pushLabel = root.getAttribute('data-push-label') || 'We send';
    var periods = (root.getAttribute('data-orbit-speed') || '140,200').split(',').map(function (s) { return Math.max(20, parseFloat(s) || 140); });
    var mobileMode = root.getAttribute('data-orbit-mobile') || 'rings';
    var dl = (root.getAttribute('data-dir-labels') || 'Pulls|Sends|Both').split('|');
    var dirLabels = { pull: dl[0], push: dl[1], send: dl[1], both: dl[2] };
    root.classList.add('korb'); root.setAttribute('data-mobile', mobileMode);

    var stage = document.createElement('div'); stage.className = 'korb__stage';
    var svg = mk('svg', { class: 'korb__lines', 'aria-hidden': 'true', focusable: 'false' });
    var ringsG = mk('g', { class: 'korb__rings' }), linesG = mk('g', {}), flowG = mk('g', {});
    svg.appendChild(ringsG); svg.appendChild(linesG); svg.appendChild(flowG);
    stage.appendChild(svg);
    core.classList.add('korb__core'); stage.appendChild(core);
    var list = document.createElement('div'); list.className = 'korb__items'; list.setAttribute('role', 'group'); list.setAttribute('aria-label', root.getAttribute('data-label') || 'Integrations');
    stage.appendChild(list);
    var cap = document.createElement('div'); cap.className = 'korb__cap'; cap.setAttribute('aria-live', 'polite');
    var hint = root.querySelector('.korb__hint'); if (hint) hint.hidden = true;
    root.insertBefore(stage, root.firstChild);
    root.appendChild(cap);

    var rings = {};
    var model = items.map(function (it, i) {
      var r = it.getAttribute('data-ring') === '2' ? 2 : 1;
      (rings[r] = rings[r] || []).push(i);
      if (it.tagName !== 'BUTTON') { it.setAttribute('role', 'button'); it.tabIndex = 0; } else it.type = 'button';
      it.classList.add('korb__item');
      var name = it.getAttribute('data-name') || (it.querySelector('img') && it.querySelector('img').alt) || 'Tool ' + (i + 1);
      it.setAttribute('aria-label', name); it.setAttribute('aria-pressed', 'false'); it.setAttribute('aria-controls', id + '-cap');
      var im = it.querySelector('img'); if (im) { im.alt = ''; im.draggable = false; }
      list.appendChild(it);
      var line = mk('line', { class: 'korb__line' }); linesG.appendChild(line);
      var d = it.getAttribute('data-dir') || (it.getAttribute('data-pull') && it.getAttribute('data-push') ? 'both' : it.getAttribute('data-push') ? 'push' : 'pull');
      var flow = mk('line', { class: 'korb__flow korb__flow--' + (d === 'send' ? 'push' : d) }); flowG.appendChild(flow);
      return { el: it, ring: r, name: name, line: line, flow: flow, a0: 0, x: 0, y: 0 };
    });
    cap.id = id + '-cap';
    [1, 2].forEach(function (r) {
      var ids = rings[r] || [], off = r === 2 ? Math.PI / ids.length : -Math.PI / 2;
      ids.forEach(function (idx, k) { model[idx].a0 = off + k / ids.length * Math.PI * 2; });
    });
    var ringCircles = [1, 2].filter(function (r) { return rings[r]; }).map(function (r) { var c = mk('circle', { class: 'korb__ring', 'data-r': r }); ringsG.appendChild(c); return c; });

    var W = 0, cx = 0, cy = 0, R = { 1: 0, 2: 0 }, coreR = 0, tile = 0, grid = false;
    var angle = { 1: 0, 2: 0 }, speed = 0, target = 1, last = 0, raf = 0, hover = false, focusIn = false, inView = false, active = -1;

    function measure() {
      var b = stage.getBoundingClientRect(); W = b.width;
      grid = mobileMode === 'grid' && window.matchMedia('(max-width: 640px)').matches;
      root.classList.toggle('is-grid', grid);
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + b.height);
      cx = W / 2; cy = b.height / 2;
      coreR = core.getBoundingClientRect().width / 2;
      tile = model[0].el.getBoundingClientRect().width;
      var two = !!rings[2];
      R[2] = W / 2 - tile * .5 - 6;
      R[1] = two ? R[2] * .58 : R[2];
      if (two && R[1] < coreR + tile * .75) R[1] = coreR + tile * .75;
      ringCircles.forEach(function (c) { var r = +c.getAttribute('data-r'); c.setAttribute('cx', cx); c.setAttribute('cy', cy); c.setAttribute('r', R[r]); });
      place();
    }
    function edge(x, y, tx, ty, h) { // where the ray from (x,y) towards (tx,ty) leaves a square of half-size h centred on (x,y)
      var dx = tx - x, dy = ty - y, m = Math.max(Math.abs(dx), Math.abs(dy)) || 1;
      return { x: x + dx / m * h, y: y + dy / m * h };
    }
    function place() {
      if (grid) { model.forEach(function (m) { m.el.style.transform = ''; }); return; }
      model.forEach(function (m) {
        var a = m.a0 + angle[m.ring] * (m.ring === 2 ? -1 : 1);
        m.x = cx + Math.cos(a) * R[m.ring]; m.y = cy + Math.sin(a) * R[m.ring];
        m.el.style.transform = 'translate3d(' + (m.x - tile / 2).toFixed(2) + 'px,' + (m.y - tile / 2).toFixed(2) + 'px,0)';
        var d = Math.hypot(m.x - cx, m.y - cy) || 1, ux = (m.x - cx) / d, uy = (m.y - cy) / d;
        var p1 = { x: cx + ux * (coreR + 5), y: cy + uy * (coreR + 5) };
        var p2 = edge(m.x, m.y, cx, cy, tile / 2 + 5);
        [m.line, m.flow].forEach(function (l) { l.setAttribute('x1', p1.x.toFixed(2)); l.setAttribute('y1', p1.y.toFixed(2)); l.setAttribute('x2', p2.x.toFixed(2)); l.setAttribute('y2', p2.y.toFixed(2)); });
      });
    }
    function frame(t) {
      var dt = Math.min(.05, (t - last) / 1000); last = t;
      var want = (hover || focusIn || !inView || document.hidden || reduce.matches) ? 0 : 1;
      speed += (want - speed) * Math.min(1, dt * 5);
      if (speed < .002 && want === 0) speed = 0;
      angle[1] += speed * dt * Math.PI * 2 / periods[0];
      angle[2] += speed * dt * Math.PI * 2 / (periods[1] || periods[0] * 1.4);
      place();
      raf = (speed > 0 || want > 0) && inView ? requestAnimationFrame(frame) : 0;
    }
    function wake() { if (!raf && inView && !reduce.matches) { last = performance.now(); raf = requestAnimationFrame(frame); } }

    function caption(i) {
      if (i < 0) {
        cap.innerHTML = '<div class="korb__card is-hint">' + (hint ? hint.innerHTML : '<p>' + esc(hintHTML) + '</p>') + '</div>';
        return;
      }
      var it = model[i].el, info = it.querySelector('.korb__info');
      var logo = it.getAttribute('data-logo') || (it.querySelector('img') && it.querySelector('img').getAttribute('src'));
      var html = '<div class="korb__card"><div class="korb__ch">' + (logo ? '<span class="korb__clogo"><img src="' + esc(logo) + '" alt=""></span>' : '') +
        '<div><b>' + esc(model[i].name) + '</b>' + (it.getAttribute('data-what') ? '<span>' + esc(it.getAttribute('data-what')) + '</span>' : '') + '</div></div>';
      var dir = it.getAttribute('data-dir'), line = it.getAttribute('data-line');
      if (info) html += '<div class="korb__cb">' + info.innerHTML + '</div>';
      else if (line) {
        html += '<div class="korb__cb">' + (dir ? '<span class="korb__chip korb__chip--' + esc(dir) + '">' + esc(dirLabels[dir] || dir) + '</span>' : '') + '<p>' + esc(line) + '</p></div>';
      } else {
        html += '<dl class="korb__cb">';
        if (it.getAttribute('data-pull')) html += '<div><dt><i class="korb__in" aria-hidden="true"></i>' + esc(pullLabel) + '</dt><dd>' + esc(it.getAttribute('data-pull')) + '</dd></div>';
        if (it.getAttribute('data-push')) html += '<div><dt><i class="korb__out" aria-hidden="true"></i>' + esc(pushLabel) + '</dt><dd>' + esc(it.getAttribute('data-push')) + '</dd></div>';
        html += '</dl>';
      }
      cap.innerHTML = html + '</div>';
      if (!reduce.matches && cap.firstChild.animate) cap.firstChild.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 300, easing: 'cubic-bezier(.2,.8,.2,1)' });
    }
    function select(i) {
      if (i === active) i = -1;
      active = i;
      model.forEach(function (m, k) {
        var on = k === i;
        m.el.classList.toggle('is-on', on); m.el.setAttribute('aria-pressed', on ? 'true' : 'false');
        m.line.classList.toggle('is-on', on); m.flow.classList.toggle('is-on', on);
      });
      root.classList.toggle('has-active', i >= 0);
      caption(i);
      root.dispatchEvent(new CustomEvent('orbit:select', { bubbles: true, detail: { index: i, name: i >= 0 ? model[i].name : null } }));
    }
    model.forEach(function (m, i) {
      m.el.addEventListener('click', function () { select(i); });
      m.el.addEventListener('keydown', function (e) {
        var j = -1;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') j = (i + 1) % model.length;
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') j = (i - 1 + model.length) % model.length;
        else if (e.key === 'Escape') { if (active >= 0) { e.preventDefault(); select(-1); } return; }
        else if (m.el.tagName !== 'BUTTON' && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); select(i); return; }
        if (j >= 0) { e.preventDefault(); model[j].el.focus(); }
      });
    });
    stage.addEventListener('mouseenter', function () { hover = true; });
    stage.addEventListener('mouseleave', function () { hover = false; wake(); });
    root.addEventListener('focusin', function () { focusIn = true; });
    root.addEventListener('focusout', function (e) { if (!root.contains(e.relatedTarget)) { focusIn = false; wake(); } });
    document.addEventListener('visibilitychange', wake);
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { inView = es[0].isIntersecting; if (inView) wake(); }, { threshold: .15 }).observe(stage);
    else inView = true;
    if ('ResizeObserver' in window) new ResizeObserver(measure).observe(stage);
    window.addEventListener('resize', measure);
    measure(); caption(-1);
    if (core.querySelector('img') && !core.querySelector('img').complete) core.querySelector('img').addEventListener('load', measure);
    root.__korbApi = { select: select, active: function () { return active; }, angle: function () { return angle[1]; },
      lineInfo: function (i) { var m = model[i]; return { x1: +m.line.getAttribute('x1'), y1: +m.line.getAttribute('y1'), x2: +m.line.getAttribute('x2'), y2: +m.line.getAttribute('y2'), cx: cx, cy: cy, coreR: coreR, tx: m.x, ty: m.y, tile: tile }; } };
  }

  function init(scope) { (scope || document).querySelectorAll('[data-orbit]').forEach(setup); }
  window.KitOrbit = {
    init: init,
    select: function (el, i) { if (el.__korbApi) el.__korbApi.select(i); },
    active: function (el) { return el.__korbApi ? el.__korbApi.active() : -1; },
    _angle: function (el) { return el.__korbApi ? el.__korbApi.angle() : 0; },
    _line: function (el, i) { return el.__korbApi ? el.__korbApi.lineInfo(i) : null; }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { init(); });
  else init();
})();
