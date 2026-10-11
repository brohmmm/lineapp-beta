/*! LineApp R2 kit · header.js · hide a fixed header on scroll down, show it on any scroll up. Standalone.
 *  <header data-header> … </header>   Options: data-header-offset="80" (px before it may hide), data-header-tolerance="4".
 *  Classes set on the header: is-hidden, is-scrolled (page left the top), is-pinned (forced visible: focus, open menu).
 *  Sets --kit-header-h on <html> to the header height, so pages can pad the first section and set scroll-padding-top.
 *  The page styles the movement, e.g. [data-header]{transition:transform .32s cubic-bezier(.2,.8,.2,1)}
 *  [data-header].is-hidden{transform:translateY(calc(-100% - 16px))}
 */
(function (win, doc) {
  'use strict';
  if (win.KitHeader) return;
  var headers = [];

  function Header(el) {
    this.el = el;
    this.offset = parseFloat(el.getAttribute('data-header-offset')) || 80;
    this.tol = parseFloat(el.getAttribute('data-header-tolerance')) || 4;
    this.lastY = Math.max(0, win.pageYOffset);
    this.hidden = false;
    this.locks = 0;
    var self = this;
    el.addEventListener('focusin', function () { self.show(); self.update(); });
    el.addEventListener('focusout', function () { setTimeout(function () { self.update(); }, 0); });
    // a menu opened inside the header ([aria-expanded="true"]) pins it
    if ('MutationObserver' in win) new MutationObserver(function () { self.update(); }).observe(el, { attributes: true, subtree: true, attributeFilter: ['aria-expanded'] });
    if ('ResizeObserver' in win) new ResizeObserver(function () { self.measure(); }).observe(el);
    this.measure();
    this.update();
  }
  Header.prototype.pinned = function () {
    return this.locks > 0 || this.el.contains(doc.activeElement) || !!this.el.querySelector('[aria-expanded="true"]');
  };
  Header.prototype.measure = function () {
    doc.documentElement.style.setProperty('--kit-header-h', Math.round(this.el.getBoundingClientRect().height) + 'px');
  };
  Header.prototype.show = function () { if (this.hidden) { this.hidden = false; this.el.classList.remove('is-hidden'); } };
  Header.prototype.hide = function () { if (!this.hidden) { this.hidden = true; this.el.classList.add('is-hidden'); } };
  Header.prototype.update = function () {
    if (doc.documentElement.classList.contains('kov-locked')) return; // an overlay is open: leave the header as it is
    var y = Math.max(0, win.pageYOffset || doc.documentElement.scrollTop), pinned = this.pinned();
    this.el.classList.toggle('is-scrolled', y > 2);
    this.el.classList.toggle('is-pinned', pinned);
    if (pinned || y <= this.offset) { this.show(); this.lastY = y; return; }
    var dy = y - this.lastY;
    // small moves accumulate until they pass the tolerance (filters sub-pixel jitter and iOS rubber-band)
    if (Math.abs(dy) < this.tol) return;
    if (dy > 0) this.hide(); else this.show();
    this.lastY = y;
  };

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    win.requestAnimationFrame(function () { ticking = false; for (var i = 0; i < headers.length; i++) headers[i].update(); });
  }

  function init() {
    var els = doc.querySelectorAll('[data-header]');
    for (var i = 0; i < els.length; i++) if (!els[i]._kitHeader) { els[i]._kitHeader = new Header(els[i]); headers.push(els[i]._kitHeader); }
  }
  win.addEventListener('scroll', onScroll, { passive: true });
  win.addEventListener('resize', function () { for (var i = 0; i < headers.length; i++) headers[i].measure(); onScroll(); });
  // hash links: show the header so a jumped-to heading is never hidden under it, then let scrolling decide
  win.addEventListener('hashchange', function () { for (var i = 0; i < headers.length; i++) headers[i].show(); });

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', init); else init();

  win.KitHeader = {
    init: init,
    // KitHeader.lock() keeps headers visible (e.g. while a page-level menu is open); KitHeader.unlock() releases it
    lock: function () { headers.forEach(function (h) { h.locks++; h.show(); h.update(); }); },
    unlock: function () { headers.forEach(function (h) { h.locks = Math.max(0, h.locks - 1); h.update(); }); },
    show: function () { headers.forEach(function (h) { h.show(); }); }
  };
})(window, document);
