# Kiosk-Einrichtung der Stele

Browser-Vollbild und ein abgesicherter Kiosk-Modus sind zwei verschiedene Dinge. Vollbild (`requestFullscreen`) lässt sich mit einer Wischgeste oder Taste verlassen. Ein echter Kiosk sperrt das Gerät auf diese eine Anwendung: Er startet sie selbst, verhindert das Verlassen, startet nach Absturz oder Stromausfall neu. Dieser Teil wird am Gerät eingerichtet, nicht in der Webanwendung.

## Hardware

- **Bildschirm:** 50 Zoll, 4K (2160 × 3840) im Hochformat, kapazitiver Multitouch (PCAP), entspiegelt. In Einkaufszentren mit Oberlicht ist eine matte oder entspiegelte Oberfläche wichtiger als maximale Helligkeit; 500 cd/m² reichen in der Regel.
- **Rechner:** kleiner PC mit aktueller integrierter Grafik (Intel Iris Xe oder besser, AMD Radeon 680M oder besser), 8 GB RAM, SSD. Ein Raspberry Pi 5 bewältigt die Anwendung in der Qualitätsstufe „Sparsam“, für 4K-Wiedergabe mit voller Qualität ist ein Mini-PC sicherer.
- **Betriebssystem:** Windows 11 IoT Enterprise/Pro, ChromeOS Flex oder Linux (Ubuntu). Alle drei unterstützen einen echten Kiosk-Modus.
- **Netz:** WLAN oder LTE-Router genügt. Die Anwendung läuft nach dem ersten Start auch ohne Verbindung weiter (siehe unten).

## Einbauhöhe und Reichweite

Die Bedienelemente liegen in der unteren rund zwei Dritteln des Bildschirms (Bühnenkoordinaten 400–1920 von 1920), der obere Teil ist für Titel und Fragen reserviert, die aus der Ferne wirken sollen.

Empfehlung: **Unterkante der aktiven Bildfläche auf 70–80 cm über dem Boden.** Bei einem 50-Zoll-Hochformat (aktive Höhe etwa 110 cm) liegt dann das Dock auf rund 75–85 cm und die höchsten Bedienelemente auf rund 120 cm. Das entspricht der vorderen Greifreichweite von Menschen im Rollstuhl (etwa 38–122 cm nach den gängigen Barrierefreiheitsrichtlinien) und ist für Kinder ab etwa sechs Jahren erreichbar. Vor der Stele eine freie, ebene Fläche von mindestens 150 × 150 cm vorsehen; ein Sockel darf nicht so tief sein, dass ein Rollstuhl nicht nahe genug herankommt (Kniefreiheit).

## Chrome oder Edge im Kiosk-Modus

Die Anwendung ist für Chromium-Browser getestet. Startparameter für einen Kiosk:

```
--kiosk
--app=https://<adresse>/?kiosk=1&location=<Standort>
--noerrdialogs
--disable-pinch
--overscroll-history-navigation=0
--disable-features=TranslateUI,OverscrollHistoryNavigation
--disable-session-crashed-bubble
--check-for-update-interval=31536000
--autoplay-policy=no-user-gesture-required
```

`--disable-pinch` und `--overscroll-history-navigation=0` verhindern Zoomen mit zwei Fingern und das Zurückwischen. Die Anwendung blockiert zusätzlich Kontextmenü, Textauswahl, Doppeltipp-Zoom und Ziehen von Bildern.

### Windows 11

1. Einen lokalen Kiosk-Benutzer anlegen.
2. **Einstellungen → Konten → Andere Benutzer → Kiosk einrichten** (Zugewiesener Zugriff) und Microsoft Edge im Modus „Digitale Beschilderung / interaktive Anzeige“ wählen, Adresse wie oben eintragen. Edge startet dann automatisch, im Vollbild, ohne Bedienleisten, und nach einem Absturz neu.
3. Für Edge eine Leerlaufzeit von 0 (nie neu starten) einstellen; die Rückkehr zum Start übernimmt die Anwendung selbst.
4. Energieoptionen: Bildschirm und Standby nie ausschalten (oder per Zeitplan außerhalb der Öffnungszeiten), automatische Updates in ein Wartungsfenster legen.
5. Windows-Touch-Gesten vom Rand deaktivieren (Gruppenrichtlinie „Kantenwischen zulassen“ = deaktiviert).

### ChromeOS Flex

Gerät in der Google-Admin-Konsole registrieren und als Kiosk-App eine Web-App mit obiger Adresse festlegen. Automatischer Start, Absturzwiederherstellung und Gestensperre sind eingebaut.

### Linux (Ubuntu)

Automatische Anmeldung eines Kiosk-Benutzers, dann per Autostart (zum Beispiel `~/.config/autostart/kiosk.desktop` oder ein systemd-User-Dienst mit `Restart=always`) Chromium mit den Parametern oben starten. Bildschirmschoner und Energiesparen abschalten (`xset s off -dpms` bzw. in den GNOME-Einstellungen). Hochformat über die Anzeige-Einstellungen drehen und den Touchscreen per `xinput map-to-output` dem gedrehten Ausgang zuordnen.

## Drehung und Touch-Kalibrierung

Die Drehung auf Hochformat erfolgt im Betriebssystem, nicht in der Anwendung. Nach dem Drehen prüfen, ob Berührungen an der richtigen Stelle ankommen. Testbild dafür: das Wartungsmenü öffnen (Logo oben links 4 Sekunden halten) und die Knöpfe in allen Ecken antippen.

## Offline-Betrieb

Beim ersten Start mit Internet speichert der Service Worker alle Programmdateien, Inhalte und Schriften. Danach läuft die Stele auch ohne Verbindung weiter; Inhalte werden aktualisiert, sobald wieder eine Verbindung besteht. Die QR-Codes funktionieren unabhängig vom Netz der Stele, denn sie werden auf der Stele erzeugt und öffnen sich auf dem Smartphone der Besucherinnen und Besucher.

Für eine Stele ganz ohne Internet: Schriften einmalig mit `node tools/fetch-fonts.mjs` lokal ablegen und die Anwendung von einem lokalen Webserver auf dem Gerät ausliefern, oder `dist/tire-le-fil-standalone.html` direkt öffnen.

## Wartung

- **Wartungsmenü:** Logo oben links 4 Sekunden halten. Dort auch Designvariante, „Neue Vorführung“ und der Hinweis „Prototyp“. Zeigt Version, Standort, Datum, Verbindung, Bildwiederholrate, Übersetzungsprüfung; erlaubt Qualitätsstufe, reduzierte Animationen, Neuladen und einen Test der Rückkehr zum Start. Schließt nach einer Minute ohne Bedienung von selbst.
- **Täglicher Neustart:** Die Anwendung lädt sich nachts einmal neu (`config.json` → `kiosk.dailyReloadAt`, Standard 04:30), aber nur, wenn gerade niemand sie benutzt.
- **Fehler:** Tritt ein unerwarteter Fehler auf, zeigt die Stele kurz einen ruhigen Hinweis in der gewählten Sprache und kehrt nach wenigen Sekunden von selbst zum Start zurück. Können die Inhalte gar nicht geladen werden, versucht sie es automatisch erneut.
- **Standortwechsel:** nur den Parameter `location` in der Startadresse ändern (oder `config.json`).
- **Reinigung:** Für das Putzen des Bildschirms das Wartungsmenü öffnen, damit versehentliche Berührungen nichts auslösen.
