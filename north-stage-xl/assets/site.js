/* North Stage · XL · round 3 · page script (kit parts load before this file) */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var clamp = function (v, a, b) { if (a === undefined) { a = 0; b = 1; } return Math.min(b, Math.max(a, v)); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var easeOut = function (t) { return 1 - (1 - t) * (1 - t); };
  var ease = function (t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var fmt = function (n) { return Math.round(n).toLocaleString('en-GB'); };
  var docEl = document.documentElement, body = document.body;
  var vw = 0, vh = 0;
  function measureViewport() {
    vw = docEl.clientWidth || innerWidth || 1024;
    vh = innerHeight || docEl.clientHeight || 800;
    if (vh < 320) vh = 320;
  }
  measureViewport();

  function onView(el, cb, opts) {
    if (!el) return;
    if (!('IntersectionObserver' in window)) { cb(); return; }
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { io.disconnect(); cb(); } }); }, opts || { threshold: .3 });
    io.observe(el);
  }
  function watch(el, cb, opts) {
    if (!el || !('IntersectionObserver' in window)) return;
    new IntersectionObserver(function (es) { es.forEach(function (e) { cb(e.isIntersecting, e); }); }, opts || { threshold: 0 }).observe(el);
  }

  /* ---------- menu ---------- */
  var menu = $('#menu'), menuBtn = $('#menuBtn');
  function setMenu(o) { menu.hidden = !o; menuBtn.setAttribute('aria-expanded', o ? 'true' : 'false'); menuBtn.textContent = o ? 'Close' : 'Menu'; body.style.overflow = o ? 'hidden' : ''; }
  menuBtn.addEventListener('click', function () { setMenu(menu.hidden); });
  $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !menu.hidden) { setMenu(false); menuBtn.focus(); } });

  /* navigation links glide (navigation only; every detail opens an overlay instead) */
  $$('.links a, .menu nav a, .nav-cta, .dock, .brand, .skip, .h-copy .btn').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href'); if (!id || id.charAt(0) !== '#') return;
      var t = document.querySelector(id); if (!t) return;
      e.preventDefault();
      t.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      if (id === '#form') setTimeout(function () { $('#fName').focus({ preventScroll: true }); }, reduce ? 0 : 800);
    });
  });

  /* ---------- Going / Maybe / Skip: one choice at a time ---------- */
  $$('.acts').forEach(function (g) {
    var bs = $$('.ab', g);
    bs.forEach(function (b) { b.addEventListener('click', function () {
      var on = b.getAttribute('aria-pressed') !== 'true';
      bs.forEach(function (o) { o.setAttribute('aria-pressed', o === b && on ? 'true' : 'false'); });
    }); });
  });

  /* =====================================================================
     01 · hero + kabum. The photo collapses into the glass frame from the first scroll, the frame becomes the
     real artist screen, and three beats (23:13, 23:14, 23:15) change the phone while the stage stays pinned.
     ===================================================================== */
  var hero = $('#top'), vp = $('#heroVp'), hPhoto = $('#hPhoto'), hImg = $('#hImg'), hShade = $('#hShade'), hp = $('#hp'), hpUi = $('#hpUi'), hpDim = $('#hpDim'),
      hCopy = $('#hCopy'), hKab = $('#hKab'), cue = $('#scrollCue'), clock = $('#hpClock'), beatEls = $$('#beats .beat');
  var FACE = { x: .657, y: .409 }, IAR = 1116 / 2000, G = null, mobile = false, beat = -1, heroP = 0, heroVis = true;
  var CLOCKS = ['23:13', '23:14', '23:15'];
  if (reduce) hero.classList.add('rm');
  function heroLayout() {
    measureViewport();
    mobile = vw < 900;
    var navH = vw < 760 ? 56 : 64, g = {};
    if (!mobile) {
      var gut = 40, wrapW = Math.min(1240, vw - 2 * gut), wl = (vw - wrapW) / 2;
      g.FH = clamp(vh - navH - 56, 440, 820); g.s = g.FH / 844; g.FW = 390 * g.s;
      g.x = Math.min(wl + wrapW * .8 - g.FW / 2, wl + wrapW - g.FW); g.y = navH + (vh - navH - g.FH) / 2;
      var tw = Math.max(320, Math.min(620, g.x - wl - 56));
      hCopy.style.maxWidth = tw + 'px'; hKab.style.maxWidth = tw + 'px';
    } else {
      hCopy.style.maxWidth = hKab.style.maxWidth = '';
      g.FH = clamp(vh * .54, 300, vh - navH - 190); g.s = g.FH / 844; g.FW = 390 * g.s;
      g.x = (vw - g.FW) / 2; g.y = vh - g.FH - 16;
    }
    g.fx = g.x + g.FW * .5; g.fy = g.y + g.FH * .31;
    /* the start: the photo covers the stage (on phones the top stays black under the text) */
    var cover = Math.max(g.fx / FACE.x, (vw - g.fx) / (1 - FACE.x), ((vh - g.fy) / (1 - FACE.y)) / IAR);
    if (!mobile) cover = Math.max(cover, (g.fy / FACE.y) / IAR, 2.3 * g.FH);
    else cover = Math.max(cover, 3.2 * g.FH);
    g.iw = cover;
    /* the end: inside the app, the face takes about three quarters of the screen width */
    g.zEnd = Math.min(1, (3.1 * g.FW) / g.iw);
    hImg.style.width = g.iw + 'px'; hImg.style.height = (g.iw * IAR) + 'px';
    hp.style.transform = 'translate(' + g.x.toFixed(1) + 'px,' + g.y.toFixed(1) + 'px) scale(' + g.s.toFixed(4) + ')';
    hShade.style.background = mobile
      ? 'linear-gradient(180deg, #000 0px, #000 ' + Math.round(g.y - 70) + 'px, rgba(0,0,0,.35) ' + Math.round(g.y + 10) + 'px, rgba(0,0,0,0) ' + Math.round(g.y + g.FH * .35) + 'px)'
      : 'linear-gradient(90deg, rgba(0,0,0,.96) 0px, rgba(0,0,0,.88) ' + Math.round(g.x * .55) + 'px, rgba(0,0,0,.35) ' + Math.round(g.x - 20) + 'px, rgba(0,0,0,0) ' + Math.round(g.x + 120) + 'px), linear-gradient(0deg, rgba(0,0,0,.6) 0px, rgba(0,0,0,0) 30%)';
    G = g;
  }
  function setBeat(b) {
    if (b === beat) return; beat = b;
    hp.setAttribute('data-beat', String(b));
    clock.textContent = CLOCKS[b];
    beatEls.forEach(function (li, i) { li.classList.toggle('on', i === b); li.classList.toggle('done', i < b); });
  }
  var t0 = performance.now();
  function heroFrame(now) {
    if (!G) return;
    var total = Math.max(1, hero.offsetHeight - vh);
    var p = clamp(-hero.getBoundingClientRect().top / total); heroP = p;
    var c = reduce ? (p > .04 ? 1 : 0) : easeOut(clamp(p / .26));
    var zc = reduce ? c : ease(clamp(p / .3));
    var breathe = reduce ? 0 : (.5 - .5 * Math.cos(((now || performance.now()) - t0) / 14000 * Math.PI * 2)) * .045 * c;
    var z = lerp(1, G.zEnd, zc) * (1 + breathe);
    var W = G.iw * z, L = G.fx - FACE.x * W, T = G.fy - FACE.y * W * IAR;
    hImg.style.transform = 'translate(' + L.toFixed(1) + 'px,' + T.toFixed(1) + 'px) scale(' + z.toFixed(4) + ')';
    var top = lerp(0, G.y, c), left = lerp(0, G.x, c), right = lerp(0, vw - G.x - G.FW, c), bot = lerp(0, vh - G.y - G.FH, c), rad = lerp(0, 52 * G.s, c);
    hPhoto.style.clipPath = 'inset(' + top.toFixed(1) + 'px ' + right.toFixed(1) + 'px ' + bot.toFixed(1) + 'px ' + left.toFixed(1) + 'px round ' + rad.toFixed(1) + 'px)';
    hShade.style.opacity = (1 - c).toFixed(3);
    var u = reduce ? (p > .04 ? 1 : 0) : clamp((p - .15) / .1);
    hpUi.style.opacity = hpDim.style.opacity = u.toFixed(3);
    hp.classList.toggle('ui-on', u > .6);
    $('.hp-glass').style.opacity = c.toFixed(3);
    var co = reduce ? (p > .04 ? 0 : 1) : 1 - clamp(p / .12);
    hCopy.style.opacity = co.toFixed(3); hCopy.style.visibility = co <= 0.01 ? 'hidden' : '';
    var ko = reduce ? (p > .04 ? 1 : 0) : clamp((p - .2) / .08);
    hKab.style.opacity = ko.toFixed(3); hKab.style.visibility = ko <= 0.01 ? 'hidden' : 'visible'; hKab.setAttribute('aria-hidden', ko < .5 ? 'true' : 'false');
    cue.style.opacity = (1 - clamp(p / .05)).toFixed(3);
    setBeat(p < .5 ? 0 : p < .74 ? 1 : 2);
  }
  var heroLoop = function (now) { if (heroVis) heroFrame(now); requestAnimationFrame(heroLoop); };
  watch(hero, function (v) { heroVis = v; });

  /* ---------- 03 the claim: six words, quick, landing on "a blurry PDF" with the hand-drawn circle ---------- */
  var rollBox = $('#roll'), rollW = $('#rollW'), rollT = $('#rollT');
  var WORDS = ['a blurry PDF', 'a boring app', 'a legacy app', 'a JPEG', 'an Instagram post', 'a Facebook link'], wi = 0, rollVis = false, rollTimer = null;
  function rollShow(i) {
    rollBox.style.width = rollBox.offsetWidth + 'px';
    rollW.classList.remove('in'); rollW.classList.add('out');
    if (window.KitMarks) KitMarks.reset(rollW);
    setTimeout(function () {
      rollT.textContent = WORDS[i];
      rollBox.style.width = rollW.scrollWidth + 'px';
      rollW.classList.remove('out'); rollW.classList.add('in');
      if (i === 0 && window.KitMarks) setTimeout(function () { KitMarks.draw(rollW); }, 260);
    }, 180);
  }
  function rollStep() {
    rollTimer = null;
    if (!rollVis || document.hidden) return;
    wi = (wi + 1) % WORDS.length; rollShow(wi);
    rollTimer = setTimeout(rollStep, wi === 0 ? 3400 : 900);
  }
  if (rollW) {
    watch($('#claim-h'), function (v) {
      rollVis = v;
      if (v && !reduce && !rollTimer) { if (window.KitMarks) KitMarks.draw(rollW); rollTimer = setTimeout(rollStep, 1600); }
      if (v && reduce && window.KitMarks) KitMarks.draw(rollW);
      if (!v && rollTimer) { clearTimeout(rollTimer); rollTimer = null; }
    }, { threshold: .5 });
    addEventListener('resize', function () { rollBox.style.width = ''; });
  }

  /* ---------- 04a the ledger: the app column turns green ---------- */
  var ledger = $('#ledger');
  onView(ledger, function () {
    if (reduce) { ledger.classList.add('s1', 's2', 's3'); return; }
    setTimeout(function () { ledger.classList.add('s1'); }, 500);
    setTimeout(function () { ledger.classList.add('s2'); }, 1200);
    setTimeout(function () { ledger.classList.add('s3'); }, 2000);
  }, { threshold: .5 });

  /* ---------- 04b the calculator's plain status line ---------- */
  var APP = 20000, PACK = 40000, calcBox = $('#calcBox'), calcStatus = $('#calcStatus');
  function pounds(n) { return '£' + fmt(n); }
  if (calcBox) calcBox.addEventListener('calc:change', function (e) {
    var t = e.detail.total, s;
    if (!t) s = 'Nothing ticked yet. Start with the tab bar: it’s on every screen.';
    else if (t < APP) s = 'Package ' + pounds(t) + ' · ' + pounds(APP - t) + ' short of paying for your app.';
    else if (t === APP) s = 'Package ' + pounds(t) + ' · your app is paid for.';
    else if (t < PACK) s = 'Package ' + pounds(t) + ' · your app is paid for · <span class="lime">' + pounds(t - APP) + ' stays with you.</span>';
    else s = 'Package ' + pounds(t) + ' · your app is paid for · <span class="lime">' + pounds(t - APP) + ' stays with you. The sponsor pays for your app. And pays you the same again.</span>';
    calcStatus.innerHTML = s;
  });

  /* ---------- 04c the busy bar: the counter and the walking lines ---------- */
  var barN = $('#barN');
  onView($('#barLive'), function () {
    if (reduce) return;
    var from = 3402, to = 3480, k = 0; barN.textContent = fmt(from);
    var iv = setInterval(function () { k += 1 + Math.floor(Math.random() * 3); var v = Math.min(to, from + k); barN.textContent = fmt(v); if (v >= to) clearInterval(iv); }, 70);
  });
  var flow = $('#barFlow');
  if (flow && !reduce) {
    var NS = 'http://www.w3.org/2000/svg';
    var PATHS = ['M330 22 C 236 100, 168 196, 238 262 S 400 272, 480 226', 'M410 566 C 470 452, 600 372, 790 300', 'M8 250 C 100 268, 200 300, 300 302'];
    PATHS.forEach(function (d, i) {
      var p = document.createElementNS(NS, 'path'); p.setAttribute('d', d); p.setAttribute('id', 'bf' + i); flow.appendChild(p);
      for (var k = 0; k < 11; k++) {
        var c = document.createElementNS(NS, 'circle'); c.setAttribute('r', '2.6'); c.setAttribute('opacity', '.9');
        var am = document.createElementNS(NS, 'animateMotion'); am.setAttribute('dur', (9 + i * 1.6) + 's'); am.setAttribute('repeatCount', 'indefinite'); am.setAttribute('begin', (-k * (9 + i * 1.6) / 11).toFixed(2) + 's');
        var mp = document.createElementNS(NS, 'mpath'); mp.setAttributeNS('http://www.w3.org/1999/xlink', 'href', '#bf' + i); mp.setAttribute('href', '#bf' + i);
        am.appendChild(mp); c.appendChild(am); flow.appendChild(c);
      }
    });
  }

  /* ---------- 04d the SBM case: empty, one push, full ---------- */
  var caseVis = $('#caseVis'), caseN = $('#caseN'), caseT = $('#caseT'), caseLn = $('#caseLn'), caseRun = 0;
  function playCase() {
    var run = ++caseRun;
    caseVis.classList.remove('pushed', 'full');
    caseN.textContent = '60'; caseT.textContent = 'people in the zone · a minute before the push';
    if (reduce) {
      caseVis.classList.add('pushed', 'full'); caseN.textContent = '≈1,000'; caseT.textContent = 'people in the zone · 3 minutes after one push';
      caseLn.style.strokeDashoffset = '0'; return;
    }
    caseLn.style.transition = 'none'; caseLn.style.strokeDashoffset = '420';
    setTimeout(function () { if (run !== caseRun) return; caseLn.style.transition = 'stroke-dashoffset .9s linear'; caseLn.style.strokeDashoffset = '300'; }, 60);
    setTimeout(function () {
      if (run !== caseRun) return;
      caseVis.classList.add('pushed'); caseT.textContent = 'minute 0 · the push goes out';
      setTimeout(function () {
        if (run !== caseRun) return;
        caseVis.classList.add('full');
        caseLn.style.transition = 'stroke-dashoffset 3.4s cubic-bezier(.3,.6,.3,1)'; caseLn.style.strokeDashoffset = '0';
        var s = performance.now();
        (function tick(now) {
          if (run !== caseRun) return;
          var k = clamp((now - s) / 3400), v = 60 + (1000 - 60) * (1 - Math.pow(1 - k, 2.2));
          caseN.textContent = k < 1 ? fmt(v) : '≈1,000';
          caseT.textContent = k < 1 ? 'people in the zone · minute ' + (k * 3).toFixed(1) : 'people in the zone · 3 minutes after one push';
          if (k < 1) requestAnimationFrame(tick);
        })(s);
      }, 700);
    }, 1100);
  }
  if (caseVis) { onView(caseVis, playCase, { threshold: .45 }); $('#caseReplay').addEventListener('click', playCase); }

  /* ---------- lazy, muted, inline videos: load near the screen, play only while seen ---------- */
  function lazyVideo(v) {
    if (v.__lz) return; v.__lz = true;
    var loaded = false;
    function load() { if (loaded) return; loaded = true; $$('source', v).forEach(function (s) { if (s.dataset.src) s.src = s.dataset.src; }); v.load(); }
    v.muted = true;
    if (!('IntersectionObserver' in window)) { load(); return; }
    new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) load(); }); }, { rootMargin: '300px 0px' }).observe(v);
    new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting && e.intersectionRatio > .25 && !reduce) { load(); var pr = v.play(); if (pr && pr.catch) pr.catch(function () {}); }
        else if (!v.paused) v.pause();
      });
    }, { threshold: [0, .25, .6] }).observe(v);
    v.addEventListener('click', function () { load(); if (v.paused) { var pr = v.play(); if (pr && pr.catch) pr.catch(function () {}); } else v.pause(); });
  }
  $$('video[data-lazy]').forEach(lazyVideo);

  /* ---------- 06 data: the control room ---------- */
  var ctrl = $('#ctrl'), dotsG = $('#dots'), stormG = $('#storm'), DOTS = [];
  var rnd = (function (s) { return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; })(42);
  function gauss() { return (rnd() + rnd() + rnd() - 1.5) / 1.5; }
  var CL = {
    now: [[520, 298, 92, 24, 175], [631, 196, 24, 9, 24], [775, 296, 14, 8, 38], [440, 214, 10, 6, 6], [95, 360, 50, 42, 28], [500, 425, 7, 28, 26], [900, 258, 44, 22, 20], [384, 352, 30, 12, 18], [701, 352, 26, 8, 10]],
    storm: [[520, 298, 88, 24, 140], [631, 196, 24, 9, 18], [775, 296, 14, 8, 26], [791, 205, 22, 10, 20], [95, 360, 50, 42, 50], [500, 425, 7, 28, 30], [900, 258, 44, 22, 26], [384, 352, 30, 12, 16], [701, 352, 26, 8, 14]],
    shelter: [[384, 345, 34, 16, 125], [735, 262, 26, 12, 105], [520, 300, 80, 22, 40], [95, 360, 50, 42, 40], [900, 258, 44, 22, 20], [500, 425, 7, 28, 10], [775, 296, 12, 8, 8]]
  };
  function target(mode) {
    var out = [];
    CL[mode].forEach(function (c) { for (var i = 0; i < c[4]; i++) out.push([c[0] + gauss() * c[2], c[1] + gauss() * c[3]]); });
    return out;
  }
  if (dotsG) {
    var NS2 = 'http://www.w3.org/2000/svg', start = target('now');
    for (var di = 0; di < 350; di++) {
      var c = document.createElementNS(NS2, 'circle'), pt = start[di % start.length];
      c.setAttribute('r', '2.4'); c.setAttribute('cx', pt[0].toFixed(1)); c.setAttribute('cy', pt[1].toFixed(1)); c.setAttribute('opacity', (.55 + rnd() * .4).toFixed(2));
      dotsG.appendChild(c); DOTS.push({ el: c, x: pt[0], y: pt[1], tx: pt[0], ty: pt[1], ph: rnd() * 6.28 });
    }
  }
  function moveDots(mode) {
    var t = target(mode);
    DOTS.forEach(function (d, i) { var q = t[i % t.length]; d.tx = q[0]; d.ty = q[1]; });
    if (reduce) DOTS.forEach(function (d) { d.x = d.tx; d.y = d.ty; d.el.setAttribute('cx', d.x.toFixed(1)); d.el.setAttribute('cy', d.y.toFixed(1)); });
  }
  var ctrlVis = false, stormX = -40;
  watch(ctrl, function (v) { ctrlVis = v; });
  function ctrlFrame(now) {
    if (ctrlVis && !reduce) {
      DOTS.forEach(function (d) {
        d.x += (d.tx - d.x) * .03; d.y += (d.ty - d.y) * .03;
        var jx = Math.sin(now / 900 + d.ph) * .7, jy = Math.cos(now / 1100 + d.ph) * .7;
        d.el.setAttribute('cx', (d.x + jx).toFixed(1)); d.el.setAttribute('cy', (d.y + jy).toFixed(1));
      });
      if (ctrl.classList.contains('is-storm')) { stormX = stormX > 260 ? -80 : stormX + .2; stormG.setAttribute('transform', 'translate(' + stormX.toFixed(1) + ',230)'); }
    }
    requestAnimationFrame(ctrlFrame);
  }
  function ctrlView() { var sv = $('#ctrlSvg'); if (sv) sv.setAttribute('viewBox', vw < 760 ? '300 120 560 400' : '0 0 1000 558'); }
  ctrlView(); addEventListener('resize', ctrlView);
  if (ctrl) {
    stormG.setAttribute('transform', 'translate(60,230)');
    requestAnimationFrame(ctrlFrame);
    $$('.ct-sw button', ctrl).forEach(function (b) {
      b.addEventListener('click', function () {
        var storm = b.getAttribute('data-ctrl') === 'storm';
        $$('.ct-sw button', ctrl).forEach(function (o) { o.setAttribute('aria-pressed', o === b ? 'true' : 'false'); });
        ctrl.classList.toggle('is-storm', storm);
        $('#ctrlWhen').textContent = storm ? 'Friday 20:52 · Next 15 minutes' : 'Friday 23:00 · Next 15 minutes';
        $('#nxNow').hidden = storm; $('#nxStorm').hidden = !storm;
        $('#sendAlert').hidden = false; $('#sentLine').hidden = true;
        if (storm) stormX = 40;
        $('#ctrlImg').setAttribute('href', storm ? 'assets/img/journey-XL-storm-16x9.jpg' : 'assets/img/journey-XL-3-evening-16x9.jpg');
        moveDots(storm ? 'storm' : 'now');
      });
    });
    $('#sendAlert').addEventListener('click', function () {
      this.hidden = true; $('#sentLine').hidden = false; moveDots('shelter');
    });
    var sp = $('[data-sendpush]', ctrl);
    if (sp) sp.addEventListener('click', function () {
      sp.textContent = 'Sent · North bar is 3 min'; sp.classList.add('done'); sp.disabled = true;
      var moved = 0;
      DOTS.forEach(function (d) { if (moved < 22 && Math.abs(d.tx - 775) < 40 && Math.abs(d.ty - 296) < 30) { d.tx = 440 + gauss() * 12; d.ty = 214 + gauss() * 7; moved++; } });
    });
  }

  /* ---------- 10 reviews (placeholders), the grumpy ones left in ---------- */
  var RA = [
    ['u/bucket_hat_barry', 'Manchester', 'Reddit r/festivals', 0, 'av-02', 'Honestly expected another PDF line-up with a logo on it. The clash screen picked between two sets for me and I didn’t regret it. Weird feeling.'],
    ['Hannah R.', 'Bristol', 'App Store', 5, 'HR', 'Poncho on, phone in a bag, one buzz: “Main Stage paused. Shelter in the big tops by Gate B.” Calm and clear. Nobody panicked.'],
    ['Daniel M.', 'Birmingham', 'Google Play', 3, 'DM', 'Map took ages to load the first time on 4G and the campsite pins were in the wrong order on Friday. Fixed by Saturday. Three stars, grudgingly.', 1],
    ['@ellie.goes.out', 'London', 'TikTok comment', 0, 'EG', 'pov you’re the only one in the group who downloaded the festival app so now you’re the leader'],
    ['u/wellies_and_wifi', 'Belfast', 'Reddit r/festivals', 0, 'WW', 'From someone who hates festival apps: this one opened with zero bars. Checked the map, closed it, back to the music. That’s the point.'],
    ['Niamh F.', 'Cork', 'App Store', 5, 'av-09', 'Found my lot at 2 a.m. in Campsite West with 9 % battery. The rose emoji on the map was my sister. Never letting her pick it again.'],
    ['Tom H.', 'Manchester', 'App Store', 4, 'av-13', 'Clash, offline map, crew: all good. The music preview kept playing after I closed the artist page, confused me for a minute. Still four stars.', 1],
    ['@aisling.raves', 'Dublin', 'TikTok comment', 0, 'av-11', 'ok but who designed this because the artist pages look nicer than spotify']
  ];
  var RB = [
    ['Michał R.', 'Festival director · Kraków', 'e-mail to us', 0, 'av-06', 'I used to defend the app budget every spring. This year the sponsor paid for it, and the report did the arguing for me.'],
    ['Darren W.', 'Production manager · Manchester', 'LinkedIn', 0, 'av-08', 'Set times moved three times on Saturday. I changed them once in the panel and every phone had it before the stage manager finished the radio call.'],
    ['Julia M.', 'Volunteer coordinator · Łódź', 'Trustpilot', 3, 'JM', 'Setup took longer than the promised week for us, and the first push template was too long. Mostly our fault. The volunteers loved it after that.', 1],
    ['Elżbieta K.', 'Festival founder · Wrocław', 'Trustpilot', 5, 'av-12', 'Twenty years of printed programmes. I didn’t think our crowd would download anything. Nearly half did. And the team picks up the phone at midnight.'],
    ['Seán O’C.', 'Marketing lead · Dublin', 'e-mail to us', 0, 'SO', 'The Monday report is the first deck I didn’t have to build myself. Who came, when, what they tapped, which sponsor got seen. I forwarded it as it was.']
  ];
  function card(R, org) {
    var li = document.createElement('li'); li.className = 'rc' + (org ? ' org' : '') + (R[6] ? ' grump' : '');
    var av = /^av-/.test(R[4]) ? '<img class="av" src="assets/av/' + R[4] + '.jpg" alt="" loading="lazy" width="38" height="38">' : '<span class="av ini" aria-hidden="true">' + R[4] + '</span>';
    var st = R[3] ? '<span class="stars" role="img" aria-label="' + R[3] + ' out of 5 stars">' + new Array(R[3] + 1).join('<svg aria-hidden="true"><use href="#star"/></svg>') + '</span>' : '';
    li.innerHTML = '<p>“' + R[5] + '”</p><div class="who">' + av + '<span><b>' + R[0] + '</b><small>' + R[1] + '</small></span><span class="src">' + st + R[2] + '</span></div>';
    return li;
  }
  var rowA = $('#rowA'), rowB = $('#rowB');
  if (rowA) { RA.forEach(function (R) { rowA.appendChild(card(R)); }); RB.forEach(function (R) { rowB.appendChild(card(R, true)); }); }

  /* ---------- 11 industry vs us: one pair at a time ---------- */
  var cmp = $('#cmp');
  var vid = function (n, label) { return '<video data-lazy muted loop playsinline preload="none" poster="assets/app/' + n + '-poster.jpg" aria-label="' + label + '" data-ph="licence"><source data-src="assets/app/' + n + '.webm" type="video/webm"><source data-src="assets/app/' + n + '.mp4" type="video/mp4"></video>'; };
  var PAIRS = [
    { a: '<div class="fill duo r"><img class="bgblur" src="assets/app/crew-map-xl-en.jpg" alt=""><span class="phone dance"><img src="assets/app/crew-map-xl-en.jpg" alt="LineApp map: the live Main Stage glows, your crew waves from the map."><i class="glow" aria-hidden="true"></i><i class="wave" aria-hidden="true">👋</i></span></div>', ac: 'A map that dances: live stages glow, your crew waves from the food trucks.',
      b: '<div class="fill duo l sadbg"><img class="bgblur" src="assets/app/sadmap-static-festival-map.jpg" alt=""><span class="phone"><img src="assets/app/sadmap-static-festival-map.jpg" alt="A plain grey static festival map with red default pins."></span></div>', bc: 'A static map, like a car park on Google Maps.' },
    { a: '<div class="fill duo r"><img class="bgblur" src="assets/app/feed-scroll-loop-poster.jpg" alt=""><span class="phone">' + vid('feed-scroll-loop', 'LineApp feed: artists play one after another, a like pops.') + '</span></div>', ac: 'A feed that plays, jumps and hums. Six seconds and you know.',
      b: '<div class="fill grey-list" role="img" aria-label="A grey list of names and times"><h4>LINE-UP · SATURDAY</h4><ul><li><span>14:00</span>Jan Nowak · Stage 2</li><li><span>15:30</span>TBA · Stage 3</li><li><span>17:00</span>Jan Nowak (DJ set) · Stage 2</li><li><span>19:15</span>TBA · Stage 1</li><li><span>21:00</span>Jan Nowak · Stage 2</li><li><span>23:15</span>Ellis Rook · Stage 1</li></ul><p>Last updated: Tuesday</p></div>', bc: 'A grey list of names. Jan Nowak. 21:00. Stage 2.' }
  ];
  function setPair(i) {
    var P = PAIRS[i];
    $('#cmpA').innerHTML = P.a; $('#cmpB').innerHTML = P.b; $('#cmpAc').textContent = P.ac; $('#cmpBc').textContent = P.bc;
    $$('#cmpA video').forEach(lazyVideo);
    capFade(50); if (window.KitCompare) KitCompare.set(cmp, 50);
  }
  function capFade(v) { var a = $('#ccA'), b = $('#ccB'); if (!a) return; a.style.opacity = (0.35 + 0.65 * (1 - v / 100)).toFixed(2); b.style.opacity = (0.35 + 0.65 * (v / 100)).toFixed(2); }
  if (cmp) {
    cmp.addEventListener('compare:change', function (e) { capFade(e.detail.value); });
    setPair(0);
    $$('.cmp-tabs button').forEach(function (bt) {
      bt.addEventListener('click', function () {
        $$('.cmp-tabs button').forEach(function (o) { o.setAttribute('aria-pressed', o === bt ? 'true' : 'false'); });
        setPair(+bt.getAttribute('data-pair'));
      });
    });
  }

  /* ---------- 12 FAQ tabs ---------- */
  var ftabs = $$('#faqTabs [role="tab"]');
  function fSel(i, focus) {
    ftabs.forEach(function (t, k) { var on = k === i; t.setAttribute('aria-selected', on ? 'true' : 'false'); t.tabIndex = on ? 0 : -1; $('#' + t.getAttribute('aria-controls')).hidden = !on; });
    if (focus) ftabs[i].focus();
  }
  ftabs.forEach(function (t, i) {
    t.addEventListener('click', function () { fSel(i); });
    t.addEventListener('keydown', function (e) { var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0; if (d) { e.preventDefault(); fSel((i + d + ftabs.length) % ftabs.length, true); } });
  });

  /* ---------- 13 mascot: bounce and blink, pixel-sharp ---------- */
  var masc = $('#mascot');
  if (masc && !reduce) {
    var mf = 0, srcs = ['down', 'up', 'down', 'down', 'up', 'down', 'blink', 'down'];
    srcs.forEach(function (s) { var im = new Image(); im.src = 'assets/team/claude-code-mascot-' + s + '.svg'; });
    var mVis = false; watch(masc, function (v) { mVis = v; });
    setInterval(function () { if (!mVis) return; mf = (mf + 1) % srcs.length; masc.src = 'assets/team/claude-code-mascot-' + srcs[mf] + '.svg'; }, 420);
  }

  /* ---------- 14 form: the live home screen ---------- */
  var homePh = $('#homePh'), hs = homePh && $('.hs', homePh);
  function fitHome() { if (homePh) hs.style.setProperty('--k', (homePh.clientWidth / 390).toFixed(4)); }
  fitHome(); if ('ResizeObserver' in window && homePh) new ResizeObserver(fitHome).observe(homePh);
  var form = $('#form'), fName = $('#fName'), fMail = $('#fMail'), fFrom = $('#fFrom'), fTo = $('#fTo'), fGuests = $('#fGuests'), fSpon = $('#fSpon'), sponX = $('#sponX'), fSC = $('#fSC'), fSN = $('#fSN');
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  function preview() {
    var nm = fName.value.trim();
    $('#pvName').textContent = $('#mpName').textContent = nm || 'Your festival';
    $('#pvName').style.fontSize = nm.length > 26 ? '30px' : nm.length > 15 ? '36px' : '44px';
    $('#pvWel').textContent = nm ? 'Welcome to ' + nm + '. Your weekend starts here.' : 'Your weekend starts here.';
    var a = fFrom.value ? new Date(fFrom.value + 'T12:00') : null, b = fTo.value ? new Date(fTo.value + 'T12:00') : null, d = 'Your festival · your dates';
    if (a && b && b >= a && !isNaN(a) && !isNaN(b)) d = (a.getMonth() === b.getMonth() ? a.getDate() : a.getDate() + ' ' + MONTHS[a.getMonth()]) + '–' + b.getDate() + ' ' + MONTHS[b.getMonth()] + ' ' + b.getFullYear();
    else if (a && !isNaN(a)) d = a.getDate() + ' ' + MONTHS[a.getMonth()] + ' ' + a.getFullYear();
    $('#pvDates').textContent = $('#mpDates').textContent = d;
    $('#pvPartner').hidden = $('#mpPartner').hidden = !fSpon.checked;
    var cat = fSC.value, sn = fSN.value, t = cat ? (cat === 'Other' ? 'Your main partner' : 'Your ' + cat.toLowerCase() + ' partner') : 'Your sponsor';
    if (sn === '2 to 3') t += ' + 1–2 more'; else if (sn === '4 or more') t += ' + 3 more';
    $('#pvPartnerT').textContent = $('#mpPartnerT').textContent = t;
  }
  [fName, fFrom, fTo, fGuests, fSC, fSN].forEach(function (f) { f.addEventListener('input', preview); f.addEventListener('change', preview); });
  fFrom.addEventListener('change', function () {
    if (!fFrom.value) return;
    fTo.min = fFrom.value;
    if (!fTo.value || fTo.value < fFrom.value) { var dt = new Date(fFrom.value + 'T12:00'); dt.setDate(dt.getDate() + 2); fTo.value = dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0') + '-' + String(dt.getDate()).padStart(2, '0'); fTo.dispatchEvent(new Event('input', { bubbles: true })); }
    preview();
  });
  fSpon.addEventListener('change', function () { sponX.hidden = !fSpon.checked; fSpon.setAttribute('aria-expanded', fSpon.checked ? 'true' : 'false'); preview(); });
  var pvCd = $('#pvCd'); if (pvCd) pvCd.addEventListener('countdown:change', function (e) { $('#mpCd').textContent = e.detail.text; $('#cdInline').textContent = e.detail.text; });
  function fieldErr(inp, el, msg) { el.textContent = msg; inp.closest('.fld').classList.toggle('bad', !!msg); inp.setAttribute('aria-invalid', msg ? 'true' : 'false'); if (msg) inp.setAttribute('aria-describedby', el.id); else inp.removeAttribute('aria-describedby'); }
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var nm = fName.value.trim(), ml = fMail.value.trim(), ok = true;
    if (!nm) { fieldErr(fName, $('#eName'), 'Your festival needs a name. Even a working title.'); ok = false; } else fieldErr(fName, $('#eName'), '');
    if (!ml) { fieldErr(fMail, $('#eMail'), 'Where should we send it?'); ok = false; }
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(ml)) { fieldErr(fMail, $('#eMail'), 'That address looks a bit off. Check for a typo?'); ok = false; }
    else fieldErr(fMail, $('#eMail'), '');
    if (!ok) { (nm ? fMail : fName).focus(); return; }
    var btn = $('#fBtn'); btn.textContent = 'Building ' + nm + '…'; btn.disabled = true;
    setTimeout(function () {
      $('#tName').textContent = nm;
      form.hidden = true; var th = $('#thanks'); th.hidden = false; th.focus();
      if (window.KitConfetti && !reduce) KitConfetti.burst(th, { count: 90 });
    }, reduce ? 0 : 700);
  });
  preview();

  /* ---------- phones: the docked lime button shows after the hero, never with the form or the calculator ---------- */
  var formVis = false, calcVis = false, lastY = scrollY, upFor = 0;
  watch($('.fin-form'), function (v) { formVis = v; dockUpdate(); }, { rootMargin: '0px 0px -10% 0px' });
  watch($('#calc'), function (v) { calcVis = v; dockUpdate(); });
  function dockUpdate() {
    var y = scrollY, dy = y - lastY; lastY = y;
    if (dy < -4) upFor = 1; else if (dy > 4) upFor = 0;
    var afterHero = hero.getBoundingClientRect().bottom < vh * .5;
    /* phones: the docked button appears only while scrolling up, so it never sits on text you are reading */
    body.classList.toggle('dock-off', !afterHero || formVis || calcVis || !upFor);
  }
  addEventListener('scroll', dockUpdate, { passive: true });

  /* ---------- go ---------- */
  function relayout() { heroLayout(); heroFrame(); dockUpdate(); }
  addEventListener('resize', relayout);
  addEventListener('load', relayout);
  if ('ResizeObserver' in window) new ResizeObserver(function () { var w = docEl.clientWidth, h = innerHeight; if (w !== vw || h !== vh) relayout(); }).observe(docEl);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(relayout);
  relayout();
  requestAnimationFrame(heroLoop);
})();
