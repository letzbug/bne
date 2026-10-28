/*
 * Tire le fil — BNE Experience
 * Hauptanwendung. Keine Abhängigkeiten, keine Cloud, keine Besucherdaten.
 * Texte: content/translations.json · Inhalte: content/content.json · Betrieb: content/config.json
 */
(function () {
  'use strict';

  var STAGE_W = 1080, STAGE_H = 1920, TOP = 120;
  var params = new URLSearchParams(location.search);
  var D = null;                 // { config, content, i18n }
  var S = {                     // Sitzungszustand (wird beim Neustart verworfen)
    lang: 'fr', screen: null, discoveries: [],
    obj: null, quiz: null, bne: null, local: null
  };
  var stage, screenEl, dock, topbar, overlayRoot, fil;
  var scope = null;             // Timer/Listener des aktuellen Bildschirms
  var current = null;           // aktueller Bildschirm { el, onLang, leave }
  var missingLogged = {};
  var i18nIssues = [];
  var stageScale = 1;
  var errorCount = 0, booted = false;

  /* =========================================================== Hilfen */

  function h(tag, props, children) {
    var el = document.createElementNS(/^(svg|path|circle|g|line|rect|defs|linearGradient|stop|text)$/.test(tag) ? 'http://www.w3.org/2000/svg' : 'http://www.w3.org/1999/xhtml', tag);
    props = props || {};
    Object.keys(props).forEach(function (k) {
      var v = props[k];
      if (v == null || v === false) return;
      if (k === 'class') el.setAttribute('class', v);
      else if (k === 'i18n') el.setAttribute('data-i18n', v);
      else if (k === 'vars') el.setAttribute('data-i18n-vars', JSON.stringify(v));
      else if (k === 'aria') el.setAttribute('data-i18n-aria', v);
      else if (k === 'ariaVars') el.setAttribute('data-i18n-aria-vars', JSON.stringify(v));
      else if (k === 'style' && typeof v === 'object') Object.keys(v).forEach(function (s) { el.style.setProperty(s, v[s]); });
      else if (k === 'html') el.innerHTML = v;
      else if (k === 'text') el.textContent = v;
      else if (k.slice(0, 2) === 'on' && typeof v === 'function') el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : v);
    });
    (children || []).forEach(function (c) {
      if (c == null || c === false) return;
      el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return el;
  }
  function px(n) { return n + 'px'; }
  function pos(left, top, extra) { var s = { left: px(left), top: px(top) }; if (extra) Object.keys(extra).forEach(function (k) { s[k] = extra[k]; }); return s; }
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var tmp = a[i]; a[i] = a[j]; a[j] = tmp; } return a; }
  function sdgColor(n) { return D.content.sdgColors[String(n)] || '#ffffff'; }
  function sdgList() { var c = []; for (var i = 1; i <= 17; i++) c.push(D.content.sdgColors[String(i)]); return c; }
  function storedGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function storedSet(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { /* ok */ } }

  /* ---------- Designvarianten: 'corporate' (BNE Corporate) und 'dark' (Original Dark) ---------- */
  var DESIGNS = ['corporate', 'dark', 'hybrid'];
  function currentDesign() {
    var u = params.get('design'), st = storedGet('bne-design'), c = D.config.design && D.config.design.variant;
    if (DESIGNS.indexOf(u) >= 0) return u;
    if (DESIGNS.indexOf(st) >= 0) return st;
    return DESIGNS.indexOf(c) >= 0 ? c : 'corporate';
  }
  function threadTheme(v) {
    var bc = D.content.brandColors;
    return v === 'corporate' ? { colors: (bc && bc.thread) || sdgList(), mode: 'ink' } : { colors: sdgList(), mode: 'glow' };
  }
  // 'hybrid' = Lichtvorhang: dunkles, leuchtendes Startbild, nach dem Loslassen des Fadens hell (BNE Corporate)
  function effectiveDesign(screen) { return S.design === 'hybrid' ? (screen === 'attract' ? 'dark' : 'corporate') : S.design; }
  function setEffective(eff) {
    if (S.effective === eff) return;
    S.effective = eff;
    document.documentElement.setAttribute('data-design', eff);
    if (fil) fil.setTheme(threadTheme(eff));
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', eff === 'corporate' ? '#FBF8F3' : '#0E2C31');
  }
  function applyDesign(v, persist) {
    S.design = v;
    document.documentElement.setAttribute('data-variant', v);
    if (persist) storedSet('bne-design', v);
    S.effective = null;
    setEffective(effectiveDesign(S.screen || 'attract'));
  }
  function lightCurtain(x, y) {
    return new Promise(function (res) {
      if (document.body.classList.contains('reduced')) { setEffective('corporate'); res(); return; }
      var c = h('div', { class: 'curtain', style: { '--x': px(x), '--y': px(y) } });
      overlayRoot.appendChild(c);
      requestAnimationFrame(function () { requestAnimationFrame(function () { c.classList.add('open'); }); });
      setTimeout(function () {
        setEffective('corporate'); res();
        setTimeout(function () { c.classList.add('done'); setTimeout(function () { c.remove(); }, 520); }, 140);
      }, 980);
    });
  }

  /* ---------- Gemeinsamer Faden: anonymer Zähler der Starts auf diesem Gerät ---------- */
  function commonsRead() {
    try { return JSON.parse(storedGet('bne-commons') || 'null') || { n: 0, since: todayISO() }; } catch (e) { return { n: 0, since: todayISO() }; }
  }
  function countCommons() {
    if (!D.config.commons || !D.config.commons.enabled) return;
    var c = commonsRead(); c.n++; storedSet('bne-commons', JSON.stringify(c));
  }
  function fmtNum(n) { try { return new Intl.NumberFormat(lookup(S.lang, 'meta.locale') || 'fr-LU').format(n); } catch (e) { return String(n); } }
  function badgeOn() { var st = storedGet('bne-badge'); return st === null ? D.config.demoBadge !== false : st === '1'; }

  /* ---------- Logo-Bögen als Hintergrundmotiv (Farben aus dem Logo) ---------- */
  function brandArcs() {
    // Großer Ring aus den 17 Logo-Segmenten: Bühne für die Faden-Form im Ruhezustand
    var bc = D.content.brandColors, cols = (bc && bc.thread) || sdgList();
    var cx = 540, cy = 760, r = 430, n = cols.length, span = 360 / n, gap = span * 0.16, html = '';
    cols.forEach(function (c, i) {
      var s0 = (-90 + i * span + gap / 2) * Math.PI / 180, s1 = (-90 + (i + 1) * span - gap / 2) * Math.PI / 180;
      html += '<path d="M' + (cx + r * Math.cos(s0)).toFixed(1) + ' ' + (cy + r * Math.sin(s0)).toFixed(1) + ' A' + r + ' ' + r + ' 0 0 1 ' +
        (cx + r * Math.cos(s1)).toFixed(1) + ' ' + (cy + r * Math.sin(s1)).toFixed(1) + '" stroke="' + c + '" stroke-width="18" fill="none"/>';
    });
    return h('svg', { id: 'brand-arcs', viewBox: '0 0 1080 1920', 'aria-hidden': 'true', html: '<g class="ring">' + html + '</g>' });
  }

  /* ---------- Der Faden formt Gegenstände: Linienzug aus 'form' oder aus der Zeichnung ---------- */
  var formCache = {};
  function formPoints(src) {
    if (src.form) return src.form;
    var key = src.id || src.drawing;
    if (formCache[key]) return formCache[key];
    var NS = 'http://www.w3.org/2000/svg', svg = document.createElementNS(NS, 'svg'), path = document.createElementNS(NS, 'path');
    svg.setAttribute('width', '0'); svg.setAttribute('height', '0'); svg.style.position = 'absolute';
    path.setAttribute('d', src.drawing); svg.appendChild(path); document.body.appendChild(svg);
    var L = path.getTotalLength(), pts = [];
    for (var i = 0; i <= 160; i++) { var q = path.getPointAtLength(L * i / 160); pts.push([q.x, q.y]); }
    svg.remove();
    return (formCache[key] = pts);
  }
  function formPoly(src, cx, cy, size, o) {
    o = o || {};
    var k = size / 400, pts = formPoints(src).map(function (q) { return [cx + (q[0] - 200) * k, cy + (q[1] - 200) * k]; });
    var a = pts[0], z = pts[pts.length - 1];
    var inY = o.inY != null ? o.inY : cy + size * 0.4, outY = o.outY != null ? o.outY : cy - size * 0.4;
    var lead = FilShapes.catmull([[-280, inY], [cx - size * 0.9, (inY + a[1]) / 2 + 30], a], 10);
    var tail = FilShapes.catmull([z, [cx + size * 0.9, (outY + z[1]) / 2 - 30], [1360, outY]], 10);
    return lead.concat(pts.slice(1), tail.slice(1));
  }

  /* ---------- Entdeckte Perle wandert sichtbar auf den persönlichen Faden ---------- */
  function flyBead(fromEl, color) {
    var th = $('#dock-thread');
    if (!th || !fromEl || document.body.classList.contains('reduced') || !fromEl.isConnected) return Promise.resolve();
    var sr = stage.getBoundingClientRect(), sc = sr.width / STAGE_W, a = fromEl.getBoundingClientRect(), b = th.getBoundingClientRect();
    if (!a.width) return Promise.resolve();
    var x0 = (a.left + a.width / 2 - sr.left) / sc, y0 = (a.top + a.height / 2 - sr.top) / sc;
    var x1 = (b.left + b.width * 0.36 - sr.left) / sc, y1 = (b.top + b.height / 2 - sr.top) / sc;
    var bead = h('i', { class: 'fly-bead', style: { '--c': color, left: px(x0 - 20), top: px(y0 - 20) } });
    overlayRoot.appendChild(bead);
    var mx = (x0 + x1) / 2 + (x0 < 540 ? 170 : -170), my = Math.min(y0, y1) - 240;
    var anim = bead.animate([
      { transform: 'translate(0,0) scale(.4)', opacity: 0 },
      { transform: 'translate(' + (mx - x0) + 'px,' + (my - y0) + 'px) scale(1.3)', opacity: 1, offset: 0.45 },
      { transform: 'translate(' + (x1 - x0) + 'px,' + (y1 - y0) + 'px) scale(.7)', opacity: 1 }
    ], { duration: 950, easing: 'cubic-bezier(.45,0,.2,1)' });
    return new Promise(function (res) {
      function done() { bead.remove(); res(); }
      anim.onfinish = done; anim.oncancel = done;
    });
  }

  function later(fn, ms) { var id = setTimeout(fn, ms); if (scope) scope.timers.push(id); return id; }
  function every(fn, ms) { var id = setInterval(fn, ms); if (scope) scope.intervals.push(id); return id; }
  function cleanupScope() {
    if (!scope) return;
    scope.timers.forEach(clearTimeout); scope.intervals.forEach(clearInterval);
    scope.cleanups.forEach(function (f) { try { f(); } catch (e) { /* ignorieren */ } });
    scope = null;
  }

  /* =========================================================== Datum */

  function todayISO() {
    var o = params.get('today') || (D && D.config.today);
    if (o && /^\d{4}-\d{2}-\d{2}$/.test(o)) return o;
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function fmtDate(iso, lang) {
    var p = iso.split('-').map(Number), d = new Date(p[0], p[1] - 1, p[2], 12);
    var loc = lookup(lang, 'meta.locale') || 'fr-LU';
    try { return new Intl.DateTimeFormat(loc, { day: 'numeric', month: 'long', year: 'numeric' }).format(d); }
    catch (e) { return iso; }
  }

  /* =========================================================== Mehrsprachigkeit */

  function lookup(lang, key) {
    var node = D && D.i18n[lang];
    var parts = key.split('.');
    for (var i = 0; i < parts.length && node != null; i++) node = node[parts[i]];
    return node;
  }
  function fill(str, vars, lang) {
    if (!vars) return str;
    return str.replace(/\{(\w+)\}/g, function (m, k) {
      var v = vars[k];
      if (v == null) return m;
      if (typeof v === 'object' && v.date) return fmtDate(v.date, lang);
      if (typeof v === 'object' && v.key) return t(v.key, v.vars, lang);
      return String(v);
    });
  }
  function t(key, vars, lang) {
    lang = lang || S.lang;
    var v = lookup(lang, key);
    if (typeof v !== 'string') {
      if (!missingLogged[lang + key]) { missingLogged[lang + key] = 1; console.warn('[i18n] fehlt:', lang, key); }
      v = lookup('fr', key);
      if (typeof v !== 'string') return '';
    }
    return fill(v, vars, lang);
  }
  function pluralKey(base, n) {
    var k = base + (n === 0 ? '.zero' : n === 1 ? '.one' : '.other');
    if (n === 0 && lookup(S.lang, k) == null) k = base + '.other';
    return k;
  }

  function applyI18n(root) {
    root = root || document;
    $$('[data-i18n]', root).forEach(function (el) {
      var vars = el.getAttribute('data-i18n-vars');
      var lang = el.getAttribute('data-i18n-lang') || S.lang;
      el.textContent = t(el.getAttribute('data-i18n'), vars ? JSON.parse(vars) : null, lang);
      if (el.hasAttribute('data-i18n-lang')) el.setAttribute('lang', lang);
    });
    $$('[data-i18n-aria]', root).forEach(function (el) {
      var vars = el.getAttribute('data-i18n-aria-vars');
      el.setAttribute('aria-label', t(el.getAttribute('data-i18n-aria'), vars ? JSON.parse(vars) : null));
    });
    $$('[data-qr]', root).forEach(renderQR);
    fitAll(root);
  }
  function setVars(el, vars) { el.setAttribute('data-i18n-vars', JSON.stringify(vars)); applyI18n(el.parentNode || el); }
  function setKey(el, key, vars) {
    el.setAttribute('data-i18n', key);
    if (vars) el.setAttribute('data-i18n-vars', JSON.stringify(vars)); else el.removeAttribute('data-i18n-vars');
    el.textContent = t(key, vars);
    if (el.classList.contains('fit')) fitText(el);
  }

  // Prüft, ob DE und EN jeden Text aus FR besitzen (und umgekehrt)
  function checkTranslations() {
    var issues = [];
    function flat(node, prefix, out) {
      if (typeof node === 'string') { out[prefix] = node; return out; }
      if (node && typeof node === 'object') Object.keys(node).forEach(function (k) { flat(node[k], prefix ? prefix + '.' + k : k, out); });
      return out;
    }
    var langs = D.config.languages, maps = {};
    langs.forEach(function (l) { maps[l] = flat(D.i18n[l] || {}, '', {}); });
    var all = {};
    langs.forEach(function (l) { Object.keys(maps[l]).forEach(function (k) { all[k] = 1; }); });
    Object.keys(all).forEach(function (k) {
      langs.forEach(function (l) {
        if (typeof maps[l][k] !== 'string' || !maps[l][k].trim()) issues.push(l + ': ' + k);
      });
    });
    return issues;
  }

  // Text verkleinern, bis er in seinen Rahmen passt (z. B. lange deutsche Wörter)
  function fitText(el) {
    el.style.fontSize = '';
    var base = parseFloat(getComputedStyle(el).fontSize), size = base;
    var min = base * (parseFloat(el.getAttribute('data-fit-min')) || 0.68), guard = 0;
    while ((el.scrollHeight > el.clientHeight + 2 || el.scrollWidth > el.clientWidth + 2) && size > min && guard++ < 40) {
      size *= 0.95; el.style.fontSize = size + 'px';
    }
  }
  function fitAll(root) { $$('.fit', root || document).forEach(fitText); }

  /* =========================================================== Bühne */

  function layout() {
    var vw = window.innerWidth, vh = window.innerHeight;
    var preview = !params.get('kiosk') && vw / vh > 0.72;
    document.body.classList.toggle('is-preview', preview);
    var pad = preview ? 60 : 0, capH = preview ? 56 : 0;
    stageScale = Math.min((vw - pad) / STAGE_W, (vh - pad - capH) / STAGE_H);
    stage.parentNode.style.paddingBottom = capH ? px(capH) : '';
    stage.style.transform = 'scale(' + stageScale + ')';
    stage.style.margin = (-(STAGE_H - STAGE_H * stageScale) / 2) + 'px ' + (-(STAGE_W - STAGE_W * stageScale) / 2) + 'px';
    if (fil) fil.resize(stageScale, window.devicePixelRatio || 1);
  }
  function toStage(e) {
    var r = stage.getBoundingClientRect();
    return { x: (e.clientX - r.left) / stageScale, y: (e.clientY - r.top) / stageScale };
  }

  /* =========================================================== QR-Codes */

  function urlFor(key, lang) {
    var u = D.content.urls[key];
    if (!u) return 'https://bne.lu/';
    var url = u[lang || S.lang] || u.fr;
    var utm = D.config.qr && D.config.qr.utm;
    if (utm && utm.enabled) {
      var loc = (params.get('location') || D.config.location.name || 'stele').toLowerCase().replace(/[^a-z0-9]+/g, '-');
      url += (url.indexOf('?') < 0 ? '?' : '&') + 'utm_source=' + encodeURIComponent(utm.source) + '&utm_medium=' + encodeURIComponent(utm.medium) + '&utm_campaign=' + encodeURIComponent(loc);
    }
    return url;
  }
  function shortUrl(url) { return url.replace(/^https?:\/\//, '').replace(/\?utm_.*$/, '').replace(/\/$/, ''); }
  function qrBox(urlKey, cls) {
    return h('div', { class: 'qr ' + (cls || ''), 'data-qr': urlKey });
  }
  function renderQR(el) {
    var url = urlFor(el.getAttribute('data-qr'));
    if (el.getAttribute('data-qr-url') === url) return;
    el.setAttribute('data-qr-url', url);
    try {
      el.innerHTML = QR.toSVG(url, { ecl: (D.config.qr && D.config.qr.ecl) || 'M', margin: 3, dark: '#0E2C31', light: '#ffffff', title: shortUrl(url) });
    } catch (e) { el.textContent = shortUrl(url); }
    var cap = el.parentNode && el.parentNode.querySelector('[data-qr-text="' + el.getAttribute('data-qr') + '"]');
    if (cap) cap.textContent = shortUrl(url);
  }
  function qrText(urlKey) { return h('p', { class: 'qr-url', 'data-qr-text': urlKey }); }

  /* =========================================================== Icons */

  var ICON = {
    home: '<path d="M4 11.5 12 5l8 6.5"/><path d="M6.5 10v9h11v-9"/>',
    back: '<path d="M14.5 5.5 8 12l6.5 6.5"/>',
    tag: '<path d="M3.5 11.6V4.5h7.1l9 9-7.1 7.1z"/><circle cx="7.8" cy="8.8" r="1.6"/>',
    timer: '<circle cx="12" cy="13.5" r="7"/><path d="M12 13.5V9.5M9.5 3.5h5"/>',
    links: '<circle cx="7" cy="8" r="3.3"/><circle cx="17" cy="8" r="3.3"/><circle cx="12" cy="17" r="3.3"/><path d="M9.6 9.9 11 14.2M14.4 9.9 13 14.2M10.3 8h3.4"/>',
    pin: '<path d="M12 21s-6.5-6.1-6.5-11a6.5 6.5 0 0 1 13 0c0 4.9-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.4"/>',
    check: '<path d="M5 12.5 10 17.5 19 7"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>'
  };
  function icon(name, cls) {
    return h('svg', { viewBox: '0 0 24 24', class: cls || '', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true', html: ICON[name] });
  }
  function btn(cls, iconName, key, onclick, extra) {
    var b = h('button', Object.assign({ class: 'btn ' + cls, type: 'button', onclick: onclick }, extra || {}), [
      iconName ? icon(iconName) : null, h('span', { i18n: key })
    ]);
    return b;
  }

  /* =========================================================== Entdeckungen ("Dein Faden") */

  function discover(d, fromEl) {
    if (S.discoveries.some(function (x) { return x.id === d.id; })) return false;
    S.discoveries.push(d);
    if (fromEl) flyBead(fromEl, sdgColor(d.sdg)).then(function () { updateDock(true); fil.pulse(-1); });
    else updateDock(true);
    stat('discoveries');
    return true;
  }
  var toastTimer = null;
  // Rückmeldung „An deinen Faden geknüpft“ direkt im Faden-Knopf des Docks:
  // dort landet die neue Perle, und nichts verdeckt die Inhalte des Bildschirms.
  function toast(color) {
    var th = $('#dock-thread'), countEl = $('#dt-count');
    if (!th || !countEl) return;
    th.style.setProperty('--flash', color || 'var(--glow)');
    th.classList.add('flash');
    setKey(countEl, 'ui.added');
    var live = $('#toast');
    if (live) live.textContent = t('ui.added');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { th.classList.remove('flash'); updateDock(false); if (live) live.textContent = ''; }, 2400);
  }

  /* =========================================================== Dock und Kopfzeile */

  function buildChrome() {
    var brandLeft, hasLogo = !!D.logoSvg;
    if (hasLogo) brandLeft = h('span', { class: 'brand-logo', role: 'img', 'aria-label': 'bne.lu – Bildung fir Nohalteg Entwécklung', html: D.logoSvg });
    else if (D.config.brand.logo) { brandLeft = h('img', { class: 'brand-logo', src: D.config.brand.logo, alt: 'bne.lu' }); hasLogo = true; }
    else brandLeft = h('span', { class: 'brand-mark', text: D.config.brand.wordmark || 'bne.lu' });
    var brand = h('div', { class: 'brand' + (hasLogo ? ' has-logo' : ''), id: 'brand' }, [brandLeft, hasLogo ? null : h('span', { class: 'brand-desc', i18n: 'brand.descriptor' }), h('i', { class: 'brand-hold' })]);
    stage.insertBefore(brandArcs(), stage.firstChild);
    var loc = params.get('location') || D.config.location.name;
    var right = h('div', { class: 'top-right' }, [
      loc ? h('span', { class: 'loc' }, [icon('pin'), h('span', { text: loc })]) : null,
      h('span', { class: 'badge' + (badgeOn() ? '' : ' is-off'), id: 'badge', i18n: 'ui.prototype' })
    ]);
    topbar.appendChild(brand); topbar.appendChild(right);
    adminHold(brand);

    var home = h('button', { class: 'btn btn-ghost btn-sm dock-home', type: 'button', id: 'dock-home', onclick: function () { go('hub'); } }, [icon('home'), h('span', { i18n: 'ui.home' })]);
    var thread = h('button', { class: 'dock-thread', type: 'button', id: 'dock-thread', onclick: function () { go('take'); } }, [
      h('svg', { class: 'beads', viewBox: '0 0 420 70', preserveAspectRatio: 'none', 'aria-hidden': 'true' }),
      h('span', { class: 'dt-text' }, [h('span', { class: 'dt-label', i18n: 'ui.yourThread' }), h('span', { class: 'dt-count', id: 'dt-count' })])
    ]);
    var lang = h('div', { class: 'lang', role: 'group', 'data-i18n-aria': 'ui.language' }, D.config.languages.map(function (l) {
      return h('button', { type: 'button', 'data-lang': l, 'aria-pressed': 'false', 'aria-label': lookup(l, 'meta.language') || l, lang: l, onclick: function () { setLang(l); } }, [l.toUpperCase()]);
    }));
    dock.appendChild(home); dock.appendChild(thread); dock.appendChild(lang);
    overlayRoot.appendChild(h('div', { class: 'sr-only', id: 'toast', role: 'status', 'aria-live': 'polite' }));
  }

  function updateDock(pop) {
    var n = S.discoveries.length;
    var th = $('#dock-thread');
    th.classList.toggle('has-items', n > 0);
    var countEl = $('#dt-count');
    setKey(countEl, pluralKey('ui.discoveries', n), { n: n });
    $('.dt-label', th).setAttribute('data-i18n', n > 0 ? 'ui.takeAway' : 'ui.yourThread');
    $('.dt-label', th).textContent = t(n > 0 ? 'ui.takeAway' : 'ui.yourThread');
    var svg = $('svg.beads', th);
    var shown = S.discoveries.slice(-14);
    var w = 420, y = 35, d1 = 'M4 ' + y, d2 = 'M4 ' + y;
    for (var x = 4; x <= w - 4; x += 12) {
      d1 += ' L' + x + ' ' + (y + Math.sin(x / 34) * 6 + Math.sin(x / 9) * 2.4).toFixed(1);
      d2 += ' L' + x + ' ' + (y + Math.sin(x / 34) * 6 - Math.sin(x / 9) * 2.4).toFixed(1);
    }
    var html = '<path d="' + d1 + '" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/>' +
               '<path d="' + d2 + '" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" opacity=".7"/>';
    shown.forEach(function (it, i) {
      var bx = 26 + i * ((w - 52) / Math.max(13, shown.length - 1));
      var by = y + Math.sin(bx / 34) * 6;
      var last = pop && i === shown.length - 1, r0 = last ? 15 : 12;
      var anim = last ? ' style="transform-box:fill-box;transform-origin:center;animation:pop .6s"' : '';
      html += '<g' + anim + '><circle cx="' + bx.toFixed(1) + '" cy="' + by.toFixed(1) + '" r="' + r0 + '" fill="' + sdgColor(it.sdg) + '" style="stroke:var(--bead-edge)" stroke-width="3"/>' +
        '<circle cx="' + (bx - r0 * 0.32).toFixed(1) + '" cy="' + (by - r0 * 0.34).toFixed(1) + '" r="' + (r0 * 0.28).toFixed(1) + '" fill="#fff" opacity=".55"/></g>';
    });
    svg.innerHTML = html;
    th.setAttribute('aria-label', t('ui.yourThread') + ', ' + t(pluralKey('ui.discoveries', n), { n: n }));
    if (pop) { th.classList.remove('pop'); void th.offsetWidth; th.classList.add('pop'); }
  }

  function updateChrome() {
    var att = S.screen === 'attract';
    $('#dock-home').classList.toggle('is-hidden', att || S.screen === 'hub');
    $('#dock-thread').classList.toggle('is-hidden', att);
    $$('.lang button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-lang') === S.lang)); });
  }

  function setLang(l) {
    if (D.config.languages.indexOf(l) < 0 || l === S.lang) { bump(); return; }
    S.lang = l;
    document.documentElement.lang = l;
    applyI18n(document);
    updateDock(false);
    updateChrome();
    if (current && current.onLang) current.onLang();
    stat('lang_' + l);
  }

  /* =========================================================== Router */

  var SCREENS = {};

  function go(name, opts) {
    if (!SCREENS[name]) name = 'hub';
    bump();
    var old = current;
    cleanupScope();
    if (old && old.leave) { try { old.leave(); } catch (e) { /* ignorieren */ } }
    scope = { timers: [], intervals: [], cleanups: [] };
    S.screen = name;
    document.body.setAttribute('data-screen', name);
    if (S.design === 'hybrid') setEffective(effectiveDesign(name));
    var next;
    try {
      next = SCREENS[name](opts || {});
    } catch (err) {
      console.error(err); showError(); return;
    }
    current = next;
    next.el.classList.add('scr', 'enter');
    screenEl.appendChild(next.el);
    applyI18n(next.el);
    if (old && old.el) {
      old.el.classList.add('leave');
      setTimeout(function () { if (old.el.parentNode) old.el.parentNode.removeChild(old.el); }, 420);
    }
    requestAnimationFrame(function () { requestAnimationFrame(function () { next.el.classList.remove('enter'); }); });
    if (next.shape) fil.setShape(next.shape[0], next.shape[1]);
    if (old) fil.pulse();
    updateChrome();
    stat('screen_' + name);
  }

  /* =========================================================== Zeichnungen */

  function gradientFor(obj) {
    var cols = [];
    obj.threads.forEach(function (th) { var c = sdgColor(th.sdg); if (cols.indexOf(c) < 0) cols.push(c); });
    return cols;
  }
  var gradSeq = 0;
  function drawingSVG(obj, opts) {
    opts = opts || {};
    var id = 'g' + (++gradSeq), cols = gradientFor(obj);
    var stops = cols.map(function (c, i) { return '<stop offset="' + (cols.length > 1 ? i / (cols.length - 1) : 0) + '" stop-color="' + c + '"/>'; }).join('');
    var stroke = opts.ink ? opts.ink : 'url(#' + id + ')';
    var html = '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="1" y2="1">' + stops + '</linearGradient></defs>';
    if (opts.glow) html += '<path d="' + obj.drawing + '" fill="none" stroke="' + stroke + '" stroke-width="' + (opts.w * 3.2) + '" stroke-opacity=".16" stroke-linecap="round" stroke-linejoin="round" pathLength="1" class="' + (opts.cls || '') + '"/>';
    html += '<path d="' + obj.drawing + '" fill="none" stroke="' + stroke + '" stroke-width="' + opts.w + '" stroke-linecap="round" stroke-linejoin="round" pathLength="1" class="' + (opts.cls || '') + '"/>';
    if (opts.loop) html += '<circle class="loop" cx="200" cy="200" r="232" fill="none" stroke="url(#' + id + ')" stroke-width="5" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"/>';
    return h('svg', { viewBox: '0 0 400 400', 'aria-hidden': 'true', html: html });
  }
  function restartDraw(svg, sec) {
    $$('path', svg).forEach(function (p) {
      p.classList.remove('draw', 'undraw'); void p.getBoundingClientRect();
      p.style.setProperty('--draw', sec + 's'); p.classList.add('draw');
    });
  }

  /* =========================================================== 1 · Anziehung */

  SCREENS.attract = function () {
    var cfg = D.config.attract;
    var items = (cfg.objects || []).map(function (id) {
      var o = objById(id);
      if (o) return { src: o, hook: 'objects.items.' + id + '.hook' };
      var m = D.content.motifs && D.content.motifs[id];
      return m ? { src: m, hook: 'attract.motifs.' + id } : null;
    }).filter(Boolean);
    var idx = -1;
    var hook = h('h2', { class: 'abs att-hook t-h1 balance fit fade-out', 'data-fit-min': '0.6' });
    var prompt = h('p', { class: 'att-prompt', i18n: 'attract.touch' });
    var commons = h('p', { class: 'att-commons is-off' });
    function showCommons() {
      var cfg = D.config.commons, c = commonsRead();
      var on = cfg && cfg.enabled && c.n >= (cfg.minToShow || 10);
      commons.classList.toggle('is-off', !on);
      if (on) setKey(commons, pluralKey('attract.commons', c.n), { n: fmtNum(c.n) });
    }
    var lastPt = { x: 540, y: 1590 };
    var el = h('section', { class: 'scr-attract' }, [
      h('h1', { class: 'abs att-title t-hero fit nowrap', i18n: 'attract.title' }),
      h('p', { class: 'abs att-tagline t-lead balance', i18n: 'attract.tagline' }),
      hook,
      h('div', { class: 'abs att-touch', 'aria-hidden': 'true' }, [h('span', { class: 'pulse' }), prompt, commons]),
      h('button', { class: 'sr-only', type: 'button', 'data-i18n-aria': 'attract.touch', onclick: function () { start(); } })
    ]);
    var FLOW = ['attract', { width: 64, deform: true, twist: 2.4, spin: 0.5, morph: 1.3, grabRadius: 360 }];
    // Ruhezustand: Der Faden fließt frei, formt dann einen Gegenstand und löst sich wieder.
    function flow() {
      fil.setShape(FLOW[0], FLOW[1]);
      hook.classList.add('fade-out');
      later(form, (cfg.flowSec || 3.6) * 1000);
    }
    function form() {
      if (!items.length) return;
      idx = (idx + 1) % items.length;
      var it = items[idx];
      fil.setShape('path', { poly: formPoly(it.src, 540, 760, 620, { inY: 1040, outY: 520 }), width: 13, twist: 52, spin: 0.7, morph: 1.15, deform: true, grabRadius: 360, breathe: 3.5 });
      later(function () { setKey(hook, it.hook); fitText(hook); hook.classList.remove('fade-out'); }, 900);
      later(flow, (cfg.holdSec || 6) * 1000);
    }
    var starting = false;
    function start() {
      if (starting) return;
      starting = true;
      fil.pulse(); stat('sessions'); countCommons();
      if (S.design === 'hybrid') later(function () { lightCurtain(lastPt.x, lastPt.y).then(function () { go('hub'); }); }, 240);
      else later(function () { go('hub'); }, 420);
    }
    // Den Faden aufnehmen: Er folgt dem Finger, spannt sich und gibt beim Loslassen den Weg frei.
    // Antippen funktioniert genauso (für alle, die nicht ziehen können oder möchten).
    var downAt = null;
    el.addEventListener('pointerdown', function (e) { downAt = Date.now(); lastPt = toStage(e); bump(); });
    el.addEventListener('pointermove', function () {
      if (!downAt) return;
      var pulling = fil.grabbed && fil.pullDistance > 50;
      if (pulling !== el.classList.contains('is-pulling')) { el.classList.toggle('is-pulling', pulling); setKey(prompt, pulling ? 'attract.pulling' : 'attract.touch'); }
      if (fil.pullDistance > 300) start();
    });
    function up() { if (!downAt) return; downAt = null; start(); }
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', function () { downAt = null; el.classList.remove('is-pulling'); setKey(prompt, 'attract.touch'); });
    later(form, 1800);
    showCommons();
    return { el: el, shape: FLOW, onLang: function () { fitText(hook); showCommons(); } };
  };

  /* =========================================================== 2 · Startseite */

  var HUB_KNOTS = [[200, 760], [236, 1010], [200, 1260], [236, 1510]];

  SCREENS.hub = function () {
    var el = h('section', { class: 'scr-hub' }, [
      h('div', { class: 'abs hub-head' }, [
        h('h1', { class: 'hub-title t-h1 pretty fit', style: { 'max-height': '190px' }, i18n: 'hub.title' }),
        h('p', { class: 'hub-lead t-lead', i18n: 'hub.lead' })
      ])
    ]);
    D.content.hub.forEach(function (item, i) {
      var k = HUB_KNOTS[i];
      var b = h('button', {
        class: 'hub-item', type: 'button',
        style: { left: px(k[0] - 110), top: px(k[1] - TOP - 115), width: px(1010 - (k[0] - 110)), '--c': sdgColor(item.sdg), '--d': (i * 0.6) + 's' },
        onclick: function (e) {
          b.classList.add('is-pulling');
          fil.ripple(k[0], k[1]);
          later(function () { go(item.screen); }, 280);
        }
      }, [
        h('span', { class: 'hk' }, [icon(item.icon)]),
        h('span', { class: 'ht' }, [
          h('h3', { class: 't-h3', i18n: 'hub.' + item.id + '.title' }),
          h('p', { class: 't-small muted', i18n: 'hub.' + item.id + '.text' })
        ])
      ]);
      el.appendChild(b);
    });
    var path = [[1260, 540], [700, 600], [260, 640]].concat(HUB_KNOTS).concat([[170, 1720], [-220, 1880]]);
    return { el: el, shape: ['through', { points: path, width: 26, deform: true, twist: 7, spin: 0.7 }] };
  };

  /* =========================================================== 3 · Objekte */

  function objById(id) { return D.content.objects.filter(function (o) { return o.id === id; })[0]; }

  var PICK = [[300, 470], [780, 470], [300, 1050], [780, 1050]];
  var PICK_PATH = [[-220, 425], [300, 440], [780, 430], [1260, 450], [1260, 1005], [780, 1015], [300, 1008], [-220, 1020]];

  SCREENS.objects = function () {
    var el = h('section', { class: 'scr-objects' }, [
      h('h1', { class: 'abs obj-title t-h2', i18n: 'objects.title' }),
      h('p', { class: 'abs obj-lead t-body pretty fit', i18n: 'objects.lead' })
    ]);
    var strings = h('svg', { class: 'strings', width: '1080', height: '1660', viewBox: '0 0 1080 1660', 'aria-hidden': 'true' });
    el.appendChild(strings);
    var sHtml = '', lineYs = [440, 430, 1008, 1015];
    D.content.objects.slice(0, PICK.length).forEach(function (obj, i) {
      var p = PICK[i];
      sHtml += '<path d="M' + p[0] + ' ' + (lineYs[i] - TOP - 6) + ' L' + p[0] + ' ' + (p[1] - TOP + 38) + '" style="stroke:var(--string)" stroke-width="3"/>';
      var dots = h('span', { class: 'dots' }, obj.threads.map(function (th) { return h('i', { style: { '--c': sdgColor(th.sdg) } }); }));
      var b = h('button', { class: 'obj-pick', type: 'button', style: pos(p[0] - 200, p[1] - TOP), onclick: function () {
        if (el.classList.contains('is-leaving')) return;
        el.classList.add('is-leaving');
        $$('.obj-pick', el).forEach(function (x) { x.classList.toggle('is-dimmed', x !== b); });
        b.classList.add('is-picked'); fil.ripple(p[0], p[1]); fil.pulse();
        later(function () { go('object', { id: obj.id }); }, 430);
      } }, [
        h('span', { class: 'tag-wrap', style: { position: 'relative' } }, [
          h('span', { class: 'tag swing', style: { 'animation-delay': (0.12 * i) + 's' } }, [
            drawingSVG(obj, { w: 7, ink: '#10282C' }),
            h('span', { class: 'tag-title', i18n: 'objects.items.' + obj.id + '.name' }),
            dots
          ])
        ])
      ]);
      el.appendChild(b);
    });
    strings.innerHTML = sHtml;
    return { el: el, shape: ['through', { points: PICK_PATH, width: 10, deform: false, twist: 16, spin: 0.6 }] };
  };

  // Objekt oben, vier Fäden hängen nach unten in Reichweite (Bildschirmkoordinaten)
  var KNOTS = [[165, 770], [415, 770], [665, 770], [915, 770]];
  var ANCHORS = [[452, 525], [508, 547], [572, 547], [628, 525]];
  var TAG_TOP = 985;
  // Der Faden zeichnet den Gegenstand selbst: groß beim Ziehen, klein über Entscheidung und Angebot
  function objectShape(obj, phase) {
    // Ziehen: der Faden liegt deckungsgleich auf der Zeichnung (Kasten 340 px, Mitte 540/480).
    // Entscheidung und Angebot: er legt sich als Schlinge um die kleine, klare Zeichnung.
    return phase === 'pull'
      ? ['path', { poly: formPoly(obj, 540, 480, 340, { inY: 660, outY: 380 }), width: 8, twist: 30, spin: 0.6, morph: 1.7 }]
      : ['loop', { cx: 540, cy: 320, r: 185, width: 14, twist: 9, spin: 0.6, inY: -0.2, outY: -0.6 }];
  }

  SCREENS.object = function (opts) {
    var obj = objById(opts.id) || D.content.objects[0];
    if (!S.obj || S.obj.id !== obj.id) S.obj = { id: obj.id, revealed: [], current: null, phase: 'pull', choice: null };
    var st = S.obj, base = 'objects.items.' + obj.id, total = obj.threads.length;

    var root = h('section', { class: 'scr-object phase-' + st.phase });
    var lines = h('svg', { class: 'ob-lines', viewBox: '0 0 1080 1660', width: '1080', height: '1660', 'aria-hidden': 'true' });
    var art = h('div', { class: 'abs ob-art' }, [drawingSVG(obj, { w: 7, glow: true, loop: true })]);
    var hint = h('p', { class: 'abs ob-hint t-small', i18n: 'objects.pullHint' });
    var tagSlot = h('div', { class: 'abs ob-tag' });
    var nav = h('div', { class: 'abs ob-nav' });

    root.appendChild(h('h2', { class: 'abs ob-hook t-h2 balance fit', i18n: base + '.hook' }));
    root.appendChild(lines);
    root.appendChild(art);

    var paths = [], glows = [], knots = [], linesHtml = '';
    obj.threads.forEach(function (th, i) {
      var c = sdgColor(th.sdg);
      linesHtml += '<path data-g="' + i + '" fill="none" stroke="' + c + '" stroke-opacity=".22" stroke-width="16" stroke-linecap="round"/>';
      linesHtml += '<path data-p="' + i + '" fill="none" stroke="' + c + '" stroke-width="5" stroke-linecap="round"/>';
    });
    linesHtml += '<path data-link fill="none" style="stroke:var(--string)" stroke-width="4" stroke-linecap="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"/>';
    lines.innerHTML = linesHtml;
    obj.threads.forEach(function (th, i) {
      paths[i] = lines.querySelector('[data-p="' + i + '"]');
      glows[i] = lines.querySelector('[data-g="' + i + '"]');
    });
    var linkPath = lines.querySelector('[data-link]');

    function threadD(i, kx, ky) {
      var a = ANCHORS[i];
      return 'M' + a[0] + ' ' + a[1] + ' C' + a[0] + ' ' + (a[1] + 130) + ' ' + kx + ' ' + (ky - 160) + ' ' + kx + ' ' + ky;
    }
    function setThread(i, kx, ky) { var d = threadD(i, kx, ky); paths[i].setAttribute('d', d); glows[i].setAttribute('d', d); }

    obj.threads.forEach(function (th, i) {
      var k = KNOTS[i];
      setThread(i, k[0], k[1]);
      var knot = h('button', {
        class: 'knot' + (st.revealed.indexOf(th.id) >= 0 ? ' is-pulled' : ''), type: 'button',
        style: pos(k[0], k[1], { '--c': sdgColor(th.sdg) }),
        'data-i18n-aria': base + '.threads.' + th.id + '.label'
      }, [h('span', { class: 'knot-core' })]);
      var label = h('span', { class: 'knot-label', style: pos(k[0], k[1] + 92), i18n: base + '.threads.' + th.id + '.label' });
      knots[i] = knot;
      root.appendChild(knot); root.appendChild(label);
      attachPull(knot, i, k);
    });

    // Ziehen: Knoten folgt dem Finger, der Faden dehnt sich; Loslassen weit genug oder kurzes Tippen deckt auf
    function attachPull(knot, i, k) {
      var drag = null, raf = 0;
      knot.addEventListener('pointerdown', function (e) {
        if (st.phase !== 'pull') return;
        e.preventDefault();
        try { knot.setPointerCapture(e.pointerId); } catch (x) { /* ok */ }
        var p = toStage(e);
        drag = { sx: p.x, sy: p.y, dx: 0, dy: 0, id: e.pointerId };
        knot.style.transition = 'none';
        cancelAnimationFrame(raf);
      });
      knot.addEventListener('pointermove', function (e) {
        if (!drag || e.pointerId !== drag.id) return;
        var p = toStage(e), dx = p.x - drag.sx, dy = p.y - drag.sy, len = Math.hypot(dx, dy), max = 260;
        if (len > max) { dx *= max / len; dy *= max / len; }
        drag.dx = dx; drag.dy = dy;
        knot.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
        setThread(i, k[0] + dx, k[1] + dy);
        bump();
      });
      function release(e) {
        if (!drag || (e && e.pointerId !== drag.id)) return;
        var len = Math.hypot(drag.dx, drag.dy), dx = drag.dx, dy = drag.dy;
        drag = null;
        if (len < 16 || len > 80) reveal(i);
        var t0 = performance.now();
        (function spring(now) {
          var tt = (now - t0) / 1000, f = Math.exp(-6 * tt) * Math.cos(13 * tt);
          knot.style.transform = 'translate(' + (dx * f) + 'px,' + (dy * f) + 'px)';
          setThread(i, k[0] + dx * f, k[1] + dy * f);
          if (tt < 1.1) raf = requestAnimationFrame(spring); else { knot.style.transform = ''; setThread(i, k[0], k[1]); }
        })(t0);
      }
      knot.addEventListener('pointerup', release);
      knot.addEventListener('pointercancel', release);
      scope.cleanups.push(function () { cancelAnimationFrame(raf); });
    }

    function reveal(i) {
      if (st.phase !== 'pull') return;
      var th = obj.threads[i];
      if (st.revealed.indexOf(th.id) < 0) st.revealed.push(th.id);
      st.current = th.id;
      knots[i].classList.add('is-pulled');
      fil.ripple(KNOTS[i][0], KNOTS[i][1] + TOP);
      renderTag(i, true);
      updateProgress();
      fil.pulse(-1);
      discover({ id: 'thr:' + obj.id + ':' + th.id, sdg: th.sdg, url: obj.offer.url, labelKey: base + '.offer.title' }, knots[i]);
      stat('threads');
    }
    var progressEl = null;
    function renderTag(i, animate) {
      var th = obj.threads[i], tb = base + '.threads.' + th.id;
      knots.forEach(function (kn, j) { kn.classList.toggle('is-current', j === i); });
      tagSlot.innerHTML = '';
      progressEl = h('span', { class: 'tag-progress', i18n: pluralKey('objects.progress', st.revealed.length), vars: { n: st.revealed.length, total: total } });
      var tag = h('div', { class: 'tag' + (animate ? ' swing' : '') }, [
        h('div', { class: 'tag-top' }, [
          h('span', { class: 'sdg-chip', style: { '--c': sdgColor(th.sdg) } }, [h('b', { text: String(th.sdg) }), h('span', { i18n: 'sdg.' + th.sdg })]),
          progressEl
        ]),
        h('p', { class: 'tag-title balance', i18n: tb + '.title' }),
        h('p', { class: 'tag-text pretty fit', i18n: tb + '.text' })
      ]);
      tagSlot.appendChild(h('div', { class: 'tag-wrap', style: { position: 'relative' } }, [tag]));
      applyI18n(tagSlot);
      var k = KNOTS[i];
      linkPath.setAttribute('d', 'M' + k[0] + ' ' + (k[1] + 76) + ' C' + k[0] + ' ' + (k[1] + 170) + ' 540 ' + (TAG_TOP - 80) + ' 540 ' + (TAG_TOP + 38));
      linkPath.classList.remove('draw'); void linkPath.getBoundingClientRect();
      linkPath.style.setProperty('--draw', animate ? '0.6s' : '0.01s');
      linkPath.classList.add('draw');
      hint.classList.add('is-hidden');
    }
    function updateProgress() {
      var n = st.revealed.length;
      hint.classList.toggle('is-hidden', n > 0);
      if (progressEl) setKey(progressEl, pluralKey('objects.progress', n), { n: n, total: total });
      renderNav();
    }

    // Entscheidung
    var decide = h('div', { class: 'abs ob-decide' }, [
      h('h3', { class: 't-h3 balance', i18n: base + '.decision.question' }),
      h('p', { class: 'lead t-small muted', i18n: 'objects.decisionLead' })
    ].concat(obj.options.map(function (o) {
      return h('button', { class: 'choice', type: 'button', onclick: function () { choose(o); } }, [
        h('span', { class: 'mark' }, [icon('check')]),
        h('span', { class: 'ctext', i18n: base + '.decision.options.' + o + '.label' })
      ]);
    })));

    // Angebot
    var insight = h('p', { class: 'insight fit balance' });
    var offerKind = obj.offer.kind === 'public' ? 'objects.offerPublic' : 'objects.offerGroups';
    var offer = h('div', { class: 'abs ob-offer' }, [
      insight,
      h('div', { class: 'tag-wrap' }, [
        h('div', { class: 'tag tag-offer' }, [
          h('p', { class: 'eyebrow', i18n: 'objects.offerLead' }),
          h('p', { class: 'tag-title balance', i18n: base + '.offer.title' }),
          h('p', { class: 'meta', i18n: obj.offer.kind === 'public' ? 'objects.offerShort.public' : 'objects.offerShort.groups', vars: { org: { key: base + '.offer.org' } } }),
          h('div', { class: 'offer-qr' }, [qrBox(obj.offer.url), h('p', { class: 'scan', i18n: 'objects.offerScan' })])
        ])
      ])
    ]);

    root.appendChild(hint); root.appendChild(tagSlot);
    root.appendChild(decide); root.appendChild(offer);
    root.appendChild(nav);

    function renderNav() {
      nav.innerHTML = '';
      if (st.phase === 'offer') {
        nav.appendChild(btn('btn-ghost', 'back', 'objects.another', function () { go('objects'); }));
        nav.appendChild(btn('btn-primary', null, 'ui.takeAway', function () { go('take'); }));
      } else {
        nav.appendChild(btn('btn-ghost', 'back', 'objects.all', function () { go('objects'); }));
        if (st.phase === 'pull') {
          var nb = btn('btn-primary', null, 'objects.next', function () { setPhase('decide'); });
          if (st.revealed.length < 2) nb.classList.add('is-hidden');
          nav.appendChild(nb);
        }
      }
      applyI18n(nav);
    }
    function setPhase(p) {
      st.phase = p;
      root.classList.remove('phase-pull', 'phase-decide', 'phase-offer');
      root.classList.add('phase-' + p);
      var sh = objectShape(obj, p); fil.setShape(sh[0], sh[1]); fil.pulse();
      renderNav();
      bump();
    }
    function choose(o) {
      st.choice = o;
      setKey(insight, base + '.decision.options.' + o + '.insight');
      art.classList.add('looped');
      var loop = $('.loop', art);
      loop.classList.remove('draw'); void loop.getBoundingClientRect(); loop.style.setProperty('--draw', '1.4s'); loop.classList.add('draw');
      setPhase('offer');
      applyI18n(offer);
      var added = discover({ id: 'obj:' + obj.id, sdg: 12, url: obj.offer.url, labelKey: base + '.offer.title' }, $('.offer-qr .qr', offer));
      if (added) later(function () { toast(sdgColor(12)); }, 700);
      stat('completed_objects');
    }

    if (st.current) renderTag(obj.threads.map(function (x) { return x.id; }).indexOf(st.current), false);
    updateProgress();
    if (st.phase === 'offer' && st.choice) { insight.setAttribute('data-i18n', base + '.decision.options.' + st.choice + '.insight'); art.classList.add('looped'); $('.loop', art).setAttribute('stroke-dashoffset', '0'); }

    return { el: root, shape: objectShape(obj, st.phase) };
  };

  /* =========================================================== 4 · Quiz */

  function newQuiz() {
    var items = D.content.quiz.items, groups = {};
    shuffle(items).forEach(function (it) { if (!groups[it.group]) groups[it.group] = it; });
    var pick = shuffle(Object.keys(groups).map(function (g) { return groups[g]; })).slice(0, D.content.quiz.pick || 3);
    var order = {};
    pick.forEach(function (it) { order[it.id] = shuffle([0, 1, 2]); });
    return { items: pick, order: order, i: 0, answers: {}, remaining: D.config.quiz.totalSeconds, timerOff: false, phase: 'intro' };
  }

  SCREENS.quiz = function () {
    if (!S.quiz || S.quiz.phase === 'done') S.quiz = newQuiz();
    var q = S.quiz, total = D.config.quiz.totalSeconds;
    var C = 2 * Math.PI * 120;

    var root = h('section', { class: 'scr-quiz' });
    var numEl = h('p', { class: 't-small muted' });
    root.appendChild(h('div', { class: 'abs qz-head' }, [numEl]));

    var ringFg = h('circle', { cx: '140', cy: '140', r: '120', stroke: 'var(--glow)', 'stroke-dasharray': C.toFixed(1), 'stroke-dashoffset': '0', 'stroke-linecap': 'round' });
    var ringNum = h('b'), ringLbl = h('span', { i18n: 'quiz.seconds' });
    var ring = h('div', { class: 'abs qz-ring', 'data-phase': 'intro q reveal' }, [
      h('svg', { viewBox: '0 0 280 280', 'aria-hidden': 'true' }, [h('circle', { cx: '140', cy: '140', r: '120', style: { stroke: 'var(--ring-track)' } }), ringFg]),
      h('div', { class: 'num' }, [ringNum, ringLbl])
    ]);
    root.appendChild(ring);

    // Einstieg
    root.appendChild(h('h1', { class: 'abs qz-intro-title t-h1 balance', 'data-phase': 'intro', i18n: 'quiz.title' }));
    root.appendChild(h('p', { class: 'abs qz-intro-lead t-lead', 'data-phase': 'intro', i18n: 'quiz.lead' }));
    root.appendChild(h('div', { class: 'abs qz-intro-cta', 'data-phase': 'intro' }, [btn('btn-primary', null, 'quiz.start', function () { q.phase = 'q'; render(); })]));

    // Frage
    var qText = h('h2', { class: 'abs qz-q t-h2 balance fit', 'data-phase': 'q reveal', 'data-fit-min': '0.62' });
    var choices = h('div', { class: 'abs qz-choices', 'data-phase': 'q reveal' });
    var verdict = h('h3', { class: 't-h3' }), explain = h('p', { class: 'qx pretty fit', style: { 'max-height': '135px' } }), src = h('p', { class: 'src' });
    var feedback = h('div', { class: 'abs qz-feedback', 'data-phase': 'reveal' }, [verdict, explain, src]);
    var nextBtn = h('button', { class: 'btn btn-primary', type: 'button', onclick: nextQ }, [h('span')]);
    var nextWrap = h('div', { class: 'abs qz-next', 'data-phase': 'reveal' }, [nextBtn]);
    root.appendChild(qText); root.appendChild(choices); root.appendChild(feedback); root.appendChild(nextWrap);

    // Ergebnis
    var score = h('p', { class: 'abs qz-done-score t-h3', 'data-phase': 'done' });
    var beads = h('svg', { class: 'abs qz-beads', 'data-phase': 'done', viewBox: '0 0 1080 200', width: '1080', height: '200', 'aria-hidden': 'true' });
    root.appendChild(beads);
    root.appendChild(h('h1', { class: 'abs qz-done-title t-h1 fit nowrap', 'data-phase': 'done', i18n: 'quiz.doneTitle' }));
    root.appendChild(score);
    root.appendChild(h('p', { class: 'abs qz-done-text t-lead', 'data-phase': 'done', i18n: 'quiz.doneText', vars: { total: q.items.length } }));
    root.appendChild(h('div', { class: 'abs qz-done-actions', 'data-phase': 'done' }, [
      btn('btn-primary', null, 'ui.takeAway', function () { go('take'); }),
      btn('btn-ghost', null, 'quiz.again', function () { S.quiz = newQuiz(); S.quiz.phase = 'q'; q = S.quiz; render(); }),
      btn('btn-ghost', 'home', 'ui.home', function () { go('hub'); })
    ]));

    function item() { return q.items[q.i]; }
    function base() { return 'quiz.items.' + item().id; }

    function render() {
      root.classList.remove('ph-intro', 'ph-q', 'ph-reveal', 'ph-done');
      root.classList.add('ph-' + q.phase);
      $$('[data-phase]', root).forEach(function (e) { e.hidden = e.getAttribute('data-phase').split(' ').indexOf(q.phase) < 0; });
      if (q.phase === 'intro') { numEl.textContent = ''; ringNum.textContent = String(total); ringFg.setAttribute('stroke-dashoffset', '0'); setRing(); }
      if (q.phase === 'q' || q.phase === 'reveal') renderQuestion();
      if (q.phase === 'done') {
        numEl.textContent = '';
        var right = q.items.filter(function (it) { return q.answers[it.id] === it.correct; }).length;
        setKey(score, 'quiz.score', { n: right, total: q.items.length });
        var bh = '<path d="M60 100 C300 60 420 140 540 100 S800 60 1020 100" style="stroke:var(--string-soft)" stroke-width="4" fill="none"/>';
        q.items.forEach(function (it, j) {
          var bx = 340 + j * 200, ok = q.answers[it.id] === it.correct;
          bh += '<circle cx="' + bx + '" cy="100" r="58" fill="' + sdgColor(it.sdg) + '" style="stroke:var(--bead-edge)" stroke-width="6"/>' +
            '<text x="' + bx + '" y="118" text-anchor="middle" font-family="Bricolage Grotesque, DejaVu Sans, sans-serif" font-weight="800" font-size="50" fill="#fff">' + it.sdg + '</text>' +
            (ok ? '<circle cx="' + (bx + 44) + '" cy="56" r="20" fill="#FFE7A3"/><path d="M' + (bx + 35) + ' 56 l7 7 l12 -13" stroke="#10282C" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' : '');
        });
        beads.innerHTML = bh;
      }
      fil.setShape(q.phase === 'done' ? 'horizon' : 'loop', q.phase === 'done' ? { y: 1615, amp: 0.6, width: 30, twist: 5 } : { cx: 540, cy: 380, r: 175, width: 12, twist: 10, spin: 0.8, inY: -0.3, outY: -0.5 });
      applyI18n(root);
    }
    function renderQuestion() {
      var it = item();
      setKey(numEl, 'quiz.question', { n: q.i + 1, total: q.items.length });
      setKey(qText, base() + '.q');
      choices.innerHTML = '';
      var answered = q.phase === 'reveal', given = q.answers[it.id];
      q.order[it.id].forEach(function (optIdx) {
        var cls = 'choice';
        if (answered) {
          if (optIdx === it.correct) cls += ' is-correct';
          else if (optIdx === given) cls += ' is-wrong';
          else cls += ' is-dim';
        }
        var tagKey = answered ? (optIdx === it.correct ? 'quiz.correctAnswer' : optIdx === given ? 'quiz.yourAnswer' : null) : null;
        choices.appendChild(h('button', { class: cls, type: 'button', disabled: answered, onclick: function () { answer(optIdx); } }, [
          h('span', { class: 'mark' }, [icon('check')]),
          h('span', { class: 'ctext' }, [h('span', { i18n: base() + '.options.' + optIdx }), tagKey ? h('span', { class: 'ctag', i18n: tagKey }) : null])
        ]));
      });
      if (answered) {
        var key = given === undefined || given === null ? 'quiz.timeUp' : given === it.correct ? 'quiz.right' : 'quiz.wrong';
        setKey(verdict, key);
        setKey(explain, base() + '.explain');
        setKey(src, 'quiz.source', { s: { key: base() + '.source' } });
        $('span', nextBtn).setAttribute('data-i18n', q.i < q.items.length - 1 ? 'quiz.nextQuestion' : 'quiz.finish');
      }
      setRing();
      applyI18n(choices);
      if (answered) requestAnimationFrame(function () { feedback.style.top = px(Math.min(1250, 760 + choices.offsetHeight + 34)); fitText(explain); });
    }
    function setRing() {
      if (q.timerOff) {
        ringFg.setAttribute('stroke-dashoffset', C.toFixed(1));
        ringNum.textContent = '';
        ringLbl.setAttribute('data-i18n', 'quiz.noTimer'); ringLbl.className = 'long';
      } else {
        ringFg.setAttribute('stroke-dashoffset', (C * (1 - q.remaining / total)).toFixed(1));
        ringNum.textContent = String(Math.ceil(q.remaining));
        ringLbl.setAttribute('data-i18n', 'quiz.seconds'); ringLbl.className = '';
      }
      ringLbl.textContent = t(ringLbl.getAttribute('data-i18n'));
    }
    function answer(optIdx) {
      if (q.phase !== 'q') return;
      var it = item();
      q.answers[it.id] = optIdx;
      q.phase = 'reveal';
      discover({ id: 'quiz:' + it.id, sdg: it.sdg, url: it.url, labelKey: 'programs.agenda.name' }, $('.qz-ring', root));
      render();
    }
    function timeUp() {
      var it = item();
      q.answers[it.id] = null;
      q.timerOff = true;
      q.phase = 'reveal';
      discover({ id: 'quiz:' + it.id, sdg: it.sdg, url: it.url, labelKey: 'programs.agenda.name' }, $('.qz-ring', root));
      render();
    }
    function nextQ() {
      if (q.i < q.items.length - 1) { q.i++; q.phase = 'q'; }
      else { q.phase = 'done'; stat('completed_quiz'); }
      render();
    }
    every(function () {
      if (q.phase !== 'q' || q.timerOff) return;
      q.remaining = Math.max(0, q.remaining - 0.1);
      setRing();
      if (q.remaining <= 0) timeUp();
    }, 100);

    render();
    return { el: root, shape: ['loop', { cx: 540, cy: 380, r: 175, width: 12, twist: 10, spin: 0.8, inY: -0.3, outY: -0.5 }] };
  };

  /* =========================================================== 5 · Was ist BNE? */

  SCREENS.bne = function () {
    if (!S.bne) S.bne = { panel: 1, tied: [], sel: null };
    var st = S.bne;
    var root = h('section', { class: 'scr-bne' });
    var stepEl = h('p', { class: 't-small muted' });
    root.appendChild(h('div', { class: 'abs bn-head' }, [stepEl]));
    var title = h('h2', { class: 'bn-title t-h2 balance fit' });
    var text = h('p', { class: 'bn-text t-body pretty fit' });
    var area = h('div', { class: 'bn-area' });
    var nav = h('div', { class: 'abs bn-nav' });
    root.appendChild(h('div', { class: 'abs bn-headblock' }, [title, text])); root.appendChild(area); root.appendChild(nav);

    function show(n) {
      st.panel = n;
      setKey(stepEl, 'bne.step', { n: n, total: 3 });
      setKey(title, 'bne.p' + n + '.title');
      setKey(text, n === 3 ? 'bne.p3.text' : 'bne.p' + n + '.text');
      area.innerHTML = ''; nav.innerHTML = '';
      if (n === 1) panel1(); else if (n === 2) panel2(); else panel3();
      nav.appendChild(n > 1 ? btn('btn-ghost', 'back', 'ui.back', function () { show(n - 1); }) : h('span'));
      if (n < 3) nav.appendChild(btn('btn-primary', null, 'ui.next', function () { show(n + 1); }));
      applyI18n(root);
      bump();
    }

    function panel1() {
      var you = [540, 960], nodes = { planet: [540, 700, 15], people: [270, 1195, 5], economy: [810, 1195, 8] };
      var svg = h('svg', { class: 'abs', style: pos(0, 0), width: '1080', height: '1660', viewBox: '0 0 1080 1660', 'aria-hidden': 'true' });
      area.appendChild(svg);
      var youEl = h('button', { class: 'bn-node you', type: 'button', style: pos(you[0], you[1], { '--c': 'var(--btn-bg)' }), i18n: 'bne.p1.you' });
      var done = h('p', { class: 'abs bn-done t-h3 balance' + (st.tied.length === 3 ? '' : ' fade-out'), i18n: 'bne.p1.done' });
      Object.keys(nodes).forEach(function (k) {
        var n = nodes[k], c = sdgColor(n[2]);
        var line = h('path', { d: 'M' + n[0] + ' ' + n[1] + ' L' + you[0] + ' ' + you[1], stroke: c, 'stroke-width': '8', 'stroke-linecap': 'round', pathLength: '1', 'stroke-dasharray': '1', 'stroke-dashoffset': st.tied.indexOf(k) >= 0 ? '0' : '1' });
        svg.appendChild(line);
        var b = h('button', { class: 'bn-node' + (st.tied.indexOf(k) >= 0 ? ' is-tied' : ''), type: 'button', style: pos(n[0], n[1], { '--c': c }), i18n: 'bne.p1.' + k, onclick: function () {
          if (st.tied.indexOf(k) < 0) st.tied.push(k);
          b.classList.add('is-tied');
          line.style.setProperty('--draw', '0.7s'); line.classList.add('draw');
          fil.ripple(n[0], n[1] + TOP);
          if (st.tied.length === 3) { youEl.classList.add('all'); done.classList.remove('fade-out'); }
        } });
        area.appendChild(b);
      });
      if (st.tied.length === 3) youEl.classList.add('all');
      area.appendChild(youEl); area.appendChild(done);
    }

    function panel2() {
      var chip = h('div', { class: 'abs bn-chip' + (st.sel ? '' : ' fade-out') });
      var svg = h('svg', { class: 'abs', style: pos(0, 0), width: '1080', height: '1660', viewBox: '0 0 1080 1660', 'aria-hidden': 'true' });
      area.appendChild(svg);
      var strands = [];
      for (var i = 1; i <= 17; i++) {
        var x = 100 + (i - 1) * 55, c = sdgColor(i);
        var d = 'M' + x + ' 610 C' + (x + 26) + ' 800 ' + (x - 26) + ' 1080 ' + x + ' 1280';
        var p = h('path', { d: d, stroke: c, 'stroke-width': st.sel === i ? '20' : '10', 'stroke-linecap': 'round', fill: 'none', style: { transition: 'stroke-width .25s' } });
        svg.appendChild(p); strands.push(p);
        (function (n, x) {
          area.appendChild(h('button', { class: 'bn-strand', type: 'button', style: pos(x - 27, 600), 'data-i18n-aria': 'sdg.' + n, onclick: function () { select(n); } }));
        })(i, x);
      }
      function select(n) {
        st.sel = n;
        strands.forEach(function (p, j) { p.setAttribute('stroke-width', j + 1 === n ? '20' : '10'); p.setAttribute('stroke-opacity', j + 1 === n ? '1' : '.55'); });
        chip.innerHTML = '';
        chip.style.setProperty('--c', sdgColor(n));
        chip.appendChild(h('b', { text: String(n) }));
        chip.appendChild(h('span', { class: 'cl balance', i18n: 'sdg.' + n }));
        chip.classList.remove('fade-out');
        applyI18n(chip);
        fil.ripple(100 + (n - 1) * 55, 950 + TOP);
      }
      area.appendChild(chip);
      if (st.sel) select(st.sel);
    }

    function panel3() {
      var svg = h('svg', { class: 'abs', style: pos(0, 0), width: '1080', height: '1660', viewBox: '0 0 1080 1660', 'aria-hidden': 'true' });
      var stops = '';
      for (var i = 1; i <= 17; i++) stops += '<stop offset="' + ((i - 1) / 16).toFixed(3) + '" stop-color="' + sdgColor(i) + '"/>';
      svg.innerHTML = '<defs><linearGradient id="spec" x1="0" x2="1">' + stops + '</linearGradient></defs>' +
        '<path d="M70 760 C300 730 420 790 540 760 S800 730 1010 760" stroke="url(#spec)" stroke-width="8" fill="none" stroke-linecap="round"/>';
      area.appendChild(svg);
      [['understand', 200, 4], ['reflect', 540, 16], ['act', 880, 13]].forEach(function (k) {
        area.appendChild(h('span', { class: 'knot', style: pos(k[1], 760, { '--c': sdgColor(k[2]), width: '120px', height: '120px', margin: '-60px 0 0 -60px' }) }, [h('span', { class: 'knot-core', style: { inset: '38px' } })]));
        area.appendChild(h('div', { class: 'bn-triad', style: { left: px(k[1] - 150) } }, [
          h('h3', { class: 't-h3', i18n: 'bne.p3.' + k[0] }),
          h('p', { class: 't-small muted', i18n: 'bne.p3.' + k[0] + 'Text' })
        ]));
      });
      area.appendChild(h('p', { class: 'abs bn-name t-small balance', i18n: 'bne.p3.name' }));
      area.appendChild(h('div', { class: 'abs bn-cta' }, [btn('btn-primary', 'pin', 'bne.p3.cta', function () { go('local'); })]));
      later(function () { discover({ id: 'bne:edd', sdg: 4, url: 'edd', labelKey: 'programs.edd.name' }, $('.bn-cta', area)); }, 500);
      stat('completed_bne');
    }

    show(st.panel);
    return { el: root, shape: ['horizon', { y: 1615, amp: 0.6, width: 26, twist: 6 }] };
  };

  /* =========================================================== 6 · BNE in der Nähe */

  function programVisible(id) {
    var p = D.content.programs[id];
    if (!p) return false;
    var today = todayISO();
    if (p.showUntil && today > p.showUntil) return false;
    if (p.showFrom && today < p.showFrom) return false;
    return true;
  }
  function programPhase(id) {
    var p = D.content.programs[id], today = todayISO();
    var ph = (p.phases || []).filter(function (x) { return today <= x.until; })[0];
    if (!ph) return null;
    return { key: 'programs.' + id + '.phases.' + ph.id, vars: ph.date ? { date: { date: ph.date } } : null };
  }

  var CLOTHESLINE = { y: 720, sag: 60 };

  SCREENS.local = function () {
    if (!S.local) S.local = { audience: null, open: null };
    var st = S.local;
    var root = h('section', { class: 'scr-local' });
    var head = h('div', { class: 'abs lc-head' });
    root.appendChild(head);
    var body = h('div');
    root.appendChild(body);

    function renderAsk() {
      st.audience = null; st.open = null;
      head.innerHTML = '';
      body.innerHTML = '';
      body.appendChild(h('h1', { class: 'abs lc-title t-h2', i18n: 'local.title' }));
      body.appendChild(h('p', { class: 'abs lc-ask t-lead', i18n: 'local.ask' }));
      body.appendChild(h('div', { class: 'abs lc-options' }, D.content.audiences.map(function (a) {
        return h('button', { class: 'choice', type: 'button', onclick: function () { st.audience = a.id; renderTags(); } }, [
          h('span', { class: 'ct', i18n: 'local.audiences.' + a.id + '.title' }),
          h('span', { class: 'cs', i18n: 'local.audiences.' + a.id + '.text' })
        ]);
      })));
      fil.setShape('horizon', { y: 330, width: 34, twist: 5, spin: 0.4 });
      applyI18n(root);
    }

    function renderTags() {
      var aud = D.content.audiences.filter(function (a) { return a.id === st.audience; })[0];
      var ids = aud.programs.filter(programVisible);
      if (!ids.length) ids = ['home'];
      head.innerHTML = '';
      body.innerHTML = '';
      body.appendChild(h('div', { class: 'abs lc-nav' }, [btn('btn-ghost', 'back', 'local.change', renderAsk)]));
      body.appendChild(h('p', { class: 'abs lc-for t-small', i18n: 'local.for' }));
      body.appendChild(h('h2', { class: 'abs lc-aud t-h2 balance fit', i18n: 'local.audiences.' + aud.id + '.title' }));
      var xs = ids.length === 1 ? [540] : ids.length === 2 ? [330, 750] : [210, 540, 870];
      var strings = h('svg', { class: 'strings', width: '1080', height: '1660', viewBox: '0 0 1080 1660', 'aria-hidden': 'true' });
      body.appendChild(strings);
      var sh = '';
      ids.forEach(function (id, i) {
        var x = xs[i], ly = FilShapes.lineY(CLOTHESLINE, x) - TOP, top = ly + 44;
        sh += '<path d="M' + x + ' ' + ly + ' L' + x + ' ' + (top + 38) + '" style="stroke:var(--string)" stroke-width="3"/>';
        var ph = programPhase(id);
        var prog = D.content.programs[id];
        body.appendChild(h('button', { class: 'lc-prog', type: 'button', style: pos(x - 150, top), onclick: function () { openSheet(id); } }, [
          h('span', { class: 'tag-wrap', style: { position: 'relative' } }, [
            h('span', { class: 'tag swing', style: { 'animation-delay': (i * 0.12) + 's' } }, [
              h('span', { class: 'stripe', style: { '--c': sdgColor(prog.sdg) } }),
              h('span', { class: 'tag-title fit', style: { 'max-height': '130px' }, i18n: 'programs.' + id + '.name' }),
              h('span', { class: 'tag-text', i18n: 'programs.' + id + '.short' }),
              ph ? h('span', { class: 'when', i18n: ph.key, vars: ph.vars }) : null
            ])
          ])
        ]));
      });
      strings.innerHTML = sh;
      body.appendChild(h('p', { class: 'abs lc-hint t-small', i18n: 'local.tapTag' }));
      fil.setShape('line', { y: CLOTHESLINE.y, sag: CLOTHESLINE.sag, width: 9, twist: 16, spin: 0.5 });
      applyI18n(root);
      if (st.open) openSheet(st.open);
    }

    function openSheet(id) {
      st.open = id;
      var prog = D.content.programs[id], ph = programPhase(id);
      var sheet = h('div', { class: 'sheet', role: 'dialog' });
      function close() { st.open = null; sheet.remove(); bump(); }
      sheet.appendChild(h('div', { class: 'scrim', onclick: close }));
      sheet.appendChild(h('div', { class: 'tag-wrap' }, [
        h('div', { class: 'tag swing' }, [
          h('button', { class: 'close', type: 'button', 'data-i18n-aria': 'ui.close', onclick: close }, [icon('close')]),
          h('p', { class: 'eyebrow', i18n: 'programs.' + id + '.name' }),
          h('h2', { class: 'short balance', i18n: 'programs.' + id + '.short' }),
          h('p', { class: 'tag-text pretty', i18n: 'programs.' + id + '.text' }),
          ph ? h('p', { class: 'when', i18n: ph.key, vars: ph.vars }) : null,
          h('div', { class: 'qr-row' }, [
            h('div', {}, [qrBox(prog.url), qrText(prog.url)]),
            h('p', { class: 'scan', i18n: 'ui.scan' })
          ]),
          h('div', { class: 'sheet-actions' }, [btn('btn-primary', null, 'ui.close', close)])
        ])
      ]));
      root.appendChild(sheet);
      applyI18n(sheet);
      var added = discover({ id: 'prog:' + id, sdg: prog.sdg, url: prog.url, labelKey: 'programs.' + id + '.name' }, $('.qr', sheet));
      if (added) later(function () { toast(sdgColor(prog.sdg)); }, 600);
      stat('completed_local');
    }

    if (st.audience) renderTags(); else renderAsk();
    return { el: root, shape: st.audience ? ['line', { y: CLOTHESLINE.y, sag: CLOTHESLINE.sag, width: 9, twist: 16, spin: 0.5 }] : ['horizon', { y: 330, width: 34, twist: 5, spin: 0.4 }] };
  };

  /* =========================================================== 7 · Mitnehmen */

  SCREENS.take = function () {
    var cfg = D.content.take, seen = {}, list = [];
    S.discoveries.forEach(function (d) { if (!seen[d.url]) { seen[d.url] = 1; list.push(d); } else list.forEach(function (x, i) { if (x.url === d.url) list[i] = d; }); });
    list = list.slice(-(cfg.max || 4));
    var empty = list.length === 0;
    if (empty) list = cfg.defaults.map(function (id) { var p = D.content.programs[id]; return { url: p.url, sdg: p.sdg, labelKey: 'programs.' + id + '.name' }; });
    var root = h('section', { class: 'scr-take' }, [
      h('h1', { class: 'abs tk-title t-h2', i18n: 'take.title' }),
      h('p', { class: 'abs tk-lead t-lead pretty', i18n: 'take.lead' }),
      empty ? h('p', { class: 'abs tk-empty t-small', i18n: 'take.empty' }) : null
    ]);
    var slots = [[100, 330], [560, 330], [100, 850], [560, 850]];
    if (list.length === 1) slots = [[330, 420]];
    if (list.length === 2) slots = [[100, 420], [560, 420]];
    if (list.length === 3) slots = [[100, 330], [560, 330], [330, 850]];
    list.forEach(function (d, i) {
      var s = slots[i];
      root.appendChild(h('div', { class: 'tk-card', style: pos(s[0], s[1]) }, [
        h('div', { class: 'tag-wrap', style: { position: 'relative' } }, [
          h('div', { class: 'tag swing', style: { 'animation-delay': (i * 0.1) + 's' } }, [
            qrBox(d.url),
            h('p', { class: 'tag-title', i18n: d.labelKey }),
            qrText(d.url)
          ])
        ])
      ]));
    });
    root.appendChild(h('p', { class: 'abs tk-privacy t-small', i18n: 'take.privacy' }));
    root.appendChild(h('div', { class: 'abs tk-actions' }, [
      btn('btn-ghost', null, 'take.continue', function () { go('hub'); }),
      btn('btn-primary', null, 'take.finish', function () { resetSession(); })
    ]));
    return { el: root, shape: ['horizon', { y: 1602, amp: 0.4, width: 14, twist: 6 }] };
  };

  /* =========================================================== Sitzung, Inaktivität */

  var lastActivity = Date.now(), warning = null, adminOpen = false;
  function bump() { lastActivity = Date.now(); if (warning) hideWarning(); }

  function resetSession() {
    hideWarning();
    closeAdmin();
    S.lang = D.config.defaultLanguage || 'fr';
    document.documentElement.lang = S.lang;
    S.discoveries = []; S.obj = null; S.quiz = null; S.bne = null; S.local = null;
    $$('.sheet', screenEl).forEach(function (s) { s.remove(); });
    applyI18n(document);
    updateDock(false);
    go('attract');
  }

  function idleTick() {
    if (D && adminOpen && Date.now() - lastActivity > 60000) { closeAdmin(); return; } // vergessenes Wartungsmenü schließen
    if (!D || adminOpen || S.screen === 'attract' || warning) return;
    var lim = (S.screen === 'take' ? D.config.idle.takeScreenTimeoutSec : D.config.idle.timeoutSec) * 1000;
    if (params.get('idle')) lim = parseFloat(params.get('idle')) * 1000;
    if (Date.now() - lastActivity > lim) showWarning();
  }
  function showWarning() {
    var secs = parseFloat(params.get('warn')) || D.config.idle.warningSec, left = secs;
    var C = 2 * Math.PI * 96;
    var fg = h('circle', { cx: '110', cy: '110', r: '96', stroke: 'var(--glow)', 'stroke-dasharray': C.toFixed(1), 'stroke-dashoffset': '0', transform: 'rotate(-90 110 110)', 'stroke-linecap': 'round' });
    var cd = h('p', { class: 't-small muted', i18n: 'ui.idle.countdown', vars: { s: left } });
    var ov = h('div', { class: 'overlay', role: 'alertdialog' }, [
      h('div', { class: 'idle-box' }, [
        h('svg', { class: 'idle-ring', viewBox: '0 0 220 220', 'aria-hidden': 'true' }, [h('circle', { cx: '110', cy: '110', r: '96', style: { stroke: 'var(--ring-track)' } }), fg]),
        h('h2', { class: 't-h1', i18n: 'ui.idle.title' }),
        h('p', { class: 't-lead', i18n: 'ui.idle.text' }),
        cd,
        h('button', { class: 'btn btn-primary', type: 'button', onclick: function () { bump(); } }, [h('span', { i18n: 'ui.idle.stay' })])
      ])
    ]);
    overlayRoot.appendChild(ov);
    applyI18n(ov);
    var t0 = Date.now();
    warning = { el: ov, iv: setInterval(function () {
      var el = (Date.now() - t0) / 1000;
      left = Math.max(0, Math.ceil(secs - el));
      fg.setAttribute('stroke-dashoffset', (C * Math.min(1, el / secs)).toFixed(1));
      cd.setAttribute('data-i18n-vars', JSON.stringify({ s: left }));
      cd.textContent = t('ui.idle.countdown', { s: left });
      if (el >= secs) { stat('idle_resets'); resetSession(); }
    }, 200) };
  }
  function hideWarning() {
    if (!warning) return;
    clearInterval(warning.iv); warning.el.remove(); warning = null;
  }

  /* =========================================================== Wartung (lange auf die Marke drücken) */

  function adminHold(el) {
    var timer = null, bar = $('.brand-hold', el), need = (D.config.kiosk.adminHoldSec || 4) * 1000;
    function down(e) {
      e.stopPropagation();
      bar.style.transition = 'width ' + need + 'ms linear'; bar.style.width = '100%';
      timer = setTimeout(openAdmin, need);
    }
    function up() { clearTimeout(timer); bar.style.transition = 'width .2s'; bar.style.width = '0'; }
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointerup', up); el.addEventListener('pointerleave', up); el.addEventListener('pointercancel', up);
  }
  function openAdmin() {
    closeAdmin();
    adminOpen = true;
    var issues = i18nIssues.length;
    var qual = D.config.animation.quality;
    var ov = h('div', { class: 'overlay', id: 'admin' });
    function row(k, v, vars) { return [h('dt', { i18n: k }), h('dd', vars ? { i18n: v, vars: vars } : { text: v })]; }
    var statsLine;
    if (D.config.stats.enabled) {
      var s = readStats();
      statsLine = h('dd', { i18n: 'admin.statsLine', vars: { sessions: s.sessions || 0, completed: (s.completed_objects || 0) + (s.completed_quiz || 0) + (s.completed_bne || 0) + (s.completed_local || 0) } });
    } else statsLine = h('dd', { i18n: 'admin.statsOff' });
    var dl = h('dl', {}, [].concat(
      row('admin.version', D.config.version),
      row('admin.location', params.get('location') || D.config.location.name || '—'),
      row('admin.date', todayISO()),
      row('admin.quality', fil.qualityName + (fil.autoQuality ? ' (auto)' : '')),
      row('admin.fps', String(fil.fps)),
      [h('dt', { i18n: 'admin.i18n' }), issues ? h('dd', { i18n: 'admin.i18nMissing', vars: { n: issues } }) : h('dd', { i18n: 'admin.i18nOk' })],
      [h('dt', { i18n: 'admin.connection' }), h('dd', { i18n: navigator.onLine ? 'admin.online' : 'admin.offline' })],
      [h('dt', { i18n: 'admin.stats' }), statsLine],
      [h('dt', { i18n: 'admin.commons' }), h('dd', { i18n: 'admin.commonsLine', vars: { n: fmtNum(commonsRead().n), date: { date: commonsRead().since } } })]
    ));
    var qRow = h('div', { class: 'row' }, ['auto', 'high', 'balanced', 'low'].map(function (q) {
      return h('button', { class: 'btn btn-ghost', type: 'button', 'aria-pressed': String((q === 'auto' && fil.autoQuality) || (!fil.autoQuality && fil.qualityName === q)), onclick: function () {
        if (q === 'auto') fil.setQuality('high', true); else fil.setQuality(q, false);
        openAdmin();
      } }, [h('span', { i18n: 'admin.q.' + q })]);
    }));
    var reduced = document.body.classList.contains('reduced');
    var designRow = h('div', { class: 'row' }, ['dark', 'corporate', 'hybrid'].map(function (v) {
      return h('button', { class: 'btn btn-ghost', type: 'button', 'aria-pressed': String(S.design === v), onclick: function () { applyDesign(v, true); openAdmin(); } }, [h('span', { i18n: 'admin.designs.' + v })]);
    }));
    var badge = badgeOn();
    var panel = h('div', { class: 'admin' }, [
      h('h2', { class: 't-h2', i18n: 'admin.title' }),
      h('p', { class: 't-mini', i18n: 'admin.design', style: { 'margin-bottom': '10px' } }),
      designRow,
      h('div', { class: 'row' }, [
        h('button', { class: 'btn btn-primary', type: 'button', onclick: function () { newDemo(); } }, [h('span', { i18n: 'admin.newDemo' })]),
        h('button', { class: 'btn btn-ghost', type: 'button', 'aria-pressed': String(badge), onclick: function () {
          storedSet('bne-badge', badge ? '0' : '1'); $('#badge').classList.toggle('is-off', badge); openAdmin();
        } }, [h('span', { i18n: 'admin.badge' }), h('span', { text: ': ' }), h('span', { i18n: badge ? 'admin.yes' : 'admin.no' })])
      ]),
      dl,
      h('p', { class: 't-mini', i18n: 'admin.quality', style: { 'margin-bottom': '10px' } }),
      qRow,
      h('div', { class: 'row' }, [
        h('button', { class: 'btn btn-ghost', type: 'button', 'aria-pressed': String(reduced), onclick: function () { setReduced(!reduced); openAdmin(); } }, [h('span', { i18n: 'admin.reduced' }), h('span', { text: ': ' }), h('span', { i18n: reduced ? 'admin.yes' : 'admin.no' })])
      ]),
      h('div', { class: 'row' }, [
        h('button', { class: 'btn btn-ghost', type: 'button', onclick: function () { location.reload(); } }, [h('span', { i18n: 'admin.reload' })]),
        h('button', { class: 'btn btn-ghost', type: 'button', onclick: function () { storedSet('bne-commons', null); openAdmin(); } }, [h('span', { i18n: 'admin.commonsReset' })]),
        h('button', { class: 'btn btn-ghost', type: 'button', onclick: function () { resetSession(); } }, [h('span', { i18n: 'admin.testReset' })]),
        D.config.stats.enabled ? h('button', { class: 'btn btn-ghost', type: 'button', onclick: function () { try { localStorage.removeItem('bne-stats'); } catch (e) { /* ok */ } openAdmin(); } }, [h('span', { i18n: 'admin.statsReset' })]) : null,
        h('button', { class: 'btn btn-primary', type: 'button', onclick: closeAdmin }, [h('span', { i18n: 'ui.close' })])
      ]),
      issues ? h('pre', { class: 't-mini', style: { 'white-space': 'pre-wrap', 'max-height': '300px', overflow: 'auto' }, text: i18nIssues.slice(0, 40).join('\n') }) : null
    ]);
    ov.appendChild(panel);
    overlayRoot.appendChild(ov);
    applyI18n(ov);
  }
  // Für die nächste Vorführung: alles auf Anfang, Designwahl bleibt
  function newDemo() {
    try { localStorage.removeItem('bne-stats'); } catch (e) { /* ok */ }
    resetSession();
  }
  function closeAdmin() { var a = $('#admin'); if (a) a.remove(); adminOpen = false; bump(); }
  function setReduced(on) { document.body.classList.toggle('reduced', on); if (fil) fil.setReduced(on); }

  /* =========================================================== Optionale lokale Statistik */

  function readStats() { try { return JSON.parse(localStorage.getItem('bne-stats') || '{}'); } catch (e) { return {}; } }
  function stat(key) {
    if (!D || !D.config.stats || !D.config.stats.enabled) return;
    try { var s = readStats(); s[key] = (s[key] || 0) + 1; localStorage.setItem('bne-stats', JSON.stringify(s)); } catch (e) { /* ok */ }
  }

  /* =========================================================== Fehler */

  function showError() {
    if ($('#err')) return;
    var ov = h('div', { class: 'overlay', id: 'err' }, [h('div', { class: 'err-box' }, [
      h('h2', { class: 't-h2', i18n: 'ui.error.title', style: { 'margin-bottom': '24px' } }),
      h('p', { class: 't-lead muted', i18n: 'ui.error.text' })
    ])]);
    overlayRoot.appendChild(ov);
    if (D) applyI18n(ov);
    setTimeout(function () { ov.remove(); if (D) resetSession(); else location.reload(); }, 6000);
  }
  window.addEventListener('error', function (e) {
    console.error(e.error || e.message);
    errorCount++;
    if (!booted) return;
    if (errorCount > 8) location.reload();
  });
  window.addEventListener('unhandledrejection', function (e) { console.error(e.reason); errorCount++; });

  /* =========================================================== Start */

  function loadData() {
    if (window.BNE_DATA) return Promise.resolve(window.BNE_DATA);
    function get(f) { return fetch(f, { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw new Error(f + ' ' + r.status); return r.json(); }); }
    return Promise.all([get('content/config.json'), get('content/content.json'), get('content/translations.json')])
      .then(function (r) {
        var data = { config: r[0], content: r[1], i18n: r[2], logoSvg: null };
        var logo = data.config.brand && data.config.brand.logo;
        if (!logo || !/\.svg$/i.test(logo)) return data;
        return fetch(logo).then(function (res) { return res.ok ? res.text() : null; }).then(function (txt) { data.logoSvg = cleanSvg(txt); return data; }, function () { return data; });
      });
  }
  // Logo-SVG für das Einbetten vorbereiten: keine Skripte, Größe per CSS
  function cleanSvg(txt) {
    if (!txt || txt.indexOf('<svg') < 0) return null;
    txt = txt.slice(txt.indexOf('<svg'));
    return txt.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/\son[a-z]+="[^"]*"/gi, '')
      .replace(/<svg([^>]*?)\swidth="[^"]*"/, '<svg$1').replace(/<svg([^>]*?)\sheight="[^"]*"/, '<svg$1')
      .replace(/<svg/, '<svg aria-hidden="true" focusable="false"');
  }

  function fileHint() {
    // Ohne Server lassen sich die JSON-Dateien nicht laden: dreisprachiger Hinweis
    var txt = {
      fr: 'Ouvre ce dossier avec un petit serveur local (voir README) ou utilise la version autonome dans dist/.',
      de: 'Öffne diesen Ordner über einen lokalen Server (siehe README) oder nutze die eigenständige Version in dist/.',
      en: 'Open this folder through a local server (see README) or use the standalone version in dist/.'
    };
    screenEl.innerHTML = '';
    screenEl.appendChild(h('div', { class: 'abs', style: pos(90, 500, { width: '900px' }) }, ['fr', 'de', 'en'].map(function (l) { return h('p', { class: 't-lead', lang: l, style: { 'margin-bottom': '40px' }, text: txt[l] }); })));
  }

  function boot() {
    stage = $('#stage'); screenEl = $('#screen'); dock = $('#dock'); topbar = $('#topbar'); overlayRoot = $('#overlay-root');
    layout();
    window.addEventListener('resize', layout);

    loadData().then(function (data) {
      D = data;
      S.lang = params.get('lang') && D.config.languages.indexOf(params.get('lang')) >= 0 ? params.get('lang') : (D.config.defaultLanguage || 'fr');
      document.documentElement.lang = S.lang;
      i18nIssues = checkTranslations();
      if (i18nIssues.length) console.warn('[i18n] Unvollständige Übersetzungen:', i18nIssues);

      if (window.BNE_DATA && window.BNE_DATA.logoSvg) D.logoSvg = cleanSvg(window.BNE_DATA.logoSvg);
      var design = currentDesign();
      applyDesign(design, false);
      var theme = threadTheme(design);
      var reducedPref = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      var reduced = D.config.animation.reducedMotion || reducedPref || params.get('reduced') === '1';
      fil = new Fil($('#fil'), { colors: theme.colors, mode: theme.mode, quality: params.get('quality') || D.config.animation.quality, reducedMotion: reduced, particles: D.config.animation.particles });
      if (reduced) document.body.classList.add('reduced');
      layout();
      fil.start();
      document.addEventListener('visibilitychange', function () { if (document.hidden) fil.stop(); else fil.start(); });

      buildChrome();
      updateDock(false);
      $('#preview-caption').setAttribute('data-i18n', 'preview.caption');

      // Berührungen: Faden reagiert, Inaktivität zurücksetzen
      var kiosk = params.get('kiosk') === '1' || D.config.kiosk.requestFullscreen;
      if (kiosk && (params.get('kiosk') === '1' || D.config.kiosk.hideCursor)) document.body.classList.add('hide-cursor');
      stage.addEventListener('pointerdown', function (e) {
        bump();
        var p = toStage(e); fil.touch(p.x, p.y, true);
        if (kiosk && !document.fullscreenElement && document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(function () { /* ok */ });
      });
      stage.addEventListener('pointermove', function (e) { if (e.buttons || e.pointerType === 'touch') { var p = toStage(e); fil.touch(p.x, p.y, true); } });
      window.addEventListener('pointerup', function () { fil.touch(0, 0, false); });
      window.addEventListener('pointercancel', function () { fil.touch(0, 0, false); });
      window.addEventListener('keydown', bump);
      ['contextmenu', 'dragstart', 'selectstart', 'gesturestart'].forEach(function (ev) { document.addEventListener(ev, function (e) { e.preventDefault(); }); });

      setInterval(idleTick, 1000);
      var reloadedAt = 0;
      setInterval(function () {
        var at = D.config.kiosk.dailyReloadAt;
        if (!at || S.screen !== 'attract' || Date.now() - reloadedAt < 3600000) return;
        var d = new Date(), hm = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
        if (hm === at && performance.now() > 3600000) { reloadedAt = Date.now(); location.reload(); }
      }, 30000);

      go(params.get('screen') || 'attract', params.get('id') ? { id: params.get('id') } : {});
      applyI18n(document);
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { fitAll(document); });
      booted = true;
      if (params.get('admin') === '1') openAdmin();

      if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol) && !window.BNE_DATA && params.get('sw') !== '0') {
        navigator.serviceWorker.register('sw.js').catch(function () { /* offline-Cache optional */ });
      }
    }).catch(function (err) {
      console.error(err);
      if (location.protocol === 'file:') { fileHint(); return; }
      showError();
    });
  }

  // Für automatisierte Tests
  window.BNE = { go: go, setLang: setLang, state: S, design: function (v) { if (v) applyDesign(v, false); return S.design; }, fil: function () { return fil; }, t: t, reset: function () { resetSession(); }, issues: function () { return i18nIssues; }, openAdmin: function () { openAdmin(); } };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
