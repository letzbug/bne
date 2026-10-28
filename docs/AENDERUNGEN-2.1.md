# Änderungen in Version 2.1

**Lichtvorhang (neue Designvariante, jetzt Standard).** Das Startbild ist dunkel und leuchtend, damit die Stele in der hellen Mall aus der Ferne auffällt. Der Logo-Ring aus den 17 Segmenten leuchtet dabei schon mit. Wer den Faden loslässt oder antippt, sieht, wie das Licht durch den Faden läuft und den Bildschirm vom Berührungspunkt aus hell flutet; danach läuft alles in BNE Corporate. Nach dem Reset kehrt die Stele ins Dunkle zurück.

Im Wartungsmenü gibt es jetzt drei Varianten: Original Dark, BNE Corporate, Lichtvorhang. Standard in `content/config.json`: `"design": { "variant": "hybrid" }`.

**Gemeinsamer Faden.** Die Stele zählt anonym, wie oft das Erlebnis auf diesem Gerät gestartet wurde, und zeigt es im Startbild unter der Aufforderung, zum Beispiel „1.284 personnes ont déjà tiré le fil ici.“ (Zahlenformat nach Luxemburger Konvention). Erst ab 10 Starts sichtbar (`commons.minToShow`). Keine Personendaten, keine Zeitstempel einzelner Besuche. Im Wartungsmenü: Stand und Datum seit Beginn, Knopf „Zähler zurücksetzen“ für den Standortwechsel. „Neue Vorführung“ lässt den Zähler bewusst stehen.

**Ausgetauschte Dateien:** `js/app.js`, `css/app.css`, `content/config.json`, `content/translations.json`, `sw.js` (Cache-Version 2.1.0, damit Stelen mit Offline-Cache die neue Fassung laden), `dist/tire-le-fil-standalone.html`, diese Datei.
