/*! LineApp R2 kit · marquee.js · slow continuous rows (reviews). Standalone, no dependencies.
 *  <section data-marquee-group data-marquee-name="reviews">
 *    <div class="kmq" data-marquee data-speed="30" data-direction="left"><ul class="kmq__track"><li>…</li></ul></div>
 *    <div class="kmq" data-marquee data-speed="24" data-direction="right"><ul class="kmq__track"><li>…</li></ul></div>
 *  </section>
 *  Pauses (easing to a stop) on hover, on keyboard focus inside, off-screen and in a hidden tab. A small pause/play button is added
 *  at the side of the group unless the group already has a [data-marquee-toggle] button. Reduced motion: a still, scrollable row.
 */
(function (win, doc) {
  'use strict';
  if (win.KitMarquee) return;
  var reduce = win.matchMedia ? win.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  var ICON_PAUSE = '<svg viewBox="0 0 12 12" fill="currentColor" aria-hidden="true"><rect x="2" y="1.5" width="2.6" height="9" rx=".8"/><rect x="7.4" y="1.5" width="2.6" height="9" rx=".8"/></svg>';
  var ICON_PLAY = '<svg viewBox="0 0 12 12" fill="currentColor" aria-hidden="true"><path d="M3 1.8v8.4c0 .5.5.8.9.5l6.5-4.2c.4-.3.4-.8 0-1L3.9 1.3c-.4-.3-.9 0-.9.5z"/></svg>';
  var groups = [];

  function Row(el, group) {
    this.el = el; this.group = group;
    this.track = el.querySelector('.kmq__track') || el.firstElementChild;
    this.speed = parseFloat(el.getAttribute('data-speed')) || 30; // px per second
    this.dir = el.getAttribute('data-direction') === 'right' ? -1 : 1;
    this.offset = 0; this.period = 0; this.factor = 1;
    this.originals = Array.prototype.slice.call(this.track.children);
    this.visible = true;
  }
  Row.prototype.clear = function () {
    var kids = Array.prototype.slice.call(this.track.children);
    for (var i = 0; i < kids.length; i++) if (kids[i].hasAttribute('data-kmq-clone')) this.track.removeChild(kids[i]);
    this.track.style.transform = '';
  };
  Row.prototype.measure = function () {
    if (!this.originals.length) return;
    this.clear();
    var first = this.originals[0];
    // one clone set gives the exact period (gap included)
    this.cloneSet();
    var clones = this.track.querySelectorAll('[data-kmq-clone]');
    this.period = clones[0].offsetLeft - first.offsetLeft;
    var need = Math.ceil((this.el.clientWidth + this.period) / Math.max(1, this.period));
    for (var k = 1; k < need; k++) this.cloneSet();
    this.offset = this.offset % (this.period || 1);
    this.paint();
  };
  Row.prototype.cloneSet = function () {
    for (var i = 0; i < this.originals.length; i++) {
      var c = this.originals[i].cloneNode(true);
      c.setAttribute('data-kmq-clone', ''); c.setAttribute('aria-hidden', 'true'); c.setAttribute('inert', '');
      if (c.id) c.removeAttribute('id');
      var ids = c.querySelectorAll('[id]'); for (var j = 0; j < ids.length; j++) ids[j].removeAttribute('id');
      this.track.appendChild(c);
    }
  };
  Row.prototype.paint = function () {
    if (!this.period) return;
    var x = this.dir > 0 ? -this.offset : -(this.period - this.offset);
    this.track.style.transform = 'translate3d(' + x.toFixed(2) + 'px,0,0)';
  };
  Row.prototype.advance = function (dt, target) {
    // ease the speed toward the target: a 0.35 s glide to a stop or back to speed, never a hard cut
    this.factor += (target - this.factor) * Math.min(1, dt / 0.35 * 2.2);
    if (Math.abs(this.factor - target) < 0.002) this.factor = target;
    if (!this.period || this.factor === 0) return;
    this.offset = (this.offset + this.speed * this.factor * dt) % this.period;
    this.paint();
  };

  function Group(el) {
    var self = this;
    this.el = el;
    this.rows = [];
    this.hover = false; this.focus = false; this.user = false; this.onscreen = true;
    var rows = el.hasAttribute('data-marquee') ? [el] : el.querySelectorAll('[data-marquee]');
    for (var i = 0; i < rows.length; i++) { rows[i]._kmq = true; this.rows.push(new Row(rows[i], this)); }
    var name = el.getAttribute('data-marquee-name') || (rows[0] && rows[0].getAttribute('data-marquee-name')) || 'moving row';

    // the toggle: page-provided or a small one at the side
    this.btn = el.querySelector('[data-marquee-toggle]');
    if (!this.btn) {
      var bar = doc.createElement('div'); bar.className = 'kmq-bar';
      this.btn = doc.createElement('button'); this.btn.type = 'button'; this.btn.className = 'kmq-toggle';
      bar.appendChild(this.btn);
      if (el.hasAttribute('data-marquee')) el.parentNode.insertBefore(bar, el.nextSibling); else el.appendChild(bar);
      this.bar = bar;
    }
    this.name = name;
    this.btn.addEventListener('click', function () { self.user = !self.user; self.sync(); });

    el.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') { self.hover = true; } });
    el.addEventListener('pointerleave', function () { self.hover = false; });
    el.addEventListener('focusin', function (e) { if (e.target !== self.btn) self.focus = true; });
    el.addEventListener('focusout', function () { setTimeout(function () { self.focus = el.contains(doc.activeElement) && doc.activeElement !== self.btn; }, 0); });
    if ('IntersectionObserver' in win) new IntersectionObserver(function (en) { self.onscreen = en[0].isIntersecting; if (self.onscreen) start(); }).observe(el);
    this.applyMode();
  }
  Group.prototype.applyMode = function () {
    var still = reduce.matches;
    this.el.classList.toggle('is-static', still);
    if (this.bar) this.bar.hidden = still;
    for (var i = 0; i < this.rows.length; i++) {
      var r = this.rows[i];
      r.el.classList.toggle('kmq--static', still);
      if (still) { r.clear(); r.el.setAttribute('tabindex', '0'); if (!r.el.hasAttribute('aria-label')) r.el.setAttribute('aria-label', this.name + ', scroll sideways'); }
      else { r.el.removeAttribute('tabindex'); r.measure(); }
    }
    this.sync();
  };
  Group.prototype.sync = function () {
    var paused = this.user;
    this.btn.innerHTML = paused ? ICON_PLAY : ICON_PAUSE;
    this.btn.setAttribute('aria-label', (paused ? 'Play ' : 'Pause ') + this.name);
    this.btn.setAttribute('title', paused ? 'Play' : 'Pause');
    this.el.classList.toggle('is-paused', paused);
    start();
  };
  Group.prototype.target = function () { return (this.user || this.hover || this.focus) ? 0 : 1; };

  var raf = 0, last = 0;
  function frame(ts) {
    raf = 0;
    var dt = last ? Math.min(0.05, (ts - last) / 1000) : 1 / 60;
    last = ts;
    var busy = false;
    for (var g = 0; g < groups.length; g++) {
      var G = groups[g];
      if (reduce.matches || !G.onscreen) continue;
      var t = G.target();
      for (var r = 0; r < G.rows.length; r++) { G.rows[r].advance(dt, t); if (t > 0 || G.rows[r].factor > 0) busy = true; }
    }
    if (busy && !doc.hidden) raf = win.requestAnimationFrame(frame); else last = 0;
  }
  function start() { if (!raf && !reduce.matches) { last = 0; raf = win.requestAnimationFrame(frame); } }

  function init() {
    var els = doc.querySelectorAll('[data-marquee-group], [data-marquee]');
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (el._kmq || el._kmqGroup) continue;
      if (el.hasAttribute('data-marquee') && el.closest('[data-marquee-group]')) continue;
      el._kmqGroup = new Group(el);
      groups.push(el._kmqGroup);
    }
    start();
  }
  function remeasure() { if (reduce.matches) return; groups.forEach(function (g) { g.rows.forEach(function (r) { r.measure(); }); }); }
  var rt = 0, lastW = win.innerWidth;
  win.addEventListener('resize', function () { if (win.innerWidth === lastW) return; lastW = win.innerWidth; clearTimeout(rt); rt = setTimeout(remeasure, 150); });
  doc.addEventListener('visibilitychange', start);
  if (reduce.addEventListener) reduce.addEventListener('change', function () { groups.forEach(function (g) { g.applyMode(); }); start(); });
  if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(remeasure);
  win.addEventListener('load', remeasure);

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', init); else init();
  win.KitMarquee = { init: init, remeasure: remeasure };
})(window, document);
