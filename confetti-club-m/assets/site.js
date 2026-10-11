/* Confetti Club · round 3 · M · page script (kit parts init themselves; this file is the page glue) */
(function () {
  'use strict';
  var doc = document, body = doc.body;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var easeIO = function (t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };
  var px = function (v) { return v.toFixed(2) + 'px'; };
  var fmtN = function (n) { return Math.round(n).toLocaleString('en-GB'); };
  var jobs = [], ticking = false;
  function onScroll(fn) { jobs.push(fn); }
  function run() { ticking = false; for (var i = 0; i < jobs.length; i++) jobs[i](); }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(run); } }, { passive: true });
  window.addEventListener('resize', function () { fitAll(); heroProfile(); confetti.resize(); run(); });
  function inView(el, fn, th) {
    if (!el) return;
    if (reduce || !('IntersectionObserver' in window)) { fn(el); return; }
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { fn(e.target); io.unobserve(e.target); } }); }, { threshold: th || .3 });
    io.observe(el);
  }

  /* ---------- menu (phones and tablets) ---------- */
  var menuBtn = $('#menuBtn'), menuLbl = $('#menuLbl');
  function setMenu(open) {
    body.classList.toggle('menu-open', open);
    menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    menuLbl.textContent = open ? 'Close' : 'Menu';
    if (window.KitHeader) { if (open) KitHeader.lock(); else KitHeader.unlock(); }
  }
  menuBtn.addEventListener('click', function () { setMenu(!body.classList.contains('menu-open')); });
  $$('#sheet a').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  doc.addEventListener('keydown', function (e) { if (e.key === 'Escape' && body.classList.contains('menu-open')) { setMenu(false); menuBtn.focus(); } });

  /* ---------- sticky CTA pill ---------- */
  var gen = $('#generate'), limeSecs = $$('.limeband'), headEl = $('.site-head');
  onScroll(function () {
    body.classList.toggle('head-hidden', headEl.classList.contains('is-hidden'));
    var vh = window.innerHeight, gr = gen.getBoundingClientRect();
    body.classList.toggle('cta-off', gr.top < vh * .85 && gr.bottom > 0);
    var on = false, mob = window.innerWidth < 760, yc = mob ? vh - 12 - 27 : 42;
    limeSecs.forEach(function (el) { var r = el.getBoundingClientRect(); if (r.top < yc && r.bottom > yc) on = true; });
    body.classList.toggle('on-lime', on);
  });

  /* ---------- fit 390-wide HTML screens into their boxes ---------- */
  function fitAll() {
    $$('.fit').forEach(function (f) { var w = f.parentNode.clientWidth; if (w) f.style.setProperty('--k', (w / 390).toFixed(4)); });
  }
  fitAll();

  /* =====================================================================
     CONFETTI · paper that tumbles: drag depends on how flat the piece is,
     the tumble pushes it sideways, so it flutters and glides as it falls.
     ===================================================================== */
  var confetti = (function () {
    var cv = $('#confetti'), ctx = cv.getContext('2d'), P = [], raf = 0, last = 0, W = 0, H = 0, dpr = 1, fade = 1, fadeOut = false;
    var COLS = [['#C7E635', '#93AB1F'], ['#FFFFFF', '#C9C9C2'], ['#F4E7D3', '#BFAF97'], ['#E3F58A', '#A9BC4C'], ['#C7E635', '#93AB1F']];
    function resize() { dpr = Math.min(2, window.devicePixelRatio || 1); W = window.innerWidth; H = window.innerHeight; cv.width = W * dpr; cv.height = H * dpr; }
    resize();
    function burst(x, y, opt) {
      if (reduce) return;
      opt = opt || {};
      var n = opt.count || 150, k = clamp(H / 900, .7, 1.25), spread = (opt.spread || 56) * Math.PI / 180, base = (opt.angle || -90) * Math.PI / 180;
      for (var i = 0; i < n; i++) {
        var a = base + (Math.random() - .5) * 2 * spread * Math.pow(Math.random(), .6);
        var v = (900 + Math.random() * 900) * k, c = COLS[(Math.random() * COLS.length) | 0];
        P.push({ x: x + (Math.random() - .5) * 30, y: y + (Math.random() - .5) * 10, vx: Math.cos(a) * v, vy: Math.sin(a) * v,
          w: 7 + Math.random() * 7, h: 4 + Math.random() * 4, sq: Math.random() < .22,
          th: Math.random() * 6.28, om: (Math.random() - .5) * 9, ph: Math.random() * 6.28, phs: (5 + Math.random() * 9) * (Math.random() < .5 ? -1 : 1),
          f: c[0], b: c[1], wind: (Math.random() - .5) * 40, life: 0 });
      }
      fade = 1; fadeOut = false;
      if (!raf) { last = performance.now(); raf = requestAnimationFrame(step); }
    }
    function step(t) {
      var dt = Math.min(.034, (t - last) / 1000); last = t;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
      var g = 420 * clamp(H / 900, .8, 1.2);
      fade = Math.max(0, fade - (fadeOut ? dt * 2.5 : 0));
      for (var i = P.length - 1; i >= 0; i--) {
        var p = P[i], cph = Math.cos(p.ph), area = .22 + .78 * Math.abs(cph), sp = Math.hypot(p.vx, p.vy);
        var drag = (1.9 * area + .0016 * sp);
        var ax = -drag * p.vx + .55 * Math.sin(2 * p.ph) * Math.abs(p.vy) + p.wind;
        var ay = g - drag * p.vy;
        p.vx += ax * dt; p.vy += ay * dt; p.x += p.vx * dt; p.y += p.vy * dt;
        p.ph += p.phs * dt * (.55 + .45 * Math.min(1, sp / 380)); p.th += p.om * dt; p.life += dt;
        if (p.y > H + 40 || p.life > 5) { P.splice(i, 1); continue; }
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.th); ctx.scale(1, cph);
        ctx.fillStyle = cph >= 0 ? p.f : p.b;
        ctx.globalAlpha = Math.min(fade, p.life > 3.8 ? Math.max(0, (5 - p.life) / 1.2) : 1);
        if (p.sq) ctx.fillRect(-p.h / 2, -p.h / 2, p.h, p.h); else ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
      if (P.length) raf = requestAnimationFrame(step); else { raf = 0; ctx.clearRect(0, 0, W, H); }
    }
    function from(el, opt) { var r = el.getBoundingClientRect(); burst(r.left + r.width / 2, r.top + r.height * .3, opt); }
    return { burst: burst, from: from, resize: resize, leave: function (on) { fadeOut = on; }, count: function () { return P.length; } };
  })();
  window.PageConfetti = confetti;

  /* =====================================================================
     01 HERO + KABUM · one pinned track, scroll-linked, works from the first scroll
     ===================================================================== */
  var hero = $('#top'), stage = $('#stage'), phone = $('#heroPhone'), goingPill = $('#goingPill'), bgclip = $('#bgclip');
  var pills = $$('.phone .apill'), beats = $$('#kab .beat'), bLock = $('#bLock'), bMap = $('#bMap');
  var DESK = { sw: 1440, sh: 900, fx0: 918, fy0: 96, ps0: 1, fh0: 740, fx1: 868, fy1: 62, ps1: .97, fh1: 790, hh1: 430, cy1: 318,
    cx: 96, cy: 168, cw: 760, h1: 100, pw: 560, pfs: 20, subgap: '28px', cue: 846,
    kx: 96, ky: 176, kw: 700, kh2: 70, kfs: 21, kgap: '40px', kbg: '22px',
    shade: 'linear-gradient(90deg, rgba(6,6,6,.94) 0, rgba(6,6,6,.62) 36%, rgba(6,6,6,0) 60%), linear-gradient(0deg, rgba(6,6,6,.85), rgba(6,6,6,0) 28%), linear-gradient(180deg, rgba(6,6,6,.55), rgba(6,6,6,0) 16%)' };
  var MOB = { sw: 390, sh: 844, ix: -1225, iy: 30, iw: 2000, ih: 1116, fx0: 35, fy0: 405, ps0: .82, fh0: 740, fx1: 86, fy1: 300, ps1: .556, fh1: 790, hh1: 430, cy1: 318,
    cx: 20, cy: 92, cw: 350, h1: 47, pw: 350, pfs: 15.5, subgap: '16px', cue: 800,
    kx: 20, ky: 82, kw: 350, kh2: 30, kfs: 15.5, kgap: '16px', kbg: '10px',
    shade: 'linear-gradient(180deg, #060606 0, #060606 4%, rgba(6,6,6,.82) 20%, rgba(6,6,6,.6) 40%, rgba(6,6,6,0) 56%), linear-gradient(0deg, rgba(6,6,6,.7), rgba(6,6,6,0) 22%)' };
  var P = DESK, mobH = false;
  function heroProfile() {
    var w = window.innerWidth, h = window.innerHeight, st = stage.style, s, q;
    mobH = w < 760;
    if (mobH) {
      s = w / 390; P = {}; for (q in MOB) P[q] = MOB[q];
      P.sh = Math.round(h / s);
      P.ps1 = clamp((P.sh - 96 - 268) / 790, .4, .6);
      P.fy1 = P.sh - 88 - 790 * P.ps1; P.fx1 = (390 - 390 * P.ps1) / 2;
      P.fh0 = clamp((P.sh - 82 - P.fy0) / P.ps0, 360, 740);
    } else {
      s = Math.min(w / 1440, h / 900);
      var sw = w / s, sh = h / s, dx = (sw - 1440) / 2, dy = (sh - 900) / 2;
      var axp = 1113 + dx, ayp = 311 + dy;
      var k = Math.max(0.92, axp / 1420, (sw - axp) / 580, ayp / 440, (sh - ayp) / 676) * 1.002;
      P = {}; for (q in DESK) P[q] = DESK[q];
      P.sw = sw; P.sh = sh;
      P.ix = axp - 1420 * k; P.iy = ayp - 440 * k; P.iw = 2000 * k; P.ih = 1116 * k;
      ['fx0', 'fx1', 'cx', 'kx'].forEach(function (n) { P[n] = DESK[n] + dx; });
      ['fy0', 'fy1', 'cy', 'cue', 'ky'].forEach(function (n) { P[n] = DESK[n] + dy; });
    }
    /* Going / Maybe / Skip: 26 px from the frame side and well above the bottom of the first frame */
    P.cy0 = P.fh0 - 200;
    var set = { '--sw': P.sw + 'px', '--sh': P.sh + 'px', '--ix': P.ix + 'px', '--iy': P.iy + 'px', '--iw': P.iw + 'px', '--ih': P.ih + 'px',
      '--cx': P.cx + 'px', '--cy0': P.cy + 'px', '--cw': P.cw + 'px', '--h1': P.h1 + 'px', '--pw': P.pw + 'px', '--pfs': P.pfs + 'px', '--sub-gap': P.subgap,
      '--cue-y': P.cue + 'px', '--kx': P.kx + 'px', '--ky': P.ky + 'px', '--kw': P.kw + 'px', '--kh2': P.kh2 + 'px', '--kfs': P.kfs + 'px', '--kgap': P.kgap, '--kbg': P.kbg,
      '--shade': P.shade, '--s': s.toFixed(4) };
    for (var k2 in set) st.setProperty(k2, set[k2]);
    stage.classList.toggle('is-mob', mobH);
  }
  var fired = false, userTouched = false, lastY = window.scrollY;
  function setGoing(on) { pills.forEach(function (b) { b.setAttribute('aria-pressed', b === goingPill && on ? 'true' : 'false'); }); }
  pills.forEach(function (b) {
    b.addEventListener('click', function () {
      var wasOn = b.getAttribute('aria-pressed') === 'true';
      userTouched = true; goingPill.classList.remove('hint');
      var on = !wasOn;
      pills.forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      if (b === goingPill && on) confetti.from(goingPill, { count: 170 });
    });
  });
  function finalVisible() { var fr = gen.getBoundingClientRect(); return fr.top < window.innerHeight && fr.bottom > 0; }
  function seg(p, a, b) { return clamp((p - a) / (b - a), 0, 1); }
  /* Timeline (p = 0..1 over the pinned track):
     0 → .30 the photo's clip closes onto the frame · .06 → .18 headline leaves · .26 → .38 the frame becomes the artist screen
     .42 Going switches on and confetti flies once · .44 → .50 kabum copy · beats .50 / .66 / .82 (lock screen · map · artist screen) */
  var B0 = .50, B1 = .66, B2 = .82;
  function heroUpdate() {
    var vh = window.innerHeight, r = hero.getBoundingClientRect();
    var total = Math.max(1, hero.offsetHeight - vh);
    var p = reduce ? 0 : clamp(-r.top / total, 0, 1);
    var mc = easeIO(seg(p, 0, .30));
    var c = mobH ? seg(p, .03, .13) : seg(p, .06, .18);
    var e = seg(p, .26, .38), ee = easeIO(e);
    var e2 = seg(p, .33, .42), tab = seg(p, .31, .41);
    var fx = lerp(P.fx0, P.fx1, mc), fy = lerp(P.fy0, P.fy1, mc), ps = lerp(P.ps0, P.ps1, mc);
    var fh = lerp(P.fh0, P.fh1, mc), hh = lerp(fh, P.hh1, ee);
    var st = stage.style, fw = 390 * ps, fhh = fh * ps;
    var t = fy * mc, l = fx * mc, rr = Math.max(0, P.sw - fx - fw) * mc, bb = Math.max(0, P.sh - fy - fhh) * mc;
    bgclip.style.clipPath = 'inset(' + t.toFixed(1) + 'px ' + rr.toFixed(1) + 'px ' + bb.toFixed(1) + 'px ' + l.toFixed(1) + 'px round ' + (48 * ps * mc).toFixed(1) + 'px)';
    st.setProperty('--ghost-op', (.3 * (1 - seg(p, 0, .3))).toFixed(3));
    st.setProperty('--bg-op', (1 - seg(p, .27, .30)).toFixed(3));
    st.setProperty('--shade-op', (1 - seg(p, 0, .24)).toFixed(3));
    st.setProperty('--copy-op', (1 - c).toFixed(3));
    st.setProperty('--copy-pe', c > .5 ? 'none' : 'auto');
    st.setProperty('--copy-lift', px(-60 * c));
    var kop = seg(p, .44, .50);
    st.setProperty('--k-op', kop.toFixed(3));
    var ph = phone.style;
    ph.setProperty('--fx', px(fx)); ph.setProperty('--fy', px(fy)); ph.setProperty('--ps', ps.toFixed(4)); ph.setProperty('--fh', px(fh));
    var sc = mobH ? .68 : .75;
    var ax = (P.ix - fx) / ps, ay = (P.iy - fy) / ps, aw = P.iw / ps, ah = P.ih / ps;
    var tw = 2000 * sc, th = 1116 * sc, tx = 205 - 1400 * sc, ty = 190 - 420 * sc;
    ph.setProperty('--wx', px(lerp(ax, tx, ee))); ph.setProperty('--wy', px(lerp(ay, ty, ee)));
    ph.setProperty('--ww', px(lerp(aw, tw, ee))); ph.setProperty('--wh', px(lerp(ah, th, ee)));
    ph.setProperty('--wf-top', px(lerp(fh - 260, P.hh1 - 230, ee)));
    ph.setProperty('--wf-len', px(lerp(260, 240, ee)));
    ph.setProperty('--cy', px(lerp(P.cy0, P.cy1, ee)));
    ph.setProperty('--e', e.toFixed(3)); ph.setProperty('--e2', e2.toFixed(3)); ph.setProperty('--tab-op', tab.toFixed(3));
    phone.classList.toggle('app', e > .98);
    /* beats */
    var lo = seg(p, B0, B0 + .018) * (1 - seg(p, B1 - .009, B1 + .009));
    var mo = seg(p, B1 - .009, B1 + .009) * (1 - seg(p, B2 - .009, B2 + .009));
    bLock.classList.toggle('vis', p >= B0 && p < B1);
    bMap.classList.toggle('vis', p >= B1 && p < B2);
    var cur = p < B0 ? -1 : (p < B1 ? 0 : (p < B2 ? 1 : 2)), bounds = [B0, B1, B2, 1];
    beats.forEach(function (b, i) {
      var on = i === cur;
      b.classList.toggle('on', i === cur);
      b.classList.toggle('show', on);
      b.style.setProperty('--on', i === cur ? '1' : '0');
      b.style.setProperty('--bp', (i < cur ? 1 : (i === cur ? seg(p, bounds[i], bounds[i + 1]) : 0)).toFixed(3));
    });
    /* Going: scroll switches it on when the artist screen is complete; the confetti flies once per pass, from the pill */
    var dy = Math.abs(window.scrollY - lastY); lastY = window.scrollY;
    if (!userTouched && p >= .38 && !fired && !reduce) { fired = true; goingPill.classList.add('hint'); setTimeout(function () { goingPill.classList.remove('hint'); }, 3400); }
    confetti.leave(r.bottom < vh * .7 && r.bottom > -vh * 3 && !finalVisible());
    body.classList.toggle('cta-on', mobH || (reduce ? r.bottom < vh * .35 : (c > .65 || r.bottom < 0)));
  }
  heroProfile();
  onScroll(heroUpdate);

  /* reduced motion: the three kabum screens as stills */
  if (reduce) {
    var ks = $('#ksGrid');
    var items = [
      { t: '22:41', p: 'Nadia Rook moves to 23:30. Your plan moved with her.', el: bLock },
      { t: '22:42', p: 'Fifteen spare minutes. The Forest Stage bar has a 3-minute queue. Your crew is already there.', el: bMap },
      { t: '23:30', p: 'Phone away. Front left, all six of you.', el: null }
    ];
    items.forEach(function (it) {
      var fig = doc.createElement('figure'); fig.className = 'ks';
      var dev = doc.createElement('div'); dev.className = 'dev'; dev.style.setProperty('--dw', '240px');
      var scr = doc.createElement('div'); scr.className = 'scr';
      var fit = doc.createElement('div'); fit.className = 'fit';
      var box = doc.createElement('div'); box.className = 'phone-still'; box.style.cssText = 'position:relative;width:390px;height:844px;overflow:hidden';
      if (it.el) { var cl = it.el.cloneNode(true); cl.removeAttribute('id'); cl.classList.add('vis'); cl.style.setProperty('--o', '1'); box.appendChild(cl); }
      else box.innerHTML = '<div class="artist-still"><div class="as-ph"></div><div class="as-tx"><div class="np"><i class="live-dot"></i>PLAYING NOW · MAIN STAGE</div><div class="an">Nadia Rook</div><div class="tm"><b>23:30</b> live now · until 00:45</div><div class="as-pills"><span class="on">Going</span><span>Maybe</span><span>Skip</span></div><div class="as-crew">Your crew: all six, front left</div></div></div>';
      fit.appendChild(box); scr.appendChild(fit); dev.appendChild(scr); fig.appendChild(dev);
      var cap = doc.createElement('figcaption'); cap.innerHTML = '<span class="t">' + it.t + '</span><p>' + it.p + '</p>'; fig.appendChild(cap);
      ks.appendChild(fig);
    });
    fitAll();
  }

  /* ---------- reveal ---------- */
  var io = 'IntersectionObserver' in window && !reduce ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: .12, rootMargin: '0px 0px -6% 0px' }) : null;
  $$('.rv').forEach(function (el) { if (io) io.observe(el); else el.classList.add('in'); });

  /* ---------- count-up (once, on enter) ---------- */
  function countUp(el) {
    var to = +el.getAttribute('data-count'); if (!to || reduce) return;
    var small = el.querySelector('small'), tail = small ? small.outerHTML : '';
    var t0 = null, dur = 1100;
    function step(ts) { if (!t0) t0 = ts; var k = clamp((ts - t0) / dur, 0, 1); k = 1 - Math.pow(1 - k, 3); el.innerHTML = fmtN(to * k) + tail; if (k < 1) requestAnimationFrame(step); }
    requestAnimationFrame(step);
  }

  /* ---------- 03 claim: six words, fast, then it lands on "a blurry PDF" and gets circled ---------- */
  (function () {
    var rot = $('#rot'); if (!rot) return;
    var words = $$('span:not(.circ)', rot), circ = $('.circ', rot), i = 0, timer = null, vis = false, hold = null;
    function show(j) { words.forEach(function (w, k) { w.classList.toggle('on', k === j); w.classList.toggle('out', k === i && k !== j); }); i = j; }
    function fitCirc() { var w = words[0].offsetWidth; circ.style.width = 'calc(' + w + 'px + .42em)'; circ.style.right = 'auto'; }
    function land() { fitCirc(); rot.classList.add('landed'); hold = setTimeout(function () { if (vis) cycle(); }, 5200); }
    function cycle() {
      clearTimeout(hold); rot.classList.remove('landed');
      var seq = [1, 2, 3, 4, 5, 0], k = 0;
      clearInterval(timer);
      timer = setInterval(function () {
        show(seq[k]); k++;
        if (k >= seq.length) { clearInterval(timer); timer = null; setTimeout(land, 320); }
      }, 880);
    }
    if (reduce) { show(0); fitCirc(); rot.classList.add('landed'); return; }
    fitCirc();
    new IntersectionObserver(function (es) {
      vis = es[0].isIntersecting;
      if (vis && !timer && !rot.classList.contains('landed')) cycle();
      if (!vis) { clearInterval(timer); timer = null; clearTimeout(hold); }
      if (vis && rot.classList.contains('landed') && !hold) hold = setTimeout(function () { if (vis) cycle(); }, 3000);
    }, { threshold: .5 }).observe(rot);
    window.addEventListener('resize', fitCirc);
  })();

  /* ---------- 04 the green column ---------- */
  inView($('#xlSheet'), function (el) { el.classList.add('in'); }, .5);

  /* ---------- 05 calculator: what the ticked package does for the app ---------- */
  (function () {
    var calc = $('#calc'), paid = $('#paid'), say = $('#paidSay'), bar = $('.tr i', paid), APP = 10000, FULL = 20000, tmr = 0;
    if (!calc) return;
    function money(n) { return '£' + fmtN(n); }
    function render(t, n) {
      bar.style.setProperty('--w', clamp(t / FULL * 100, 0, 100).toFixed(1) + '%');
      var s;
      if (!n) s = 'Nothing ticked yet. Start with the tab bar: it\'s on every screen.';
      else if (t < APP) s = 'Package <b>' + money(t) + '</b> · ' + money(APP - t) + ' short of paying for your app.';
      else if (t === APP) s = 'Package <b>' + money(t) + '</b> · your app is paid for.';
      else if (t < FULL) s = 'Package <b>' + money(t) + '</b> · your app is paid for · <b>' + money(t - APP) + '</b> stays with you.';
      else s = 'Package <b>' + money(t) + '</b> · your app is paid for · <b>' + money(t - APP) + '</b> stays with you. The same again.';
      say.innerHTML = s;
      say.setAttribute('aria-label', s.replace(/<[^>]+>/g, '') + (t ? ' The app costs £10,000; sponsor money pays for it first, and anything above £10,000 stays with your festival.' : ''));
      paid.classList.toggle('all', t >= FULL);
    }
    var rP = $('#rPeople'), rT = $('#rTimes'), extra = $('#calcExtra'), DATA = [];
    try { DATA = JSON.parse($('script[type="application/json"]', calc).textContent).M; } catch (err) { DATA = []; }
    function reach(ids) {
      var ppl = 0, times = 0;
      DATA.forEach(function (it) { if (ids.indexOf(it.id) > -1) { ppl = Math.max(ppl, it.people); times += it.impressions; } });
      rP.textContent = fmtN(ppl); rT.textContent = fmtN(times);
    }
    calc.addEventListener('calc:change', function (e) {
      var d = e.detail, n = d.selected.length;
      clearTimeout(tmr); tmr = setTimeout(function () { render(d.total, n); reach(d.selected); }, 120);
      var kl = $('.kcalc__live', calc); if (kl && kl.parentNode) kl.parentNode.removeChild(kl);
    });
    function place() { var sum = $('.kcalc__totals', calc), wide = window.innerWidth > 860; if (wide && sum && extra.parentNode !== sum) sum.appendChild(extra); if (!wide && extra.parentNode !== calc.parentNode) calc.parentNode.insertBefore(extra, calc.nextSibling); }
    window.addEventListener('resize', place);
    doc.addEventListener('DOMContentLoaded', function () { setTimeout(place, 0); });
    setTimeout(place, 120);
    render(6000, 1);
  })();

  var calcEl = $('#calc'), jrEl = $('#journey');
  onScroll(function () { if (!jrEl) return; var r = jrEl.getBoundingClientRect(); body.classList.toggle('in-journey', window.innerWidth <= 760 && r.top < window.innerHeight * .5 && r.bottom > window.innerHeight * .5); });
  onScroll(function () { if (!calcEl) return; var r = calcEl.getBoundingClientRect(); body.classList.toggle('in-calc', window.innerWidth <= 860 && r.top < window.innerHeight * .9 && r.bottom > window.innerHeight * .3); });

  /* honest maths: the till starts printing as soon as the whole printer is on screen, so the column is never empty for long */
  (function () { var pr = $('#printer'); if (!pr || reduce || !('IntersectionObserver' in window)) return; var started = false;
    function tryStart() { if (started) return; var hs = pr.querySelector('.kprn__body, .kprn__printer, .kprn__head') || pr; var r = hs.getBoundingClientRect(); if (r.top < window.innerHeight * .75 && r.bottom > 0 && window.KitPrinter && KitPrinter.state(pr) === 'idle') { started = true; KitPrinter.replay(pr); } }
    onScroll(tryStart); })();

  /* ---------- 06 the zone: slow zoom with scroll, facts count up ---------- */
  var zoneWrap = $('#zoneWrap'), zoomer = $('#zoomer');
  onScroll(function () {
    if (reduce || !zoneWrap) return;
    var r = zoneWrap.getBoundingClientRect(), vh = window.innerHeight;
    var k = clamp((vh - r.top) / (vh + r.height), 0, 1);
    zoomer.style.setProperty('--cz', (1 + .1 * easeIO(k)).toFixed(4));
  });
  inView($('#facts'), function (f) { f.classList.add('in'); $$('[data-count]', f).forEach(countUp); }, .3);

  /* ---------- 07 SBM case: empty zone → one push → about 1,000 people in 3 minutes ---------- */
  (function () {
    var box = $('#zonebox'); if (!box) return;
    var cv = $('#zoneDots') || doc.createElement('canvas'), ctx = cv.getContext('2d'), nEl = $('#zoneN'), clk = $('#zoneClock'), line = $('#zoneLine');
    var dots = [], running = false, done = false, W = 0, H = 0, dpr = 1;
    var len = line.getTotalLength ? line.getTotalLength() : 700;
    line.style.strokeDasharray = len; line.style.strokeDashoffset = len;
    function seed() {
      dots = [];
      var rs = 7; for (var i = 0; i < 200; i++) {
        var u = (i * 0.618034) % 1, v = ((i * 0.381966 * 7) % 1);
        var tx = .08 + u * .84, ty = .62 + Math.pow(v, .8) * .34 + (Math.sin(i * 12.9898) * .02);
        var side = i % 3, sx = side === 0 ? -.05 : (side === 1 ? 1.05 : u), sy = side === 2 ? 1.08 : .7 + v * .3;
        dots.push({ tx: tx, ty: ty, sx: sx, sy: sy, d: i < 12 ? -1 : (i / 200) * .8 + ((i * 37) % 17) / 100, s: 3 + ((i * rs) % 3) });
      }
    }
    function size() { dpr = Math.min(2, window.devicePixelRatio || 1); W = box.clientWidth; H = box.clientHeight; cv.width = W * dpr; cv.height = H * dpr; draw(done ? 1 : 0); }
    function draw(k) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
      dots.forEach(function (d) {
        var a = d.d < 0 ? 1 : clamp((k - d.d) / .25, 0, 1); if (a <= 0) return;
        var e = 1 - Math.pow(1 - a, 3), x = lerp(d.sx, d.tx, d.d < 0 ? 1 : e) * W, y = lerp(d.sy, d.ty, d.d < 0 ? 1 : e) * H;
        ctx.globalAlpha = d.d < 0 ? .9 : .4 + .5 * e; ctx.fillStyle = d.d < 0 ? '#fff' : '#C7E635';
        ctx.beginPath(); ctx.arc(x, y, d.s * (W / 700), 0, 6.283); ctx.fill();
      });
      ctx.globalAlpha = 1;
    }
    function set(k) {
      var ke = 1 - Math.pow(1 - k, 2.2), n = Math.round(60 + (1000 - 60) * ke);
      nEl.textContent = fmtN(n);
      var sec = Math.round(k * 180), mm = Math.floor(sec / 60), ss = sec % 60;
      clk.textContent = mm + ':' + (ss < 10 ? '0' : '') + ss + ' after the push';
      box.style.setProperty('--full', (ke * .85).toFixed(3));
      line.style.strokeDashoffset = (len * (1 - k)).toFixed(1);
      draw(k);
    }
    function play() {
      if (running) return; running = true; done = false; box.classList.add('sent');
      var t0 = 0, dur = 3600;
      requestAnimationFrame(function f(t) { if (!t0) t0 = t + 500; var k = clamp((t - t0) / dur, 0, 1); set(k); if (k < 1) requestAnimationFrame(f); else { running = false; done = true; } });
    }
    seed(); size();
    window.addEventListener('resize', size);
    if (reduce) { box.classList.add('sent'); done = true; set(1); return; }
    set(0);
    inView(box, play, .55);
    box.addEventListener('click', function () { if (!running) { set(0); box.classList.remove('sent'); setTimeout(play, 60); } });
  })();

  /* ---------- 11 data panel: pictures for the tiles ---------- */
  (function () {
    var lk = $('#lockers'); if (lk) {
      var s = '', i = 0, filled = 17;
      for (var r = 0; r < 4; r++) for (var c = 0; c < 5; c++) {
        var x = 8 + c * 20, y = 10 + r * 24;
        s += '<rect x="' + x + '" y="' + y + '" width="17" height="21" rx="3" class="' + (i < filled ? 'f' : '') + '" style="--i:' + i + '"/><circle cx="' + (x + 13) + '" cy="' + (y + 11) + '" r="1.6"/>';
        i++;
      }
      lk.innerHTML = s;
    }
    var gd = $('#gateDots'); if (gd) {
      var g = '';
      for (var k = 0; k < 46; k++) { var a = (k * 2.39996), rr = 5 + Math.sqrt(k) * 4.2; g += '<circle class="in-dot" cx="' + (56 + Math.cos(a) * rr * .9).toFixed(1) + '" cy="' + (60 + Math.sin(a) * rr * .55).toFixed(1) + '" r="2.1"/>'; }
      for (var m = 0; m < 9; m++) g += '<circle class="out-dot" cx="' + (8 + (m % 3) * 7 + (m > 5 ? 84 : 0)).toFixed(1) + '" cy="' + (98 - Math.floor(m / 3) * 7 + (m > 5 ? 14 : 0)).toFixed(1) + '" r="2.1"/>';
      gd.innerHTML = g;
    }
    inView($('#panel'), function (el) { el.classList.add('in'); $$('[data-count]', el).forEach(countUp); }, .25);
  })();

  /* ---------- videos: load near the viewport, play only while visible, muted and inline ---------- */
  (function () {
    var vids = $$('video[data-lazyvid]').filter(function (v) { return !v.closest('#cmp'); });
    function load(v) { if (v.__ld) return; v.__ld = true; $$('source', v).forEach(function (s) { s.src = s.getAttribute('data-src'); }); v.load(); }
    if (!('IntersectionObserver' in window)) { vids.forEach(load); return; }
    var near = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { load(e.target); near.unobserve(e.target); } }); }, { rootMargin: '400px 0px' });
    var vis = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        var v = e.target;
        if (e.isIntersecting && !reduce) { load(v); var pr = v.play(); if (pr && pr.catch) pr.catch(function () {}); }
        else v.pause();
      });
    }, { threshold: .3 });
    vids.forEach(function (v) {
      v.muted = true; v.setAttribute('muted', ''); near.observe(v); vis.observe(v);
      if (reduce) { v.parentNode.addEventListener('click', function () { load(v); if (v.paused) { var pr = v.play(); if (pr && pr.catch) pr.catch(function () {}); } else v.pause(); }); }
    });
    doc.addEventListener('visibilitychange', function () { if (doc.hidden) vids.forEach(function (v) { v.pause(); }); });
  })();

  /* ---------- 16 compare: knob stays inside, phones never rest half-way ---------- */
  (function () {
    var cmp = $('#cmp'); if (!cmp) return;
    function knobClamp() {
      var k = cmp.querySelector('.kcmp__knob'); if (!k) return;
      var W = cmp.clientWidth, pv = cmp.style.getPropertyValue('--pos'), v = pv === '' ? 50 : parseFloat(pv), x = W * v / 100, m = 32;
      k.style.setProperty('--kshift', (x < m ? m - x : (x > W - m ? W - m - x : 0)).toFixed(1) + 'px');
    }
    if ('MutationObserver' in window) new MutationObserver(knobClamp).observe(cmp, { attributes: true, attributeFilter: ['style'] });
    window.addEventListener('resize', knobClamp); setTimeout(knobClamp, 600);
    function settle() {
      return;
      setTimeout(function () { var v = parseFloat(cmp.style.getPropertyValue('--pos')); if (isNaN(v) || v === 0 || v === 100) return; KitCompare.set(cmp, v < 50 ? 0 : 100); }, 380);
    }
    ['pointerup', 'touchend', 'keyup'].forEach(function (t) { cmp.addEventListener(t, settle); });
    setTimeout(settle, 900);
  })();

  doc.addEventListener('DOMContentLoaded', function () { setTimeout(function () { var ob = $('#orbit'); if (window.KitOrbit && ob) KitOrbit.select(ob, 7); }, 200); });
  (function () {
    var cmp = $('#cmp'); if (!cmp || !('IntersectionObserver' in window) || reduce) return;
    new IntersectionObserver(function (es) { var on = es[0].isIntersecting; $$('video', cmp).forEach(function (v) { if (on) { if (!v.__ld) { v.__ld = true; $$('source', v).forEach(function (s) { s.src = s.getAttribute('data-src'); }); v.load(); } var pr = v.play(); if (pr && pr.catch) pr.catch(function () {}); } else v.pause(); }); }, { threshold: .15 }).observe(cmp);
  })();

  /* ---------- accordions (page and overlays) ---------- */
  doc.addEventListener('click', function (e) {
    var b = e.target.closest('.acc .q > button'); if (!b) return;
    var q = b.parentNode, open = !q.classList.contains('open');
    q.classList.toggle('open', open); b.setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  /* ---------- 17 FAQ tabs ---------- */
  var ftabs = $$('#faqTabs button');
  function fSel(i, focus) {
    ftabs.forEach(function (b, j) {
      var on = j === i; b.setAttribute('aria-selected', on ? 'true' : 'false'); b.tabIndex = on ? 0 : -1;
      doc.getElementById(b.getAttribute('aria-controls')).hidden = !on;
    });
    if (focus) ftabs[i].focus();
  }
  ftabs.forEach(function (b, j) {
    b.addEventListener('click', function () { fSel(j); });
    b.addEventListener('keydown', function (e) {
      var n = null;
      if (e.key === 'ArrowRight') n = (j + 1) % ftabs.length; else if (e.key === 'ArrowLeft') n = (j - 1 + ftabs.length) % ftabs.length; else if (e.key === 'Home') n = 0; else if (e.key === 'End') n = ftabs.length - 1;
      if (n !== null) { e.preventDefault(); fSel(n, true); }
    });
  });

  /* ---------- 18 mascot: hop and blink ---------- */
  var masc = $('#mascot'), mframes = ['down', 'up', 'down', 'down', 'blink', 'down'], mi = 0;
  if (!reduce && masc) setInterval(function () { if (doc.hidden) return; mi = (mi + 1) % mframes.length; masc.src = 'assets/team/claude-code-mascot-' + mframes[mi] + '.svg'; }, 520);

  /* ---------- 19 form: live home screen, countdown, sponsor ---------- */
  var f = $('#genForm'), fName = $('#fName'), fMail = $('#fMail'), fFrom = $('#fFrom'), fTo = $('#fTo'), fGuests = $('#fGuests');
  var fSpon = $('#fSpon'), more = $('#sponMore'), fN = $('#fSponN'), fC = $('#fSponC');
  var pvMono = $('#pvMono'), pvDates = $('#pvDates'), pvPartner = $('#pvPartner'), pvCat = $('#pvCat'), pvGuests = $('#pvGuests');
  function initials(s) { var w = s.trim().split(/\s+/).filter(Boolean); if (!w.length) return 'YF'; return (w[0][0] + (w[1] ? w[1][0] : (w[0][1] || ''))).toUpperCase(); }
  var DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function fmtD(v) { var d = new Date(v + 'T12:00:00'); return isNaN(d) ? '' : DAYS[d.getDay()] + ' ' + d.getDate() + ' ' + MON[d.getMonth()]; }
  function preview() {
    var n = fName.value.trim();
    $$('.pv-name').forEach(function (x) { x.textContent = n || 'Your festival'; });
    var ini = initials(n);
    if (pvMono.textContent !== ini) { pvMono.classList.remove('bump'); void pvMono.offsetWidth; pvMono.classList.add('bump'); setTimeout(function () { pvMono.classList.remove('bump'); }, 400); }
    $$('.pv-mono').forEach(function (x) { x.textContent = ini; });
    var a = fmtD(fFrom.value), b = fmtD(fTo.value);
    pvDates.textContent = a && b && a !== b ? a + ' – ' + b : (a || b || 'Your festival · your dates');
    var g = parseInt(fGuests.value, 10);
    pvGuests.innerHTML = g > 0 ? 'Built for <b>' + g.toLocaleString('en-GB') + '</b> guests' : 'Built for your crowd';
    var on = fSpon.checked;
    pvPartner.classList.toggle('on', on); $('#homeScr').classList.toggle('has-partner', on);
    $$('.pv-chip').forEach(function (x) { x.classList.toggle('on', on); });
    pvCat.textContent = on ? (fC.value ? fC.value + ' · ' : '') + (fN.value && fN.value !== 'None yet' ? fN.value + ' sponsor' + (fN.value === '1' ? '' : 's') : 'your place for a sponsor') : "Your sponsor's place in the app";
    if (window.KitCountdown) $$('[data-countdown]').forEach(function (el) { KitCountdown.refresh(el); });
  }
  [fName, fFrom, fTo, fGuests, fN, fC].forEach(function (el) { el.addEventListener('input', preview); el.addEventListener('change', preview); });
  fFrom.addEventListener('change', function () { if (fFrom.value) { fTo.min = fFrom.value; if (!fTo.value || fTo.value < fFrom.value) fTo.value = fFrom.value; preview(); } });
  fSpon.addEventListener('change', function () {
    var on = fSpon.checked; more.classList.toggle('open', on); fSpon.setAttribute('aria-expanded', on ? 'true' : 'false');
    fN.disabled = !on; fC.disabled = !on; preview();
  });
  function bad(el, on, msg) { var w = el.closest('.fld'); w.classList.toggle('bad', on); el.setAttribute('aria-invalid', on ? 'true' : 'false'); if (msg) w.querySelector('.err').textContent = msg; }
  f.addEventListener('submit', function (e) {
    e.preventDefault();
    var ok = true, n = fName.value.trim(), m = fMail.value.trim();
    bad(fName, !n); if (!n) ok = false;
    if (!m) { bad(fMail, true, 'Where should we send it?'); ok = false; }
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(m)) { bad(fMail, true, 'That address looks a bit off. Check for a typo?'); ok = false; }
    else bad(fMail, false);
    if (!ok) { var first = f.querySelector('.bad input'); if (first) first.focus(); return; }
    var btn = $('#fBtn'); btn.disabled = true; btn.firstChild.textContent = 'Building ' + n + '… ';
    setTimeout(function () {
      $('#thxH').textContent = 'Done. ' + n + ' is on its way.';
      $('#finalBox').classList.add('done');
      confetti.from($('#thanks').getBoundingClientRect().width ? $('#thxH') : pvMono, { count: 120 });
      $('#thanks').setAttribute('tabindex', '-1'); $('#thanks').focus({ preventScroll: true });
      var fb = $('#finalBox').getBoundingClientRect(), hh = (headEl.offsetHeight || 64) + 28;
      if (fb.top < hh) window.scrollTo({ top: window.scrollY + fb.top - hh, behavior: reduce ? 'auto' : 'smooth' });
    }, 650);
  });
  [fName, fMail].forEach(function (el) { el.addEventListener('input', function () { if (el.closest('.fld').classList.contains('bad')) bad(el, false); }); });
  preview();

  run();
  window.addEventListener('load', function () { fitAll(); heroProfile(); run(); });
})();
