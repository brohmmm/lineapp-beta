/* Field Notes · S · round 3 · page script (vanilla; the kits do the heavy parts) */
(function () {
  'use strict';
  var doc = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) doc.classList.add('rm');
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var fmt = function (n) { return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','); };
  var money = function (n) { return '£' + fmt(n); };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var onReady = function (fn) { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn); else setTimeout(fn, 0); };

  /* ================= reviews (placeholders, data-ph="review"); rendered before the marquee starts ================= */
  var REV_A = [
    ['u/bucket_hat_barry', 'Manchester', 'Reddit r/festivals', 'av-02', '', 'Honestly expected another PDF line-up with a logo on it. The clash screen picked between two sets for me and I didn\'t regret it. Weird feeling.'],
    ['Priya K.', 'Leeds', 'App Store', 'av-05', '★★★★☆', 'Really good. Set times moved twice on Saturday and the app knew before the screens did. One star off because dark mode is very dark in full sun.'],
    ['@zuza.glitter', 'Łódź', 'TikTok comment', 'av-04', '', 'your crew on the map is the only reason i found my sister by the second stage with 4% battery lol'],
    ['Hannah R.', 'Bristol', 'App Store', 'HR', '★★★★★', 'Poncho on, phone in a bag, one buzz: "Main Stage paused. Shelter in the big tent by Gate B." Calm and clear. Nobody panicked.'],
    ['Bartek W.', 'Gdańsk', 'Google Play', 'BW', '★★★☆☆', 'Map is great, pushes were spot on. But I wanted to drop my own pin on the tent and you can\'t. Three stars till you fix it.'],
    ['u/glitterfoot', 'Kraków', 'Reddit r/Polska', 'GF', '', 'Small thing: the app said the water point by Gate C had the shorter queue. Saved me ages in 30 degrees.']
  ];
  var REV_B = [
    ['Darren W.', 'Production manager · Manchester', 'LinkedIn', 'av-08', '', 'Set times moved three times on Saturday. I changed them once in the panel and every phone had it before the stage manager finished the radio call.', 1],
    ['Elżbieta K.', 'Festival founder · Wrocław', 'Trustpilot', 'av-12', '★★★★★', 'Twenty years of printed programmes. I didn\'t think our crowd would download anything. More than half did. And the team picks up the phone at midnight.', 1],
    ['u/wellies_and_wifi', 'Belfast', 'Reddit r/festivals', 'WW', '', 'From someone who hates festival apps: this one opened in under a second with zero bars. Checked the map, closed it, back to the music. That\'s the point.'],
    ['Daniel M.', 'Birmingham', 'Google Play', 'DM', '★★☆☆☆', 'Map took ages to load the first time on 4G and I nearly gave up. Fine after that, but first impressions matter.'],
    ['Seán O\'C.', 'Marketing lead, independent festival · Dublin', 'e-mail to us', 'SO', '', 'The Monday report is the first deck I didn\'t have to build myself. Who came, when, what they tapped, which sponsor got seen. I forwarded it as it was.', 1],
    ['u/deadphone_dave', 'Cardiff', 'Reddit r/festivals', 'DD', '', 'PSA for next year: download the festival app before you leave home. The map works offline. Learnt this the hard way last summer.']
  ];
  function revCard(r) {
    var av = /^av-/.test(r[3]) ? '<img src="assets/av/' + r[3] + '.jpg" alt="" loading="lazy" width="36" height="36">' : '<span class="ini">' + r[3] + '</span>';
    return '<li><article class="rv-card' + (r[6] ? ' org' : '') + '" data-ph="review"><p>' + esc(r[5]) + '</p><div class="rv-who">' + av +
      '<span><b>' + esc(r[0]) + '</b>' + esc(r[1]) + '</span><span class="rv-src">' + (r[4] ? '<span class="st">' + r[4] + '</span>' : '') + esc(r[2]) + '</span></div></article></li>';
  }
  $('#rowA').innerHTML = REV_A.map(revCard).join('');
  $('#rowB').innerHTML = REV_B.map(revCard).join('');
  $$('.rv-src .st').forEach(function (s) { var n = (s.textContent.match(/★/g) || []).length; s.setAttribute('aria-label', n + ' out of 5 stars'); });

  /* ================= data pictures ================= */
  (function () {
    var rnd = (function (seed) { return function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; })(42);
    var g = $('#gatePic');
    if (g) {
      var h = '<rect x="0" y="0" width="300" height="120" rx="12" fill="rgba(247,246,241,.04)"/>';
      for (var i = 0; i < 64; i++) h += '<circle cx="' + (12 + rnd() * 196).toFixed(1) + '" cy="' + (12 + rnd() * 96).toFixed(1) + '" r="3.4" fill="#C7E635" opacity="' + (0.55 + rnd() * 0.45).toFixed(2) + '"/>';
      for (var j = 0; j < 10; j++) h += '<circle cx="' + (238 + rnd() * 52).toFixed(1) + '" cy="' + (14 + rnd() * 92).toFixed(1) + '" r="3.4" fill="rgba(247,246,241,.42)"/>';
      h += '<g stroke="rgba(247,246,241,.6)" stroke-width="2"><line x1="222" y1="4" x2="222" y2="44"/><line x1="222" y1="76" x2="222" y2="116"/></g><path d="M214 60h16" stroke="#C7E635" stroke-width="2"/><text x="104" y="116" font-size="9" fill="rgba(247,246,241,.55)" font-weight="700" text-anchor="middle">INSIDE</text><text x="262" y="116" font-size="9" fill="rgba(247,246,241,.55)" font-weight="700" text-anchor="middle">OUTSIDE</text>';
      g.innerHTML = h;
    }
    var l = $('#lockPic');
    if (l) {
      var s = '';
      for (var k = 0; k < 12; k++) { var x = 10 + (k % 6) * 17, y = 22 + Math.floor(k / 6) * 40, on = [0, 1, 2, 4, 5, 6, 7, 9, 10].indexOf(k) >= 0;
        s += '<rect x="' + x + '" y="' + y + '" width="14" height="36" rx="2" fill="' + (on ? '#C7E635' : 'none') + '" stroke="' + (on ? '#C7E635' : 'rgba(247,246,241,.45)') + '" stroke-width="1.6"/><rect x="' + (x + 9) + '" y="' + (y + 16) + '" width="2.4" height="5" rx="1" fill="' + (on ? '#0E1108' : 'rgba(247,246,241,.45)') + '"/>'; }
      l.innerHTML = s;
    }
  })();

  /* ================= app maps drawn in SVG (English, our lake field): crew · fog · dance ================= */
  (function () {
    var BASE = '<rect width="390" height="844" fill="#17201A"/>' +
      '<path d="M220 0h170v250c-50 34-110 30-146 4-30-22-34-70-24-130z" fill="#1B3340"/>' +
      '<path d="M0 560c70-22 130-12 180 10s120 18 210-12v286H0z" fill="#1B261E"/>' +
      '<path d="M30 230c60-24 140-30 200-8l30 120-30 160c-70 22-140 20-200-4z" fill="#203026"/>' +
      '<g fill="#22301F"><circle cx="350" cy="300" r="26"/><circle cx="372" cy="350" r="22"/><circle cx="330" cy="260" r="18"/><circle cx="20" cy="190" r="22"/></g>' +
      '<g fill="none" stroke="#2F3B33" stroke-width="12" stroke-linecap="round"><path d="M-10 720c80-30 160-60 220-130s80-170 70-260"/><path d="M210 590c40 40 90 70 190 80"/></g>' +
      '<rect x="100" y="236" width="132" height="44" rx="8" fill="#2A332C"/>' +
      '<rect x="292" y="358" width="70" height="30" rx="7" fill="#2A332C"/>' +
      '<g fill="#3B463E"><rect x="36" y="604" width="34" height="18" rx="4"/><rect x="78" y="610" width="34" height="18" rx="4"/><rect x="120" y="618" width="34" height="18" rx="4"/></g>' +
      '<rect x="228" y="520" width="56" height="30" rx="8" fill="#C9733A" opacity=".85"/>' +
      '<rect x="156" y="396" width="26" height="18" rx="4" fill="#3B463E"/>';
    var LAB = function (x, y, t, s, cls) { return '<text x="' + x + '" y="' + y + '" class="am-l ' + (cls || '') + '">' + t + (s ? '<tspan x="' + x + '" dy="14" class="am-s">' + s + '</tspan>' : '') + '</text>'; };
    var TOP = '<text x="26" y="44" class="am-sb">21:10</text><text x="24" y="98" class="am-h">Map</text>';
    var TABS = '<rect y="768" width="390" height="76" fill="#0f1210"/><g class="am-tab"><text x="58" y="808">Discover</text><text x="150" y="808">Line-up</text><text x="240" y="808" class="on">Map</text><text x="322" y="808">Me</text></g>';
    var EMO = function (x, y, e, c) { return '<g class="am-em ' + (c || '') + '" transform="translate(' + x + ' ' + y + ')"><circle r="19" fill="#fff" stroke="#C7E635" stroke-width="3"/><text y="7" text-anchor="middle" font-size="20">' + e + '</text></g>'; };
    function build(mode) {
      var s = BASE, extra = '';
      if (mode === 'crew') {
        s += '<path class="am-route" d="M196 700c-8-40-30-60-70-70s-60-10-70-24" fill="none" stroke="#C7E635" stroke-width="4" stroke-linecap="round" stroke-dasharray="2 10"/>';
        s += LAB(110, 226, 'Main Stage', '21:00 · Ellis Rook') + LAB(36, 594, 'Food trucks') + LAB(232, 512, 'Bar');
        s += EMO(72, 590, '🍒', 'bob') + '<circle cx="196" cy="704" r="9" fill="#3B8BFF" stroke="#fff" stroke-width="3"/>';
        s += '<rect x="14" y="664" width="362" height="92" rx="22" fill="#141614" stroke="rgba(255,255,255,.1)"/><text x="30" y="696" class="am-cb">🍒 Line-up Cherry · 80 m</text><text x="30" y="718" class="am-cs">by the food trucks · last seen 3 min ago</text><text x="30" y="738" class="am-cs">No signal? The arrow still points the way.</text>';
        s += '<rect x="250" y="70" width="116" height="34" rx="17" fill="rgba(255,255,255,.1)"/><text x="308" y="92" text-anchor="middle" class="am-pill">Your crew · 3</text>';
      } else if (mode === 'fog') {
        s += LAB(110, 226, 'Main Stage') + LAB(292, 350, 'Forest Stage') + LAB(232, 512, "Sponsor's bar");
        s += '<defs><filter id="fogf" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".011 .016" numOctaves="4" seed="7"/><feColorMatrix values="0 0 0 0 .80  0 0 0 0 .84  0 0 0 0 .82  0 0 0 1.1 -.05"/></filter>' +
          '<filter id="fogb"><feGaussianBlur stdDeviation="16"/></filter>' +
          '<mask id="fogm" maskUnits="userSpaceOnUse" x="0" y="0" width="390" height="844"><rect width="390" height="844" fill="#fff"/><g class="fog-trail" filter="url(#fogb)" fill="#000"><ellipse cx="80" cy="720" rx="120" ry="70"/><ellipse cx="196" cy="740" rx="70" ry="60"/></g></mask></defs>';
        s += '<g mask="url(#fogm)"><rect width="390" height="844" fill="#1d2320" opacity=".9"/><rect width="390" height="844" filter="url(#fogf)" opacity=".38"/></g>';
        s += '<path id="fogpath" d="M196 740c-10-60-40-90-30-150s70-60 70-90-40-60-60-90-30-90 10-150" fill="none" stroke="none"/>';
        s += '<path class="fog-walk" d="" fill="none" stroke="#C7E635" stroke-width="3" stroke-linecap="round" stroke-dasharray="2 9"/>';
        s += '<circle class="fog-me" r="8" fill="#3B8BFF" stroke="#fff" stroke-width="3" cx="196" cy="740"/>';
        s += '<rect x="14" y="676" width="362" height="80" rx="22" fill="#141614" stroke="rgba(255,255,255,.1)"/>' +
          '<circle cx="52" cy="716" r="22" fill="none" stroke="rgba(255,255,255,.14)" stroke-width="6"/><circle class="fog-ring" cx="52" cy="716" r="22" fill="none" stroke="#C7E635" stroke-width="6" stroke-linecap="round" transform="rotate(-90 52 716)" stroke-dasharray="138.2" stroke-dashoffset="80"/>' +
          '<text x="52" y="721" text-anchor="middle" class="am-pc"><tspan class="fog-pc">42</tspan>%</text>' +
          '<text x="88" y="710" class="am-cb">uncovered</text><text x="88" y="732" class="am-cs">3 spots left by the lake</text>';
      } else if (mode === 'dance') {
        s += '<g class="beams"><path d="M166 236 L120 120 L150 118Z" fill="#C7E635" opacity=".35"/><path d="M166 236 L200 112 L224 120Z" fill="#ff5ab4" opacity=".35"/></g>';
        s += '<rect class="stage-glow" x="96" y="230" width="140" height="56" rx="12" fill="none" stroke="#C7E635" stroke-width="4"/>';
        s += '<rect x="104" y="296" width="124" height="22" rx="11" fill="#C7E635"/><text x="166" y="311" text-anchor="middle" class="am-live">LIVE · Main Stage</text>';
        s += '<rect x="262" y="398" width="122" height="34" rx="10" fill="rgba(20,22,20,.9)"/><text x="272" y="413" class="am-l">Forest Stage</text><text x="272" y="426" class="am-s">Next · 22:00</text>';
        s += EMO(148, 418, '🐨', 'bob') + EMO(196, 436, '🦌', 'bob d2') + EMO(70, 590, '🍒', 'bob d3');
        s += LAB(36, 646, 'Food trucks');
      }
      return '<svg viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' + s + TOP + TABS + '</svg>';
    }
    $$('.appmap').forEach(function (el) {
      var mode = el.getAttribute('data-map'); el.innerHTML = build(mode);
      if (mode === 'fog') {
        var trail = $('.fog-trail', el), me = $('.fog-me', el), path = $('#fogpath', el), walk = $('.fog-walk', el), ring = $('.fog-ring', el), pc = $('.fog-pc', el);
        var L = path.getTotalLength ? path.getTotalLength() : 0, base = trail.innerHTML, pts = [];
        function at(k) {
          var q = path.getPointAtLength(L * k);
          me.setAttribute('cx', q.x.toFixed(1)); me.setAttribute('cy', q.y.toFixed(1));
          if (!pts.length || Math.hypot(q.x - pts[pts.length - 1][0], q.y - pts[pts.length - 1][1]) > 18) {
            pts.push([q.x, q.y]);
            trail.insertAdjacentHTML('beforeend', '<circle cx="' + q.x.toFixed(1) + '" cy="' + q.y.toFixed(1) + '" r="46"/>');
          }
          walk.setAttribute('d', 'M' + pts.map(function (p) { return p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' L'));
          var v = Math.round(18 + 24 * k); pc.textContent = v; ring.setAttribute('stroke-dashoffset', (138.2 * (1 - v / 100)).toFixed(1));
        }
        function reset() { trail.innerHTML = base; pts = []; }
        if (reduce || !L) { reset(); for (var t = 0; t <= 1.0001; t += 0.05) at(Math.min(1, t)); return; }
        reset(); at(0);
        var t0 = 0, raf = 0;
        function loop(now) {
          if (!t0) t0 = now; var k = ((now - t0) % 10000) / 8000;
          if (k <= 1) { if (k < 0.012 && pts.length > 2) reset(); at(k); }
          raf = requestAnimationFrame(loop);
        }
        new IntersectionObserver(function (en) { cancelAnimationFrame(raf); if (en[0].isIntersecting) { t0 = 0; reset(); raf = requestAnimationFrame(loop); } }, { threshold: 0.3 }).observe(el);
      }
    });
  })();

  /* ================= 01 hero + 02 kabum: the show goes into the phone, then it lights up three times ================= */
  var hero = $('#top'), stage = $('#stage'), phone = $('#heroPhone'), sticky = $('#stickyCta'), s2 = $('#s2');
  var beatEls = $$('#beats li'), clockEl = $('#hpClock');
  var IMG = { w: 2000, h: 1116, fx: 1290, fy: 560 }; // mouth and mic in the source photo
  var P = {};
  var DESK = { sh: 900, ps: 0.88, fh0: 740, fh1: 844, hdr: 560, cy0: 196, cw: 640, h1: 96, pw: 520, pfs: 20, s2w: 560, h2: 60, s2fs: 19 };
  var MOB = { sh: 844, ps: 0.46, fh0: 740, fh1: 844, hdr: 560, cy0: 84, cw: 342, h1: 44, pw: 330, pfs: 15.5, s2w: 342, h2: 30, s2fs: 14 };
  var heroCtaVisible = true, beat = -2, chromeOn = false;
  function heroProfile() {
    var vw = doc.clientWidth, vh = window.innerHeight;
    var mob = vw < 760;
    var B = mob ? MOB : DESK;
    var s = vh / B.sh;
    if (mob) s = Math.min(vw / 390, vh / B.sh);
    var sw = vw / s, sh = B.sh;
    var k = Math.max(sw / IMG.w, sh / IMG.h), dw = IMG.w * k, dh = IMG.h * k;
    var frameW = 390 * B.ps;
    var gut = mob ? 24 : Math.max(48, Math.min(96, sw * 0.066));
    var wantX = mob ? sw / 2 : Math.max(gut + B.cw + 60 + frameW / 2, sw - Math.max(240, sw * 0.27));
    var offX = clamp(IMG.fx * k - wantX, 0, dw - sw);
    var offY = clamp((dh - sh) * 0.4, 0, dh - sh);
    var focusX = IMG.fx * k - offX, focusY = IMG.fy * k - offY;
    var fx0 = focusX - frameW / 2;
    var copyEl = $('.stage .copy'), copyBottom = copyEl ? copyEl.offsetTop + copyEl.offsetHeight : 330;
    var fy0 = mob ? Math.max(copyBottom + 20, focusY - B.fh0 * B.ps * 0.62) : clamp(focusY - 0.5 * B.fh0 * B.ps, 96, sh - B.fh0 * B.ps - 60);
    var navH = mob ? 64 : 68, topMin = (navH + 18) / s;
    var dockTop = window.innerHeight - 14 - (sticky && mob ? sticky.offsetHeight || 52 : 0);
    var ps1 = B.ps, fy1, s2y;
    if (mob) {
      s2y = (navH + 6) / s;
      var s2Bottom = s2y + (s2 ? s2.offsetHeight : 180);
      var room = (dockTop - 14) / s - (s2Bottom + 12);
      ps1 = clamp(room / B.fh1, 0.4, 0.66);
      fy1 = (dockTop - 14) / s - B.fh1 * ps1;
    } else {
      fy1 = Math.max(topMin, (sh - B.fh1 * B.ps) / 2 + 8);
      s2y = Math.max(topMin, fy1 + B.fh1 * B.ps / 2 - (s2 ? s2.offsetHeight : 420) / 2);
    }
    var fx1 = mob ? sw / 2 - 390 * ps1 / 2 : Math.min(Math.max(fx0, gut + B.s2w + 90), sw - gut - frameW - 20);
    P = { mob: mob, B: B, s: s, sw: sw, sh: sh, fx0: fx0, fx1: fx1, fy0: fy0, fy1: fy1, ps0: B.ps, ps1: ps1 };
    var st = stage.style;
    st.setProperty('--s', s.toFixed(4));
    st.setProperty('--sw', sw.toFixed(1) + 'px'); st.setProperty('--sh', sh + 'px'); st.setProperty('--ps', B.ps);
    st.setProperty('--opx', (-offX).toFixed(1) + 'px'); st.setProperty('--opy', (-offY).toFixed(1) + 'px');
    st.setProperty('--cx', gut + 'px'); st.setProperty('--cy0', B.cy0 + 'px'); st.setProperty('--cw', B.cw + 'px');
    st.setProperty('--h1', B.h1 + 'px'); st.setProperty('--pw', B.pw + 'px'); st.setProperty('--pfs', B.pfs + 'px');
    st.setProperty('--s2x', gut + 'px'); st.setProperty('--s2y', s2y.toFixed(1) + 'px'); st.setProperty('--s2w', B.s2w + 'px');
    st.setProperty('--h2', B.h2 + 'px'); st.setProperty('--s2fs', B.s2fs + 'px');
    st.setProperty('--credit-y', (mob ? fy0 + B.fh0 * B.ps + 12 : sh - 52) + 'px');
    st.setProperty('--fcx', (fx0 + frameW / 2).toFixed(1) + 'px'); st.setProperty('--fcy', (fy0 + B.fh0 * B.ps / 2).toFixed(1) + 'px');
  }
  var BEAT_CLOCK = ['20:58', '20:59', '21:00'];
  var hpVid = $('.hp-vid', phone);
  if (hpVid) hpVid.addEventListener('playing', function () { hpVid.classList.add('ready'); });
  function heroVid(on) {
    if (!hpVid || reduce) return;
    if (on) { hpVid.preload = 'auto'; var pr = hpVid.play(); if (pr && pr.catch) pr.catch(function () {}); }
    else hpVid.pause();
  }
  function setBeat(b) {
    if (b === beat) return;
    var prev = beat; beat = b;
    beatEls.forEach(function (li, i) { li.classList.toggle('on', i === b); });
    phone.classList.toggle('n1', b === 0);
    phone.classList.toggle('map', b === 1);
    phone.classList.toggle('live', b === 2);
    clockEl.textContent = BEAT_CLOCK[Math.max(0, b)] || '20:58';
    if (b === 0 && prev < 0 && !reduce) { phone.classList.remove('buzz'); void phone.offsetWidth; phone.classList.add('buzz'); }
  }
  function heroUpdate() {
    if (!P.B || reduce) return;
    var B = P.B, vh = window.innerHeight;
    var y = clamp(-hero.getBoundingClientRect().top, 0, hero.offsetHeight - vh);
    // 0 → 0.95 vh: the photo becomes the app; then three beats of ~0.31 vh each
    var p = clamp(y / (vh * 0.95), 0, 1);
    var e = clamp((p - 0.5) / 0.36, 0, 1);
    var c = clamp((p - 0.18) / 0.24, 0, 1);
    var s2o = clamp((p - 0.62) / 0.3, 0, 1);
    var tab = clamp((e - 0.45) / 0.45, 0, 1);
    var m = clamp((p - 0.25) / 0.45, 0, 1); m = m * m * (3 - 2 * m);
    var pb = clamp((p - 0.25) / 0.75, 0, 1);
    var fh = lerp(B.fh0, B.fh1, m);
    var hh = fh - (fh - B.hdr) * e;
    var ps = lerp(P.ps0, P.ps1, m);
    var fx = P.mob ? P.sw / 2 - 390 * ps / 2 : lerp(P.fx0, P.fx1, m), fy = lerp(P.fy0, P.fy1, m);
    var st = stage.style;
    st.setProperty('--ps', ps.toFixed(4));
    st.setProperty('--p', pb.toFixed(4));
    st.setProperty('--dim', (0.22 * clamp(p / 0.2, 0, 1)).toFixed(3));
    st.setProperty('--fx', fx.toFixed(1) + 'px'); st.setProperty('--fy', fy.toFixed(1) + 'px');
    st.setProperty('--fh', fh.toFixed(1) + 'px'); st.setProperty('--hh', hh.toFixed(1) + 'px');
    st.setProperty('--cy', (hh - 196 + 8 * e).toFixed(1) + 'px');
    st.setProperty('--phone-bg', e.toFixed(3)); st.setProperty('--scr-op', e.toFixed(3));
    st.setProperty('--tab-op', tab.toFixed(3));
    st.setProperty('--copy-op', (1 - c).toFixed(3)); st.setProperty('--copy-lift', (-50 * c).toFixed(1) + 'px');
    st.setProperty('--credit-op', (1 - clamp((p - 0.12) / 0.12, 0, 1)).toFixed(3));
    st.setProperty('--s2-op', s2o.toFixed(3));
    var chrome = clamp((p - 0.45) / 0.14, 0, 1);
    st.setProperty('--chrome-op', chrome.toFixed(3));
    var on = chrome > 0.9;
    if (on !== chromeOn) {
      chromeOn = on;
      phone.classList.toggle('app', on); phone.classList.toggle('live-ui', on);
      heroVid(on);
      $$('#hpChrome .pill').forEach(function (b) { if (on) b.removeAttribute('tabindex'); else b.setAttribute('tabindex', '-1'); });
    }
    s2.classList.toggle('on', s2o > 0.5);
    s2.setAttribute('aria-hidden', s2o > 0.5 ? 'false' : 'true');
    var by = y - vh * 0.96;
    setBeat(by < 0 ? -1 : Math.min(2, Math.floor(by / (vh * 0.31))));
    heroCtaVisible = c < 0.6;
  }
  // Listen and Going react; Going fires the kit confetti when it is switched on
  $('#hpListen').addEventListener('click', function () { var b = this, on = b.getAttribute('aria-pressed') !== 'true'; b.setAttribute('aria-pressed', on ? 'true' : 'false'); $('span', b).textContent = on ? 'Playing' : 'Listen'; });
  $('#hpGo').addEventListener('click', function () { var b = this, on = b.getAttribute('aria-pressed') !== 'true'; b.setAttribute('aria-pressed', on ? 'true' : 'false'); $('.go-t', b).textContent = on ? 'In plan · Going' : 'Going'; });

  /* ================= nav: sticky pill, menu ================= */
  var formVisible = false;
  function navUpdate() {
    var hd = $('.site-head');
    sticky.classList.toggle('ghost', !P.mob && heroCtaVisible && window.scrollY < hero.offsetHeight * 0.3);
    sticky.classList.toggle('away', formVisible || (P.mob && calcVisible) || (!P.mob && hd.classList.contains('is-hidden')));
  }
  if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { en.forEach(function (x) { formVisible = x.isIntersecting; navUpdate(); }); }, { threshold: 0.15 }).observe($('#generate'));
  if ('MutationObserver' in window) new MutationObserver(function () { navUpdate(); }).observe($('.site-head'), { attributes: true, attributeFilter: ['class'] });
  var calcVisible = false;
  if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { calcVisible = en[0].isIntersecting; navUpdate(); }, { threshold: 0, rootMargin: '-10% 0px -10% 0px' }).observe($('#calc'));
  var menu = $('#menu'), menuBtn = $('#menuBtn');
  function closeMenu() { menu.hidden = true; menuBtn.setAttribute('aria-expanded', 'false'); doc.style.overflow = ''; }
  menuBtn.addEventListener('click', function () { menu.hidden = false; menuBtn.setAttribute('aria-expanded', 'true'); doc.style.overflow = 'hidden'; $('#menuClose').focus(); });
  $('#menuClose').addEventListener('click', function () { closeMenu(); menuBtn.focus(); });
  $$('#menu a').forEach(function (a) { a.addEventListener('click', closeMenu); });
  document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape' && !menu.hidden) { closeMenu(); menuBtn.focus(); } });

  /* ================= 04 claim: six words, 0.9 s each, the last one circled ================= */
  (function () {
    var rot = $('#rot'), rw = $('.rw', rot), claim = $('#claim'); if (!rot) return;
    var WORDS = ['a boring app', 'a legacy app', 'a JPEG', 'an Instagram post', 'a Facebook link', 'a blurry PDF'];
    var t = 0, running = false, vis = false;
    function show(i) {
      rw.textContent = WORDS[i]; rw.classList.remove('flip'); void rw.offsetWidth; rw.classList.add('flip');
      if (i === WORDS.length - 1) { rot.classList.add('landed'); t = setTimeout(function () { running = false; if (vis) run(); }, 5200); }
      else t = setTimeout(function () { show(i + 1); }, 900);
    }
    function run() { if (running || reduce) return; running = true; rot.classList.remove('landed'); show(0); }
    if (reduce) { rot.classList.add('landed'); return; }
    new IntersectionObserver(function (en) { vis = en[0].isIntersecting; if (vis) run(); }, { threshold: 0.5 }).observe(claim);
  })();

  /* ================= on enter: reveals and counters ================= */
  function countUp(el) {
    if (el._done) return; el._done = true;
    var to = +el.getAttribute('data-to');
    if (reduce) { el.textContent = fmt(to); return; }
    var t0 = performance.now(), dur = 700 + Math.min(400, to / 8);
    (function tick(t) {
      var k = clamp((t - t0) / dur, 0, 1); k = 1 - Math.pow(1 - k, 3);
      el.textContent = fmt(to * (0.86 + 0.14 * k));
      if (k < 1) requestAnimationFrame(tick); else el.textContent = fmt(to);
    })(t0);
  }
  var watch = $$('.rv, .panel, .zone-fig');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (en) { en.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add('in'); $$('.cnt', x.target).forEach(countUp); io.unobserve(x.target); } }); }, { threshold: 0.25 });
    watch.forEach(function (el) { io.observe(el); });
  } else watch.forEach(function (el) { el.classList.add('in'); });

  /* ================= videos: play only while on screen, never under reduced motion ================= */
  (function () {
    var vids = $$('video[data-autoplay]');
    vids.forEach(function (v) {
      v.muted = true; v.setAttribute('muted', '');
      var st = parseFloat(v.getAttribute('data-start')); if (st) v.addEventListener('loadedmetadata', function () { try { v.currentTime = st; } catch (e) {} }, { once: true });
      if (reduce) { v.addEventListener('click', function () { if (v.paused) { v.preload = 'auto'; var pr = v.play(); if (pr && pr.catch) pr.catch(function () {}); } else v.pause(); }); }
    });
    if (reduce || !('IntersectionObserver' in window)) return;
    var vo = new IntersectionObserver(function (en) {
      en.forEach(function (x) {
        var v = x.target;
        if (x.isIntersecting) { if (v.preload !== 'auto') { v.preload = 'auto'; } var pr = v.play(); if (pr && pr.catch) pr.catch(function () {}); }
        else if (!v.paused) v.pause();
      });
    }, { threshold: 0.25 });
    vids.forEach(function (v) { vo.observe(v); });
    document.addEventListener('visibilitychange', function () { if (document.hidden) vids.forEach(function (v) { v.pause(); }); });
  })();

  /* ================= 05b calculator: the app is paid for at £4,000, the rest stays with the festival ================= */
  var APP = 4000, PKG = 8000;
  onReady(function () {
    var calc = $('#calc'); if (!calc) return;
    var touched = false;
    function mount() {
      var tot = $('.kcalc__totals', calc); if (!tot || $('.calc-status', calc)) return !!tot;
      var d = document.createElement('div'); d.className = 'calc-status';
      d.innerHTML = '<div class="cs-bar" aria-hidden="true"><i></i><span class="mark"></span></div><div class="cs-labels" aria-hidden="true"><span>£0</span><span>your app · <span data-ph="price">£4,000</span></span><span data-ph="price">£8,000</span></div><p class="cs-line" data-ph="price" aria-live="polite"></p>';
      var kitLive = $('.kcalc__live', calc); if (kitLive) kitLive.parentNode.removeChild(kitLive); // one pricing model: the status line below speaks
      var reach = $('.kcalc__reach', tot);
      tot.insertBefore(d, reach || null);
      return true;
    }
    function render(total) {
      if (!mount()) return;
      $('.cs-bar i', calc).style.setProperty('--w', (total / PKG * 100).toFixed(1) + '%');
      var line = $('.cs-line', calc), h;
      if (!total) h = 'Nothing ticked yet. Start with the tab bar: it\'s on every screen.';
      else if (total < APP) h = 'Package ' + money(total) + ' · ' + money(APP - total) + ' short of paying for your app.';
      else if (total === APP) h = 'Package ' + money(total) + ' · <span class="ok">your app is paid for.</span>';
      else if (total < PKG) h = 'Package ' + money(total) + ' · <span class="ok">your app is paid for</span> · ' + money(total - APP) + ' stays with you.';
      else h = 'Package ' + money(total) + ' · <span class="ok">your app is paid for</span> · ' + money(total - APP) + ' stays with you.<br><span class="cs-big">The sponsor pays for your app. And pays you the same again.</span>';
      line.innerHTML = h;
    }
    calc.addEventListener('calc:change', function (e) { render(e.detail.total); });
    calc.addEventListener('click', function () { touched = true; });
    calc.addEventListener('keydown', function () { touched = true; });
    setTimeout(function () { render(window.KitCalc ? KitCalc.total(calc) : 0); }, 120);
    // show the mechanic once: two places tick themselves when the calculator comes into view
    if ('IntersectionObserver' in window) {
      var o = new IntersectionObserver(function (en) {
        if (!en[0].isIntersecting) return; o.disconnect();
        if (!window.KitCalc) return;
        setTimeout(function () { if (!touched && KitCalc.total(calc) === 0) KitCalc.set(calc, 'tab-bar-logo', true); }, reduce ? 0 : 500);
        setTimeout(function () { if (!touched && KitCalc.total(calc) === 2400) KitCalc.set(calc, 'launch-cover-poster', true); }, reduce ? 0 : 1500);
      }, { threshold: 0.45 });
      o.observe(calc);
    }
  });

  /* ================= 05d the real case: empty, one push, about 1,000 in three minutes ================= */
  (function () {
    var card = $('#caseCard'), vis = $('#caseVis'); if (!card || !vis) return;
    var nEl = $('#caseN'), tEl = $('#caseT'), full = $('.cv-full', vis), raf = 0, timer = 0;
    function set(k) {
      var n = Math.round(60 + 940 * (1 - Math.pow(1 - k, 2.2)));
      nEl.textContent = k >= 1 ? 'about 1,000' : fmt(n);
      tEl.textContent = k <= 0 ? 'minute 0 · push sent' : (k < 1 ? 'minute ' + Math.min(2, Math.floor(k * 3) + 0) + ' · walking in' : '+3 min · zone full');
      full.style.opacity = clamp((k - 0.05) / 0.85, 0, 1).toFixed(3);
    }
    function play() {
      cancelAnimationFrame(raf); clearTimeout(timer);
      card.classList.remove('go'); vis.classList.remove('pushed'); void card.offsetWidth;
      if (reduce) { vis.classList.add('pushed'); card.classList.add('go'); set(1); return; }
      full.style.opacity = '0'; nEl.textContent = '60'; tEl.textContent = 'before the push';
      timer = setTimeout(function () {
        vis.classList.add('pushed'); card.classList.add('go');
        var t0 = performance.now();
        (function f(t) { var k = clamp((t - t0) / 3600, 0, 1); set(k); if (k < 1) raf = requestAnimationFrame(f); })(t0);
      }, 1000);
    }
    $('#caseReplay').addEventListener('click', play);
    if ('IntersectionObserver' in window) { var o = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { o.disconnect(); play(); } }, { threshold: 0.55 }); o.observe(vis); }
    else play();
  })();

  /* ================= 13 FAQ tabs ================= */
  var tabs = $$('#faqTabs [role="tab"]');
  function tabSet(t) { tabs.forEach(function (x) { var on = x === t; x.setAttribute('aria-selected', on ? 'true' : 'false'); x.tabIndex = on ? 0 : -1; $('#' + x.getAttribute('aria-controls')).hidden = !on; }); }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { tabSet(t); });
    t.addEventListener('keydown', function (e) {
      var j = -1, n = tabs.length;
      if (e.key === 'ArrowRight') j = (i + 1) % n; else if (e.key === 'ArrowLeft') j = (i - 1 + n) % n; else if (e.key === 'Home') j = 0; else if (e.key === 'End') j = n - 1;
      if (j >= 0) { e.preventDefault(); tabSet(tabs[j]); tabs[j].focus(); }
    });
  });

  /* ================= 14 mascot: bounce and blink while on screen ================= */
  (function () {
    var m = $('#mascot'); if (!m || reduce || !('IntersectionObserver' in window)) return;
    var src = { d: 'assets/team/claude-code-mascot-down.svg', u: 'assets/team/claude-code-mascot-up.svg', b: 'assets/team/claude-code-mascot-blink.svg' };
    [src.u, src.b].forEach(function (s) { var i = new Image(); i.src = s; });
    var seq = ['d', 'u', 'd', 'u', 'd', 'd', 'b', 'd'], i = 0, timer = 0;
    function step() { m.src = src[seq[i % seq.length]]; i++; timer = setTimeout(step, seq[i % seq.length] === 'b' ? 180 : 420); }
    new IntersectionObserver(function (en) { clearTimeout(timer); if (en[0].isIntersecting) step(); else m.src = src.d; }).observe(m);
  })();

  /* ================= 15 form: the home screen takes the typed name; the kit counts down ================= */
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var fName = $('#fName'), fMail = $('#fMail'), fWeb = $('#fWeb'), fFrom = $('#fFrom'), fTo = $('#fTo'), fGuests = $('#fGuests'), fSpon = $('#fSpon'), fSponC = $('#fSponC'), fSponN = $('#fSponN');
  var pvName = $('#pvName'), pvWelcome = $('#pvWelcome'), pvPartner = $('#pvPartner'), pvCat = $('#pvCat'), pvUrl = $('#pvUrl'), typingT = 0;
  function dateTxt(a, b) {
    var A = a ? new Date(a + 'T12:00:00') : null, Bd = b ? new Date(b + 'T12:00:00') : null;
    if (A && isNaN(A)) A = null; if (Bd && isNaN(Bd)) Bd = null;
    if (A && Bd && Bd > A) {
      if (A.getMonth() === Bd.getMonth()) return A.getDate() + '–' + Bd.getDate() + ' ' + MONTHS[A.getMonth()];
      return A.getDate() + ' ' + MONTHS[A.getMonth()].slice(0, 3) + ' – ' + Bd.getDate() + ' ' + MONTHS[Bd.getMonth()].slice(0, 3);
    }
    if (A) return A.getDate() + ' ' + MONTHS[A.getMonth()];
    return '';
  }
  function preview() {
    var raw = fName.value.trim(), n = raw || 'Your festival';
    pvName.textContent = n;
    var dt = dateTxt(fFrom.value, fTo.value), g = parseInt(String(fGuests.value).replace(/[^\d]/g, ''), 10);
    pvWelcome.textContent = raw ? 'Welcome to ' + raw + '. Your weekend starts here.' : 'Your festival · your dates';
    if (raw && (dt || g > 0)) pvWelcome.textContent = [dt, g > 0 ? fmt(g) + ' guests' : ''].filter(Boolean).join(' · ') + ' · welcome to ' + raw + '.';
    pvUrl.textContent = fWeb.value.trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
    pvPartner.hidden = !fSpon.checked;
    pvCat.textContent = 'Your sponsor' + (fSponC.value ? ' · ' + fSponC.value : '');
    $('#mpName').textContent = n;
    var cd = $('.h-cd'); $('#mpMeta').textContent = (cd && cd.textContent) || 'Pick a date. We\'ll count down.';
  }
  fName.addEventListener('input', function () { preview(); pvName.classList.add('typing'); clearTimeout(typingT); typingT = setTimeout(function () { pvName.classList.remove('typing'); }, 600); });
  [fWeb, fFrom, fTo, fGuests, fSponC, fSponN].forEach(function (el) { el.addEventListener('input', preview); el.addEventListener('change', preview); });
  fFrom.addEventListener('change', function () { if (fFrom.value) { fTo.min = fFrom.value; if (!fTo.value || fTo.value < fFrom.value) { fTo.value = fFrom.value; fTo.dispatchEvent(new Event('input')); } preview(); } });
  document.addEventListener('countdown:change', preview);
  fSpon.addEventListener('change', function () { $('#sponMore').hidden = !fSpon.checked; preview(); });
  function setErr(input, el, msg) { el.textContent = msg; if (msg) { input.setAttribute('aria-invalid', 'true'); input.setAttribute('aria-describedby', el.id); } else input.removeAttribute('aria-invalid'); }
  $('#leadForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var ok = true, mail = fMail.value.trim();
    if (!fName.value.trim()) { setErr(fName, $('#eName'), 'Your festival needs a name. Even a working title.'); ok = false; } else setErr(fName, $('#eName'), '');
    if (!mail) { setErr(fMail, $('#eMail'), 'Where should we send it?'); ok = false; }
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail)) { setErr(fMail, $('#eMail'), 'That address looks a bit off. Check for a typo?'); ok = false; }
    else setErr(fMail, $('#eMail'), '');
    if (!ok) { (fName.getAttribute('aria-invalid') ? fName : fMail).focus(); return; }
    var btn = $('#fBtn'); btn.textContent = 'Building ' + fName.value.trim() + '…'; btn.disabled = true;
    setTimeout(function () {
      $('#tName').textContent = fName.value.trim();
      $('#leadForm').hidden = true; var th = $('#thanks'); th.hidden = false; th.focus({ preventScroll: true });
    }, reduce ? 0 : 700);
  });
  onReady(preview);

  /* ================= scroll loop ================= */
  var ticking = false;
  function frame() { ticking = false; heroUpdate(); navUpdate(); }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }, { passive: true });
  window.addEventListener('resize', function () { heroProfile(); frame(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { heroProfile(); frame(); });
  heroProfile(); frame();
  if (reduce) { setBeat(2); }
})();
