#!/usr/bin/env node
/*
 * Baut eine eigenständige Einzeldatei: dist/tire-le-fil-standalone.html
 * Enthält CSS, JavaScript und alle Inhalte (config, content, translations).
 * Nutzen: per Doppelklick ohne Server öffnen, per USB-Stick auf die Stele kopieren,
 * oder als Vorschau verschicken. Für den Dauerbetrieb ist der normale Ordner
 * (GitHub Pages oder lokaler Server) besser, weil Inhalte dort ohne Neubau änderbar sind.
 *
 * Aufruf (im Projektordner):   node tools/build-standalone.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(root, p), 'utf8');
const json = (p) => JSON.parse(read(p));

let html = read('index.html');
const data = {
  config: json('content/config.json'),
  content: json('content/content.json'),
  i18n: json('content/translations.json')
};

// Stylesheets einbetten
html = html.replace(/<link rel="stylesheet" href="(css\/[^"]+)">/g, (m, href) => {
  if (!existsSync(join(root, href))) return '';
  let css = read(href);
  // lokale Schriftdateien (falls vorhanden) als data-URI einbetten
  css = css.replace(/url\("?\.\.\/assets\/fonts\/([^")]+)"?\)/g, (mm, f) => {
    const p = join(root, 'assets/fonts', f);
    if (!existsSync(p)) return mm;
    return `url("data:font/woff2;base64,${readFileSync(p).toString('base64')}")`;
  });
  return `<style>\n${css}\n</style>`;
});

// Manifest entfernen, Icon als data-URI
html = html.replace(/\s*<link rel="manifest"[^>]*>/, '');
html = html.replace(/<link rel="icon" href="assets\/icon\.svg"[^>]*>/, () =>
  `<link rel="icon" href="data:image/svg+xml;base64,${Buffer.from(read('assets/icon.svg')).toString('base64')}">`);

// Skripte einbetten, Daten vor app.js
const safe = (s) => s.replace(/<\/script/gi, '<\\/script');
html = html.replace(/<script src="(js\/[^"]+)"><\/script>/g, (m, src) => {
  const code = safe(read(src));
  const pre = src.endsWith('app.js') ? `<script>window.BNE_DATA = ${safe(JSON.stringify(data))};</script>\n  ` : '';
  return `${pre}<script>\n${code}\n</script>`;
});

mkdirSync(join(root, 'dist'), { recursive: true });
const out = join(root, 'dist', 'tire-le-fil-standalone.html');
writeFileSync(out, html);
console.log(`✓ ${out} (${(Buffer.byteLength(html) / 1024).toFixed(0)} KB)`);
