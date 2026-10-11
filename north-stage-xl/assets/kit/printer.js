/* LineApp R3 kit · printer.js — a receipt that really prints.
   When 40 % of the printer is in view, the paper feeds out of the slot line by line (about 3.6 s), with a soft sway and
   a slight curl. It pauses if the visitor scrolls away and carries on when they come back. Replay button afterwards.
   data-printer-dir="down" (default): the printer sits on top and the paper hangs down out of its slot (the R3 sponsor
   receipts have a straight top edge made for this). "up": the printer sits below and the paper rises, header first.
   <div class="kprn" data-printer data-printer-src="receipt.png" data-printer-alt="…">  or  <div class="kprn__receipt">HTML</div>
   Reduced motion: the receipt is already printed. No dependencies. */
(function () {
  'use strict';
  if (window.KitPrinter) return;
  var reduce = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };

  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function easeOut(k) { return 1 - Math.pow(1 - k, 2.4); }
  function easeInOut(k) { return k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; }

  function setup(root) {
    if (root.__kprn) return; root.__kprn = true;
    var dur = Math.max(2400, parseFloat(root.getAttribute('data-printer-duration') || '3600'));
    var lineH = parseFloat(root.getAttribute('data-printer-line') || '24');
    var label = root.getAttribute('data-printer-label');
    var replayText = root.getAttribute('data-printer-replay') || 'Print again';
    var src = root.getAttribute('data-printer-src');
    var receipt = root.querySelector('.kprn__receipt');
    var actions = root.querySelector('[data-printer-actions]');
    var down = (root.getAttribute('data-printer-dir') || 'down') !== 'up';
    var LEAN = down ? .35 : -.5;

    root.classList.add('kprn', down ? 'kprn--down' : 'kprn--up');
    var stage = el('div', 'kprn__stage');
    var out = el('div', 'kprn__out');
    var paper = el('div', 'kprn__paper');
    if (src) {
      var img = el('img', 'kprn__img');
      img.src = src; img.alt = root.getAttribute('data-printer-alt') || 'Receipt'; img.decoding = 'async';
      paper.appendChild(img);
    } else if (receipt) {
      paper.classList.add('kprn__paper--html');
      paper.appendChild(receipt);
    }
    // the free end curls a little: a darker copy of the paper, faded in from the free edge (follows torn edges and shadows)
    var curl = el('span', 'kprn__curl'); curl.setAttribute('aria-hidden', 'true');
    if (src) { var cimg = paper.querySelector('img').cloneNode(); cimg.alt = ''; cimg.className = 'kprn__curlimg'; curl.appendChild(cimg); paper.appendChild(curl); }
    else if (receipt) { if (getComputedStyle(receipt).position === 'static') receipt.style.position = 'relative'; receipt.appendChild(curl); }
    out.appendChild(paper);
    var body = el('div', 'kprn__body',
      '<span class="kprn__slot"></span><span class="kprn__cutter"></span>' +
      '<span class="kprn__face">' + (label ? '<span class="kprn__label">' + label.replace(/[<>&]/g, '') + '</span>' : '') +
      '<span class="kprn__led" aria-hidden="true"></span></span>');
    body.setAttribute('aria-hidden', 'true');
    stage.appendChild(out); stage.appendChild(body);
    root.insertBefore(stage, root.firstChild);

    var foot = el('div', 'kprn__foot');
    if (actions) { actions.classList.add('kprn__actions'); foot.appendChild(actions); }
    var replay = el('button', 'kprn__replay', '<svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M15.5 10a5.5 5.5 0 1 1-1.6-3.9" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M14.6 2.8v3.6h-3.6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg><span>' + replayText + '</span>');
    replay.type = 'button';
    foot.appendChild(replay);
    root.appendChild(foot);

    var H = 0, feed = 0, t = 0, state = 'idle', raf = 0, last = 0, inView = false, visible = 0, seed = Math.random() * 100;
    var settleT = 0;

    function measure() {
      var w = paper.getBoundingClientRect().width;
      if (src) { var im = paper.querySelector('img'); if (!im.naturalWidth) return false; H = Math.round(w * im.naturalHeight / im.naturalWidth); }
      else H = Math.ceil((receipt || paper).getBoundingClientRect().height);
      if (!H) return false;
      root.style.setProperty('--kprn-h', H + 'px');
      return true;
    }
    function render(sway, jx, jr) {
      var y = down ? feed - H : H - feed;
      paper.style.transform = 'translate3d(' + jx.toFixed(2) + 'px,' + y.toFixed(2) + 'px,0) rotate(' + (sway + jr).toFixed(3) + 'deg)';
      root.style.setProperty('--kprn-out', Math.min(1, feed / Math.max(1, H)).toFixed(3));
    }
    function frame(now) {
      var dt = Math.min(64, now - last); last = now;
      if (state === 'printing') {
        if (inView && !document.hidden) t += dt;
        var steps = Math.max(8, Math.round(H / lineH)), stepDur = dur / steps;
        var si = Math.floor(t / stepDur), fr = (t - si * stepDur) / stepDur;
        var moving = fr < .58;
        var mv = moving ? easeOut(fr / .58) : 1;
        feed = Math.min(H, (si + mv) * (H / steps));
        var outK = feed / H;
        var sway = Math.sin(now / 520 + seed) * .45 * outK;
        var jx = moving ? (Math.sin(now * .09 + seed) * .35) : 0, jr = moving ? Math.sin(now * .13) * .08 : 0;
        render(sway, jx, jr);
        root.classList.toggle('is-feeding', moving && inView);
        if (t >= dur) { state = 'settling'; settleT = 0; feed = H; root.classList.remove('is-feeding'); }
      } else if (state === 'settling') {
        settleT += dt;
        var k = Math.min(1, settleT / 1100);
        // a small damped swing that comes to rest with a slight lean
        var lean = LEAN * easeInOut(k) + Math.sin(settleT / 150) * .5 * (1 - k) * Math.exp(-settleT / 500);
        render(lean, 0, 0);
        if (k >= 1) { state = 'done'; finish(); return; }
      } else if (state === 'tearing') {
        settleT += dt;
        var q = Math.min(1, settleT / 320);
        paper.style.opacity = String(1 - q);
        paper.style.transform = 'translate3d(0,' + ((down ? 30 : -24) * easeOut(q)).toFixed(1) + 'px,0) rotate(' + (LEAN + (down ? 2 : -2) * q).toFixed(2) + 'deg)';
        if (q >= 1) { paper.style.opacity = ''; feed = 0; t = 0; render(0, 0, 0); state = 'printing'; root.classList.add('is-printing'); root.classList.remove('is-done'); }
      }
      raf = requestAnimationFrame(frame);
    }
    function finish() {
      raf = 0; root.classList.remove('is-printing'); root.classList.add('is-done'); root.removeAttribute('aria-busy');
      root.dispatchEvent(new CustomEvent('printer:done', { bubbles: true }));
    }
    function run() { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } }
    function start() {
      if (state !== 'idle' || !H) return;
      if (reduce.matches) { showStatic(); return; }
      state = 'printing'; t = 0; feed = 0; root.classList.add('is-printing'); root.setAttribute('aria-busy', 'true');
      root.dispatchEvent(new CustomEvent('printer:start', { bubbles: true }));
      run();
    }
    function showStatic() { feed = H; render(LEAN, 0, 0); state = 'done'; root.classList.add('is-done', 'is-static'); }
    function again() {
      if (!H) return;
      if (reduce.matches) { showStatic(); return; }
      cancelAnimationFrame(raf); raf = 0;
      if (state === 'idle') { start(); return; }
      state = 'tearing'; settleT = 0; root.setAttribute('aria-busy', 'true'); run();
    }
    replay.addEventListener('click', again);

    function ready() {
      if (!measure()) return;
      if (state === 'idle') { feed = 0; render(0, 0, 0); if (reduce.matches) showStatic(); else if (visible >= .4) start(); }
      else if (state === 'done') { feed = H; render(LEAN, 0, 0); }
    }
    if (src) { var im = paper.querySelector('img'); if (im.complete) ready(); else im.addEventListener('load', ready); }
    else { ready(); if (document.fonts && document.fonts.ready) document.fonts.ready.then(ready); }
    if ('ResizeObserver' in window) new ResizeObserver(function () { var h = H; if (measure() && h !== H) { if (state === 'done' || state === 'idle') { feed = state === 'done' ? H : 0; render(state === 'done' ? LEAN : 0, 0, 0); } } }).observe(paper);

    var startAt = parseFloat(root.getAttribute('data-printer-start') || '.4');
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          visible = e.intersectionRatio;
          inView = e.isIntersecting && e.intersectionRatio >= .1;
          if (e.intersectionRatio >= startAt) { if (state === 'idle') start(); }
        });
      }, { threshold: [0, .1, .15, .2, .3, .4, .5] }).observe(stage);
    } else { inView = true; visible = 1; setTimeout(start, 300); }

    root.__kprnApi = { replay: again, state: function () { return state; }, feed: function () { return feed / (H || 1); } };
  }

  function init(scope) { (scope || document).querySelectorAll('[data-printer]').forEach(setup); }
  window.KitPrinter = {
    init: init,
    replay: function (el) { if (el.__kprnApi) el.__kprnApi.replay(); },
    state: function (el) { return el.__kprnApi ? el.__kprnApi.state() : 'none'; },
    progress: function (el) { return el.__kprnApi ? el.__kprnApi.feed() : 0; }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { init(); });
  else init();
})();
