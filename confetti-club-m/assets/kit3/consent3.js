/* LineApp R3 kit · consent3.js — the consent hand-off in three plain steps: scan → choose → done.
   It steps by itself while in view, until the visitor clicks a step. Each step has a small built-in picture
   (or your own image with data-img). Reduced motion: no auto-stepping, pictures stand still.
   <div class="kcs" data-consent3 data-brand="the brand">
     <ol><li><b>Scan</b><span>…</span></li><li><b>Choose</b><span>…</span></li><li><b>Done</b><span>…</span></li></ol>
   </div> */
(function () {
  'use strict';
  if (window.KitConsent) return;
  var reduce = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  var uid = 0;

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function qr() { // a decorative code: three finder squares + a fixed pseudo-random pattern (it does not scan)
    var n = 21, s = '', seed = 7;
    function rnd() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
    function finder(x, y) { return '<path d="M' + x + ' ' + y + 'h7v7h-7z M' + (x + 1) + ' ' + (y + 1) + 'v5h5v-5z" fill-rule="evenodd"/><rect x="' + (x + 2) + '" y="' + (y + 2) + '" width="3" height="3"/>'; }
    for (var y = 0; y < n; y++) for (var x = 0; x < n; x++) {
      var inF = (x < 8 && y < 8) || (x > 12 && y < 8) || (x < 8 && y > 12);
      if (!inF && rnd() > .52) s += '<rect x="' + x + '" y="' + y + '" width="1" height="1"/>';
    }
    return '<svg class="kcs__qr" viewBox="-1 -1 23 23" aria-hidden="true" focusable="false"><rect x="-1" y="-1" width="23" height="23" fill="#fff"/><g fill="#0B0C0E">' + finder(0, 0) + finder(14, 0) + finder(0, 14) + s + '</g></svg>';
  }
  function art(kind, brand) {
    if (kind === 0) return '<div class="kcs__art kcs__art--scan"><div class="kcs__finder">' + qr() + '<i class="kcs__c kcs__c1"></i><i class="kcs__c kcs__c2"></i><i class="kcs__c kcs__c3"></i><i class="kcs__c kcs__c4"></i><i class="kcs__beam"></i></div><p class="kcs__cue">Point the camera at the code</p></div>';
    if (kind === 1) return '<div class="kcs__art kcs__art--choose"><div class="kcs__sheet"><i class="kcs__grab"></i><b>Share your number with ' + esc(brand) + '?</b>' +
      '<p>Only for this festival’s offers. You can take it back any time.</p>' +
      '<div class="kcs__row"><span>Share my number</span><span class="kcs__switch" aria-hidden="true"><i></i></span></div>' +
      '<span class="kcs__btn">Share</span><span class="kcs__no">Not now</span></div></div>';
    return '<div class="kcs__art kcs__art--done"><span class="kcs__badge"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="12"/><path d="M7.35 12.35 10.55 15.5 16.75 8.95" pathLength="1" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></span>' +
      '<b>Shared with ' + esc(brand) + '</b><p>Saved with the time you said yes.</p><span class="kcs__link">Take it back</span></div>';
  }

  function setup(root) {
    if (root.__kcs) return; root.__kcs = true;
    var id = 'kcs' + (++uid);
    var steps = Array.prototype.slice.call(root.querySelectorAll('li'));
    if (!steps.length) return;
    var brand = root.getAttribute('data-brand') || 'the brand';
    var interval = Math.max(2500, parseFloat(root.getAttribute('data-interval') || '3800'));
    root.classList.add('kcs');
    root.style.setProperty('--kcs-interval', interval + 'ms');
    var list = steps[0].parentNode; list.classList.add('kcs__steps'); list.setAttribute('role', 'tablist'); list.setAttribute('aria-label', root.getAttribute('data-label') || 'How consent works');
    var stage = document.createElement('div'); stage.className = 'kcs__stage';
    var panels = steps.map(function (li, i) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'kcs__step'; b.id = id + '-s' + i;
      b.setAttribute('role', 'tab'); b.setAttribute('aria-controls', id + '-p' + i);
      b.innerHTML = '<span class="kcs__num" aria-hidden="true">' + (i + 1) + '</span><span class="kcs__txt">' + li.innerHTML + '</span><i class="kcs__prog" aria-hidden="true"></i>';
      li.innerHTML = ''; li.setAttribute('role', 'presentation'); li.appendChild(b);
      var p = document.createElement('div'); p.className = 'kcs__panel'; p.id = id + '-p' + i; p.setAttribute('role', 'tabpanel'); p.setAttribute('aria-labelledby', b.id);
      var img = li.getAttribute('data-img');
      p.innerHTML = img ? '<img class="kcs__img" src="' + esc(img) + '" alt="' + esc(li.getAttribute('data-alt') || '') + '">' : art(i % 3, brand);
      if (!img) p.setAttribute('aria-hidden', 'false');
      stage.appendChild(p);
      b.addEventListener('click', function () { stop(); go(i); });
      b.addEventListener('keydown', function (e) {
        var j = -1;
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') j = (i + 1) % steps.length;
        else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') j = (i - 1 + steps.length) % steps.length;
        else if (e.key === 'Home') j = 0; else if (e.key === 'End') j = steps.length - 1;
        if (j >= 0) { e.preventDefault(); stop(); go(j); steps[j].querySelector('button').focus(); }
      });
      return p;
    });
    root.appendChild(stage);
    var say = document.createElement('p'); say.className = 'kcs__say'; say.setAttribute('aria-hidden', 'true'); root.appendChild(say);
    var btns = steps.map(function (li) { return li.querySelector('button'); });
    var cur = -1, auto = !reduce.matches && root.getAttribute('data-auto') !== 'false', timer = 0, inView = false;

    function go(i) {
      cur = i;
      btns.forEach(function (b, k) { var on = k === i; b.setAttribute('aria-selected', on ? 'true' : 'false'); b.tabIndex = on ? 0 : -1; b.parentNode.classList.toggle('is-on', on); b.parentNode.classList.toggle('is-past', k < i); });
      panels.forEach(function (p, k) { var on = k === i; p.hidden = !on; p.classList.remove('is-on'); if (on) { void p.offsetWidth; p.classList.add('is-on'); } });
      root.setAttribute('data-step', String(i));
      var sp = btns[i].querySelector('.kcs__txt span'); say.textContent = sp ? sp.textContent : '';
      root.classList.remove('is-ticking'); void root.offsetWidth; if (auto && inView) root.classList.add('is-ticking');
      root.dispatchEvent(new CustomEvent('consent3:step', { bubbles: true, detail: { index: i } }));
      schedule();
    }
    function schedule() {
      clearTimeout(timer);
      if (!auto || !inView || document.hidden) { root.classList.remove('is-ticking'); return; }
      timer = setTimeout(function () { go((cur + 1) % steps.length); }, cur === steps.length - 1 ? interval * 1.25 : interval);
    }
    function stop() { auto = false; clearTimeout(timer); root.classList.remove('is-ticking'); root.classList.add('is-manual'); }
    document.addEventListener('visibilitychange', schedule);
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) {
      var was = inView; inView = es[0].isIntersecting;
      if (inView && !was && auto) go(cur < 0 ? 0 : cur); else schedule();
    }, { threshold: .45 }).observe(root);
    else inView = true;
    go(0);
    root.__kcsApi = { go: function (i) { stop(); go(i); }, current: function () { return cur; }, auto: function () { return auto; } };
  }

  function init(scope) { (scope || document).querySelectorAll('[data-consent3]').forEach(setup); }
  window.KitConsent = {
    init: init,
    go: function (el, i) { if (el.__kcsApi) el.__kcsApi.go(i); },
    current: function (el) { return el.__kcsApi ? el.__kcsApi.current() : -1; },
    isAuto: function (el) { return el.__kcsApi ? el.__kcsApi.auto() : false; }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { init(); });
  else init();
})();
