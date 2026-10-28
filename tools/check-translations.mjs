#!/usr/bin/env node
/*
 * Prüft content/translations.json und content/content.json.
 * Aufruf (im Projektordner):   node tools/check-translations.mjs
 *
 * Fehler (Abbruch mit Code 1):
 *  - Schlüssel fehlt in einer Sprache oder ist leer
 *  - Platzhalter wie {n} oder {date} unterscheiden sich zwischen den Sprachen
 *  - Listen (z. B. Quiz-Antworten) haben unterschiedlich viele Einträge
 *  - content.json verweist auf einen Text, den es nicht gibt
 *  - ein Link fehlt für eine Sprache oder beginnt nicht mit https://
 *  - Datumsangaben sind nicht im Format JJJJ-MM-TT
 * Hinweise (kein Abbruch):
 *  - identischer Text in mehreren Sprachen (oft korrekt bei Eigennamen, sonst vergessene Übersetzung)
 *  - Programmphasen, deren Datum bereits vorbei ist
 *  - Links, die nur nach Sprachmuster gebildet und noch nicht geprüft wurden
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => JSON.parse(readFileSync(join(root, p), 'utf8'));

const tr = read('content/translations.json');
const content = read('content/content.json');
const config = read('content/config.json');
const LANGS = config.languages || ['fr', 'de', 'en'];
const BASE = config.defaultLanguage || 'fr';

const errors = [];
const notes = [];

function flatten(obj, prefix = '', out = {}) {
  for (const [k, v] of Object.entries(obj)) {
    if (k.startsWith('_')) continue;
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) flatten(v, key, out);
    else out[key] = v;
  }
  return out;
}
const placeholders = (s) => (String(s).match(/\{[a-z]+\}/gi) || []).sort().join(',');

const flat = {};
for (const l of LANGS) {
  if (!tr[l]) { errors.push(`Sprache „${l}“ fehlt in translations.json`); continue; }
  flat[l] = flatten(tr[l]);
}

// 1. Gleiche Schlüssel, nichts leer, gleiche Platzhalter
const allKeys = new Set(LANGS.flatMap((l) => Object.keys(flat[l] || {})));
for (const key of [...allKeys].sort()) {
  const vals = {};
  for (const l of LANGS) {
    const v = flat[l]?.[key];
    if (v === undefined) { errors.push(`[${l}] fehlt: ${key}`); continue; }
    if (Array.isArray(v)) {
      if (!v.length || v.some((x) => !String(x).trim())) errors.push(`[${l}] leere Liste oder leerer Eintrag: ${key}`);
    } else if (!String(v).trim()) errors.push(`[${l}] leer: ${key}`);
    vals[l] = v;
  }
  const present = Object.keys(vals);
  if (present.length < 2) continue;
  const ref = vals[present[0]];
  for (const l of present.slice(1)) {
    const v = vals[l];
    if (Array.isArray(ref) !== Array.isArray(v)) { errors.push(`Typ unterschiedlich (Liste/Text): ${key}`); continue; }
    if (Array.isArray(ref)) {
      if (ref.length !== v.length) errors.push(`Listenlänge unterschiedlich (${present[0]}: ${ref.length}, ${l}: ${v.length}): ${key}`);
      ref.forEach((x, i) => { if (placeholders(x) !== placeholders(v[i] ?? '')) errors.push(`Platzhalter unterschiedlich in ${key}[${i}] (${l})`); });
    } else if (placeholders(ref) !== placeholders(v)) {
      errors.push(`Platzhalter unterschiedlich in ${key}: ${present[0]}="${placeholders(ref)}" ${l}="${placeholders(v)}"`);
    }
  }
  if (key.startsWith('meta.')) continue;
  const strs = present.map((l) => JSON.stringify(vals[l]));
  if (new Set(strs).size < strs.length && strs[0].length > 14) notes.push(`gleicher Text in mehreren Sprachen (Eigenname?): ${key}`);
}

// 2. Verweise aus content.json
const need = (key) => { for (const l of LANGS) if (flat[l] && flat[l][key] === undefined) errors.push(`[${l}] content.json braucht Text: ${key}`); };
for (let n = 1; n <= 17; n++) need(`sdg.${n}`);
(content.hub || []).forEach((h) => { need(`hub.${h.id}.title`); need(`hub.${h.id}.text`); });
(content.objects || []).forEach((o) => {
  const b = `objects.items.${o.id}`;
  ['name', 'hook', 'decision.question', 'offer.title', 'offer.org', 'offer.text', 'offer.audience', 'offer.langs'].forEach((k) => need(`${b}.${k}`));
  (o.threads || []).forEach((t) => ['label', 'title', 'text'].forEach((k) => need(`${b}.threads.${t.id}.${k}`)));
  (o.options || []).forEach((op) => ['label', 'insight'].forEach((k) => need(`${b}.decision.options.${op}.${k}`)));
  if (o.offer && !content.urls[o.offer.url]) errors.push(`Objekt ${o.id}: Link „${o.offer.url}“ fehlt in urls`);
});
(content.quiz?.items || []).forEach((q) => {
  ['q', 'options', 'explain', 'source'].forEach((k) => need(`quiz.items.${q.id}.${k}`));
  for (const l of LANGS) {
    const opts = flat[l]?.[`quiz.items.${q.id}.options`];
    if (Array.isArray(opts) && (q.correct < 0 || q.correct >= opts.length)) errors.push(`[${l}] Quiz ${q.id}: „correct“ zeigt auf keine Antwort`);
  }
  if (q.url && !content.urls[q.url]) errors.push(`Quiz ${q.id}: Link „${q.url}“ fehlt in urls`);
});
const iso = /^\d{4}-\d{2}-\d{2}$/;
const today = new Date().toISOString().slice(0, 10);
for (const [id, p] of Object.entries(content.programs || {})) {
  if (id.startsWith('_')) continue;
  ['name', 'short', 'text', 'after'].forEach((k) => need(`programs.${id}.${k}`));
  if (!content.urls[p.url]) errors.push(`Programm ${id}: Link „${p.url}“ fehlt in urls`);
  if (p.showUntil && !iso.test(p.showUntil)) errors.push(`Programm ${id}: showUntil ist kein Datum JJJJ-MM-TT`);
  (p.phases || []).forEach((ph) => {
    need(`programs.${id}.phases.${ph.id}`);
    if (!iso.test(ph.until)) errors.push(`Programm ${id}, Phase ${ph.id}: until ist kein Datum JJJJ-MM-TT`);
    if (ph.date && !iso.test(ph.date)) errors.push(`Programm ${id}, Phase ${ph.id}: date ist kein Datum JJJJ-MM-TT`);
    if (ph.until < today) notes.push(`Programm ${id}: Phase „${ph.id}“ ist seit ${ph.until} vorbei und wird nicht mehr angezeigt`);
  });
}
(content.audiences || []).forEach((a) => {
  need(`local.audiences.${a.id}.title`); need(`local.audiences.${a.id}.text`);
  a.programs.forEach((p) => { if (!content.programs[p]) errors.push(`Zielgruppe ${a.id}: Programm „${p}“ unbekannt`); });
});
(config.attract?.objects || []).forEach((id) => {
  const isObj = (content.objects || []).some((o) => o.id === id), motif = content.motifs?.[id];
  if (!isObj && !motif) errors.push(`config.attract.objects: „${id}“ ist weder Gegenstand noch Motiv`);
  if (motif) { need(`attract.motifs.${id}`); if (!Array.isArray(motif.form) || motif.form.length < 2) errors.push(`Motiv ${id}: form fehlt`); }
});
if (content.brandColors && (content.brandColors.thread || []).length !== 17) errors.push('brandColors.thread braucht genau 17 Farben');
(content.take?.defaults || []).forEach((p) => { if (!content.programs[p]) errors.push(`take.defaults: Programm „${p}“ unbekannt`); });

// 3. Links
for (const [key, u] of Object.entries(content.urls || {})) {
  if (key.startsWith('_')) continue;
  for (const l of LANGS) {
    if (!u[l]) errors.push(`Link ${key}: Sprache ${l} fehlt`);
    else if (!/^https:\/\//.test(u[l])) errors.push(`Link ${key} (${l}) beginnt nicht mit https://`);
  }
  if (u.pattern) notes.push(`Link ${key}: ${u.pattern.join(', ')} nach Sprachmuster gebildet, vor dem Einsatz öffnen und prüfen`);
}

const total = Object.keys(flat[BASE] || {}).length;
console.log(`BNE Experience · Übersetzungs- und Inhaltsprüfung`);
console.log(`${total} Texte je Sprache · Sprachen: ${LANGS.join(', ')}`);
if (notes.length) { console.log(`\nHinweise (${notes.length}):`); notes.forEach((n) => console.log('  · ' + n)); }
if (errors.length) {
  console.log(`\nFEHLER (${errors.length}):`);
  errors.forEach((e) => console.log('  ✗ ' + e));
  process.exit(1);
}
console.log('\n✓ Alles vollständig: jede Sprache hat alle Texte, alle Verweise und Links sind vorhanden.');
