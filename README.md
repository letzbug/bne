# Tire le fil · Zieh am Faden · Pull the thread

Interaktive Touchscreen-Experience der BNE (Bildung fir nohalteg Entwécklung) für eine mobile Stele mit 50-Zoll-Hochformat-Bildschirm in Einkaufszentren in Luxemburg.

**Status:** Prototyp zur Präsentation bei der BNE. Alle Inhalte sind Demonstrationsmaterial, bis die BNE sie freigibt.

Ein Faden aus 17 Strängen, in den Farben der 17 Nachhaltigkeitsziele, läuft durch das ganze Erlebnis. Alltagsgegenstände tragen ein „verstecktes Etikett“: Wer an ihren Fäden zieht, sieht, womit sie verbunden sind. Jede Entdeckung wird als Perle an den eigenen Faden geknüpft, und am Ende nimmt man genau diese Entdeckungen per QR-Code mit nach Hause. Das Konzept und seine Begründung stehen in [docs/KONZEPT.md](docs/KONZEPT.md).

Französisch ist Standardsprache, Deutsch und Englisch sind vollständig und gleichwertig. Der Sprachwechsel ist jederzeit möglich und behält den Fortschritt.

---

## Schnellstart

Die Anwendung ist reines HTML, CSS und JavaScript ohne Build-Schritt und ohne Abhängigkeiten. Weil die Inhalte als JSON-Dateien geladen werden, braucht sie einen kleinen lokalen Webserver (ein Doppelklick auf `index.html` reicht nicht).

```bash
cd tirelefil
python3 -m http.server 8080
# dann im Browser: http://localhost:8080
```

Alternativ `npx serve .` (Node.js) oder die Erweiterung „Live Server“ in VS Code.

Auf einem normalen Monitor erscheint die Stele als Hochformat-Vorschau mit Rahmen; die Maus ersetzt den Finger. Auf einem Hochformat-Bildschirm oder mit `?kiosk=1` füllt sie den ganzen Bildschirm.

**Ohne Server:** `dist/tire-le-fil-standalone.html` enthält alles in einer Datei und funktioniert per Doppelklick, auch vom USB-Stick. Nach Inhaltsänderungen neu bauen mit `node tools/build-standalone.mjs`.

## Veröffentlichung auf GitHub Pages

1. Den Inhalt dieses Ordners in ein GitHub-Repository legen (die Datei `.nojekyll` mitnehmen, sie verhindert, dass GitHub Dateien umbaut).
2. Im Repository: **Settings → Pages → Build and deployment → Source: Deploy from a branch**, Branch `main`, Ordner `/ (root)`.
3. Nach etwa einer Minute ist die Stele unter `https://<benutzer>.github.io/<repository>/` erreichbar.
4. Für die Stele selbst diese Adresse mit `?kiosk=1` aufrufen, zum Beispiel `https://<benutzer>.github.io/<repository>/?kiosk=1&location=Cloche%20d%E2%80%99Or`.

Alle Pfade sind relativ, die Anwendung läuft daher auch in einem Unterordner. Nach jeder Änderung an Programmdateien (`js/`, `css/`, `index.html`) die Versionsnummer in `sw.js` erhöhen, damit Stelen mit Offline-Cache die neue Fassung laden. Inhalte (`content/*.json`) werden bei bestehender Verbindung immer frisch geladen.

## Aufbau

```
index.html                  Einstieg
css/app.css                 Gestaltung (Farb- und Schrift-Tokens oben in :root)
css/fonts.css               lokale Schriften (wird von tools/fetch-fonts.mjs gefüllt)
js/app.js                   Bildschirme, Sprachlogik, Inaktivität, Wartungsmenü
js/fil.js                   der lebendige Faden (Canvas)
js/qr.js                    QR-Code-Generator, funktioniert offline
content/config.json         Betrieb: Standort, Zeitlimits, Animation, Kiosk, Logo
content/content.json        Struktur: Gegenstände, Quiz, Programme, Zielgruppen, Links, Daten
content/translations.json   alle sichtbaren Texte in FR, DE, EN
assets/                     Icon, Platz für das offizielle Logo (assets/brand/)
sw.js                       Offline-Cache
dist/                       eigenständige Einzeldatei
docs/                       Konzept, Inhaltspflege, Kiosk-Einrichtung, offene Punkte
tools/                      Prüf- und Bauwerkzeuge
```

## Inhalte pflegen

Texte, Links und Termine lassen sich ohne Programmierkenntnisse ändern. Die ausführliche Anleitung steht in [docs/INHALTE.md](docs/INHALTE.md). Kurz:

- **Texte** stehen in `content/translations.json`, für jede Sprache unter demselben Schlüssel.
- **Links und Termine** stehen in `content/content.json`. Zeitgebundene Hinweise (z. B. „Anmeldung bis 11. November 2026“) verschwinden nach ihrem Datum von selbst; danach erscheint ein allgemeiner Text.
- **Standort, Zeitlimits, Logo** stehen in `content/config.json`.

Nach jeder Änderung prüfen:

```bash
node tools/check-translations.mjs
```

Das Skript meldet fehlende oder leere Texte, unterschiedliche Platzhalter zwischen den Sprachen, kaputte Verweise, Links ohne `https://` und abgelaufene Termine.

## URL-Parameter (Test und Betrieb)

| Parameter | Wirkung |
|---|---|
| `kiosk=1` | Vollbild-Betrieb ohne Vorschaurahmen; Vollbild bei der ersten Berührung, wenn in `config.json` aktiviert |
| `location=Name` | Standortname oben rechts, überschreibt `config.json` |
| `lang=de` | Startsprache zum Testen (nach dem Neustart gilt wieder Französisch) |
| `screen=quiz` | direkt einen Bildschirm öffnen: `attract`, `hub`, `objects`, `object` (mit `&id=tshirt`), `quiz`, `bne`, `local`, `take` |
| `today=2027-02-01` | Datum simulieren, um zeitgebundene Inhalte zu testen |
| `idle=10`, `warn=3` | Inaktivitätszeit und Countdown in Sekunden verkürzen |
| `quality=low` | Animationsqualität erzwingen: `high`, `balanced`, `low` |
| `reduced=1` | reduzierte Animationen |
| `admin=1` | Wartungsmenü sofort öffnen |
| `sw=0` | Offline-Cache für diesen Aufruf abschalten (Entwicklung) |

**Wartungsmenü an der Stele:** die Marke „bne.lu“ oben links 4 Sekunden gedrückt halten. Es zeigt Version, Standort, verwendetes Datum, Verbindung, Bilder pro Sekunde und Übersetzungsprüfung und bietet: Animationsqualität, reduzierte Animationen, Neu laden, Rückkehr zum Start testen.

## Schriften

Titel: **Bricolage Grotesque**, Text: **Atkinson Hyperlegible Next** (vom Braille Institute für Lesbarkeit bei Sehschwäche entwickelt). Beide unter SIL Open Font License.

Standardmäßig kommen sie von Google Fonts; der Service Worker speichert sie nach dem ersten Start mit Internet. Damit die Stele auch beim allerersten Start offline richtig aussieht, einmalig mit Internet ausführen:

```bash
node tools/fetch-fonts.mjs
```

Danach liegen die Dateien in `assets/fonts/`, und die Google-Fonts-Zeile in `index.html` kann entfernt werden (Datenschutz: dann gehen beim Start keine Anfragen mehr an Google).

## Tests

```bash
node tools/check-translations.mjs          # Texte und Inhalte
pip install playwright opencv-python-headless && playwright install chromium
python3 -m http.server 8765 &              # im Projektordner
python3 tools/test_e2e.py                  # Abläufe in FR/DE/EN, Textüberläufe, QR-Codes, Inaktivität (einige Minuten)
python3 tools/test_e2e.py --lang de        # nur eine Sprache
```

Der End-to-End-Test spielt alle Erlebnisse in allen drei Sprachen durch, wechselt mitten im Quiz die Sprache, prüft jeden Text auf Überlauf, dekodiert jeden QR-Code in jeder Sprache und testet die Rückkehr zum Start. Bildschirmfotos landen in `test-output/`.

## Technische Eckdaten

- Bühne 1080 × 1920 CSS-Pixel, skaliert verlustfrei auf 2160 × 3840 (Faktor 2) und jede andere Hochformat-Auflösung.
- Keine Frameworks, keine externen Bibliotheken, keine API-Schlüssel, kein Backend.
- Keine Kamera, kein Mikrofon, keine Cookies, keine Speicherung von Besucherdaten. Optionale anonyme Zähler nur auf dem Gerät, standardmäßig aus.
- Getestet mit Chromium (Chrome, Edge). Für den Kiosk wird Chrome oder Edge empfohlen, siehe [docs/KIOSK.md](docs/KIOSK.md).
