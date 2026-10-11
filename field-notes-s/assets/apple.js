/* LineApp · page S · "Apple density" variant: every element marked data-a4-more is hidden and a "+ label" button opens it
   in a sheet. Elements with the same label in the same card or section share one button, placed after their shared parent. */
(function () {
  'use strict';
  function qa(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  var groups = new Map();
  qa('[data-a4-more]').forEach(function (el) {
    var scope = el.closest('.pp, .pp6x, .kexp__item, .case, .sp-band, .calc-sec, .consent-sec, .maths-sec, section');
    var key = el.getAttribute('data-a4-more') + '|' + (scope ? qa('*').indexOf(scope) : 0);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(el);
  });
  var dlg = document.createElement('dialog'); dlg.className = 'a4-dlg';
  dlg.innerHTML = '<button type="button" class="a4-x" aria-label="Close">×</button><div class="a4-in"></div>';
  document.body.appendChild(dlg);
  var inner = dlg.querySelector('.a4-in');
  dlg.querySelector('.a4-x').addEventListener('click', function () { dlg.close(); });
  dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
  function common(els) {
    var a = els[0].parentElement;
    while (a && !els.every(function (e) { return a.contains(e); })) a = a.parentElement;
    return a;
  }
  var n = 0;
  groups.forEach(function (els, key) {
    var label = key.split('|')[0], id = 'a4m' + (++n);
    var btn = document.createElement('button'); btn.type = 'button'; btn.className = 'a4-plus';
    btn.setAttribute('aria-haspopup', 'dialog'); btn.innerHTML = '<i aria-hidden="true">+</i><span></span>';
    btn.querySelector('span').textContent = label;
    btn.addEventListener('click', function () {
      inner.innerHTML = '<h3></h3>'; var card = els[0].closest('.pp, .pp6x'), h = card && card.querySelector('.h3');
      inner.querySelector('h3').textContent = label === 'More' && h ? h.textContent : label;
      els.forEach(function (el) {
        var c = el.cloneNode(true); c.removeAttribute('data-a4-more'); c.classList.remove('a4-hide');
        if (el.closest('.mate')) { var m = el.closest('.mate'); var w = document.createElement('div'); w.className = 'mate-l';
          w.innerHTML = '<b></b>'; w.querySelector('b').textContent = m.querySelector('h3').textContent + ' · ' + m.querySelector('.cap').textContent; w.appendChild(c); c = w; }
        inner.appendChild(c);
      });
      if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
    });
    // where the "+" goes: inside the short line it extends, after the last hidden piece, or after the shared parent
    var same = els.every(function (e) { return e.parentElement === els[0].parentElement; });
    var last = els[els.length - 1], prev = els[0].previousElementSibling;
    if (els.length === 1 && prev && prev.tagName === 'P' && !prev.hasAttribute('data-a4-more')) { btn.classList.add('in'); prev.appendChild(btn); }
    else if (same) last.insertAdjacentElement('afterend', btn);
    else common(els).insertAdjacentElement('afterend', btn);
  });
})();
