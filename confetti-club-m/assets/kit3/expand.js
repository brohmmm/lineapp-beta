/* LineApp R3 kit · expand.js — click a card, it grows into a big white card in place (FLIP), with logo, facts and quote.
   The other cards dim. Prev/next inside, Esc or × to close, focus returns to the card. Phones: a full-width sheet.
   <div class="kexp" data-expand> <article class="kexp__item"> logo, name, meta, <div class="kexp__more">…</div> </article> … </div>
   No dependencies. Reduced motion: a short fade instead of the grow. */
(function () {
  'use strict';
  if (window.KitExpand) return;
  var reduce = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  var sheetMQ = window.matchMedia ? matchMedia('(max-width: 640px)') : { matches: false };
  var uid = 0;
  var DUR = 460, EASE = 'cubic-bezier(.2,.8,.2,1)';

  function q(s, r) { return (r || document).querySelector(s); }
  function qa(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function focusables(r) { return qa('a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])', r).filter(function (e) { return e.offsetParent !== null || e === document.activeElement; }); }

  function setup(root) {
    if (root.__kexp) return; root.__kexp = true;
    var id = 'kexp' + (++uid);
    var items = qa(':scope > .kexp__item, :scope > [data-expand-item]', root);
    if (!items.length) return;
    var closeLabel = root.getAttribute('data-close-label') || 'Close';
    root.classList.add('kexp');
    var grid = root;

    items.forEach(function (it, i) {
      it.classList.add('kexp__item');
      var name = (q('.kexp__name', it) || it).textContent.trim();
      var more = q('.kexp__more', it); if (more) more.hidden = true;
      var hit = document.createElement('button'); hit.type = 'button'; hit.className = 'kexp__hit';
      hit.setAttribute('aria-label', (it.getAttribute('data-expand-label') || name) + (root.getAttribute('data-more-label') ? ', ' + root.getAttribute('data-more-label') : ', more'));
      hit.setAttribute('aria-expanded', 'false'); hit.setAttribute('aria-controls', id + '-panel');
      hit.innerHTML = '<span class="kexp__plus" aria-hidden="true"><svg viewBox="0 0 20 20"><path d="M10 5.5v9M5.5 10h9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></span>';
      hit.addEventListener('click', function (e) { e.stopPropagation(); if (cur === i) close(); else if (cur >= 0) show(i, true); else open(i); });
      it.appendChild(hit);
    });

    var panel = document.createElement('div');
    panel.className = 'kexp__panel'; panel.id = id + '-panel'; panel.hidden = true; panel.tabIndex = -1;
    panel.setAttribute('role', 'dialog');
    panel.innerHTML = '<div class="kexp__pin"><div class="kexp__content"></div>' +
      '<div class="kexp__nav"><button type="button" class="kexp__prev" aria-label="Previous"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M12 4.5 6.5 10l5.5 5.5" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg></button>' +
      '<span class="kexp__count" aria-live="polite"></span>' +
      '<button type="button" class="kexp__next" aria-label="Next"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M8 4.5 13.5 10 8 15.5" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg></button></div>' +
      '<button type="button" class="kexp__close" aria-label="' + closeLabel + '"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="m5.5 5.5 9 9m0-9-9 9" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></svg></button></div>';
    root.appendChild(panel);
    var scrim = document.createElement('div'); scrim.className = 'kexp__scrim'; scrim.hidden = true;
    document.body.appendChild(scrim);
    var content = q('.kexp__content', panel), count = q('.kexp__count', panel);
    var cur = -1, busy = false, lastFocus = null, sheet = false, scrollY0 = 0;

    function fill(i) {
      var it = items[i], logo = q('.kexp__logo img, img.kexp__logo', it);
      var name = q('.kexp__name', it), meta = q('.kexp__meta', it), more = q('.kexp__more', it);
      var html = '<header class="kexp__head">';
      if (logo) {
        var src = logo.getAttribute('data-dark') || logo.getAttribute('src');
        var cls = 'kexp__plogo' + (!logo.getAttribute('data-dark') && logo.hasAttribute('data-invert') ? ' is-invert' : '');
        html += '<div class="' + cls + '" style="--s:' + (logo.getAttribute('data-panel-scale') || logo.style.getPropertyValue('--s') || 1) + '"><img src="' + src + '" alt="' + (logo.getAttribute('alt') || '').replace(/"/g, '&quot;') + '"></div>';
      }
      html += '<div class="kexp__titles"><h3 id="' + id + '-t">' + (name ? name.innerHTML : '') + '</h3>' + (meta ? '<p>' + meta.innerHTML + '</p>' : '') + '</div></header>';
      html += '<div class="kexp__body">' + (more ? more.innerHTML : '') + '</div>';
      content.innerHTML = html;
      panel.setAttribute('aria-labelledby', id + '-t');
      count.textContent = (i + 1) + ' / ' + items.length;
    }
    function rel(r, base) { return { x: r.left - base.left, y: r.top - base.top, w: r.width, h: r.height }; }
    function placeInline(i) {
      var it = items[i], rb = root.getBoundingClientRect(), rc = it.getBoundingClientRect();
      var w = Math.min(rb.width, parseFloat(getComputedStyle(root).getPropertyValue('--kexp-panel-w')) || 960);
      panel.style.width = w + 'px';
      panel.style.left = Math.round((rb.width - w) / 2) + 'px';
      panel.style.top = '0px';
      var ph = panel.offsetHeight;
      root.style.minHeight = '';
      var gh = root.offsetHeight;
      if (ph > gh) root.style.minHeight = ph + 'px';
      gh = Math.max(gh, ph);
      var top = (rc.top - rb.top) + rc.height / 2 - ph / 2;
      top = Math.max(0, Math.min(gh - ph, top));
      panel.style.top = Math.round(top) + 'px';
    }
    function setState(i) {
      items.forEach(function (it, k) {
        it.classList.toggle('is-lifted', k === i); it.classList.toggle('is-dim', i >= 0 && k !== i);
        q('.kexp__hit', it).setAttribute('aria-expanded', k === i ? 'true' : 'false');
      });
      root.classList.toggle('is-open', i >= 0);
    }

    function open(i) {
      if (busy) return;
      // round 4 fix: a fade-out left over from the last close (fill: forwards) kept the card's content at opacity 0
      if (content.parentNode.getAnimations) content.parentNode.getAnimations().forEach(function (an) { an.cancel(); });
      lastFocus = items[i].querySelector('.kexp__hit');
      sheet = sheetMQ.matches;
      cur = i; fill(i);
      panel.hidden = false; panel.classList.toggle('is-sheet', sheet);
      panel.setAttribute('aria-modal', sheet ? 'true' : 'false');
      if (sheet) {
        scrollY0 = window.scrollY;
        document.documentElement.classList.add('kexp-locked');
        scrim.hidden = false; requestAnimationFrame(function () { scrim.classList.add('is-on'); });
        panel.style.cssText = '';
        if (!reduce.matches) {
          panel.animate([{ transform: 'translateY(100%)' }, { transform: 'none' }], { duration: 380, easing: EASE });
        }
        setState(i);
      } else {
        placeInline(i);
        setState(i);
        var first = rel(items[i].getBoundingClientRect(), panel.getBoundingClientRect());
        var pr = panel.getBoundingClientRect();
        if (!reduce.matches && panel.animate) {
          busy = true;
          var sx = first.w / pr.width, sy = first.h / pr.height, r = 22;
          content.parentNode.style.opacity = '0';
          var a = panel.animate([
            { transform: 'translate(' + first.x + 'px,' + first.y + 'px) scale(' + sx + ',' + sy + ')', borderRadius: (r / sx) + 'px / ' + (r / sy) + 'px', backgroundColor: getComputedStyle(items[i]).backgroundColor },
            { transform: 'none', borderRadius: '28px', backgroundColor: getComputedStyle(panel).backgroundColor }
          ], { duration: DUR, easing: EASE });
          a.onfinish = function () { busy = false; };
          content.parentNode.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 260, delay: DUR * .45, easing: 'ease-out', fill: 'backwards' })
            .onfinish = function () { content.parentNode.style.opacity = ''; };
          setTimeout(function () { content.parentNode.style.opacity = ''; }, 30);
        } else if (panel.animate) {
          panel.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 140 });
        }
        var vr = panel.getBoundingClientRect();
        if (vr.top < 0 || vr.bottom > window.innerHeight) panel.scrollIntoView({ block: vr.height > window.innerHeight ? 'start' : 'center', behavior: reduce.matches ? 'auto' : 'smooth' });
      }
      panel.focus({ preventScroll: true });
      document.addEventListener('keydown', onKey, true);
      document.addEventListener('click', onDoc, true);
      root.dispatchEvent(new CustomEvent('expand:open', { bubbles: true, detail: { index: i } }));
    }
    function show(i, focusPanel) {
      if (cur < 0) return open(i);
      i = (i + items.length) % items.length;
      cur = i; fill(i); setState(i);
      if (!sheet) placeInline(i);
      if (!reduce.matches && content.animate) content.animate([{ opacity: 0, transform: 'translateX(10px)' }, { opacity: 1, transform: 'none' }], { duration: 240, easing: 'ease-out' });
      lastFocus = items[i].querySelector('.kexp__hit');
      if (focusPanel) panel.focus({ preventScroll: true });
    }
    function close() {
      if (cur < 0) return;
      var i = cur; cur = -1;
      document.removeEventListener('keydown', onKey, true);
      document.removeEventListener('click', onDoc, true);
      var done = function () {
        panel.hidden = true; panel.style.cssText = ''; root.style.minHeight = ''; busy = false;
        if (content.parentNode.getAnimations) content.parentNode.getAnimations().forEach(function (an) { an.cancel(); });
        setState(-1);
        if (lastFocus) lastFocus.focus({ preventScroll: true });
        root.dispatchEvent(new CustomEvent('expand:close', { bubbles: true, detail: { index: i } }));
      };
      if (sheet) {
        scrim.classList.remove('is-on');
        var fin = function () { scrim.hidden = true; document.documentElement.classList.remove('kexp-locked'); window.scrollTo({ top: scrollY0, behavior: 'instant' }); done(); };
        if (!reduce.matches && panel.animate) panel.animate([{ transform: 'none' }, { transform: 'translateY(100%)' }], { duration: 260, easing: 'cubic-bezier(.4,0,.8,.4)' }).onfinish = fin;
        else fin();
        return;
      }
      if (!reduce.matches && panel.animate) {
        busy = true;
        var pr = panel.getBoundingClientRect(), last = rel(items[i].getBoundingClientRect(), pr);
        var sx = last.w / pr.width, sy = last.h / pr.height;
        content.parentNode.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 120, fill: 'forwards' });
        items[i].classList.remove('is-lifted');
        items.forEach(function (it) { it.classList.remove('is-dim'); });
        panel.animate([
          { transform: 'none', borderRadius: '28px', backgroundColor: getComputedStyle(panel).backgroundColor },
          { transform: 'translate(' + last.x + 'px,' + last.y + 'px) scale(' + sx + ',' + sy + ')', borderRadius: (22 / sx) + 'px / ' + (22 / sy) + 'px', backgroundColor: getComputedStyle(items[i]).backgroundColor }
        ], { duration: DUR * .8, easing: EASE }).onfinish = done;
      } else done();
    }
    function onKey(e) {
      if (e.key === 'Escape') { e.preventDefault(); close(); return; }
      if (!panel.contains(document.activeElement) && document.activeElement !== panel) return;
      if (e.key === 'ArrowRight' && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) { e.preventDefault(); show(cur + 1); }
      else if (e.key === 'ArrowLeft' && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) { e.preventDefault(); show(cur - 1); }
      else if (e.key === 'Tab' && sheet) {
        var f = focusables(panel); if (!f.length) return;
        var a = f[0], z = f[f.length - 1];
        if (e.shiftKey && (document.activeElement === a || document.activeElement === panel)) { e.preventDefault(); z.focus(); }
        else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
      }
    }
    function onDoc(e) {
      if (panel.contains(e.target)) return;
      if (e.target.closest && e.target.closest('.kexp__hit') && root.contains(e.target)) return; // handled by the card
      close();
    }
    q('.kexp__close', panel).addEventListener('click', close);
    q('.kexp__prev', panel).addEventListener('click', function () { show(cur - 1); });
    q('.kexp__next', panel).addEventListener('click', function () { show(cur + 1); });
    window.addEventListener('resize', function () { if (cur >= 0 && !sheet) placeInline(cur); });

    root.__kexpApi = { open: open, close: close, show: show, current: function () { return cur; } };
    void grid;
  }

  function init(scope) { (scope || document).querySelectorAll('[data-expand]').forEach(setup); }
  window.KitExpand = {
    init: init,
    open: function (el, i) { if (el.__kexpApi) el.__kexpApi.open(i || 0); },
    close: function (el) { if (el.__kexpApi) el.__kexpApi.close(); },
    current: function (el) { return el.__kexpApi ? el.__kexpApi.current() : -1; }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { init(); });
  else init();
})();
