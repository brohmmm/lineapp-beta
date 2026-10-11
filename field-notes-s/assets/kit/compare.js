/*! LineApp R2 kit · compare.js · before/after slider ("Industry vs us"). Standalone, no dependencies.
 *  <div class="kcmp" data-compare data-label-a="Us" data-label-b="Industry">
 *    <div class="kcmp__a">… us …</div>        shown in full when the handle is all the way LEFT
 *    <div class="kcmp__b">… industry …</div>  shown in full when the handle is all the way RIGHT
 *  </div>
 *  Options: data-start="50" (handle position, % from left), data-step="5" (arrow-key step), data-hint="false" (no nudge on first view).
 *  Emits "compare:change" (detail.value = handle position 0–100).
 */
(function (win, doc) {
  'use strict';
  if (win.KitCompare) return;
  var reduce = win.matchMedia ? win.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  var CHEV = '<svg viewBox="0 0 26 26" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 8l-5 5 5 5M16 8l5 5-5 5"/></svg>';

  function clamp(v) { return Math.max(0, Math.min(100, v)); }

  function Compare(el) {
    var self = this;
    this.el = el;
    this.la = el.getAttribute('data-label-a') || 'Us';
    this.lb = el.getAttribute('data-label-b') || 'Industry';
    this.step = parseFloat(el.getAttribute('data-step')) || 5;
    this.touched = false;

    var lbB = doc.createElement('span'); lbB.className = 'kcmp__label kcmp__label--b'; lbB.textContent = this.lb; lbB.setAttribute('aria-hidden', 'true');
    var lbA = doc.createElement('span'); lbA.className = 'kcmp__label kcmp__label--a'; lbA.textContent = this.la; lbA.setAttribute('aria-hidden', 'true');
    var handle = doc.createElement('div'); handle.className = 'kcmp__handle';
    var knob = doc.createElement('div'); knob.className = 'kcmp__knob'; knob.innerHTML = CHEV;
    knob.setAttribute('role', 'slider'); knob.setAttribute('tabindex', '0');
    knob.setAttribute('aria-valuemin', '0'); knob.setAttribute('aria-valuemax', '100');
    knob.setAttribute('aria-orientation', 'horizontal');
    knob.setAttribute('aria-label', el.getAttribute('aria-label') || (this.lb + ' vs ' + this.la + '. Left shows ' + this.la + ', right shows ' + this.lb));
    handle.appendChild(knob);
    el.appendChild(lbB); el.appendChild(lbA); el.appendChild(handle);
    this.lbA = lbA; this.lbB = lbB; this.knob = knob;

    this.set(parseFloat(el.getAttribute('data-start')) || 50, 0);

    // pointer: press anywhere to move there, then drag
    var dragging = false, pid = null, raf = 0, pendingX = 0, startX = 0, moved = false, touch = false;
    function xToPos(x) { var r = el.getBoundingClientRect(); return clamp((x - r.left) / r.width * 100); }
    el.addEventListener('pointerdown', function (e) {
      if (e.button > 0) return;
      self.touched = true; self.stopTween();
      dragging = true; moved = false; pid = e.pointerId; startX = e.clientX;
      try { el.setPointerCapture(pid); } catch (err) {}
      el.classList.add('is-dragging');
      // a press on the knob grabs it in place; a press elsewhere glides there
      touch = e.pointerType === 'touch';
      if (!touch && !knob.contains(e.target)) self.set(xToPos(e.clientX), 320);
      if (e.pointerType === 'mouse') { e.preventDefault(); knob.focus({ preventScroll: true }); }
    });
    el.addEventListener('pointermove', function (e) {
      if (!dragging || e.pointerId !== pid) return;
      if (!moved && Math.abs(e.clientX - startX) < 3) return;
      moved = true; pendingX = e.clientX;
      if (!raf) raf = win.requestAnimationFrame(function () { raf = 0; self.set(xToPos(pendingX), 0); });
    });
    function end(e) {
      if (!dragging || (e && e.pointerId !== pid)) return;
      dragging = false; el.classList.remove('is-dragging');
      try { el.releasePointerCapture(pid); } catch (err) {}
      // a tap (touch) glides there; a release near an edge settles on the edge
      if (touch && !moved && e && e.type === 'pointerup' && !knob.contains(e.target)) self.set(xToPos(e.clientX), 320);
      if (moved) { if (self.value < 3) self.set(0, 220); else if (self.value > 97) self.set(100, 220); }
    }
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
    el.addEventListener('lostpointercapture', end);
    el.addEventListener('dragstart', function (e) { e.preventDefault(); });

    knob.addEventListener('keydown', function (e) {
      var v = self.value, n = null, big = self.step * 2;
      switch (e.key) {
        case 'ArrowLeft': case 'ArrowDown': n = v - (e.shiftKey ? big : self.step); break;
        case 'ArrowRight': case 'ArrowUp': n = v + (e.shiftKey ? big : self.step); break;
        case 'PageDown': n = v - 20; break;
        case 'PageUp': n = v + 20; break;
        case 'Home': n = 0; break;
        case 'End': n = 100; break;
      }
      if (n === null) return;
      e.preventDefault(); self.touched = true; self.stopTween();
      self.set(n, 200);
    });

    // first view: one gentle nudge so people see it moves
    if (el.getAttribute('data-hint') !== 'false' && 'IntersectionObserver' in win) {
      var io = new IntersectionObserver(function (en) {
        if (!en[0].isIntersecting) return;
        io.disconnect();
        if (!reduce.matches && !self.touched) setTimeout(function () { if (!self.touched) self.nudge(); }, 350);
      }, { threshold: 0.6 });
      io.observe(el);
    }
  }

  Compare.prototype.set = function (v, dur) {
    v = Math.round(clamp(v) * 10) / 10;
    this.el.style.setProperty('--kcmp-dur', (reduce.matches ? 0 : dur || 0) + 'ms');
    this.el.style.setProperty('--pos', v + '%');
    var changed = v !== this.value;
    this.value = v;
    var us = Math.round(100 - v), ind = Math.round(v), k = this.knob;
    k.setAttribute('aria-valuenow', String(Math.round(v)));
    k.setAttribute('aria-valuetext', ind <= 0 ? this.la + ' only' : us <= 0 ? this.lb + ' only' : this.la + ' ' + us + ' %, ' + this.lb + ' ' + ind + ' %');
    // a label fades out when its side is almost gone
    this.lbB.style.opacity = v < 14 ? '0' : '1';
    this.lbA.style.opacity = v > 86 ? '0' : '1';
    if (changed) {
      var ev;
      try { ev = new CustomEvent('compare:change', { bubbles: true, detail: { value: v } }); }
      catch (e) { ev = doc.createEvent('CustomEvent'); ev.initCustomEvent('compare:change', true, false, { value: v }); }
      this.el.dispatchEvent(ev);
    }
  };

  // JS tween for the hint (CSS transitions would chain awkwardly)
  Compare.prototype.nudge = function () {
    var self = this, s = this.value, keys = [[0, s], [520, s - 12], [1000, s + 6], [1400, s]], t0 = null;
    function ease(t) { return t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
    function frame(ts) {
      if (self.touched) return;
      if (t0 === null) t0 = ts;
      var t = ts - t0, i = 1;
      while (i < keys.length - 1 && t > keys[i][0]) i++;
      var a = keys[i - 1], b = keys[i], k = Math.min(1, (t - a[0]) / (b[0] - a[0]));
      self.set(a[1] + (b[1] - a[1]) * ease(k), 0);
      if (t < keys[keys.length - 1][0]) self.tween = win.requestAnimationFrame(frame);
    }
    this.tween = win.requestAnimationFrame(frame);
  };
  Compare.prototype.stopTween = function () { if (this.tween) win.cancelAnimationFrame(this.tween); this.tween = 0; };

  function init() {
    var els = doc.querySelectorAll('[data-compare]');
    for (var i = 0; i < els.length; i++) if (!els[i]._kcmp) els[i]._kcmp = new Compare(els[i]);
  }
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', init); else init();
  win.KitCompare = { init: init, set: function (el, v) { if (el && el._kcmp) el._kcmp.set(v, 320); } };
})(window, document);
