/*! LineApp R2 kit · overlay.js · large modal overlay. Standalone, no dependencies.
 *  <a href="#report" data-overlay="#report">Open the example report</a>
 *  <template id="report"><h2>Example report</h2>…</template>   (or any hidden element)
 *  Close: × button, Esc, click on the scrim, or any [data-overlay-close] inside the content.
 *  The page never scrolls: scroll is locked without layout shift and restored exactly; focus is trapped and restored.
 */
(function (win, doc) {
  'use strict';
  if (win.KitOverlay) return;

  var FOCUSABLE = 'a[href],area[href],button:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled]),' +
    'textarea:not([disabled]),iframe,audio[controls],video[controls],[contenteditable="true"],[tabindex]:not([tabindex="-1"])';
  var DUR = 240, uid = 0;
  var root, panel, body, closeBtn;
  var state = null; // { source, placeholder, wasHidden, opener, scrollY, inerted, closing }

  function build() {
    if (root) return;
    root = doc.createElement('div');
    root.className = 'kov';
    root.hidden = true;
    root.innerHTML =
      '<div class="kov__scrim" data-kov-scrim></div>' +
      '<div class="kov__panel" role="dialog" aria-modal="true" tabindex="-1">' +
      '<button type="button" class="kov__close" aria-label="Close">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>' +
      '</button><div class="kov__body"></div></div>';
    doc.body.appendChild(root);
    panel = root.querySelector('.kov__panel');
    body = root.querySelector('.kov__body');
    closeBtn = root.querySelector('.kov__close');
    closeBtn.addEventListener('click', function () { close(); });

    // close on scrim: only when the press started AND ended outside the panel (a text drag out of the panel never closes it)
    var downOutside = false;
    root.addEventListener('pointerdown', function (e) { downOutside = !panel.contains(e.target); });
    root.addEventListener('click', function (e) {
      if (downOutside && !panel.contains(e.target)) close();
      downOutside = false;
      var c = e.target.closest && e.target.closest('[data-overlay-close]');
      if (c && panel.contains(c)) { e.preventDefault(); close(); }
    });
  }

  function reduced() { return win.matchMedia && win.matchMedia('(prefers-reduced-motion: reduce)').matches; }

  function visibleFocusables() {
    var list = panel.querySelectorAll(FOCUSABLE), out = [];
    for (var i = 0; i < list.length; i++) {
      var el = list[i];
      if (el.closest('[inert]') && el.closest('[inert]') !== doc.body) continue;
      if (el.offsetWidth || el.offsetHeight || el.getClientRects().length) out.push(el);
    }
    return out;
  }

  function onKey(e) {
    if (!state) return;
    if (e.key === 'Escape' || e.key === 'Esc') { e.preventDefault(); e.stopPropagation(); close(); return; }
    if (e.key !== 'Tab') return;
    var f = visibleFocusables();
    if (!f.length) { e.preventDefault(); panel.focus({ preventScroll: true }); return; }
    var first = f[0], last = f[f.length - 1], a = doc.activeElement;
    if (e.shiftKey && (a === first || a === panel || !panel.contains(a))) { e.preventDefault(); last.focus({ preventScroll: true }); }
    else if (!e.shiftKey && (a === last || !panel.contains(a))) { e.preventDefault(); first.focus({ preventScroll: true }); }
  }

  // focus that strays outside (e.g. a click on the page through devtools) is pulled back in
  function onFocusIn(e) { if (state && !root.contains(e.target)) { e.stopPropagation(); panel.focus({ preventScroll: true }); } }

  function lockScroll() {
    var de = doc.documentElement, sbw = win.innerWidth - de.clientWidth;
    state.scrollY = win.pageYOffset || de.scrollTop;
    state.prevOverflow = de.style.overflow;
    state.prevPad = doc.body.style.paddingRight;
    de.style.setProperty('--kov-sbw', sbw + 'px');
    if (sbw > 0) doc.body.style.paddingRight = 'calc(' + (getComputedStyle(doc.body).paddingRight || '0px') + ' + ' + sbw + 'px)';
    de.style.overflow = 'hidden';
    de.classList.add('kov-locked');
  }
  function unlockScroll() {
    var de = doc.documentElement;
    de.style.overflow = state.prevOverflow || '';
    doc.body.style.paddingRight = state.prevPad || '';
    de.style.removeProperty('--kov-sbw');
    de.classList.remove('kov-locked');
    var y = win.pageYOffset || de.scrollTop;
    if (Math.abs(y - state.scrollY) > 1) {
      try { win.scrollTo({ top: state.scrollY, left: 0, behavior: 'instant' }); } catch (err) { win.scrollTo(0, state.scrollY); }
    }
  }

  function setInert(on) {
    if (on) {
      state.inerted = [];
      var kids = doc.body.children;
      for (var i = 0; i < kids.length; i++) {
        var k = kids[i];
        if (k === root || k.hasAttribute('inert') || k.tagName === 'SCRIPT' || k.tagName === 'STYLE') continue;
        k.setAttribute('inert', ''); state.inerted.push(k);
      }
    } else if (state.inerted) {
      state.inerted.forEach(function (k) { k.removeAttribute('inert'); });
    }
  }

  function resolve(target) {
    if (!target) return null;
    if (typeof target === 'string') { try { return doc.querySelector(target); } catch (e) { return null; } }
    return target;
  }

  function mount(src) {
    if (src.tagName === 'TEMPLATE') { body.appendChild(src.content.cloneNode(true)); return; }
    state.placeholder = doc.createComment('kov');
    src.parentNode.insertBefore(state.placeholder, src);
    state.wasHidden = src.hidden;
    src.hidden = false;
    body.appendChild(src);
  }
  function unmount() {
    var src = state.source;
    if (state.placeholder) {
      src.hidden = state.wasHidden;
      state.placeholder.parentNode.insertBefore(src, state.placeholder);
      state.placeholder.parentNode.removeChild(state.placeholder);
    }
    body.innerHTML = '';
  }

  function label(opener) {
    panel.removeAttribute('aria-labelledby'); panel.removeAttribute('aria-label');
    var h = body.querySelector('h1,h2,h3,[data-overlay-title]');
    if (h) { if (!h.id) h.id = 'kov-title-' + (++uid); panel.setAttribute('aria-labelledby', h.id); }
    else panel.setAttribute('aria-label', (opener && (opener.getAttribute('data-overlay-label') || opener.textContent.trim())) || 'Details');
  }

  function open(target, opener) {
    var src = resolve(target);
    if (!src) return false;
    build();
    if (state) finishClose(true);
    state = { source: src, opener: opener || doc.activeElement };
    root.classList.toggle('kov--narrow', (opener && opener.getAttribute('data-overlay-size') === 'narrow') || src.getAttribute('data-overlay-size') === 'narrow');
    mount(src);
    label(opener);
    lockScroll();
    root.hidden = false;
    setInert(true);
    doc.addEventListener('focusin', onFocusIn, true);
    doc.addEventListener('keydown', onKey);
    body.scrollTop = 0;
    // next frame: transition in
    void root.offsetWidth;
    root.classList.add('is-open');
    var auto = body.querySelector('[autofocus]');
    (auto || panel).focus({ preventScroll: true });
    if (state.opener && state.opener.setAttribute) state.opener.setAttribute('aria-expanded', 'true');
    emit('overlay:open', src);
    return true;
  }

  function close() {
    if (!state || state.closing) return;
    state.closing = true;
    root.classList.remove('is-open');
    var wait = reduced() ? 130 : DUR + 20, done = false, panelRef = panel;
    function fin() { if (done) return; done = true; panelRef.removeEventListener('transitionend', onEnd); finishClose(false); }
    function onEnd(e) { if (e.target === panelRef || e.target === root) fin(); }
    panelRef.addEventListener('transitionend', onEnd);
    state.timer = setTimeout(fin, wait);
  }

  function finishClose(immediate) {
    if (!state) return;
    clearTimeout(state.timer);
    var s = state;
    doc.removeEventListener('focusin', onFocusIn, true);
    doc.removeEventListener('keydown', onKey);
    setInert(false);
    unmount();
    root.classList.remove('is-open');
    root.hidden = true;
    unlockScroll();
    state = null;
    if (s.opener && s.opener.setAttribute) s.opener.setAttribute('aria-expanded', 'false');
    if (!immediate && s.opener && s.opener.focus && doc.contains(s.opener)) s.opener.focus({ preventScroll: true });
    emit('overlay:close', s.source);
  }

  function emit(name, el) {
    var ev;
    try { ev = new CustomEvent(name, { bubbles: true, detail: { source: el } }); }
    catch (e) { ev = doc.createEvent('CustomEvent'); ev.initCustomEvent(name, true, false, { source: el }); }
    (el && doc.contains(el) ? el : doc).dispatchEvent(ev);
  }

  doc.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button > 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var t = e.target.closest && e.target.closest('[data-overlay]');
    if (!t || (root && root.contains(t) && t.closest('[data-overlay-close]'))) return;
    var sel = t.getAttribute('data-overlay') || t.getAttribute('href');
    if (open(sel, t)) e.preventDefault();
  });

  function prime() {
    var ts = doc.querySelectorAll('[data-overlay]');
    for (var i = 0; i < ts.length; i++) {
      if (!ts[i].hasAttribute('aria-haspopup')) ts[i].setAttribute('aria-haspopup', 'dialog');
      if (!ts[i].hasAttribute('aria-expanded')) ts[i].setAttribute('aria-expanded', 'false');
      if (ts[i].tagName !== 'A' && ts[i].tagName !== 'BUTTON' && !ts[i].hasAttribute('tabindex')) { ts[i].setAttribute('tabindex', '0'); ts[i].setAttribute('role', 'button'); }
    }
  }
  // Enter/Space on non-button triggers
  doc.addEventListener('keydown', function (e) {
    if ((e.key !== 'Enter' && e.key !== ' ') || state) return;
    var t = e.target;
    if (t && t.getAttribute && t.hasAttribute('data-overlay') && t.tagName !== 'A' && t.tagName !== 'BUTTON') { e.preventDefault(); t.click(); }
  });
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', prime); else prime();

  win.KitOverlay = { open: open, close: close, refresh: prime, isOpen: function () { return !!state; } };
})(window, document);
