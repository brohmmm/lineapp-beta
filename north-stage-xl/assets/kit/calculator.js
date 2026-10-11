/* LineApp R3 kit · calculator.js — "Eight places a brand can live in your app".
   Tick a place, coins and notes fall into the jar, the package total counts up and splits 50/50.
   <div class="kcalc" data-calc data-currency="£" data-split="50"> <script type="application/json">[…]</script> </div>
   No dependencies. Reduced motion: the jar fills without falling, the total sets at once. */
(function () {
  'use strict';
  if (window.KitCalc) return;
  var reduce = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  var uid = 0;

  var ICON = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
    '<circle class="kcalc__tg-bg" cx="12" cy="12" r="11"/>' +
    '<path class="kcalc__tg-plus" d="M12 7.5v9M7.5 12h9" stroke-width="2" stroke-linecap="round"/>' +
    '<path class="kcalc__tg-tick" d="M7.35 12.35 10.55 15.5 16.75 8.95" pathLength="1" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>';

  function fmt(n, cur, locale) {
    var s;
    try { s = new Intl.NumberFormat(locale || 'en-GB', { maximumFractionDigits: 0 }).format(Math.round(n)); }
    catch (e) { s = String(Math.round(n)); }
    return cur + s;
  }
  function num(n, locale) { try { return new Intl.NumberFormat(locale || 'en-GB').format(n); } catch (e) { return String(n); } }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function readItems(root) {
    var src = root.getAttribute('data-calc-items'), node = src ? document.querySelector(src) : root.querySelector('script[type="application/json"]');
    if (node) {
      try {
        var j = JSON.parse(node.textContent), key = root.getAttribute('data-calc-key');
        if (!Array.isArray(j)) j = (key && j[key]) || [];
        return j;
      } catch (e) { return []; }
    }
    return Array.prototype.map.call(root.querySelectorAll('[data-calc-item]'), function (li, i) {
      return { id: li.getAttribute('data-calc-id') || 'p' + i, name: li.getAttribute('data-name') || li.textContent.trim(),
        note: li.getAttribute('data-note') || '', price: parseFloat(li.getAttribute('data-price')) || 0,
        thumb: li.getAttribute('data-thumb') || '', on: li.hasAttribute('data-on') };
    });
  }

  /* ---------------- jar physics (canvas) ---------------- */
  function Jar(canvas, opts) {
    this.c = canvas; this.ctx = canvas.getContext('2d'); this.bodies = []; this.raf = 0; this.last = 0; this.opts = opts;
    this.w = 0; this.h = 0; this.dpr = 1; this.visible = true;
    this.resize();
  }
  Jar.prototype.resize = function () {
    var r = this.c.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
    if (!r.width || !r.height) return;
    var ow = this.w;
    this.w = r.width; this.h = r.height; this.dpr = dpr;
    this.c.width = Math.round(r.width * dpr); this.c.height = Math.round(r.height * dpr);
    if (ow && ow !== this.w) { var k = this.w / ow; this.bodies.forEach(function (b) { b.x *= k; b.sleep = false; }); }
    this.kick();
  };
  Jar.prototype.add = function (tag, n, notesShare, instant) {
    var w = this.w || 300, s = this.scale();
    for (var i = 0; i < n; i++) {
      var note = Math.random() < notesShare;
      var r = note ? 13 * s : (12 + Math.random() * 3) * s;
      var b = { tag: tag, note: note, r: r, x: r + Math.random() * (w - 2 * r), y: -r * 2 - i * 16 * s - Math.random() * 30,
        vx: (Math.random() - .5) * 60, vy: 40 + Math.random() * 80, a: Math.random() * Math.PI * 2, va: (Math.random() - .5) * 8,
        ph: Math.random() * 6.28, alpha: 1, fade: 0, sleep: false, rest: 0 };
      this.bodies.push(b);
    }
    if (instant) this.settle(); else this.kick();
  };
  Jar.prototype.scale = function () { return Math.max(.6, Math.min(1, (this.w || 300) / 420)); };
  Jar.prototype.remove = function (tag, instant) {
    var any = false;
    this.bodies.forEach(function (b) { if (b.tag === tag && !b.fade) { b.fade = 1e-6; any = true; } });
    this.bodies.forEach(function (b) { b.sleep = false; });
    if (instant) { this.bodies = this.bodies.filter(function (b) { return b.tag !== tag; }); this.settle(); }
    else if (any) this.kick();
  };
  Jar.prototype.settle = function () { for (var i = 0; i < 360; i++) this.step(1 / 60); this.draw(); };
  Jar.prototype.kick = function () {
    var self = this;
    if (this.raf || !this.w) { this.draw(); return; }
    this.last = performance.now();
    var loop = function (t) {
      var dt = Math.min(1 / 30, (t - self.last) / 1000); self.last = t;
      var moving = self.step(dt); self.draw();
      self.raf = moving ? requestAnimationFrame(loop) : 0;
    };
    this.raf = requestAnimationFrame(loop);
  };
  Jar.prototype.step = function (dt) {
    var B = this.bodies, w = this.w, h = this.h, g = 1500, moving = false, i, j, b;
    for (i = B.length - 1; i >= 0; i--) {
      b = B[i];
      if (b.fade) { b.fade += dt / .32; b.alpha = Math.max(0, 1 - b.fade); b.vy -= 300 * dt; if (b.fade >= 1) { B.splice(i, 1); continue; } moving = true; }
      if (b.sleep) continue;
      var drag = b.note ? 2.6 : .35;
      b.vy += g * dt; b.vx -= b.vx * drag * dt; b.vy -= b.vy * drag * dt * (b.note ? 1 : .2);
      if (b.note && b.y < h - b.r * 3) { b.ph += dt * 5; b.vx += Math.sin(b.ph) * 260 * dt; b.va += Math.cos(b.ph) * 4 * dt; }
      b.x += b.vx * dt; b.y += b.vy * dt; b.a += b.va * dt;
      b.va *= (1 - Math.min(1, 1.5 * dt));
    }
    // collisions: walls + pairs (a few relaxation passes)
    for (var it = 0; it < 3; it++) {
      for (i = 0; i < B.length; i++) {
        b = B[i]; if (b.fade) continue;
        if (b.x < b.r) { b.x = b.r; b.vx = Math.abs(b.vx) * .3; }
        if (b.x > w - b.r) { b.x = w - b.r; b.vx = -Math.abs(b.vx) * .3; }
        if (b.y > h - b.r) { b.y = h - b.r; if (b.vy > 0) b.vy = -b.vy * .22; b.vx *= .86; b.va *= .8; }
        for (j = i + 1; j < B.length; j++) {
          var o = B[j]; if (o.fade) continue;
          var dx = o.x - b.x, dy = o.y - b.y, rr = b.r + o.r, d2 = dx * dx + dy * dy;
          if (d2 >= rr * rr || d2 === 0) continue;
          var d = Math.sqrt(d2), nx = dx / d, ny = dy / d, pen = (rr - d);
          var wb = b.sleep ? 0 : 1, wo = o.sleep ? 0 : 1;
          if (!wb && !wo) continue;
          var tot = wb + wo; b.x -= nx * pen * wb / tot; b.y -= ny * pen * wb / tot; o.x += nx * pen * wo / tot; o.y += ny * pen * wo / tot;
          var rv = (o.vx - b.vx) * nx + (o.vy - b.vy) * ny;
          if (rv < 0) { var imp = -rv * .62; b.vx -= nx * imp * wb / tot; b.vy -= ny * imp * wb / tot; o.vx += nx * imp * wo / tot; o.vy += ny * imp * wo / tot;
            b.vx *= .96; o.vx *= .96; }
        }
      }
    }
    for (i = 0; i < B.length; i++) {
      b = B[i]; if (b.sleep || b.fade) continue;
      var sp = Math.abs(b.vx) + Math.abs(b.vy);
      if (sp < 22 && b.y > 0) { b.rest += dt; if (b.note) b.a += (Math.round(b.a / Math.PI) * Math.PI - b.a) * Math.min(1, 6 * dt) * .5; }
      else b.rest = 0;
      if (b.rest > .35) { b.sleep = true; b.vx = b.vy = b.va = 0; } else moving = true;
    }
    // anything resting on a body that has just been removed wakes up
    if (this._wake) { B.forEach(function (x) { x.sleep = false; }); this._wake = false; moving = true; }
    return moving;
  };
  Jar.prototype.draw = function () {
    var x = this.ctx, dpr = this.dpr, B = this.bodies;
    x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, this.w, this.h);
    for (var i = 0; i < B.length; i++) {
      var b = B[i]; if (b.y < -40) continue;
      x.save(); x.globalAlpha = b.alpha; x.translate(b.x, b.y); x.rotate(b.a);
      var sc = b.fade ? 1 - b.fade * .3 : 1; x.scale(sc, sc);
      if (b.note) {
        var nw = b.r * 3.1, nh = b.r * 1.7, flip = Math.abs(Math.cos(b.ph * .5)) * .35 + .65;
        x.scale(1, flip);
        roundRect(x, -nw / 2, -nh / 2, nw, nh, 2.5); x.fillStyle = '#EEF1E4'; x.fill();
        x.fillStyle = '#C7E635'; x.fillRect(-nw / 2 + 3, -nh / 2 + 3, nw * .22, nh - 6);
        x.strokeStyle = 'rgba(11,12,14,.18)'; x.lineWidth = 1; roundRect(x, -nw / 2 + .5, -nh / 2 + .5, nw - 1, nh - 1, 2.5); x.stroke();
        x.fillStyle = '#2B2E22'; x.font = '800 ' + (nh * .62).toFixed(1) + 'px Figtree, system-ui, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
        if (Math.cos(b.a) < 0) x.rotate(Math.PI);
        x.fillText(this.opts.cur, nw * .12, .5);
      } else {
        x.beginPath(); x.arc(0, 0, b.r, 0, 6.2832); x.fillStyle = '#A9C42A'; x.fill();
        x.beginPath(); x.arc(0, -.6, b.r - 1.4, 0, 6.2832); x.fillStyle = '#C7E635'; x.fill();
        x.beginPath(); x.arc(0, -.6, b.r - 3.6, 0, 6.2832); x.strokeStyle = 'rgba(11,12,14,.16)'; x.lineWidth = 1; x.stroke();
        x.fillStyle = 'rgba(20,24,8,.78)'; x.font = '800 ' + (b.r * 1.05).toFixed(1) + 'px Figtree, system-ui, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
        x.rotate(-b.a + Math.sin(b.ph) * .3); x.fillText(this.opts.cur, 0, .5);
      }
      x.restore();
    }
  };
  function roundRect(x, l, t, w, h, r) { x.beginPath(); x.moveTo(l + r, t); x.arcTo(l + w, t, l + w, t + h, r); x.arcTo(l + w, t + h, l, t + h, r); x.arcTo(l, t + h, l, t, r); x.arcTo(l, t, l + w, t, r); x.closePath(); }

  /* ---------------- component ---------------- */
  function setup(root) {
    if (root.__kcalc) return; root.__kcalc = true;
    var id = 'kcalc' + (++uid);
    var items = readItems(root);
    var cur = root.getAttribute('data-currency') || '£';
    var locale = root.getAttribute('data-locale') || 'en-GB';
    var split = Math.max(0, Math.min(100, parseFloat(root.getAttribute('data-split') || '50')));
    // North Stage: data-split-cap = a fixed app price that the sponsor money fills first; the rest stays with the festival
    var cap = parseFloat(root.getAttribute('data-split-cap') || '0');
    function partA(v) { return cap ? Math.min(v, cap) : Math.round(v * split / 100); }
    var ph = root.hasAttribute('data-calc-ph') ? root.getAttribute('data-calc-ph') : 'price';
    var phAttr = ph ? ' data-ph="' + esc(ph) + '"' : '';
    var labelA = root.getAttribute('data-split-a') || 'LineApp, for the app';
    var labelB = root.getAttribute('data-split-b') || 'Your festival keeps';
    var totalLabel = root.getAttribute('data-total-label') || 'The sponsor pays';
    var emptyText = root.getAttribute('data-empty') || 'Tick a place to start the package.';
    var maxTotal = items.reduce(function (s, it) { return s + (+it.price || 0); }, 0) || 1;
    var hasReach = items.some(function (it) { return it.impressions != null; });
    var reachTpl = root.getAttribute('data-reach') || '{people} people saw it · {times} times in all';
    items.forEach(function (it) {
      if (!it.note && it.people != null) it.note = num(it.people, locale) + ' people · seen ' + num(it.impressions, locale) + ' times';
    });

    root.classList.add('kcalc');
    root.innerHTML =
      '<ul class="kcalc__list" role="list">' + items.map(function (it, i) {
        return '<li class="kcalc__item"><button type="button" class="kcalc__row" aria-pressed="false" data-i="' + i + '">' +
          '<span class="kcalc__tg">' + ICON + '</span>' +
          (it.thumb ? '<span class="kcalc__thumb"><img src="' + esc(it.thumb) + '" alt="" loading="lazy" decoding="async"></span>' : '') +
          '<span class="kcalc__text"><span class="kcalc__name">' + esc(it.name) + '</span>' + (it.note ? '<span class="kcalc__note">' + esc(it.note) + '</span>' : '') + '</span>' +
          '<span class="kcalc__price"' + phAttr + '>' + fmt(it.price, cur, locale) + '</span>' +
          '<span class="kcalc__sr">, not in the package</span></button></li>';
      }).join('') + '</ul>' +
      '<div class="kcalc__sum">' +
        '<div class="kcalc__jar"><canvas aria-hidden="true"></canvas><span class="kcalc__empty">' + esc(emptyText) + '</span></div>' +
        '<div class="kcalc__totals">' +
          '<div class="kcalc__tl"><span class="kcalc__tl-label">' + esc(totalLabel) + '</span><span class="kcalc__count"></span></div>' +
          '<div class="kcalc__total"' + phAttr + ' aria-hidden="true">' + fmt(0, cur, locale) + '</div>' +
          (cap ? '<div class="kcalc__bar kcalc__bar--cap" aria-hidden="true"><i class="kcalc__bar-a"></i><i class="kcalc__bar-b"></i><span class="kcalc__capmark" style="left:' + (cap / maxTotal * 100) + '%"></span></div>' : '<div class="kcalc__bar" aria-hidden="true"><i class="kcalc__bar-a" style="width:' + split + '%"></i><i class="kcalc__bar-b"></i></div>') +
          '<dl class="kcalc__split">' +
            '<div class="kcalc__sa"><dt><i></i>' + esc(labelA) + '</dt><dd' + phAttr + '>' + fmt(0, cur, locale) + '</dd></div>' +
            '<div class="kcalc__sb"><dt><i></i>' + esc(labelB) + '</dt><dd' + phAttr + '>' + fmt(0, cur, locale) + '</dd></div>' +
          '</dl>' +
          (hasReach ? '<p class="kcalc__reach" data-ph="number"></p>' : '') +
        '</div>' +
        '<p class="kcalc__live" id="' + id + '-live" aria-live="polite"' + phAttr + '></p>' +
      '</div>';

    var rows = Array.prototype.slice.call(root.querySelectorAll('.kcalc__row'));
    var canvas = root.querySelector('canvas'), totalEl = root.querySelector('.kcalc__total');
    var aEl = root.querySelector('.kcalc__sa dd'), bEl = root.querySelector('.kcalc__sb dd'), countEl = root.querySelector('.kcalc__count');
    var barA = root.querySelector('.kcalc__bar-a'), barB = root.querySelector('.kcalc__bar-b');
    var live = root.querySelector('.kcalc__live'), empty = root.querySelector('.kcalc__empty'), reachEl = root.querySelector('.kcalc__reach');
    var jar = new Jar(canvas, { cur: cur });
    var state = items.map(function (it) { return !!it.on; });
    var shown = 0, target = 0, tw = 0, liveT = 0;

    function bodiesFor(price) {
      // the jar holds all eight places at about half full, whatever its size
      var s = jar.scale(), r = 13.5 * s, cap = Math.max(18, Math.floor((jar.w || 300) * (jar.h || 200) * .5 / (Math.PI * r * r)));
      return Math.max(2, Math.round(price / maxTotal * cap));
    }
    function total() { return items.reduce(function (s, it, i) { return s + (state[i] ? +it.price || 0 : 0); }, 0); }
    function paint(v) {
      totalEl.textContent = fmt(v, cur, locale);
      var a = partA(v);
      aEl.textContent = fmt(a, cur, locale); bEl.textContent = fmt(v - a, cur, locale);
      if (cap) { barA.style.width = (a / maxTotal * 100) + '%'; barB.style.width = ((v - a) / maxTotal * 100) + '%'; }
    }
    function countTo(v, instant) {
      target = v; cancelAnimationFrame(tw);
      if (instant || reduce.matches) { shown = v; paint(v); return; }
      var from = shown, t0 = performance.now(), dur = 900;
      (function f(t) {
        var k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
        shown = from + (v - from) * e; paint(shown);
        if (k < 1) tw = requestAnimationFrame(f); else { shown = v; paint(v); }
      })(t0);
      root.classList.remove('is-bump'); void totalEl.offsetWidth; root.classList.add('is-bump');
    }
    function sync(i, instant) {
      var on = state[i], r = rows[i];
      r.setAttribute('aria-pressed', on ? 'true' : 'false');
      r.querySelector('.kcalc__sr').textContent = on ? ', in the package' : ', not in the package';
      r.parentNode.classList.toggle('is-on', on);
    }
    function update(instant) {
      var t = total(), n = state.filter(Boolean).length;
      countTo(t, instant);
      countEl.textContent = n + ' of ' + items.length + ' places';
      if (reachEl) {
        var ppl = 0, times = 0;
        items.forEach(function (it, i) { if (state[i]) { ppl = Math.max(ppl, +it.people || 0); times += +it.impressions || 0; } });
        reachEl.textContent = n ? reachTpl.replace('{people}', num(ppl, locale)).replace('{times}', num(times, locale)) : '';
      }
      root.classList.toggle('is-empty', n === 0);
      empty.hidden = n !== 0;
      clearTimeout(liveT);
      liveT = setTimeout(function () {
        var a = partA(t);
        live.textContent = totalLabel + ' ' + fmt(t, cur, locale) + '. ' + labelA + ' ' + fmt(a, cur, locale) + '. ' + labelB + ' ' + fmt(t - a, cur, locale) + '.';
      }, instant ? 0 : 700);
      root.dispatchEvent(new CustomEvent('calc:change', { bubbles: true, detail: { total: t, a: partA(t), b: t - partA(t),
        selected: items.filter(function (_, i) { return state[i]; }).map(function (it) { return it.id; }) } }));
    }
    function toggle(i, on, instant) {
      if (on == null) on = !state[i];
      if (state[i] === on) return;
      state[i] = on; sync(i);
      var it = items[i], tag = it.id || i;
      if (on) jar.add(tag, bodiesFor(+it.price || 0), Math.min(.6, .25 + (+it.price || 0) / maxTotal), instant || reduce.matches);
      else { jar._wake = true; jar.remove(tag, instant || reduce.matches); }
      update(instant);
    }
    rows.forEach(function (r, i) {
      r.addEventListener('click', function () { toggle(i); });
      r.addEventListener('keydown', function (e) {
        var k = e.key, j = -1;
        if (k === 'ArrowDown') j = Math.min(rows.length - 1, i + 1);
        else if (k === 'ArrowUp') j = Math.max(0, i - 1);
        else if (k === 'Home') j = 0; else if (k === 'End') j = rows.length - 1;
        if (j >= 0) { e.preventDefault(); rows[j].focus(); }
      });
    });

    // initial state (items with "on": true) lands in the jar without falling
    var started = false;
    function start() {
      if (started) return; started = true;
      jar.resize();
      state.forEach(function (on, i) { if (on) { state[i] = false; toggle(i, true, true); } else sync(i); });
      update(true);
    }
    if ('ResizeObserver' in window) new ResizeObserver(function () { if (started) jar.resize(); else start(); }).observe(canvas);
    else start();
    setTimeout(start, 50);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { jar.draw(); });

    root.__kcalcApi = { toggle: toggle, total: total, state: state, jar: jar, ids: items.map(function (it, i) { return it.id || i; }) };
  }

  function init(scope) { (scope || document).querySelectorAll('[data-calc]').forEach(setup); }
  window.KitCalc = {
    init: init,
    set: function (el, idOrIndex, on) {
      var api = el.__kcalcApi; if (!api) return;
      var i = typeof idOrIndex === 'number' ? idOrIndex : api.ids.indexOf(idOrIndex);
      if (i >= 0) api.toggle(i, on);
    },
    total: function (el) { return el.__kcalcApi ? el.__kcalcApi.total() : 0; },
    _bodies: function (el) { return el.__kcalcApi ? el.__kcalcApi.jar.bodies.length : 0; }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { init(); });
  else init();
})();
