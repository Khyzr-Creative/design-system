/* khyzr design-system site: progressive enhancement only. Every page reads fully without this. */
(function () {
  'use strict';
  var root = document.body.getAttribute('data-root') || '';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- chapters menu (small screens) ---------- */
  var menu = document.querySelector('.menu'), nav = document.getElementById('nav');
  if (menu && nav) {
    var setOpen = function (open) {
      nav.classList.toggle('open', open);
      document.body.classList.toggle('nav-open', open);
      menu.setAttribute('aria-expanded', open ? 'true' : 'false');
    };
    menu.addEventListener('click', function () { setOpen(!nav.classList.contains('open')); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('open')) { setOpen(false); menu.focus(); }
    });
  }

  /* ---------- search ---------- */
  var box = document.querySelector('.search'), q = document.getElementById('q'), res = box && box.querySelector('.results');
  var index = null;
  if (box && q) {
    box.hidden = false;
    var load = function () {
      if (index) return Promise.resolve(index);
      return fetch(root + 'search.json').then(function (r) { return r.json(); }).then(function (d) { index = d; return d; });
    };
    var render = function (hits, term) {
      if (!term) { res.classList.remove('open'); res.innerHTML = ''; return; }
      if (!hits.length) { res.innerHTML = '<p>Nothing matches “' + term.replace(/</g, '&lt;') + '”. Try a token name, like khyzr-green.</p>'; res.classList.add('open'); return; }
      res.innerHTML = hits.slice(0, 8).map(function (h, i) {
        var href = root + h.p + '/' + (h.id ? '#' + h.id : '');
        if (h.p === 'index') href = root + (h.id ? '#' + h.id : '');
        var snip = '', first = term.toLowerCase().split(/\s+/)[0];
        if (h.x) { var at = h.x.toLowerCase().indexOf(first); if (at >= 0) snip = (at > 40 ? '…' : '') + h.x.slice(Math.max(0, at - 40), at + 80).replace(/</g, '&lt;') + '…'; }
        return '<a role="option" href="' + href + '"' + (i === 0 ? ' aria-selected="true"' : '') + '><strong>' + (h.s || h.t) + '</strong><span>' + (h.s ? h.t : 'Chapter') + (snip ? ' · ' + snip : '') + '</span></a>';
      }).join('');
      res.classList.add('open');
    };
    q.addEventListener('focus', load, { once: true });
    q.addEventListener('input', function () {
      var term = q.value.trim().toLowerCase();
      load().then(function (d) {
        if (!term) return render([], '');
        var words = term.split(/\s+/);
        var scored = d.map(function (h) {
          var hay = (h.s + ' ' + h.t).toLowerCase(), body = (h.x || '').toLowerCase(), s = 0;
          words.forEach(function (w) { if (hay.indexOf(w) >= 0) s += 3; else if (body.indexOf(w) >= 0) s += 1; else s -= 9; });
          return { h: h, s: s };
        }).filter(function (o) { return o.s > 0; }).sort(function (a, b) { return b.s - a.s; });
        render(scored.map(function (o) { return o.h; }), q.value.trim());
      });
    });
    q.addEventListener('keydown', function (e) {
      var items = res.querySelectorAll('a'), cur = res.querySelector('[aria-selected="true"]'), k = Array.prototype.indexOf.call(items, cur);
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault(); if (!items.length) return;
        if (cur) cur.removeAttribute('aria-selected');
        k = (k + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
        items[k].setAttribute('aria-selected', 'true');
      } else if (e.key === 'Enter' && cur) { window.location.href = cur.getAttribute('href'); }
      else if (e.key === 'Escape') { q.value = ''; render([], ''); }
    });
    document.addEventListener('click', function (e) { if (!box.contains(e.target)) res.classList.remove('open'); });
  }

  /* ---------- on this page ---------- */
  var tocLinks = document.querySelectorAll('.toc a');
  if (tocLinks.length && 'IntersectionObserver' in window) {
    var byId = {};
    tocLinks.forEach(function (a) { byId[a.getAttribute('href').slice(1)] = a; });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          tocLinks.forEach(function (a) { a.classList.remove('on'); });
          var a = byId[en.target.id]; if (a) a.classList.add('on');
        }
      });
    }, { rootMargin: '-96px 0px -70% 0px' });
    document.querySelectorAll('.sec[id]').forEach(function (s) { io.observe(s); });
  }

  /* ---------- live pattern ---------- */
  document.querySelectorAll('[data-pattern-live]').forEach(function (wrap) {
    var el = wrap.querySelector('khyzr-pattern'), f = wrap.querySelector('form'), tag = wrap.querySelector('.tag'), out = f.querySelector('output');
    var sync = function () {
      var t = f.theme.value, s = f.seed.value || '7', sc = f.scale.value;
      el.setAttribute('theme', t); el.setAttribute('seed', s); el.setAttribute('scale', sc);
      el.parentNode.classList.toggle('light', t === 'light');
      out.textContent = sc;
      tag.textContent = '<khyzr-pattern theme="' + t + '" seed="' + s + '" scale="' + sc + '">';
    };
    f.addEventListener('input', sync); f.addEventListener('change', sync);
  });

  /* ---------- motion demos ---------- */
  document.querySelectorAll('[data-demo="rise"]').forEach(function (d) {
    var run = function () { d.classList.remove('run'); void d.offsetWidth; d.classList.add('run'); };
    d.querySelector('[data-replay]').addEventListener('click', run);
    if (!reduce && 'IntersectionObserver' in window) {
      var o = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { run(); o.disconnect(); } }, { threshold: .6 });
      o.observe(d);
    }
  });
  var dur = function (name, fallback) {
    var v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return parseFloat(v) || fallback;
  };
  document.querySelectorAll('[data-demo="count"]').forEach(function (d) {
    var el = d.querySelector('.count'), to = parseFloat(el.getAttribute('data-to'));
    var run = function () {
      if (reduce) { el.textContent = to; return; }
      var t0 = null, ms = dur('--dur-count', 1600);
      el.classList.remove('pulse');
      var step = function (t) {
        if (!t0) t0 = t;
        var p = Math.min(1, (t - t0) / ms), e = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(to * e);
        if (p < 1) requestAnimationFrame(step); else { void el.offsetWidth; el.classList.add('pulse'); }
      };
      requestAnimationFrame(step);
    };
    d.querySelector('[data-replay]').addEventListener('click', run);
    if ('IntersectionObserver' in window) {
      var o = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { run(); o.disconnect(); } }, { threshold: .6 });
      o.observe(d);
    }
  });

  /* ---------- live components: the design system's own React primitives ---------- */
  var mounts = document.querySelectorAll('[data-mount]');
  if (mounts.length) {
    var tries = 0;
    var mount = function () {
      var ns = window.KhyzrComponents;
      if (!(window.React && window.ReactDOM && ns)) { if (tries++ < 80) setTimeout(mount, 100); return; }
      var h = React.createElement;
      mounts.forEach(function (node) {
        var spec; try { spec = Function('return ' + node.getAttribute('data-mount'))(); } catch (e) { return; }
        var kids = spec.map(function (s, i) {
          var props = Object.assign({ key: i }, s[1]);
          return ns[s[0]] ? h(ns[s[0]], props, s[2]) : null;
        });
        ReactDOM.createRoot(node).render(h(React.Fragment, null, kids));
      });
    };
    if (document.readyState === 'complete') mount(); else window.addEventListener('load', mount);
  }
})();
