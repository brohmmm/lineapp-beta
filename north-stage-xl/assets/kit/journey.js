/* LineApp R3 kit · journey.js — "the day on one photo".
   One pinned, full-bleed frame. Scrolling moves the time of day: the photo crossfades between identical-frame stills,
   a clock runs, live labels and stage states change, and a row of counters updates. An optional storm step darkens the
   frame and shows the app's alert. Phones get 3:4 stills with labels anchored inside the frame.
   Reduced motion (or no JS): the steps are stacked stills, each with its own labels and numbers.
   <div class="kjr" data-journey data-counter-labels="In the field|Lockers taken|…"> <figure class="kjr__step" data-time="10:00" data-counters="…">…</figure> … </div> */
(function () {
  'use strict';
  if (window.KitJourney) return;
  var reduce = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  var mobileMQ = window.matchMedia ? matchMedia('(max-width: 700px)') : { matches: false };
  var uid = 0;

  var ICON_SWAP = '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M3 6.2a5 5 0 0 1 8.9-1.9M13 9.8a5 5 0 0 1-8.9 1.9" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M12.4 1.9v2.8H9.6M3.6 14.1v-2.8h2.8" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var ICON_SUN = '<svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><circle cx="10" cy="10" r="3.6" fill="currentColor"/><g stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M10 1.8v2M10 16.2v2M1.8 10h2M16.2 10h2M4.2 4.2l1.4 1.4M14.4 14.4l1.4 1.4M4.2 15.8l1.4-1.4M14.4 5.6l1.4-1.4"/></g></svg>';
  var ICON_MOON = '<svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M15.6 12.6A6.6 6.6 0 0 1 7.4 4.4a6.6 6.6 0 1 0 8.2 8.2Z" fill="currentColor"/></svg>';

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function smooth(a, b, x) { var t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }
  function mins(s) { var m = /^(\d{1,2}):(\d{2})/.exec(s || ''); return m ? (+m[1]) * 60 + (+m[2]) : null; }
  function hhmm(v) { v = ((Math.round(v / 5) * 5) % 1440 + 1440) % 1440; var h = Math.floor(v / 60), m = v % 60; return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m; }
  function parseNum(s) {
    var m = /^([^\d-]*)(-?[\d,.]+)(.*)$/.exec(String(s).trim());
    if (!m) return null;
    var raw = m[2], dec = (raw.split('.')[1] || '').length;
    return { pre: m[1], n: parseFloat(raw.replace(/,/g, '')), post: m[3], dec: dec, commas: raw.indexOf(',') >= 0 };
  }
  function fmtNum(p, v) {
    var s = v.toFixed(p.dec);
    if (p.commas) { var parts = s.split('.'); parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ','); s = parts.join('.'); }
    return p.pre + s + p.post;
  }

  function decoratePin(pin, i) {
    if (pin.__kjr) return; pin.__kjr = true;
    var x = pin.getAttribute('data-x') || '50', y = pin.getAttribute('data-y') || '50';
    pin.style.setProperty('--x', x); pin.style.setProperty('--y', y);
    pin.style.setProperty('--xm', pin.getAttribute('data-xm') || x); pin.style.setProperty('--ym', pin.getAttribute('data-ym') || y);
    pin.style.setProperty('--d', (i * 70) + 'ms');
    var align = pin.getAttribute('data-align') || (parseFloat(x) > 62 ? 'left' : 'right');
    var alignM = pin.getAttribute('data-align-m') || (parseFloat(pin.getAttribute('data-xm') || x) > 55 ? 'left' : 'right');
    pin.setAttribute('data-side', align); pin.setAttribute('data-side-m', alignM);
    var stage = pin.getAttribute('data-stage');
    var label = pin.innerHTML;
    var chip;
    if (stage === 'live') {
      chip = '<span class="kjr__chip kjr__chip--live"><span class="kjr__live"><i></i>Live</span><b>' + label + '</b></span>';
    } else if (stage === 'next') {
      var when = pin.getAttribute('data-next');
      var txt = pin.getAttribute('data-next-label') || ('Changeover · Next' + (when ? ' ' + when : ''));
      chip = '<span class="kjr__chip kjr__chip--next"><b>' + label + '</b><small>' + ICON_SWAP + txt + '</small></span>';
    } else {
      var icon = pin.getAttribute('data-icon');
      chip = '<span class="kjr__chip' + (pin.getAttribute('data-tone') ? ' kjr__chip--' + pin.getAttribute('data-tone') : '') + '">' +
        (icon ? '<span class="kjr__ico" aria-hidden="true">' + icon + '</span>' : '') + '<span>' + label + '</span></span>';
    }
    pin.innerHTML = '<span class="kjr__dot" aria-hidden="true"></span>' + chip;
  }

  // keep labels readable: flip a label under its dot when it would hit the top edge or an earlier label,
  // and slide it sideways when it would leave the visible frame
  function layoutPins(group, bounds) {
    var pins = Array.prototype.slice.call(group.querySelectorAll('.kjr__pin'));
    var B = bounds.getBoundingClientRect(), placed = [];
    pins.forEach(function (p) {
      var chip = p.querySelector('.kjr__chip'); if (!chip) return;
      p.removeAttribute('data-v'); chip.style.removeProperty('--shift');
      var r = chip.getBoundingClientRect();
      var hit = function (a) { return placed.some(function (q) { return a.left < q.right + 4 && a.right > q.left - 4 && a.top < q.bottom + 4 && a.bottom > q.top - 4; }); };
      if (r.top < B.top + 8 || hit(r)) { p.setAttribute('data-v', 'below'); r = chip.getBoundingClientRect(); }
      var shift = 0;
      if (r.right > B.right - 8) shift = (B.right - 8) - r.right;
      if (r.left + shift < B.left + 8) shift = (B.left + 8) - r.left;
      if (shift) { chip.style.setProperty('--shift', Math.round(shift) + 'px'); r = { left: r.left + shift, right: r.right + shift, top: r.top, bottom: r.bottom }; }
      placed.push(r);
    });
  }

  function counterRow(labels, values, cls) {
    var ul = document.createElement('ul'); ul.className = cls || 'kjr__counters'; ul.setAttribute('role', 'list');
    labels.forEach(function (l, i) {
      var li = document.createElement('li');
      li.innerHTML = '<b>' + (values[i] != null ? values[i] : '') + '</b><span>' + l + '</span>';
      ul.appendChild(li);
    });
    return ul;
  }

  function setup(root) {
    if (root.__kjr) return; root.__kjr = true;
    var id = 'kjr' + (++uid);
    var steps = Array.prototype.slice.call(root.querySelectorAll(':scope > .kjr__step, :scope > [data-step]'));
    var n = steps.length; if (!n) return;
    var labels = (root.getAttribute('data-counter-labels') || '').split('|').filter(function (s) { return s.trim(); });
    var stepVh = parseFloat(root.getAttribute('data-step-vh') || '100');
    var ratio = root.getAttribute('data-ratio') || '16/9', ratioM = root.getAttribute('data-ratio-m') || '3/4';
    var data = steps.map(function (f) {
      return { el: f, time: f.getAttribute('data-time') || '', label: f.getAttribute('data-label') || '',
        counters: (f.getAttribute('data-counters') || '').split('|'), storm: f.hasAttribute('data-storm') };
    });
    // the clock: make times monotonic across midnight
    var tm = [], prev = -1; data.forEach(function (d) { var m = mins(d.time); if (m == null) m = prev < 0 ? 600 : prev + 60; while (m < prev) m += 1440; tm.push(m); prev = m; });

    steps.forEach(function (f) { Array.prototype.forEach.call(f.querySelectorAll('.kjr__pin'), decoratePin); });
    root.style.setProperty('--ar', ratio); root.style.setProperty('--ar-m', ratioM);

    if (reduce.matches) { buildStatic(); return; }
    buildLive();

    /* ---------- reduced motion: stacked stills ---------- */
    function buildStatic() {
      root.classList.add('kjr', 'kjr--static');
      data.forEach(function (d, i) {
        var f = d.el, pic = f.querySelector('picture, img');
        var frame = document.createElement('div'); frame.className = 'kjr__sframe';
        if (pic) { f.insertBefore(frame, pic); frame.appendChild(pic); }
        Array.prototype.forEach.call(f.querySelectorAll('.kjr__pin'), function (p) { frame.appendChild(p); });
        if (d.storm) { var s = document.createElement('div'); s.className = 'kjr__storm is-on'; s.setAttribute('aria-hidden', 'true'); frame.appendChild(s); var al = f.querySelector('.kjr__alert'); if (al) frame.appendChild(al); }
        var head = document.createElement('p'); head.className = 'kjr__stime';
        head.innerHTML = (d.time ? '<b>' + d.time + '</b>' : '') + (d.label ? '<span>' + d.label + '</span>' : '');
        f.insertBefore(head, f.firstChild);
        if (labels.length) f.appendChild(counterRow(labels, d.counters, 'kjr__counters kjr__counters--static'));
      });
      var relayout = function () { Array.prototype.forEach.call(root.querySelectorAll('.kjr__sframe'), function (fr) { layoutPins(fr, fr); }); };
      Array.prototype.forEach.call(root.querySelectorAll('.kjr__sframe img'), function (im) { if (!im.complete) im.addEventListener('load', relayout); });
      relayout(); window.addEventListener('resize', relayout); window.addEventListener('load', relayout);
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(relayout);
    }

    /* ---------- pinned scroller ---------- */
    function buildLive() {
      root.classList.add('kjr', 'kjr--live');
      root.style.setProperty('--kjr-h', (n * stepVh) + 'vh');
      var sticky = document.createElement('div'); sticky.className = 'kjr__sticky';
      var media = document.createElement('div'); media.className = 'kjr__media';
      var frame = document.createElement('div'); frame.className = 'kjr__frame';
      var storm = document.createElement('div'); storm.className = 'kjr__storm'; storm.setAttribute('aria-hidden', 'true');
      var pinsWrap = document.createElement('div'); pinsWrap.className = 'kjr__pins';
      media.appendChild(frame);
      var hud = document.createElement('div'); hud.className = 'kjr__hud';
      var top = document.createElement('div'); top.className = 'kjr__top';
      var clock = document.createElement('div'); clock.className = 'kjr__clock'; clock.setAttribute('aria-hidden', 'true');
      clock.innerHTML = '<span class="kjr__sky"></span><b class="kjr__time">' + hhmm(tm[0]) + '</b>';
      var caps = document.createElement('div'); caps.className = 'kjr__caps'; caps.setAttribute('aria-live', 'polite');
      var alerts = document.createElement('div'); alerts.className = 'kjr__alerts';
      top.appendChild(clock); top.appendChild(caps);
      var bottom = document.createElement('div'); bottom.className = 'kjr__bottom';
      var counters = labels.length ? counterRow(labels, data[0].counters) : null;
      var scrub = document.createElement('div'); scrub.className = 'kjr__scrub'; scrub.setAttribute('role', 'group'); scrub.setAttribute('aria-label', root.getAttribute('data-scrub-label') || 'Time of day');
      scrub.innerHTML = '<span class="kjr__track"><i class="kjr__fill"></i><i class="kjr__knob"></i></span>';
      var ticks = [];

      data.forEach(function (d, i) {
        var f = d.el;
        var pic = f.querySelector('picture') || f.querySelector('img');
        var layer = document.createElement('div'); layer.className = 'kjr__img'; layer.style.zIndex = String(i + 1);
        if (pic) layer.appendChild(pic);
        frame.appendChild(layer);
        if (i > 0) { var im = layer.querySelector('img'); if (im) im.loading = 'eager'; }
        var group = document.createElement('div'); group.className = 'kjr__pg'; group.setAttribute('data-i', i);
        Array.prototype.forEach.call(f.querySelectorAll('.kjr__pin'), function (p) { group.appendChild(p); });
        pinsWrap.appendChild(group);
        var cap = f.querySelector('.kjr__cap, figcaption');
        var cw = document.createElement('div'); cw.className = 'kjr__capi'; cw.setAttribute('data-i', i);
        if (cap) { while (cap.firstChild) cw.appendChild(cap.firstChild); }
        caps.appendChild(cw);
        var al = f.querySelector('.kjr__alert');
        if (al) { al.setAttribute('data-i', i); alerts.appendChild(al); }
        var b = document.createElement('button'); b.type = 'button'; b.className = 'kjr__tick';
        b.style.left = (n > 1 ? i / (n - 1) * 100 : 0) + '%';
        b.innerHTML = '<span>' + (d.time || i + 1) + '</span>';
        b.setAttribute('aria-label', (d.time ? d.time + ', ' : '') + (d.label || 'step ' + (i + 1)));
        b.addEventListener('click', function () { go(i); });
        scrub.appendChild(b); ticks.push(b);
        f.parentNode.removeChild(f);
      });
      frame.appendChild(storm); frame.appendChild(pinsWrap);
      bottom.appendChild(scrub); if (counters) bottom.insertBefore(counters, scrub);
      hud.appendChild(top); hud.appendChild(alerts); hud.appendChild(bottom);
      sticky.appendChild(media); sticky.appendChild(hud);
      root.appendChild(sticky);

      var layers = Array.prototype.slice.call(frame.querySelectorAll('.kjr__img'));
      var groups = Array.prototype.slice.call(pinsWrap.children), capEls = Array.prototype.slice.call(caps.children);
      var alertEls = Array.prototype.slice.call(alerts.children);
      var timeEl = clock.querySelector('.kjr__time'), skyEl = clock.querySelector('.kjr__sky');
      var fill = scrub.querySelector('.kjr__fill'), knob = scrub.querySelector('.kjr__knob');
      var cvals = counters ? Array.prototype.slice.call(counters.querySelectorAll('b')) : [];
      var active = -1, raf = 0, tweens = [], isNight = null;

      function range() { return Math.max(1, root.offsetHeight - window.innerHeight); }
      function go(i) {
        var y = root.getBoundingClientRect().top + window.scrollY + (n > 1 ? i / (n - 1) : 0) * range();
        window.scrollTo({ top: Math.round(y) + 2, behavior: 'smooth' });
      }
      function setCounters(i) {
        tweens.forEach(cancelAnimationFrame); tweens = [];
        cvals.forEach(function (b, k) {
          var to = data[i].counters[k], from = b.textContent;
          var pt = parseNum(to), pf = parseNum(from);
          if (!pt || !pf || pt.pre !== pf.pre || pt.post !== pf.post) { b.textContent = to == null ? '' : to; return; }
          var t0 = performance.now(), d = 650;
          b.parentNode.classList.toggle('is-up', pt.n > pf.n); b.parentNode.classList.toggle('is-down', pt.n < pf.n);
          (function f(t) {
            var q = Math.min(1, (t - t0) / d), e = 1 - Math.pow(1 - q, 3);
            b.textContent = fmtNum(pt, pf.n + (pt.n - pf.n) * e);
            if (q < 1) tweens[k] = requestAnimationFrame(f); else b.textContent = to;
          })(t0);
        });
      }
      function setActive(i) {
        if (i === active) return;
        active = i;
        groups.forEach(function (g, k) { g.classList.toggle('is-on', k === i); g.setAttribute('aria-hidden', k === i ? 'false' : 'true'); });
        layoutPins(groups[i], media);
        capEls.forEach(function (c, k) { c.classList.toggle('is-on', k === i); c.hidden = k !== i; });
        alertEls.forEach(function (a) { a.classList.toggle('is-on', +a.getAttribute('data-i') === i); });
        ticks.forEach(function (t, k) { t.classList.toggle('is-on', k === i); if (k === i) t.setAttribute('aria-current', 'step'); else t.removeAttribute('aria-current'); });
        root.classList.toggle('is-storm', !!data[i].storm);
        setCounters(i);
        root.dispatchEvent(new CustomEvent('journey:step', { bubbles: true, detail: { index: i, time: data[i].time } }));
      }
      function update() {
        raf = 0;
        var r = root.getBoundingClientRect();
        var p = clamp(-r.top / range(), 0, 1);
        var pos = p * (n - 1), k = Math.floor(pos), fr = pos - k;
        if (k >= n - 1) { k = n - 1; fr = 0; }
        var mix = smooth(.32, .68, fr);
        layers.forEach(function (l, j) { l.style.opacity = j <= k ? '1' : (j === k + 1 ? mix.toFixed(3) : '0'); });
        var sOn = (data[k].storm ? 1 - mix : 0) + (k + 1 < n && data[k + 1].storm ? mix : 0);
        storm.style.opacity = sOn.toFixed(3);
        var t = root.hasAttribute('data-clock-step') ? tm[Math.min(n - 1, Math.round(pos))] : (k + 1 < n ? tm[k] + (tm[k + 1] - tm[k]) * smooth(.15, .85, fr) : tm[k]);
        timeEl.textContent = root.hasAttribute('data-clock-step') ? data[Math.min(n - 1, Math.round(pos))].time : hhmm(t);
        var hr = ((t % 1440) + 1440) % 1440 / 60, night = hr < 6 || hr >= 20.5;
        if (night !== isNight) { isNight = night; skyEl.innerHTML = night ? ICON_MOON : ICON_SUN; clock.classList.toggle('is-night', night); }
        var pct = (n > 1 ? pos / (n - 1) : 0) * 100;
        fill.style.width = pct + '%'; knob.style.left = pct + '%';
        setActive(Math.min(n - 1, Math.round(pos)));
      }
      function onScroll() { if (!raf) raf = requestAnimationFrame(update); }
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', function () { onScroll(); if (active >= 0) layoutPins(groups[active], media); });
      update();
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (active >= 0) layoutPins(groups[active], media); });
      root.__kjrApi = { go: go, active: function () { return active; } };
    }
    root.setAttribute('data-kjr-id', id);
  }

  function init(scope) { (scope || document).querySelectorAll('[data-journey]').forEach(setup); }
  window.KitJourney = { init: init, go: function (el, i) { if (el.__kjrApi) el.__kjrApi.go(i); }, active: function (el) { return el.__kjrApi ? el.__kjrApi.active() : -1; } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { init(); });
  else init();
})();
