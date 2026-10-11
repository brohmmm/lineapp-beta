/* LineApp R3 kit · feedphone.js — a phone with a TikTok-style vertical artist feed.
   Plays muted MP4/WebM or image cards, moves card by card on its own, a heart pops on like (double-tap or the heart),
   a single tap pauses. Pauses off-screen and in hidden tabs. Reduced motion: one still card, nothing moves by itself.
   <div class="kfeed" data-feed data-interval="4200">
     <article data-feed-card data-video="a.mp4|a.webm" data-poster="a.jpg"> <b class="kfeed__who">Name</b> <span class="kfeed__when">Main Stage · 21:40</span> <p>…</p> </article>
     <article data-feed-card data-img="b.jpg" data-autolike> … </article>
   </div> */
(function () {
  'use strict';
  if (window.KitFeed) return;
  var reduce = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  var HEART = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 20.6s-7.6-4.6-9.4-9.5C1.4 7.6 3.7 4.2 7.2 4.2c2 0 3.6 1.1 4.8 2.9 1.2-1.8 2.8-2.9 4.8-2.9 3.5 0 5.8 3.4 4.6 6.9-1.8 4.9-9.4 9.5-9.4 9.5Z"/></svg>';
  var STAR = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m12 3.3 2.6 5.6 6.1.7-4.5 4.2 1.2 6-5.4-3-5.4 3 1.2-6-4.5-4.2 6.1-.7Z" stroke-linejoin="round"/></svg>';
  var PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M8 5.5v13l10.5-6.5Z"/></svg>';
  var PAUSE = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M7.5 5.5h3v13h-3zM13.5 5.5h3v13h-3z"/></svg>';

  function esc(s) { return String(s).replace(/"/g, '&quot;'); }

  function setup(root) {
    if (root.__kfeed) return; root.__kfeed = true;
    var cards = Array.prototype.slice.call(root.querySelectorAll('[data-feed-card]'));
    if (!cards.length) return;
    var interval = Math.max(2500, parseFloat(root.getAttribute('data-interval') || '4200'));
    var label = root.getAttribute('data-label') || 'Artist feed';
    var clock = root.getAttribute('data-clock') || '21:40';
    var still = reduce.matches;
    root.classList.add('kfeed'); if (still) root.classList.add('is-still');
    root.style.setProperty('--kfeed-interval', interval + 'ms');

    var phone = document.createElement('div'); phone.className = 'kfeed__phone';
    var screen = document.createElement('div'); screen.className = 'kfeed__screen'; screen.tabIndex = 0;
    screen.setAttribute('role', 'region'); screen.setAttribute('aria-roledescription', 'feed'); screen.setAttribute('aria-label', label + '. Space pauses, up and down arrows move, L likes.');
    var track = document.createElement('div'); track.className = 'kfeed__track';
    var n = cards.length;

    function buildCard(c, i, clone) {
      var el = document.createElement('div'); el.className = 'kfeed__card';
      if (clone) el.setAttribute('aria-hidden', 'true');
      else { el.setAttribute('role', 'group'); el.setAttribute('aria-roledescription', 'card'); el.setAttribute('aria-label', (i + 1) + ' of ' + n); }
      var media;
      var vid = c.getAttribute('data-video'), img = c.getAttribute('data-img'), poster = c.getAttribute('data-poster') || img || '';
      if (vid) {
        media = document.createElement('video');
        media.muted = true; media.defaultMuted = true; media.setAttribute('muted', ''); media.playsInline = true; media.setAttribute('playsinline', '');
        media.loop = true; media.preload = i === 0 ? 'auto' : 'metadata'; if (poster) media.poster = poster;
        media.setAttribute('aria-hidden', 'true'); media.disablePictureInPicture = true;
        vid.split('|').forEach(function (u) {
          u = u.trim(); if (!u) return;
          var s = document.createElement('source'); s.src = u;
          s.type = /\.webm(\?|$)/i.test(u) ? 'video/webm' : /\.mp4(\?|$)/i.test(u) ? 'video/mp4' : '';
          if (!s.type) s.removeAttribute('type');
          media.appendChild(s);
        });
        media.addEventListener('error', function () {}, true);
      } else {
        media = document.createElement('img'); media.src = img || poster; media.alt = c.getAttribute('data-alt') || ''; media.decoding = 'async';
        if (i > 1) media.loading = 'lazy';
      }
      media.className = 'kfeed__media';
      el.appendChild(media);
      var meta = document.createElement('div'); meta.className = 'kfeed__meta';
      meta.innerHTML = c.innerHTML;
      el.appendChild(meta);
      el.appendChild(Object.assign(document.createElement('span'), { className: 'kfeed__bar' }));
      return el;
    }
    var els = cards.map(function (c, i) { return buildCard(c, i, false); });
    els.forEach(function (e) { track.appendChild(e); });
    var cloneEl = n > 1 ? buildCard(cards[0], 0, true) : null;
    if (cloneEl) track.appendChild(cloneEl);

    var top = document.createElement('div'); top.className = 'kfeed__top'; top.setAttribute('aria-hidden', 'true');
    top.innerHTML = '<span class="kfeed__status"><b>' + clock + '</b><i class="kfeed__island"></i><span class="kfeed__sig"><i></i><i></i><i></i><i></i></span></span>' +
      '<span class="kfeed__tabs"><span>Line-up</span><span class="is-on">For you</span></span>';
    var rail = document.createElement('div'); rail.className = 'kfeed__rail';
    rail.innerHTML = '<button type="button" class="kfeed__like" aria-pressed="false" aria-label="Like">' + HEART + '<span class="kfeed__num">0</span></button>' +
      '<button type="button" class="kfeed__fav" aria-pressed="false" aria-label="Add to favourites">' + STAR + '<span class="kfeed__num kfeed__favtxt">Save</span></button>';
    var big = document.createElement('div'); big.className = 'kfeed__big'; big.setAttribute('aria-hidden', 'true');
    var glyph = document.createElement('div'); glyph.className = 'kfeed__glyph'; glyph.setAttribute('aria-hidden', 'true');
    var live = document.createElement('p'); live.className = 'kfeed__sr'; live.setAttribute('aria-live', 'polite');
    screen.appendChild(track); screen.appendChild(top); screen.appendChild(rail); screen.appendChild(big); screen.appendChild(glyph); screen.appendChild(live);
    phone.appendChild(screen);
    cards.forEach(function (c) { c.parentNode.removeChild(c); });
    root.appendChild(phone);

    var likeBtn = rail.querySelector('.kfeed__like'), favBtn = rail.querySelector('.kfeed__fav');
    var likes = cards.map(function (c) { return parseInt(c.getAttribute('data-likes') || '0', 10) || 0; });
    var liked = cards.map(function () { return false; }), faved = cards.map(function () { return false; });
    var cur = 0, paused = false, inView = false, timer = 0, t0 = 0, left = interval, autoliked = {};
    var nf; try { nf = new Intl.NumberFormat('en-GB', { notation: 'compact', maximumFractionDigits: 1 }); } catch (e) { nf = { format: String }; }

    function vids() { return Array.prototype.slice.call(track.querySelectorAll('video')); }
    function syncRail() {
      likeBtn.setAttribute('aria-pressed', liked[cur] ? 'true' : 'false');
      likeBtn.querySelector('.kfeed__num').textContent = nf.format(likes[cur] + (liked[cur] ? 1 : 0));
      favBtn.setAttribute('aria-pressed', faved[cur] ? 'true' : 'false');
      favBtn.querySelector('.kfeed__favtxt').textContent = faved[cur] ? 'Saved' : 'Save';
    }
    function playCurrent() {
      vids().forEach(function (v) {
        var mine = v.parentNode === els[cur];
        if (mine && !paused && inView && !document.hidden && !still) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
        else if (!v.paused) v.pause();
      });
    }
    function go(i, instant) {
      var wrap = false;
      if (i >= n) { i = n; wrap = true; }
      if (i < 0) i = n - 1;
      track.classList.toggle('is-instant', !!instant || still);
      track.style.transform = 'translate3d(0,' + (-i * 100) + '%,0)';
      cur = wrap ? 0 : i;
      els.forEach(function (e, k) { e.classList.toggle('is-on', k === cur && !wrap); });
      if (cloneEl) cloneEl.classList.toggle('is-on', wrap);
      if (wrap) setTimeout(function () { track.classList.add('is-instant'); track.style.transform = 'translate3d(0,0,0)'; els[0].classList.add('is-on'); cloneEl.classList.remove('is-on'); void track.offsetHeight; track.classList.remove('is-instant'); }, 620);
      var v = els[cur].querySelector('video'); if (v) { try { v.currentTime = 0; } catch (e) {} }
      syncRail(); playCurrent();
      var who = els[cur].querySelector('.kfeed__who');
      live.textContent = (who ? who.textContent + '. ' : '') + (cur + 1) + ' of ' + n;
      left = interval; schedule();
      root.dispatchEvent(new CustomEvent('feed:change', { bubbles: true, detail: { index: cur } }));
      if (cards[cur].hasAttribute('data-autolike') && !autoliked[cur] && !still && !root.classList.contains('is-manual')) {
        autoliked[cur] = true;
        var k = cur; setTimeout(function () { if (cur === k && !paused && !liked[k]) like(true); }, Math.min(1800, interval * .45));
      }
    }
    function schedule() {
      clearTimeout(timer);
      var run = !paused && inView && !document.hidden && !still && n > 1;
      root.classList.toggle('is-running', run);
      els.forEach(function (e) { e.classList.remove('is-timing'); });
      if (!run) return;
      void els[cur].offsetWidth; els[cur].classList.add('is-timing');
      t0 = performance.now();
      timer = setTimeout(function () { go(cur + 1); }, left);
    }
    function setPaused(p, show) {
      if (paused === p) return;
      if (p && root.classList.contains('is-running')) left = Math.max(600, left - (performance.now() - t0));
      paused = p; root.classList.toggle('is-paused', p);
      if (show) { glyph.innerHTML = p ? PAUSE : PLAY; glyph.classList.remove('is-show'); void glyph.offsetWidth; glyph.classList.add('is-show'); }
      playCurrent(); schedule();
    }
    function burst(x, y) {
      if (still) return;
      var r = screen.getBoundingClientRect();
      var h = document.createElement('span'); h.className = 'kfeed__pop'; h.innerHTML = HEART;
      h.style.left = (x == null ? r.width / 2 : x - r.left) + 'px'; h.style.top = (y == null ? r.height * .46 : y - r.top) + 'px';
      h.style.setProperty('--rot', (Math.random() * 30 - 15).toFixed(1) + 'deg');
      big.appendChild(h);
      setTimeout(function () { if (h.parentNode) h.parentNode.removeChild(h); }, 1000);
    }
    function like(on, x, y) {
      if (on == null) on = !liked[cur];
      liked[cur] = on; syncRail();
      if (on) {
        burst(x, y);
        if (!still) { likeBtn.classList.remove('is-pop'); void likeBtn.offsetWidth; likeBtn.classList.add('is-pop'); }
      }
    }
    likeBtn.addEventListener('click', function (e) { e.stopPropagation(); root.classList.add('is-manual'); like(); });
    favBtn.addEventListener('click', function (e) {
      e.stopPropagation(); root.classList.add('is-manual'); faved[cur] = !faved[cur]; syncRail();
      if (faved[cur] && !still) { favBtn.classList.remove('is-pop'); void favBtn.offsetWidth; favBtn.classList.add('is-pop'); }
    });
    var clickT = 0;
    screen.addEventListener('click', function (e) {
      if (e.target.closest('button,a')) return;
      root.classList.add('is-manual');
      if (clickT) { clearTimeout(clickT); clickT = 0; like(true, e.clientX, e.clientY); return; }
      clickT = setTimeout(function () { clickT = 0; if (still) { var v = els[cur].querySelector('video'); if (v) { if (v.paused) { var p = v.play(); if (p && p.catch) p.catch(function () {}); } else v.pause(); } return; } setPaused(!paused, true); }, 260);
    });
    screen.addEventListener('keydown', function (e) {
      if (e.target !== screen) return;
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); root.classList.add('is-manual'); setPaused(!paused, true); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); go(cur + 1 >= n ? 0 : cur + 1, cur + 1 >= n); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); go(cur - 1 < 0 ? n - 1 : cur - 1, cur - 1 < 0); }
      else if (e.key === 'l' || e.key === 'L') { e.preventDefault(); root.classList.add('is-manual'); like(); }
    });
    document.addEventListener('visibilitychange', function () { playCurrent(); schedule(); });
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { inView = es[0].isIntersecting; playCurrent(); schedule(); }, { threshold: .5 }).observe(phone);
    else inView = true;
    go(0, true);
    root.__kfeedApi = { go: go, like: like, pause: setPaused, current: function () { return cur; }, paused: function () { return paused; }, liked: function () { return liked[cur]; } };
    void esc;
  }

  function init(scope) { (scope || document).querySelectorAll('[data-feed]').forEach(setup); }
  window.KitFeed = {
    init: init,
    next: function (el) { if (el.__kfeedApi) el.__kfeedApi.go(el.__kfeedApi.current() + 1); },
    pause: function (el, p) { if (el.__kfeedApi) el.__kfeedApi.pause(p !== false, true); },
    current: function (el) { return el.__kfeedApi ? el.__kfeedApi.current() : -1; },
    isPaused: function (el) { return el.__kfeedApi ? el.__kfeedApi.paused() : false; },
    isLiked: function (el) { return el.__kfeedApi ? el.__kfeedApi.liked() : false; }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { init(); });
  else init();
})();
