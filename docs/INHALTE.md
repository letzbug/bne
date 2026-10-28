# Inhalte pflegen

Für alle Änderungen reicht ein Texteditor (zum Beispiel VS Code oder die Bearbeitungsfunktion direkt auf GitHub). Programmcode muss nicht angefasst werden.

Drei Dateien im Ordner `content/` teilen sich die Arbeit:

| Datei | Enthält | Typische Änderung |
|---|---|---|
| `translations.json` | jeden sichtbaren Text, für `fr`, `de` und `en` unter identischen Schlüsseln | Satz umformulieren, Übersetzung verbessern |
| `content.json` | Struktur: welche Gegenstände, Fragen, Programme, Zielgruppen; Links; Termine; Farben | Link ersetzen, Frist eintragen, Programm einer Zielgruppe zuordnen |
| `config.json` | Betrieb: Standort, Zeitlimits, Animation, Kiosk, Logo, Statistik | Standortname setzen, Inaktivitätszeit ändern |

**Nach jeder Änderung:** `node tools/check-translations.mjs` ausführen. Das Skript sagt genau, welcher Text in welcher Sprache fehlt, welcher Platzhalter nicht passt oder welcher Verweis ins Leere geht. Erst wenn es „✓ Alles vollständig“ meldet, die Änderung veröffentlichen.

---

## Grundregeln für Texte

- **Jede Sprache bekommt jeden Text.** Ein Text, der nur auf Französisch geändert wird, ist ein halber Text. Das Prüfskript erkennt fehlende Schlüssel, aber nicht veraltete Übersetzungen: Bei inhaltlichen Änderungen immer alle drei Sprachen anpassen.
- **Platzhalter nicht übersetzen:** `{n}`, `{total}`, `{date}`, `{s}` bleiben wörtlich stehen. Datumsangaben werden automatisch in der jeweiligen Sprache geschrieben („11 novembre 2026“, „11. November 2026“, „11 November 2026“).
- **Kurz bleiben.** Fäden-Texte höchstens zwei Sätze, Fragen höchstens zwei Zeilen. Lange Texte verkleinern sich automatisch bis zu einer Grenze; danach wird abgeschnitten, und der End-to-End-Test meldet das.
- **Typografie:** Apostroph als ’ (nicht '). Französisch: Anführungszeichen « … », vor `? ! : ;` ein schmales geschütztes Leerzeichen, das in der Datei als `\u202f` steht. Deutsch: „…“. Englisch: “…”. Das unsichtbare `\u2060` in kurzen Bindestrich-Wörtern (T-⁠shirt) verhindert, dass dort umgebrochen wird; einfach stehen lassen.
- **Anrede:** tu / du / you. Die Stele spricht Kinder und Erwachsene gleichermaßen an.
- **Ton:** neugierig, freundlich, nie belehrend. Keine Schuldzuweisungen, kein „du solltest“. Zahlen nur mit Quelle (siehe docs/KONZEPT.md, Abschnitt 8).

## Häufige Aufgaben

### Standort eintragen

In `config.json`:

```json
"location": { "name": "Cloche d’Or" }
```

Oder ohne Dateiänderung per Adresse: `…/?kiosk=1&location=Cloche%20d%E2%80%99Or`. Der Name erscheint oben rechts. Leer lassen, um nichts anzuzeigen.

### Einen Link ändern

In `content.json` unter `urls`. Jeder Link hat eine Adresse pro Sprache:

```json
"networking": {
  "fr": "https://bne.lu/bnenetworking/",
  "de": "https://bne.lu/de/bnenetworking/",
  "en": "https://bne.lu/en/bnenetworking/",
  "checked": "2026-10-28"
}
```

Der QR-Code wird automatisch aus der Adresse der gerade gewählten Sprache erzeugt. `checked` dokumentiert, wann der Link zuletzt geöffnet und geprüft wurde. Ein Eintrag `"pattern": ["de", "en"]` bedeutet: Diese Sprachfassungen wurden nur nach dem Muster der Website gebildet und müssen noch geöffnet werden.

### Termine und Fristen

Programme in `content.json` können zeitgebundene Phasen haben. Es wird immer die erste Phase gezeigt, deren `until`-Datum noch nicht vorbei ist (das Datum zählt mit):

```json
"awards": {
  "url": "awards", "sdg": 12, "showUntil": "2027-06-30",
  "phases": [
    { "id": "register", "until": "2026-11-11", "date": "2026-11-11" },
    { "id": "submit",   "until": "2027-04-24", "date": "2027-04-24" },
    { "id": "ceremony", "until": "2027-05-20" }
  ]
}
```

Der zugehörige Text steht in `translations.json` unter `programs.awards.phases.register` usw., zum Beispiel „Inscription des équipes jusqu’au {date}“. Nach der letzten Phase erscheint stattdessen der allgemeine Text `programs.awards.after`. Mit `showUntil` verschwindet ein Programm nach diesem Datum ganz aus der Auswahl, mit `showFrom` erscheint es erst ab einem Datum.

**Für die nächste Saison** nur die Daten und, falls nötig, die Texte anpassen. Zum Testen eines Datums: `?today=2027-02-01` an die Adresse hängen.

### Ein Programm einer Zielgruppe zuordnen

In `content.json` unter `audiences`, zum Beispiel:

```json
{ "id": "family", "programs": ["networking", "youth", "awards"] }
```

Es passen drei Etiketten auf die Leine; die Reihenfolge ist die Anzeige von links nach rechts.

### Eine Quizfrage ändern oder hinzufügen

In `content.json` unter `quiz.items`:

```json
{ "id": "water", "group": "water", "correct": 1, "sdg": 6, "url": "agenda" }
```

`correct` ist die Position der richtigen Antwort in der Liste `options` (gezählt ab 0). Fragen derselben `group` erscheinen nie zusammen in einer Runde. In `translations.json` unter `quiz.items.water` für jede Sprache: `q` (Frage), `options` (genau drei Antworten in derselben Reihenfolge), `explain` (Auflösung), `source` (Quelle). Die Antworten werden bei jedem Spiel gemischt.

### Einen neuen Gegenstand hinzufügen

1. In `content.json` unter `objects` einen Eintrag nach dem Muster der vorhandenen anlegen: `id`, vier `threads` (je `id` und Nachhaltigkeitsziel `sdg`), drei `options`, ein `offer` (`url` = Schlüssel aus `urls`, `kind` = `groups` für Schul- und Gruppenangebote oder `public` für offene Angebote) und eine `drawing`.
2. Die Zeichnung ist ein SVG-Pfad im Format 400 × 400 (Attribut `d` eines `<path>`). Am besten eine einfache Linienzeichnung, die in einem Zug wirkt. Jedes Vektorprogramm (Figma, Inkscape, Illustrator) kann einen Pfad exportieren.
3. In `translations.json` unter `objects.items.<id>` für jede Sprache: `name`, `hook` (die Frage), für jeden Faden `label`, `title`, `text`, unter `decision` die `question` und für jede Option `label` und `insight`, unter `offer` `title`, `org`, `text`, `audience`, `langs`.
4. Den neuen Link in `urls` ergänzen.
5. Die Auswahl zeigt die ersten vier Einträge aus `objects` (zwei Leinen mit je zwei Etiketten). Die Reihenfolge in der Datei bestimmt, welche vier es sind; weitere Einträge bleiben vorbereitet, bis man sie nach vorne schiebt. In `config.json` unter `attract.objects` festlegen, welche Gegenstände der Anziehungs-Loop zeigt.
6. `node tools/check-translations.mjs` und den End-to-End-Test laufen lassen.

### Logo einsetzen

Offizielles Logo als SVG nach `assets/brand/` legen und in `config.json` eintragen: `"brand": { "logo": "assets/brand/bne-logo.svg" }`. Ohne Eintrag zeigt die Stele die Textmarke „bne.lu“.

### Hinweis „Prototyp“ entfernen

In `config.json`: `"demoBadge": false`.

---

## Ausbaustufe: Redaktionssystem

Für den Dauerbetrieb mit mehreren Stelen ist der Weg über GitHub bereits ein einfaches Redaktionssystem: Änderungen werden versioniert, können geprüft werden und sind nach dem Speichern auf allen Stelen aktiv, die online sind. Das Prüfskript lässt sich als GitHub Action bei jeder Änderung automatisch ausführen.

Wenn Redakteurinnen und Redakteure ohne GitHub arbeiten sollen, bieten sich an: ein Git-basiertes Headless-CMS mit Formularoberfläche (zum Beispiel Decap CMS oder Tina), das genau diese JSON-Dateien bearbeitet, oder eine Tabelle (Google Sheets, Excel), aus der ein kleines Skript die JSON-Dateien erzeugt. Beides funktioniert ohne Änderung an der Anwendung selbst.
