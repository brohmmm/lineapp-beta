/*! LineApp R2 kit · confetti.js · canvas confetti that really falls. Standalone, no dependencies.
 *  <button data-confetti>Going</button>                     bursts from the button on every click
 *  <button data-confetti="pressed" aria-pressed="false">     bursts only when the click leaves it aria-pressed="true"
 *  KitConfetti.burst(elementOrPoint, { count, angle, spread, power, colors, scalar })
 *  Physics: gravity, quadratic air drag that depends on how the paper faces the air, terminal velocity, a clump that disperses,
 *  paper flutter (flip on two axes via scale, spin on the third), side-slip while tilted. Reduced motion: a small check mark instead.
 */
(function (win, doc) {
  'use strict';
  if (win.KitConfetti) return;

  var DEFAULT_COLORS = ['#C7E635', '#C7E635', '#C7E635', '#FFFFFF', '#FFFFFF', '#FF8A3D', '#FFC83D', '#FF6F91'];
  var G = 1500;           // px/s², gravity
  var C1 = 1.4;           // 1/s, linear (viscous) drag
  var C2 = 0.026;         // 1/px, quadratic (form) drag  -> terminal speed around 200–300 px/s, varies with size and flutter
  var CLUMP = 0.5;        // s, the burst leaves as a clump that shields itself, then disperses into full drag

  var canvas = null, ctx = null, parts = [], raf = 0, last = 0, W = 0, H = 0, DPR = 1;
  var reduce = win.matchMedia ? win.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };

  function rand(a, b) { return a + Math.random() * (b - a); }
  function pick(arr) { return arr[(Math.random() * arr.length) | 0]; }
  function smooth(t) { t = t < 0 ? 0 : t > 1 ? 1 : t; return t * t * (3 - 2 * t); }

  function ensureCanvas() {
    if (canvas) return;
    canvas = doc.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    canvas.className = 'kit-confetti';
    canvas.style.cssText = 'position:fixed;left:0;top:0;width:100vw;height:100vh;pointer-events:none;z-index:2147483600;contain:strict';
    doc.body.appendChild(canvas);
    ctx = canvas.getContext('2d');
    size();
    win.addEventListener('resize', size);
  }
  function size() {
    if (!canvas) return;
    DPR = Math.min(2, win.devicePixelRatio || 1);
    W = doc.documentElement.clientWidth; H = win.innerHeight;
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
  }
  function teardown() {
    if (!canvas) return;
    win.removeEventListener('resize', size);
    if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
    canvas = ctx = null;
  }

  // shade a hex colour (k < 1 darker): the back of the paper and edge-on moments read darker
  var shadeCache = {};
  function shade(hex, k) {
    var key = hex + k;
    if (shadeCache[key]) return shadeCache[key];
    var n = parseInt(hex.slice(1), 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    return (shadeCache[key] = 'rgb(' + Math.round(r * k) + ',' + Math.round(g * k) + ',' + Math.round(b * k) + ')');
  }

  function origin(src) {
    if (!src) return { x: win.innerWidth / 2, y: win.innerHeight * 0.6 };
    if (typeof src.x === 'number' && typeof src.y === 'number' && !src.getBoundingClientRect) return src;
    var r = src.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height };
  }

  function burst(src, o) {
    o = o || {};
    var at = origin(src);
    if (reduce.matches) { check(at); return; }
    ensureCanvas();
    var phone = W < 640;
    var count = o.count || (phone ? 90 : 150);
    var colors = o.colors || DEFAULT_COLORS;
    var angle = (o.angle == null ? -90 : o.angle) * Math.PI / 180;
    var spread = (o.spread == null ? 64 : o.spread) * Math.PI / 180;
    var power = o.power || 1;
    var scalar = o.scalar || (phone ? 0.9 : 1);
    // launch speed scales with the viewport so the cloud rises about a third of the screen
    var vBase = Math.sqrt(H) * 60 * power;
    for (var i = 0; i < count; i++) {
      var kind = Math.random(), w, h, shape;
      if (kind < 0.62) { shape = 0; w = rand(7, 11); h = rand(10, 16); }        // paper rectangle
      else if (kind < 0.84) { shape = 0; w = rand(7, 10); h = w * rand(0.9, 1.1); } // square
      else if (kind < 0.94) { shape = 1; w = h = rand(5, 7.5); }                 // round sequin
      else { shape = 0; w = rand(3.5, 4.5); h = rand(18, 26); }                  // thin strip
      w *= scalar; h *= scalar;
      var a = angle + (Math.random() - 0.5) * spread * (0.6 + Math.random() * 0.4) * 1.2;
      var sp = vBase * (0.55 + Math.pow(Math.random(), 0.7) * 0.6);
      var area = w * h;
      parts.push({
        x: at.x + (Math.random() - 0.5) * Math.min(at.w || 0, 60) * 0.6,
        y: at.y + (Math.random() - 0.5) * Math.min(at.h || 0, 30) * 0.6,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
        w: w, h: h, shape: shape,
        // heavier pieces (bigger, sequins) fall a bit faster
        mass: (shape === 1 ? 1.35 : 1) * (0.85 + Math.min(area, 220) / 220 * 0.3),
        flip: Math.random() * 6.283, flipV: rand(5, 13) * (Math.random() < 0.5 ? -1 : 1),
        tilt: Math.random() * 6.283, tiltV: rand(1, 3.2) * (Math.random() < 0.5 ? -1 : 1),
        spin: Math.random() * 6.283, spinV: rand(1.2, 5) * (Math.random() < 0.5 ? -1 : 1),
        sway: Math.random() * 6.283, swayV: rand(2.6, 4.6), slip: rand(380, 760),
        cd: rand(0.8, 1.3), // each piece has its own drag, so the cloud spreads out as it falls
        color: pick(colors), age: 0, life: rand(9, 12), drift: rand(-12, 12)
      });
    }
    if (!raf) { last = 0; raf = win.requestAnimationFrame(tick); }
  }

  function step(p, dt) {
    p.age += dt;
    var speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
    var faceOn = Math.abs(Math.cos(p.flip)) * Math.abs(Math.cos(p.tilt)); // 1 = flat against the air, 0 = edge-on
    var k = (0.45 + 0.55 * faceOn) * (0.14 + 0.86 * smooth(p.age / CLUMP)) * (p.cd || 1) / p.mass;
    var drag = k * (C1 + C2 * speed);
    var ax = -p.vx * drag + p.drift;
    var ay = G - p.vy * drag;
    // falling paper swings side to side (the leaf glide), stronger while it lies flat; only once it is falling
    p.sway += p.swayV * dt;
    if (p.vy > 0 && p.shape === 0) ax += p.slip * Math.sin(p.sway) * (0.5 + 0.5 * faceOn) * Math.min(1, p.vy / 200);
    p.vx += ax * dt; p.vy += ay * dt;
    p.x += p.vx * dt; p.y += p.vy * dt;
    var spinBoost = 1 + Math.min(speed, 1600) / 900;
    p.flip += p.flipV * dt * spinBoost;
    p.tilt += p.tiltV * dt * spinBoost;
    p.spin += p.spinV * dt;
  }

  function tick(ts) {
    raf = 0;
    if (!ctx) return;
    var dt = last ? Math.min(0.033, (ts - last) / 1000) : 1 / 60;
    last = ts;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    var alive = [];
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i];
      step(p, dt);
      if (p.y > H + 40 || p.x < -80 || p.x > W + 80 || p.age > p.life) continue;
      alive.push(p);
      var sy = Math.cos(p.flip), sx = Math.cos(p.tilt);
      var front = sy * sx >= 0;
      var light = 0.62 + 0.38 * Math.abs(sy * sx);
      var fade = p.age > p.life - 0.6 ? Math.max(0, (p.life - p.age) / 0.6) : 1;
      var cs = Math.cos(p.spin), sn = Math.sin(p.spin);
      ctx.globalAlpha = fade;
      ctx.fillStyle = shade(p.color, front ? light : light * 0.78);
      // translate · rotate(spin) · scale(cos tilt, cos flip): three axes of a tumbling sheet, in one affine transform
      ctx.setTransform(cs * sx * DPR, sn * sx * DPR, -sn * sy * DPR, cs * sy * DPR, p.x * DPR, p.y * DPR);
      if (p.shape === 1) { ctx.beginPath(); ctx.arc(0, 0, p.w / 2, 0, 6.283); ctx.fill(); }
      else ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
    }
    ctx.globalAlpha = 1;
    parts = alive;
    if (parts.length) raf = win.requestAnimationFrame(tick);
    else { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, canvas.width, canvas.height); teardown(); }
  }

  /* reduced motion: a small lime check that fades in next to the element and fades away */
  function check(at) {
    var s = 30, el = doc.createElement('span');
    el.setAttribute('aria-hidden', 'true');
    el.style.cssText = 'position:fixed;z-index:2147483600;pointer-events:none;width:' + s + 'px;height:' + s + 'px;border-radius:50%;' +
      'background:#C7E635;color:#0B0C0E;display:grid;place-items:center;box-shadow:0 6px 18px rgba(0,0,0,.35);opacity:0;transition:opacity .18s ease;' +
      'left:' + Math.round(at.x + (at.w || 0) / 2 - s * 0.4) + 'px;top:' + Math.round(at.y - (at.h || 0) / 2 - s * 0.6) + 'px';
    el.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3.2 8.4l3.1 3 6.5-6.8"/></svg>';
    doc.body.appendChild(el);
    win.requestAnimationFrame(function () { el.style.opacity = '1'; });
    setTimeout(function () { el.style.opacity = '0'; }, 1100);
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 1400);
  }

  doc.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-confetti]');
    if (!t || t.disabled) return;
    var mode = t.getAttribute('data-confetti');
    var opts = {};
    if (t.hasAttribute('data-confetti-angle')) opts.angle = parseFloat(t.getAttribute('data-confetti-angle'));
    if (t.hasAttribute('data-confetti-spread')) opts.spread = parseFloat(t.getAttribute('data-confetti-spread'));
    if (t.hasAttribute('data-confetti-count')) opts.count = parseInt(t.getAttribute('data-confetti-count'), 10);
    if (t.hasAttribute('data-confetti-power')) opts.power = parseFloat(t.getAttribute('data-confetti-power'));
    if (t.hasAttribute('data-confetti-colors')) opts.colors = t.getAttribute('data-confetti-colors').split(/[\s,]+/).filter(Boolean);
    // let the page's own click handler flip aria-pressed first
    setTimeout(function () {
      if (mode === 'pressed' && t.getAttribute('aria-pressed') !== 'true') return;
      burst(t, opts);
    }, 0);
  });

  win.KitConfetti = {
    burst: burst,
    clear: function () { parts = []; if (raf) win.cancelAnimationFrame(raf); raf = 0; teardown(); },
    _step: step, _count: function () { return parts.length; }
  };
})(window, document);
