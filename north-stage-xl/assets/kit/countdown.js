/* LineApp R3 kit · countdown.js — "Festival starts in 23 days" inside the live app preview.
   <input type="date" id="start"> <input type="date" id="end">
   <span data-countdown data-countdown-for="#start" data-countdown-end="#end" data-locale="en-GB"></span>
   Handles: empty, future, tomorrow, today, during (a range), finished (past). Counts in calendar days in the visitor's
   own time zone (no DST drift). Accepts ISO dates and typed dd.mm.yyyy / dd/mm/yyyy. Re-checks at midnight.
   Built-in wording for en (default) and pl; any other locale uses Intl.RelativeTimeFormat. Every string can be overridden. */
(function () {
  'use strict';
  if (window.KitCountdown) return;
  var reduce = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };

  var TEXT = {
    en: { empty: 'Pick your dates', future: 'Festival starts in {n} days', future_one: 'Festival starts tomorrow', today: 'Festival starts today',
      during: 'Day {d} of {total}. Enjoy it.', during_one: 'It\'s festival day. Enjoy it.', last: 'Last day. Make it count.', past: 'That was the festival. See you next year.', invalid: 'Check the date' },
    pl: { empty: 'Wybierz daty', future_one: 'Festiwal startuje jutro', future_few: 'Festiwal startuje za {n} dni', future_many: 'Festiwal startuje za {n} dni', future: 'Festiwal startuje za {n} dni',
      today: 'Festiwal startuje dziś', during: 'Dzień {d} z {total}. Bawcie się dobrze.', during_one: 'Dziś festiwal. Bawcie się dobrze.', last: 'Ostatni dzień festiwalu.', past: 'To był festiwal. Do zobaczenia za rok.', invalid: 'Sprawdź datę' }
  };

  function parse(v) {
    if (!v) return null;
    v = String(v).trim();
    var m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(v), y, mo, d;
    if (m) { y = +m[1]; mo = +m[2]; d = +m[3]; }
    else if ((m = /^(\d{1,2})[./\- ](\d{1,2})[./\- ](\d{4})$/.exec(v))) { d = +m[1]; mo = +m[2]; y = +m[3]; }
    else return NaN;
    if (mo < 1 || mo > 12 || d < 1 || d > 31) return NaN;
    var t = Date.UTC(y, mo - 1, d), chk = new Date(t);
    if (chk.getUTCDate() !== d) return NaN;   // 31 Feb and friends
    return t / 864e5;                          // whole days since epoch
  }
  function todayDays(root) {
    var o = root.getAttribute('data-countdown-today');
    if (o) { var p = parse(o); if (p === p && p != null) return p; }
    var n = new Date(); return Date.UTC(n.getFullYear(), n.getMonth(), n.getDate()) / 864e5;
  }
  function valueOf(sel) {
    if (!sel) return null;
    var el = document.querySelector(sel); if (!el) return null;
    return 'value' in el ? el.value : el.textContent;
  }

  function setup(root) {
    if (root.__kcd) return; root.__kcd = true;
    var locale = root.getAttribute('data-locale') || document.documentElement.lang || 'en-GB';
    var lang = locale.slice(0, 2).toLowerCase();
    var base = TEXT[lang] || null;
    var srcSel = root.getAttribute('data-countdown-for'), endSel = root.getAttribute('data-countdown-end');
    var src = srcSel && document.querySelector(srcSel), end = endSel && document.querySelector(endSel);
    var plural; try { plural = new Intl.PluralRules(locale); } catch (e) { plural = { select: function (n) { return n === 1 ? 'one' : 'other'; } }; }
    var nf; try { nf = new Intl.NumberFormat(locale); } catch (e) { nf = { format: String }; }
    var midnight = 0, last = '';
    root.setAttribute('aria-live', root.getAttribute('aria-live') || 'polite');

    function str(key, n) {
      var attr = 'data-text-' + key.replace('_', '-');
      var form = n != null ? plural.select(n) : null;
      return (form && root.getAttribute(attr + '-' + form)) || root.getAttribute(attr) ||
        (base && ((form && base[key + '_' + form]) || base[key])) || null;
    }
    function rtf(n) {
      try { return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(n, 'day'); } catch (e) { return n + ' days'; }
    }
    function cap(t) { return t.charAt(0).toLocaleUpperCase(locale) + t.slice(1); }
    function fill(t, vars) { return t.replace(/\{(\w+)\}/g, function (_, k) { return vars[k] != null ? (typeof vars[k] === 'number' ? nf.format(vars[k]) : vars[k]) : ''; }); }

    function render() {
      var s = parse(valueOf(srcSel) || root.getAttribute('data-countdown-date'));
      var e = parse(valueOf(endSel) || root.getAttribute('data-countdown-date-end'));
      var now = todayDays(root), state, text, n = null;
      if (s == null) { state = 'empty'; text = str('empty') || ''; }
      else if (s !== s) { state = 'invalid'; text = str('invalid') || ''; }
      else {
        if (e == null || e !== e || e < s) e = s;      // no end, a bad end or an end before the start: one-day festival
        var days = s - now, total = e - s + 1;
        if (days > 1) { state = 'future'; n = days; text = str('future', n); if (!text) text = cap(rtf(n)); }
        else if (days === 1) { state = 'tomorrow'; n = 1; text = str('future_one') || str('future', 1) || cap(rtf(1)); }
        else if (days === 0) { state = 'today'; n = 0; text = total > 1 ? (str('today') || cap(rtf(0))) : (str('during_one') || str('today') || cap(rtf(0))); }
        else if (now <= e) { var d = now - s + 1; state = 'during'; text = (d === total ? (str('last') || str('during')) : str('during')) || cap(rtf(0)); text = fill(text, { d: d, total: total }); n = d; }
        else { state = 'past'; n = now - e; text = str('past') || cap(rtf(-(now - e))); }
        text = fill(text, { n: n, d: n, total: total, days: n });
      }
      root.setAttribute('data-state', state);
      root.setAttribute('data-days', n == null ? '' : String(n));
      if (text !== last) {
        last = text;
        if (!reduce.matches && root.animate && root.textContent) root.animate([{ opacity: .2, transform: 'translateY(4px)' }, { opacity: 1, transform: 'none' }], { duration: 260, easing: 'ease-out' });
        // the number can be styled on its own: <span class="kcd__n">
        root.innerHTML = '';
        var parts = n != null && state === 'future' ? text.split(nf.format(n)) : [text];
        root.appendChild(document.createTextNode(parts[0]));
        if (parts.length > 1) { var b = document.createElement('span'); b.className = 'kcd__n'; b.textContent = nf.format(n); root.appendChild(b); root.appendChild(document.createTextNode(parts.slice(1).join(nf.format(n)))); }
        root.dispatchEvent(new CustomEvent('countdown:change', { bubbles: true, detail: { state: state, days: n, text: text } }));
      }
      clearTimeout(midnight);
      var d0 = new Date(), next = new Date(d0.getFullYear(), d0.getMonth(), d0.getDate() + 1, 0, 0, 5);
      midnight = setTimeout(render, Math.min(2147483000, next - d0));
    }
    [src, end].forEach(function (inp) { if (inp) { inp.addEventListener('input', render); inp.addEventListener('change', render); } });
    render();
    root.__kcdRender = render;
  }

  function init(scope) { (scope || document).querySelectorAll('[data-countdown]').forEach(setup); }
  window.KitCountdown = { init: init, parse: parse, refresh: function (el) { if (el.__kcdRender) el.__kcdRender(); } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { init(); });
  else init();
})();
