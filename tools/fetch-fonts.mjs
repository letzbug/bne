#!/usr/bin/env node
/*
 * Lädt die beiden Schriften einmalig herunter und legt sie lokal ab,
 * damit die Stele auch beim allerersten Start ohne Internet richtig aussieht.
 *   Bricolage Grotesque (Titel) und Atkinson Hyperlegible Next (Text), beide SIL Open Font License.
 * Aufruf (im Projektordner, mit Internet):   node tools/fetch-fonts.mjs
 * Ergebnis: assets/fonts/*.woff2 und css/fonts.css. Danach kann die Google-Fonts-Zeile
 * in index.html entfernt werden (siehe README, Abschnitt Schriften).
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const CSS_URL = 'https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible+Next:wght@400;700&family=Bricolage+Grotesque:opsz,wght@12..96,500..800&display=swap';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const KEEP = new Set(['latin', 'latin-ext']); // Französisch, Deutsch, Englisch, Luxemburgisch

const css = await (await fetch(CSS_URL, { headers: { 'User-Agent': UA } })).text();
const blocks = css.split(/(?=\/\*\s*[a-z-]+\s*\*\/)/i);
mkdirSync(join(root, 'assets/fonts'), { recursive: true });
let out = '/* Lokale Schriften, erzeugt von tools/fetch-fonts.mjs (SIL Open Font License) */\n';
let n = 0;
for (const block of blocks) {
  const subset = (block.match(/\/\*\s*([a-z-]+)\s*\*\//i) || [])[1];
  if (!subset || !KEEP.has(subset)) continue;
  const family = (block.match(/font-family:\s*'([^']+)'/) || [])[1];
  const weight = (block.match(/font-weight:\s*([\d ]+);/) || [])[1];
  const src = (block.match(/url\((https:[^)]+\.woff2)\)/) || [])[1];
  if (!family || !src) continue;
  const name = `${family.toLowerCase().replace(/\s+/g, '-')}-${String(weight).trim().replace(/\s+/g, '_')}-${subset}.woff2`;
  const buf = Buffer.from(await (await fetch(src)).arrayBuffer());
  writeFileSync(join(root, 'assets/fonts', name), buf);
  out += block.replace(src, `../assets/fonts/${name}`).trim() + '\n';
  n++;
}
writeFileSync(join(root, 'css/fonts.css'), out);
console.log(`✓ ${n} Schriftdateien gespeichert, css/fonts.css geschrieben.`);
