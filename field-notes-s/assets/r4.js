/* Round 4 (11.10.2026): behaviour for the parts rebuilt after Grzegorz's Sunday feedback on page S. No dependencies. */
(function () {
  'use strict';
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function qa(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function q(s, r) { return (r || document).querySelector(s); }
  function onView(el, cb, margin) {
    if (!('IntersectionObserver' in window)) { cb(true); return; }
    new IntersectionObserver(function (es) { es.forEach(function (e) { cb(e.isIntersecting); }); }, { rootMargin: margin || '0px' }).observe(el);
  }

  /* ---------- 03 proof: drifting tickets, a tap swaps the quote by the heading ---------- */
  (function proof() {
    var box = q('[data-stubs4]'); if (!box) return;
    var figs = qa('.pq-stack .pq'), keys = figs.map(function (f) { return f.getAttribute('data-pq'); });
    var cur = 0, timer = null, held = false, seen = false;
    function show(k) {
      var i = keys.indexOf(k); if (i < 0) return; cur = i;
      figs.forEach(function (f, n) { if (n === i) { f.hidden = false; f.classList.add('is-on'); } else { f.hidden = true; f.classList.remove('is-on'); } });
      qa('.stub4[data-pq]', box).forEach(function (b) { b.classList.toggle('is-on', b.getAttribute('data-pq') === k); b.setAttribute('aria-pressed', b.getAttribute('data-pq') === k ? 'true' : 'false'); });
    }
    function visibleKey() {
      var vw = innerWidth, best = null, bd = 1e9, now = keys[cur];
      qa('.stub4[data-pq]', box).forEach(function (b) {
        var r = b.getBoundingClientRect(), c = r.left + r.width / 2;
        if (r.left < vw * .12 || r.right > vw * .88) return;
        var k = b.getAttribute('data-pq'); if (k === now) return;
        var dd = Math.abs(c - vw * .5); if (dd < bd) { bd = dd; best = k; }
      });
      return best;
    }
    function tick() { if (!held && seen) show(visibleKey() || keys[(cur + 1) % keys.length]); }
    function start() { clearInterval(timer); timer = setInterval(tick, 6500); }
    box.addEventListener('click', function (e) {
      var b = e.target.closest('.stub4[data-pq]'); if (!b) return;
      show(b.getAttribute('data-pq')); start();
    });
    var pause = q('.st-pause', box);
    pause.addEventListener('click', function () {
      held = !held; box.classList.toggle('is-paused', held);
      pause.setAttribute('aria-pressed', held ? 'true' : 'false');
      pause.setAttribute('aria-label', held ? 'Play the tickets' : 'Pause the tickets');
    });
    onView(box, function (v) { seen = v; if (v) box.classList.add('is-live'); });
    show(keys[0]); start();
  })();

  /* ---------- 05b calculator: the chosen place, big, in a whole phone ---------- */
  (function calcPreview() {
    var root = q('#calc'); if (!root) return;
    var SPOTS = {
      'tab-bar-logo': [['01-tab-bar-logo', 160, 768, 70, 52]],
      'launch-cover-poster': [['02b-launch-cover', 24, 396, 330, 172], ['02-discover-poster', 16, 448, 300, 244]],
      'zone-push': [['03-zone-push', 12, 516, 366, 102]],
      'shop-shelf': [['04-shop-shelf', 12, 276, 366, 268]],
      'stage-map-pin': [['06-map-stage-pin', 236, 366, 148, 84]],
      'identity-frame': [['07-identity-card', 20, 204, 350, 260]],
      'faq-answer': [['05-faq-answer', 20, 346, 350, 213]],
      'monday-survey': [['08-monday-survey', 20, 252, 350, 308]]
    };
    var items = []; try { items = JSON.parse(q('script[type="application/json"]', root).textContent); } catch (e) {}
    var mobile = window.matchMedia('(max-width: 860px)');
    var box = document.createElement('div');
    box.className = 'cprev'; box.setAttribute('data-ph', 'licence');
    box.innerHTML = '<div class="ph4 cprev-ph"><div class="scr"><img class="cprev-img" alt=""><span class="cprev-spot" aria-hidden="true"></span></div></div>' +
      '<p class="cprev-cap" aria-live="polite"><b></b><span></span></p>';
    var img = q('.cprev-img', box), spot = q('.cprev-spot', box), capB = q('.cprev-cap b', box), capS = q('.cprev-cap span', box);
    var pinned = 0, cycle = null, shownOnce = false;
    // preload the eight screens so a click or hover swaps instantly
    Object.keys(SPOTS).forEach(function (k) { SPOTS[k].forEach(function (s) { var i = new Image(); i.src = 'assets/sponsor/screens/' + s[0] + '.jpg'; }); });
    function paint(s) {
      img.src = 'assets/sponsor/screens/' + s[0] + '.jpg';
      spot.style.left = (s[1] / 390 * 100) + '%'; spot.style.top = (s[2] / 844 * 100) + '%';
      spot.style.width = (s[3] / 390 * 100) + '%'; spot.style.height = (s[4] / 844 * 100) + '%';
      spot.classList.remove('is-ping'); void spot.offsetWidth; spot.classList.add('is-ping');
    }
    function show(i) {
      var it = items[i]; if (!it) return;
      var screens = SPOTS[it.id] || []; if (!screens.length) return;
      clearInterval(cycle); var n = 0; paint(screens[0]);
      if (screens.length > 1) cycle = setInterval(function () { n = (n + 1) % screens.length; paint(screens[n]); }, 2600);
      capB.textContent = it.name;
      capS.textContent = '£' + Number(it.price).toLocaleString('en-GB') + ' · ' + it.note;
      box.setAttribute('aria-label', 'Preview: ' + it.name);
    }
    function place(li) {
      if (mobile.matches) { if (li) { li.after(box); box.classList.add('is-in'); } }
      else { var sum = q('.kcalc__sum', root); if (sum && box.nextSibling !== sum) root.insertBefore(box, sum); box.classList.add('is-in'); }
    }
    function ready() {
      var rows = qa('.kcalc__row', root); if (!rows.length) return false;
      rows.forEach(function (r, i) {
        r.addEventListener('click', function () { pinned = i; show(i); place(r.closest('li')); shownOnce = true; });
        r.addEventListener('mouseenter', function () { if (!mobile.matches) show(i); });
        r.addEventListener('focus', function () { if (!mobile.matches) show(i); });
      });
      q('.kcalc__list', root).addEventListener('mouseleave', function () { if (!mobile.matches) show(pinned); });
      show(0);
      if (!mobile.matches) place(null);
      mobile.addEventListener && mobile.addEventListener('change', function () { if (mobile.matches) { if (shownOnce) place(rows[pinned].closest('li')); else box.remove(); } else place(null); });
      return true;
    }
    if (!ready()) { var t = setInterval(function () { if (ready()) clearInterval(t); }, 120); }
  })();

  /* ---------- 05e consent: the three steps light up in turn while in view ---------- */
  (function consent() {
    var box = q('[data-consent4]'); if (!box) return;
    var steps = qa('.c4-step', box), i = -1, t = null;
    function next() { i = (i + 1) % steps.length; steps.forEach(function (s, n) { s.classList.toggle('is-on', n === i); }); }
    if (reduce) { steps.forEach(function (s) { s.classList.add('is-on'); }); return; }
    onView(box, function (v) { clearInterval(t); if (v) { if (i < 0) next(); t = setInterval(next, 2600); } }, '-15% 0px');
  })();

  /* ---------- 09·05 identity: the picker spins through a few animals and lands on the koala ---------- */
  (function identity() {
    var box = q('[data-identity]'); if (!box) return;
    var IDS = [
      { e: 'koala', n: 'Professional<br>Napper', t: 'Professional Napper', bg: '#8FC1A9', c: 1, r: 1, map: 'a koala' },
      { e: 'kangaroo', n: 'Front Row<br>Bouncer', t: 'Front Row Bouncer', bg: '#EFA45B', c: 1, r: 2, map: 'a kangaroo' },
      { e: 'owl', n: 'Night<br>Shift', t: 'Night Shift', bg: '#A496F2', c: 2, r: 2, map: 'an owl' },
      { e: 'flamingo', n: 'One-Leg<br>Dancer', t: 'One-Leg Dancer', bg: '#F49AB5', c: 3, r: 2, map: 'a flamingo' }
    ];
    IDS.forEach(function (d) { var i = new Image(); i.src = 'assets/emoji/' + d.e + '.png'; });
    var idp = q('.idp', box), idc = q('.idc', box), cur = 0, busy = false;
    function set(i) {
      var d = IDS[i]; cur = i;
      box.style.setProperty('--bg', d.bg); idp.style.setProperty('--bg', d.bg);
      qa('.idp-emoji, .idc-emoji', box).forEach(function (im) { im.src = 'assets/emoji/' + d.e + '.png'; });
      q('.idp-nick', box).innerHTML = d.n; q('.idc-name', box).textContent = d.t;
      q('.idc-d', box).textContent = 'Your emoji picks the nickname and colour. On the map, your crew sees ' + d.map + '.';
      var ring = q('.idp-ring', box); ring.style.setProperty('--c', d.c); ring.style.setProperty('--r', d.r);
    }
    function spin(land) {
      if (busy) return; busy = true;
      if (reduce) { set(land); busy = false; return; }
      var seq = [], n = cur; for (var k = 0; k < 7; k++) { n = (n + 1) % IDS.length; seq.push(n); }
      while (seq[seq.length - 1] !== land) { n = (n + 1) % IDS.length; seq.push(n); }
      var step = 0;
      (function go() {
        idp.classList.add('is-spin'); set(seq[step]);
        setTimeout(function () { idp.classList.remove('is-spin'); }, 120);
        step++;
        if (step < seq.length) setTimeout(go, 110 + step * step * 6); else busy = false;
      })();
    }
    var played = false;
    onView(box, function (v) { if (v && !played) { played = true; setTimeout(function () { spin(0); }, 400); } }, '-20% 0px');
    var btn = q('[data-identity-spin]');
    if (btn) btn.addEventListener('click', function () { spin((cur + 1 + Math.floor(Math.random() * (IDS.length - 1))) % IDS.length); });
  })();

  /* ---------- 09·06 your pace and your spot: scroll moves the two sliders, the photo and the chip follow ---------- */
  (function pace() {
    var art = q('[data-pace]'); if (!art) return;
    var sc = q('.pace-scroll', art), back = q('.pf.back', art), where = q('.pc-where', art), leave = q('.pc-leave', art);
    var sl = { stage: q('[data-sl="stage"]', art), pace: q('[data-sl="pace"]', art) };
    var vStage = q('[data-val="stage"]', art), vPace = q('[data-val="pace"]', art), vKmh = q('[data-val="kmh"]', art);
    var STAGE = ['At the back', 'By the sound desk', 'In the middle', 'Close to the front', 'Right at the front'];
    var STAGE_HINT = ['Somewhere to sit, with a view', 'Good sound, room to breathe', 'In the crowd, not in the crush', 'We\'ll get you there early', 'We\'ll time your walk to the stage'];
    var STAGE_E = ['blanket', 'blanket', 'smile', 'hands', 'metal'];
    var PACE = ['Easy', 'Relaxed', 'Normal', 'Brisk', 'Fast'], KMH = ['3.2', '3.8', '4.3', '5.0', '5.6'], PACE_E = ['turtle', 'walk', 'walk', 'runner', 'runner'];
    var LEAVE = ['20:56', '20:54', '20:52', '20:50', '20:48'];
    var hint = q('[data-sl="stage"]', art).parentNode.querySelector('.ps-hint');
    var last = -1, raf = 0;
    function knob(el, pos, emoji) {
      el.style.setProperty('--k-pos', pos.toFixed(4)); el.style.setProperty('--k', (0.06 + pos * 0.88).toFixed(4));
      var im = q('.ps-knob img', el), src = 'assets/emoji/' + emoji + '.png';
      if (im.getAttribute('src') !== src) im.setAttribute('src', src);
    }
    function frame() {
      raf = 0;
      // progress runs while the block crosses the screen: from its top at 85 % of the viewport to its bottom at 35 %
      var r = sc.getBoundingClientRect(), start = innerHeight * .85, end = innerHeight * .35 - r.height;
      var p = Math.min(1, Math.max(0, (start - r.top) / Math.max(1, start - end)));
      var e = p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      var pos = 1 - e, idx = Math.round(pos * 4);
      knob(sl.stage, pos, STAGE_E[idx]); knob(sl.pace, pos, PACE_E[idx]);
      var b = Math.min(1, Math.max(0, (p - .3) / .4)); back.style.setProperty('--back', b.toFixed(3)); back.style.opacity = b.toFixed(3);
      art.classList.toggle('is-back', b > .5);
      if (idx !== last) {
        last = idx;
        vStage.textContent = STAGE[idx]; hint.textContent = STAGE_HINT[idx];
        vPace.textContent = PACE[idx]; vKmh.textContent = KMH[idx] + ' km/h';
        where.textContent = STAGE[idx]; leave.textContent = LEAVE[idx];
      }
    }
    function req() { if (!raf) raf = requestAnimationFrame(frame); }
    addEventListener('scroll', req, { passive: true }); addEventListener('resize', req);
    frame();
  })();

  /* ---------- 09·07 rain bars grow once in view ---------- */
  (function rain() {
    var li = q('.i4.rain'); if (!li) return;
    li.querySelectorAll('.rn4-bars i').forEach(function (i) { i.style.animationPlayState = 'paused'; });
    onView(li, function (v) { if (v) { li.classList.add('is-in'); li.querySelectorAll('.rn4-bars i').forEach(function (i) { i.style.animationPlayState = 'running'; }); } }, '-10% 0px');
  })();

  /* ---------- 12 industry vs us: one slider for every phone; layout A, B or C ---------- */
  (function vs() {
    var box = q('[data-vs4]'); if (!box) return;
    var range = q('.vs4-range', box), row = q('.vs4-row', box), items = qa('.vs4-item', box);
    var phones = items.map(function (it) { return q('.vs4-ph', it); });
    var small = window.matchMedia('(max-width: 759px)');
    var layout = 'a', x = 50, active = 'lineup', touched = false;
    try { var saved = localStorage.getItem('lineapp-r4-vs-layout'); if (saved && /^[abc]$/.test(saved)) layout = saved; } catch (e) {}
    var qp = /[?&]vs=([abc])/.exec(location.search); if (qp) layout = qp[1];
    function eff() { return small.matches ? 'b' : layout; }
    function apply() {
      box.style.setProperty('--x', x);
      var L = eff();
      if (L === 'c') {
        var rb = row.getBoundingClientRect(), gx = rb.left + rb.width * x / 100;
        phones.forEach(function (ph) { var r = ph.getBoundingClientRect(); var lx = Math.max(0, Math.min(100, (gx - r.left) / r.width * 100)); ph.style.setProperty('--lx', lx.toFixed(2)); });
        var h = phones[0].getBoundingClientRect().height; box.style.setProperty('--ph-h', h + 'px');
      } else phones.forEach(function (ph) { ph.style.setProperty('--lx', x); });
      range.value = eff() === 'c' ? x : 100 - x;
    }
    function setLayout(l) {
      layout = l; box.setAttribute('data-layout', l);
      qa('[data-layout-pick]').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-layout-pick') === l ? 'true' : 'false'); });
      try { localStorage.setItem('lineapp-r4-vs-layout', l); } catch (e) {}
      requestAnimationFrame(apply);
    }
    function setTab(k) {
      active = k;
      items.concat(qa('.vs4-cap', box)).forEach(function (it) { it.classList.toggle('is-on', it.getAttribute('data-vs') === k); });
      qa('[data-tab]', box).forEach(function (b) { b.setAttribute('aria-selected', b.getAttribute('data-tab') === k ? 'true' : 'false'); });
      requestAnimationFrame(apply);
    }
    range.addEventListener('input', function () { touched = true; x = eff() === 'c' ? +range.value : 100 - (+range.value); apply(); });
    qa('[data-layout-pick]').forEach(function (b) { b.addEventListener('click', function () { setLayout(b.getAttribute('data-layout-pick')); }); });
    qa('[data-tab]', box).forEach(function (b) { b.addEventListener('click', function () { setTab(b.getAttribute('data-tab')); }); });
    // layout C: drag anywhere across the row
    var drag = false;
    function fromEvent(e) { var rb = row.getBoundingClientRect(); x = Math.max(0, Math.min(100, (e.clientX - rb.left) / rb.width * 100)); touched = true; apply(); }
    row.addEventListener('pointerdown', function (e) { if (eff() !== 'c') return; drag = true; row.setPointerCapture(e.pointerId); fromEvent(e); });
    row.addEventListener('pointermove', function (e) { if (drag) fromEvent(e); });
    row.addEventListener('pointerup', function () { drag = false; }); row.addEventListener('pointercancel', function () { drag = false; });
    addEventListener('resize', function () { requestAnimationFrame(apply); });
    small.addEventListener && small.addEventListener('change', function () { requestAnimationFrame(apply); });
    // a short hint the first time it comes into view: the line moves left and right once
    var hinted = false;
    onView(box, function (v) {
      if (!v || hinted || reduce) return; hinted = true;
      var t0 = performance.now(), from = x;
      (function f(t) {
        if (touched) return;
        var k = Math.min(1, (t - t0) / 2200);
        x = from + Math.sin(k * Math.PI * 2) * 22 * (1 - k * .3); apply();
        if (k < 1) requestAnimationFrame(f); else { x = 50; apply(); }
      })(t0);
    }, '-25% 0px');
    setLayout(layout); setTab(active);
  })();

  /* ---------- mobile sticky button: hides on the way down, returns on the way up, dark over the lime band ---------- */
  (function sticky() {
    var b = q('#stickyCta'); if (!b) return;
    var mq = window.matchMedia('(max-width: 760px)'), lastY = scrollY, band = q('.sp-band'), raf = 0;
    function f() {
      raf = 0; var y = scrollY, dy = y - lastY;
      if (!mq.matches) { b.classList.remove('r4-hide', 'r4-onlime'); lastY = y; return; }
      if (Math.abs(dy) > 6) { b.classList.toggle('r4-hide', dy > 0 && y > 400); lastY = y; }
      if (band) { var r = band.getBoundingClientRect(), br = b.getBoundingClientRect(); b.classList.toggle('r4-onlime', r.top < br.bottom && r.bottom > br.top); }
    }
    addEventListener('scroll', function () { if (!raf) raf = requestAnimationFrame(f); }, { passive: true });
  })();
})();
