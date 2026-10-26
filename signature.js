/* The email signature maker: choose the brand, fill in the fields, and each form of the signature
   follows as it will arrive. Copy puts it on the clipboard as rich text, naming its picture by its
   own address, and as plain text. Without this script the three signatures stand to be copied by hand. */
(function () {
  'use strict';
  var d = document, sig = d.querySelector('[data-sig]');
  if (!sig) return;
  var keys = ['name', 'role', 'phone'], need = ['name', 'role'], input = {};
  var prompt = JSON.parse(sig.getAttribute('data-prompt') || '{}'), check = sig.getAttribute('data-check') || '';
  var each = function (sel, fn, from) { Array.prototype.forEach.call((from || sig).querySelectorAll(sel), fn); };
  keys.forEach(function (k) { input[k] = d.getElementById('sig-' + k); });
  var value = function (k) { return input[k] ? input[k].value.replace(/\s+/g, ' ').trim() : ''; };
  var brand = function () { var r = sig.querySelector('input[name="sig-brand"]:checked'); return r ? r.value : 'khyzr'; };

  function quiet() { each('.sig-said', function (s) { s.textContent = ''; s.className = 'sig-said'; }); }
  function note(k, error) {
    var f = input[k].parentNode, n = f.querySelector('.sig-note');
    f.classList.toggle('is-error', !!error);
    input[k].setAttribute('aria-invalid', error ? 'true' : 'false');
    n.textContent = error || n.getAttribute('data-note');
  }
  function render() {
    var b = brand(), touched = keys.some(value);
    each('.sig-v', function (v) { v.classList.toggle('is-on', v.getAttribute('data-brand') === b); });
    keys.forEach(function (k) { each('[data-f="' + k + '"]', function (n) { n.textContent = value(k) || prompt[k]; }); });
    /* until anything is typed the preview shows every line; after, a phone left empty leaves no line */
    each('[data-row="phone"]', function (r) { r.hidden = touched && !value('phone'); });
  }
  function ready() {
    var missing = need.filter(function (k) { return !value(k); });
    missing.forEach(function (k) { note(k, k === 'name' ? 'Enter your name.' : 'Enter your role.'); });
    if (missing.length) input[missing[0]].focus();
    return !missing.length;
  }
  function markup(v) {
    var c = v.cloneNode(true);
    each('[data-row]', function (r) { if (r.hidden) r.parentNode.removeChild(r); else r.removeAttribute('data-row'); }, c);
    each('img[data-hosted]', function (i) { i.setAttribute('src', i.getAttribute('data-hosted')); i.removeAttribute('data-hosted'); }, c);
    each('[data-f]', function (s) { s.parentNode.replaceChild(d.createTextNode(s.textContent), s); }, c);
    return c.innerHTML.trim();
  }
  function bySelection(v) {
    var imgs = v.querySelectorAll('img[data-hosted]'), was = [];
    Array.prototype.forEach.call(imgs, function (i, n) { was[n] = i.getAttribute('src'); i.setAttribute('src', i.getAttribute('data-hosted')); });
    var r = d.createRange(), s = window.getSelection(), ok = false;
    r.selectNodeContents(v); s.removeAllRanges(); s.addRange(r);
    try { ok = d.execCommand('copy'); } catch (e) { ok = false; }
    if (ok) s.removeAllRanges();
    Array.prototype.forEach.call(imgs, function (i, n) { i.setAttribute('src', was[n]); });
    return ok;
  }
  function tell(said, ok) {
    said.className = 'sig-said ' + (ok ? 'is-done' : 'is-fail');
    said.innerHTML = ok ? check + '<span>Copied. Paste it into your mail program.</span>'
                        : '<span>Your browser did not copy it. Select it above and copy it by hand.</span>';
  }

  keys.forEach(function (k) {
    if (input[k]) input[k].addEventListener('input', function () { quiet(); if (value(k)) note(k, ''); render(); });
  });
  each('input[name="sig-brand"]', function (r) { r.addEventListener('change', function () { quiet(); render(); }); });
  sig.addEventListener('click', function (e) {
    var btn = e.target.closest ? e.target.closest('[data-copy]') : null;
    if (!btn) return;
    quiet();
    if (!ready()) return;
    var pane = btn.closest('.sig-pane'), v = pane.querySelector('.sig-v.is-on'), said = pane.querySelector('.sig-said');
    var text = v.innerText.replace(/\n\s*\n/g, '\n').trim() + '\n', rich = btn.getAttribute('data-copy') !== 'text';
    var done = function () { tell(said, true); }, fall = function () { tell(said, bySelection(v)); };
    if (navigator.clipboard && rich && window.ClipboardItem) {
      navigator.clipboard.write([new ClipboardItem({
        'text/html': new Blob([markup(v)], { type: 'text/html' }),
        'text/plain': new Blob([text], { type: 'text/plain' })
      })]).then(done, fall);
    } else if (navigator.clipboard && !rich) {
      navigator.clipboard.writeText(text).then(done, fall);
    } else {
      fall();
    }
  });
  render();
  sig.classList.add('sig-on');
})();
