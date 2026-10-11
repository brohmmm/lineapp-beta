/*! LineApp R2 kit · marks.js · hand-drawn SVG marks, drawn on when scrolled into view.
 *  Standalone, no dependencies. Usage: <span data-mark="underline">worth it</span>
 *  Types: underline, underline-2, circle, x, tick, arrow, arrow-2, star, burst.
 *  Ink is a filled, variable-width outline (fill: currentColor, or --mark-color); a stroked mask path reveals it.
 *  The geometry is generated per element at its real size, so the ink width never stretches.
 */
(function (root) {
  'use strict';

  /* ---------------------------------------------------------------- generator (also runs in Node) */

  function rng(seed) { // mulberry32
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hash(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function smooth(t) { return t * t * (3 - 2 * t); }
  function lerp(a, b, t) { return a + (b - a) * t; }

  // Catmull-Rom through control points, sampled densely, then resampled at an even arc step.
  function spline(pts, step) {
    var dense = [], i, j;
    for (i = 0; i < pts.length - 1; i++) {
      var p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || pts[i + 1];
      var seg = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
      var n = Math.max(4, Math.ceil(seg / 1.2));
      for (j = 0; j < n; j++) {
        var t = j / n, t2 = t * t, t3 = t2 * t;
        dense.push([
          0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
          0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)
        ]);
      }
    }
    dense.push(pts[pts.length - 1].slice());
    // even resample
    var out = [dense[0]], acc = 0;
    for (i = 1; i < dense.length; i++) {
      var a = dense[i - 1], b = dense[i], d = Math.hypot(b[0] - a[0], b[1] - a[1]);
      while (acc + d >= step) {
        var k = (step - acc) / d;
        a = [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
        out.push(a); d = Math.hypot(b[0] - a[0], b[1] - a[1]); acc = 0;
      }
      acc += d;
    }
    var last = dense[dense.length - 1], tail = out[out.length - 1];
    if (Math.hypot(last[0] - tail[0], last[1] - tail[1]) > step * 0.3) out.push(last); else out[out.length - 1] = last;
    return out;
  }

  function normals(p) {
    var n = [], i;
    for (i = 0; i < p.length; i++) {
      var a = p[Math.max(0, i - 2)], b = p[Math.min(p.length - 1, i + 2)];
      var dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
      n.push([-dy / l, dx / l]);
    }
    return n;
  }

  function f1(v) { return Math.round(v * 10) / 10; }

  /* One pen stroke -> { pieces: [{ d: outline, c: centreline, len }], maxW } */
  function stroke(spec, ink, R) {
    var step = Math.max(1, ink * 0.45);
    var p = spline(spec.pts, step), i;
    var N = p.length, len = (N - 1) * step;
    var nrm = normals(p);
    // wobble: low-frequency drift + a little tremor, along the normal
    var wob = (spec.wob == null ? 1 : spec.wob) * ink;
    var cyc = Math.max(0.8, len / (ink * 38));
    var ph1 = R() * 6.28, ph2 = R() * 6.28, ph3 = R() * 6.28;
    var f2 = cyc * (2.6 + R()), f3 = cyc * (1.4 + R());
    for (i = 0; i < N; i++) {
      var t = i / (N - 1);
      var env = smooth(Math.min(1, t / 0.1)) * smooth(Math.min(1, (1 - t) / 0.12)); // ends stay where the pen was put down
      var o = wob * env * (0.55 * Math.sin(6.283 * cyc * t + ph1) + 0.2 * Math.sin(6.283 * f2 * t + ph2));
      p[i] = [p[i][0] + nrm[i][0] * o, p[i][1] + nrm[i][1] * o];
    }
    nrm = normals(p);
    // pressure profile
    var sw = spec.startW == null ? 0.55 : spec.startW, ew = spec.endW == null ? 0.18 : spec.endW;
    var a = spec.a == null ? 0.07 : spec.a, b = spec.b == null ? 0.28 : spec.b;
    var W = ink * (spec.weight || 1), ws = [], maxW = 0;
    for (i = 0; i < N; i++) {
      var u = i / (N - 1), pr = 1;
      if (u < a) pr = lerp(sw, 1, smooth(u / a));
      else if (u > 1 - b) pr = lerp(1, ew, smooth((u - (1 - b)) / b));
      pr *= 1 + 0.13 * Math.sin(6.283 * f3 * u + ph3);
      var w = Math.max(0.6, W * pr);
      ws.push(w); if (w > maxW) maxW = w;
    }
    // edge grain: tiny, smoothed jitter so the edge is not vector-perfect
    var gL = [], gR = [];
    for (i = 0; i < N; i++) { gL.push((R() - 0.5) * ink * 0.14); gR.push((R() - 0.5) * ink * 0.14); }
    function sm(g) { var o = []; for (var k = 0; k < g.length; k++) o.push(((g[k - 1] || g[k]) + g[k] * 2 + (g[k + 1] || g[k])) / 4); return o; }
    gL = sm(gL); gR = sm(gR);

    var splits = spec.split ? [].concat(spec.split) : [], cuts = [0];
    for (i = 0; i < splits.length; i++) cuts.push(Math.round(splits[i] * (N - 1)));
    cuts.push(N - 1);
    var pieces = [];
    for (var s = 0; s < cuts.length - 1; s++) {
      var from = Math.max(0, cuts[s] - (s > 0 ? 1 : 0)), to = cuts[s + 1];
      var first = s === 0, last = s === cuts.length - 2;
      var L = [], Rt = [];
      for (i = from; i <= to; i++) {
        var hw = ws[i] / 2;
        L.push([p[i][0] + nrm[i][0] * (hw + gL[i]), p[i][1] + nrm[i][1] * (hw + gL[i])]);
        Rt.push([p[i][0] - nrm[i][0] * (hw + gR[i]), p[i][1] - nrm[i][1] * (hw + gR[i])]);
      }
      var d = 'M' + f1(L[0][0]) + ' ' + f1(L[0][1]);
      for (i = 1; i < L.length; i++) d += 'L' + f1(L[i][0]) + ' ' + f1(L[i][1]);
      d += cap(p[to], nrm[to], ws[to] / 2, last ? 1 : 0, 1);
      for (i = Rt.length - 1; i >= 0; i--) d += 'L' + f1(Rt[i][0]) + ' ' + f1(Rt[i][1]);
      d += cap(p[from], nrm[from], ws[from] / 2, first ? 1 : 0, -1) + 'Z';
      var c = 'M' + f1(p[from][0]) + ' ' + f1(p[from][1]);
      for (i = from + 1; i <= to; i++) if ((i - from) % 2 === 0 || i === to) c += 'L' + f1(p[i][0]) + ' ' + f1(p[i][1]);
      pieces.push({ d: d, c: c, len: (to - from) * step, first: first, last: last });
    }
    return { pieces: pieces, maxW: maxW, len: len };
  }

  // semicircular cap from the +normal side to the -normal side (dir 1 = end cap going forward, -1 = start cap going back)
  function cap(c, n, r, round, dir) {
    var out = '', k, steps = round ? 7 : 1;
    var tx = n[1] * dir, ty = -n[0] * dir; // tangent pointing out of the stroke end
    for (k = 1; k < steps; k++) {
      var ang = Math.PI * k / steps, cs = Math.cos(ang) * dir, sn = Math.sin(ang);
      out += 'L' + f1(c[0] + (n[0] * cs + tx * sn) * r) + ' ' + f1(c[1] + (n[1] * cs + ty * sn) * r);
    }
    return out;
  }

  /* Shapes. Each returns [{ pts, startW, endW, a, b, wob, weight, split, gap }] inside a W x H box. */
  var SHAPES = {
    underline: function (W, H, ink, R) {
      var p = ink * 0.9, y = H * 0.56, j = function (k) { return (R() - 0.5) * H * k; };
      return [{ pts: [[p, y + H * 0.06 + j(0.1)], [W * 0.26, y + j(0.12)], [W * 0.52, y - H * 0.05 + j(0.12)], [W * 0.78, y - H * 0.1 + j(0.1)], [W - p, y - H * 0.22 + j(0.1)]],
        startW: 0.62, endW: 0.16, a: 0.05, b: 0.3, wob: 0.7 }];
    },
    'underline-2': function (W, H, ink, R) {
      var p = ink * 0.9, j = function (k) { return (R() - 0.5) * H * k; };
      return [
        { pts: [[p, H * 0.36 + j(0.08)], [W * 0.3, H * 0.33 + j(0.08)], [W * 0.62, H * 0.3 + j(0.06)], [W - p, H * 0.24 + j(0.06)]], startW: 0.6, endW: 0.4, a: 0.05, b: 0.12, wob: 0.6 },
        { pts: [[W * 0.965, H * 0.5], [W * 0.7, H * 0.68 + j(0.06)], [W * 0.38, H * 0.74 + j(0.06)], [W * 0.1, H * 0.8 + j(0.06)]], startW: 0.45, endW: 0.14, a: 0.08, b: 0.36, wob: 0.6, weight: 0.82, gap: 10 }
      ];
    },
    circle: function (W, H, ink, R) {
      var p = ink * 1.1, cx = W / 2 + (R() - 0.5) * W * 0.02, cy = H / 2 + (R() - 0.5) * H * 0.04;
      var rx = W / 2 - p, ry = H / 2 - p, tilt = -0.045 + (R() - 0.5) * 0.03;
      var a0 = Math.PI + 0.42 + R() * 0.12, sweep = Math.PI * 2 + 0.5 + R() * 0.15;
      var drift = 0.93 + R() * 0.03, ph = R() * 6.28, pts = [], n = 26, k;
      for (k = 0; k <= n; k++) {
        var t = k / n, ang = a0 + sweep * t;
        var sc = 1 + 0.035 * Math.sin(2 * ang + ph) + (drift - 1) * smooth(Math.max(0, (t - 0.62) / 0.38));
        var x = rx * sc * Math.cos(ang), y = ry * sc * Math.sin(ang);
        pts.push([cx + x * Math.cos(tilt) - y * Math.sin(tilt), cy + x * Math.sin(tilt) + y * Math.cos(tilt)]);
      }
      return [{ pts: pts, startW: 0.5, endW: 0.2, a: 0.04, b: 0.16, wob: 0.6, split: [0.34, 0.68] }];
    },
    x: function (W, H, ink, R) {
      var p = ink * 1.1, j = function () { return (R() - 0.5) * Math.min(W, H) * 0.06; };
      function line(x0, y0, x1, y1, bow) {
        var mx = (x0 + x1) / 2, my = (y0 + y1) / 2, dx = x1 - x0, dy = y1 - y0, l = Math.hypot(dx, dy);
        return [[x0, y0], [mx - dy / l * bow * l, my + dx / l * bow * l], [x1, y1]];
      }
      return [
        { pts: line(p + j(), p + j(), W - p + j(), H - p + j(), 0.035), startW: 0.5, endW: 0.25, a: 0.08, b: 0.3, wob: 0.5 },
        { pts: line(W - p * 1.3 + j(), p * 1.4 + j(), p + j(), H - p * 0.9 + j(), -0.05), startW: 0.6, endW: 0.22, a: 0.06, b: 0.3, wob: 0.5, gap: 70 }
      ];
    },
    tick: function (W, H, ink, R) {
      var p = ink * 1.1, j = function () { return (R() - 0.5) * Math.min(W, H) * 0.03; };
      return [{ pts: [[p + W * 0.02, H * 0.5 + j()], [W * 0.2, H * 0.66 + j()], [W * 0.34, H - p * 1.1], [W * 0.47, H * 0.68 + j()], [W * 0.68, H * 0.36 + j()], [W - p, p + j()]],
        startW: 0.5, endW: 0.14, a: 0.1, b: 0.36, wob: 0.35 }];
    },
    arrow: function (W, H, ink, R) {
      var p = ink * 1.2, j = function () { return (R() - 0.5) * H * 0.05; };
      var shaft = [[p, H * 0.74 + j()], [W * 0.3, H * 0.34 + j()], [W * 0.6, H * 0.24 + j()], [W - p * 1.6, H * 0.5 + j()]];
      return withHead(shaft, W, H, ink, R, { startW: 0.5, endW: 0.55, a: 0.06, b: 0.1, wob: 0.5 });
    },
    'arrow-2': function (W, H, ink, R) {
      var p = ink * 1.2, j = function () { return (R() - 0.5) * H * 0.04; };
      var shaft = [[p, H * 0.62 + j()], [W * 0.18, H * 0.64 + j()], [W * 0.33, H * 0.5], [W * 0.36, H * 0.24], [W * 0.29, H * 0.12], [W * 0.22, H * 0.24],
        [W * 0.26, H * 0.48], [W * 0.42, H * 0.66 + j()], [W * 0.66, H * 0.68 + j()], [W - p * 1.6, H * 0.5 + j()]];
      return withHead(shaft, W, H, ink, R, { startW: 0.5, endW: 0.55, a: 0.05, b: 0.08, wob: 0.4, split: 0.42 });
    },
    star: function (W, H, ink, R) {
      var cx = W / 2, cy = H / 2 + H * 0.04, r = Math.min(W, H) / 2 - ink * 1.2, v = [], k, out = [];
      for (k = 0; k < 5; k++) {
        var ang = -Math.PI / 2 + k * Math.PI * 2 / 5 + (R() - 0.5) * 0.08, rr = r * (0.94 + R() * 0.08);
        v.push([cx + Math.cos(ang) * rr, cy + Math.sin(ang) * rr]);
      }
      var order = [0, 2, 4, 1, 3, 0];
      for (k = 0; k < 5; k++) {
        var A = v[order[k]], B = v[order[k + 1]], over = k === 4 ? 0.1 : 0.03;
        var dx = B[0] - A[0], dy = B[1] - A[1];
        var bow = (R() - 0.5) * 0.06, mx = (A[0] + B[0]) / 2 - dy * bow, my = (A[1] + B[1]) / 2 + dx * bow;
        out.push({ pts: [[A[0] - dx * 0.02, A[1] - dy * 0.02], [mx, my], [B[0] + dx * over, B[1] + dy * over]], startW: 0.75, endW: k === 4 ? 0.2 : 0.55, a: 0.12, b: 0.25, wob: 0.3, gap: 0 });
      }
      return out;
    },
    burst: function (W, H, ink, R) {
      var cx = W / 2, cy = H / 2, r = Math.min(W, H) / 2 - ink, n = 9, out = [], k;
      for (k = 0; k < n; k++) {
        var ang = -Math.PI / 2 + k * Math.PI * 2 / n + (R() - 0.5) * 0.3;
        var r1 = r * (0.42 + R() * 0.1), r2 = r * (0.8 + R() * 0.2), bend = (R() - 0.5) * 0.12;
        var m = (r1 + r2) / 2;
        out.push({ pts: [[cx + Math.cos(ang) * r1, cy + Math.sin(ang) * r1], [cx + Math.cos(ang + bend) * m, cy + Math.sin(ang + bend) * m], [cx + Math.cos(ang) * r2, cy + Math.sin(ang) * r2]],
          startW: 0.9, endW: 0.25, a: 0.1, b: 0.5, wob: 0.15, gap: -40 });
      }
      return out;
    }
  };

  function withHead(shaft, W, H, ink, R, opt) {
    var T = shaft[shaft.length - 1], P = spline(shaft, 2), Q = P[Math.max(0, P.length - 8)];
    var dx = T[0] - Q[0], dy = T[1] - Q[1], l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
    var L = Math.min(W, H) * 0.36 + ink * 2;
    function back(deg, len) { var a = deg * Math.PI / 180, c = Math.cos(a), s = Math.sin(a); return [T[0] - (dx * c - dy * s) * len, T[1] - (dx * s + dy * c) * len]; }
    var w1 = back(30 + (R() - 0.5) * 8, L), w2 = back(-34 + (R() - 0.5) * 8, L * 0.92);
    var s = { pts: shaft, startW: opt.startW, endW: opt.endW, a: opt.a, b: opt.b, wob: opt.wob, split: opt.split };
    return [s,
      { pts: [w1, [lerp(w1[0], T[0], 0.55) - dy * ink * 0.3, lerp(w1[1], T[1], 0.55) + dx * ink * 0.3], [T[0] + dx * ink * 0.3, T[1] + dy * ink * 0.3]], startW: 0.4, endW: 0.75, a: 0.2, b: 0.2, wob: 0.2, gap: 40 },
      { pts: [[T[0] + dx * ink * 0.2, T[1] + dy * ink * 0.2], [lerp(T[0], w2[0], 0.5) + dy * ink * 0.4, lerp(T[1], w2[1], 0.5) - dx * ink * 0.4], w2], startW: 0.75, endW: 0.2, a: 0.1, b: 0.45, wob: 0.2, gap: 0 }];
  }

  /* build(type, W, H, { ink, seed }) -> { w, h, ink, strokes: [{ pieces, gap }] } */
  function build(type, W, H, opts) {
    opts = opts || {};
    var shape = SHAPES[type] || SHAPES.underline;
    var ink = opts.ink || Math.max(1.6, Math.min(W, H) * 0.1);
    var R = rng(opts.seed == null ? hash(type) : opts.seed);
    var specs = shape(W, H, ink, R), strokes = [];
    for (var i = 0; i < specs.length; i++) {
      var s = stroke(specs[i], ink, R);
      strokes.push({ pieces: s.pieces, maxW: s.maxW, len: s.len, gap: specs[i].gap || 0 });
    }
    return { w: W, h: H, ink: ink, strokes: strokes };
  }

  // static SVG (final drawn state), for files and for reduced motion
  function toSVG(g, attrs) {
    var d = '';
    g.strokes.forEach(function (s) { s.pieces.forEach(function (p) { d += p.d; }); });
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + f1(g.w) + ' ' + f1(g.h) + '"' + (attrs || '') + ' fill="currentColor" aria-hidden="true"><path d="' + d + '"/></svg>';
  }

  var Gen = { build: build, toSVG: toSVG, hash: hash, types: Object.keys(SHAPES) };
  if (typeof module === 'object' && module.exports) module.exports = Gen;
  if (typeof document === 'undefined') return;

  /* ---------------------------------------------------------------- DOM */

  var NS = 'http://www.w3.org/2000/svg', uid = 0;
  var reduce = root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)');
  var CSS = '' +
    '.kmark{position:relative;display:inline-block;color:inherit}' +
    '.kmark--icon{display:inline-block;width:1em;height:1em;vertical-align:-0.14em}' +
    '.kmark--icon[data-mark^="arrow"]{width:2.2em;height:1.1em}' +
    '.kmark__svg{position:absolute;overflow:visible;pointer-events:none;color:var(--mark-color,currentColor)}' +
    '.kmark--icon>.kmark__svg{left:0;top:0;width:100%;height:100%}' +
    '.kmark__svg--below{left:-0.06em;width:calc(100% + 0.12em);top:calc(100% - 0.16em);height:0.42em}' +
    '.kmark__svg--below.kmark__svg--underline-2{height:0.52em}' +
    '.kmark__svg--around{left:-0.38em;width:calc(100% + 0.76em);top:-0.3em;height:calc(100% + 0.54em)}' +
    '.kmark__svg--over{left:-0.06em;width:calc(100% + 0.12em);top:0.06em;height:calc(100% - 0.12em)}' +
    '.kmark__after{display:inline-block;position:relative;width:1em;height:1em;margin-left:.22em;vertical-align:-0.12em}' +
    '.kmark__after>.kmark__svg{left:0;top:0;width:100%;height:100%}' +
    '.kmark[data-mark^="arrow"] .kmark__after{width:2em}' +
    '.kmark__svg--flip{transform:scaleX(-1)}';
  var PLACE = { underline: 'below', 'underline-2': 'below', circle: 'around', x: 'over', tick: 'after', arrow: 'after', 'arrow-2': 'after', star: 'after', burst: 'after' };

  function injectCSS() {
    if (document.getElementById('kit-marks-css')) return;
    var st = document.createElement('style'); st.id = 'kit-marks-css'; st.textContent = CSS;
    (document.head || document.documentElement).appendChild(st);
  }

  function inkFor(el, box, type, icon) {
    var fs = parseFloat(getComputedStyle(el).fontSize) || 16;
    var base = icon ? Math.min(box.width, box.height) * (type === 'burst' || type === 'star' ? 0.085 : 0.1) : fs * 0.085;
    var wt = parseFloat(el.getAttribute('data-mark-weight')) || 1;
    return Math.max(1.6, Math.min(base, 10)) * wt;
  }

  function render(el, drawn) {
    var st = el._kmark; if (!st) return;
    var r = st.svg.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return;
    st.w = r.width; st.h = r.height;
    var seed = el.getAttribute('data-mark-seed');
    seed = seed ? hash(seed) : hash(st.type + '|' + (el.textContent || '').trim() + '|' + st.index);
    var g = build(st.type, r.width, r.height, { ink: inkFor(el, r, st.type, st.icon), seed: seed });
    var id = 'km' + (++uid), html = '', mi = 0;
    st.parts = [];
    g.strokes.forEach(function (s) {
      s.pieces.forEach(function (p) {
        var mid = id + '-' + (mi++), mw = f1(s.maxW * 1.7 + 2);
        html += '<mask id="' + mid + '" maskUnits="userSpaceOnUse" x="' + f1(-r.width) + '" y="' + f1(-r.height) + '" width="' + f1(r.width * 3) + '" height="' + f1(r.height * 3) + '">' +
          '<path d="' + p.c + '" fill="none" stroke="#fff" stroke-width="' + mw + '" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="1 2" stroke-dashoffset="' + (drawn ? 0 : 1.08) + '"/></mask>' +
          '<path d="' + p.d + '" mask="url(#' + mid + ')"/>';
        st.parts.push({ len: p.len, gap: p.first ? s.gap : 0, first: p.first, last: p.last });
      });
    });
    st.svg.setAttribute('viewBox', '0 0 ' + f1(r.width) + ' ' + f1(r.height));
    st.svg.innerHTML = html;
  }

  function setup(el, index) {
    if (el._kmark) return;
    var type = el.getAttribute('data-mark');
    if (!SHAPES[type]) type = 'underline';
    var icon = !el.textContent.trim() && !el.querySelector('img,svg');
    var place = icon ? 'icon' : (el.getAttribute('data-mark-place') || PLACE[type]);
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'kmark__svg kmark__svg--' + type + (icon ? '' : ' kmark__svg--' + place) + (el.hasAttribute('data-mark-flip') ? ' kmark__svg--flip' : ''));
    svg.setAttribute('aria-hidden', 'true'); svg.setAttribute('focusable', 'false');
    svg.setAttribute('fill', 'currentColor'); svg.setAttribute('preserveAspectRatio', 'none');
    el.classList.add('kmark'); if (icon) el.classList.add('kmark--icon');
    if (place === 'after' && !icon) {
      var holder = document.createElement('span'); holder.className = 'kmark__after'; holder.setAttribute('aria-hidden', 'true');
      holder.appendChild(svg); el.appendChild(holder);
    } else el.appendChild(svg);
    if (icon && !el.hasAttribute('role') && !el.hasAttribute('aria-label')) el.setAttribute('aria-hidden', 'true');
    el._kmark = { type: type, icon: icon, svg: svg, index: index || 0, drawn: false, w: 0, h: 0 };
    render(el, false);
  }

  function draw(el, instant) {
    var st = el._kmark; if (!st) { setup(el); st = el._kmark; }
    if (!st || st.drawn) return;
    st.drawn = true;
    if (!st.w) render(el, true);
    var paths = st.svg.querySelectorAll('mask path');
    if (instant || (reduce && reduce.matches) || !paths.length || !paths[0].animate) {
      for (var i = 0; i < paths.length; i++) paths[i].setAttribute('stroke-dashoffset', '0');
      return;
    }
    var speed = (parseFloat(el.getAttribute('data-mark-speed')) || 1) * (st.icon ? 0.42 : 0.95); // px per ms
    var t = parseFloat(el.getAttribute('data-mark-delay')) || 0;
    st.parts.forEach(function (p, k) {
      var dur = Math.max(st.icon ? 110 : 140, p.len / speed);
      t += p.gap;
      var easing = p.first && p.last ? 'cubic-bezier(.42,0,.22,1)' : p.first ? 'cubic-bezier(.42,0,.9,.75)' : p.last ? 'cubic-bezier(.12,.3,.25,1)' : 'linear';
      var path = paths[k];
      var anim = path.animate([{ strokeDashoffset: '1.08px' }, { strokeDashoffset: '0px' }], { duration: dur, delay: Math.max(0, t), easing: easing, fill: 'both' });
      anim.onfinish = function () { path.setAttribute('stroke-dashoffset', '0'); path.style.strokeDashoffset = '0px'; anim.cancel(); };
      t += dur;
    });
  }

  function reset(el) {
    var st = el._kmark; if (!st) return;
    st.drawn = false; render(el, false);
  }

  var io = null, ro = null;
  function init(scope) {
    injectCSS();
    var els = (scope || document).querySelectorAll('[data-mark]');
    if (!io && 'IntersectionObserver' in root) {
      io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting) { io.unobserve(e.target); draw(e.target); } });
      }, { rootMargin: '0px 0px -12% 0px', threshold: 0.6 });
    }
    if (!ro && 'ResizeObserver' in root) {
      ro = new ResizeObserver(function (entries) {
        entries.forEach(function (e) {
          var el = e.target, st = el._kmark; if (!st) return;
          var r = st.svg.getBoundingClientRect();
          if (Math.abs(r.width - st.w) > 2 || Math.abs(r.height - st.h) > 2) render(el, st.drawn);
        });
      });
    }
    for (var i = 0; i < els.length; i++) {
      var el = els[i]; if (el._kmark) continue;
      setup(el, i);
      if (ro) ro.observe(el);
      if (el.getAttribute('data-mark-trigger') === 'manual') continue;
      if (io && !(reduce && reduce.matches)) io.observe(el); else draw(el, true);
    }
  }

  root.KitMarks = { init: init, draw: draw, reset: reset, build: build, toSVG: toSVG, types: Gen.types };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { init(); });
  else init();
})(typeof window !== 'undefined' ? window : this);
