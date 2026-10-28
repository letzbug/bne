# Offene Punkte für die offizielle Umsetzung

Stand: 28. Oktober 2026. Sortiert nach dem, was vor einem ersten öffentlichen Einsatz geklärt sein muss.

## Vor dem ersten Einsatz

1. **Fachliche Freigabe aller Inhalte durch die BNE-Koordination.** Besonders die Aussagen in den Fäden und im Quiz (Liste mit Grundlagen in docs/KONZEPT.md, Abschnitt 8), die Formulierung der Programme und die Zuordnung zu den Zielgruppen.
2. **Zustimmung der genannten Angebotsträger**, deren Workshops die Stele hervorhebt: Fairtrade Lëtzebuerg, Fondation Partage Luxembourg, äerdschëff asbl. Mit ihnen auch klären, ob sie Anfragen von Familien und Schulen aus der Stele erwarten können.
3. **Logo und Markenfarben**: Das offizielle Logo ist eingesetzt, seine 17 Farben steuern die Variante BNE Corporate. Noch zu klären: die Hausschrift von bne.lu, ob es verbindliche Hintergrund- und Grautöne gibt, und ob die automatisch erzeugte helle Negativfassung des Logos (für Original Dark) verwendet werden darf.
3a. **Designentscheidung**: BNE Corporate oder Original Dark als Standard für den Einsatz festlegen; beide sind vollständig.
4. **Links prüfen**: Die deutsche und englische Fassung der Seite „Agenda 2030 & ODD“ ist nach Sprachmuster gebildet. Alle Links vor jeder neuen Saison öffnen und `checked` in `content.json` aktualisieren.
5. **Termine der Fresque de la Mobilité** bei äerdschëff erfragen; die Angebotsseite zeigte zuletzt einen Termin vom März 2026.
6. **Übersetzungen gegenlesen lassen**, idealerweise von Muttersprachlerinnen und Muttersprachlern mit pädagogischem Hintergrund. Die Texte sind bewusst frei formuliert, nicht wortwörtlich übertragen.
7. **Schriften lokal ablegen** (`node tools/fetch-fonts.mjs`) und die Google-Fonts-Zeile entfernen, damit beim Start keine Verbindung zu Google entsteht und die Stele auch beim ersten Start ohne Netz richtig aussieht.
8. **Test mit echten Menschen** an einem Probe-Standort: Bleiben Passanten stehen? Verstehen Kinder „Tire un fil“ ohne Hilfe? Wie lange bleiben Familien? Danach Texte und Zeiten (Inaktivität, Quiz) anpassen.
9. **Test auf der Zielhardware** in 2160 × 3840: Bildwiederholrate (Ziel: flüssig über 40 Bilder pro Sekunde, sichtbar im Wartungsmenü), Touch-Genauigkeit an den Rändern, Lesbarkeit aus zwei und vier Metern, Spiegelungen im Einkaufszentrum.

## Recht und Datenschutz

10. **Datenschutzhinweis**: Die Stele erhebt keine Daten. Ein kurzer Aushang an der Stele („Keine Kamera, keine Speicherung“) schafft Vertrauen. Falls später anonyme Zähler oder QR-Kampagnenparameter aktiviert werden, mit der BNE und ihrem Datenschutzhinweis (bne.lu/rgpd) abstimmen.
11. **Barrierefreiheit der physischen Stele**: Einbauhöhe, Kniefreiheit, Bodenfläche (Empfehlungen in docs/KIOSK.md) mit dem Stelenbau abstimmen; idealerweise mit einer Selbstvertretungsorganisation testen.
12. **Bildrechte**: Der Prototyp verwendet nur eigene Linienzeichnungen und die offiziellen ODD-Farben. Für die ODD-Bezeichnungen gelten die Richtlinien der Vereinten Nationen zur Nutzung der Ziele; die Stele nutzt sie zu Bildungszwecken ohne Logo-Kacheln.

## Inhaltlicher Ausbau

13. **Luxemburgisch** als vierte Sprache ist technisch vorbereitet (eine weitere Sprachspalte in `translations.json` und ein Eintrag in `config.json`), für die erste Version aber bewusst nicht vorgesehen.
14. **Weitere Gegenstände** für Wechsel je Standort oder Saison, zum Beispiel Banane („Ana Banana“), Klopapier („Hilfe, wo ist mein Klopapier?“), Plastikflasche („Plastic Loop“). Alle drei sind reale BNE-Angebote.
15. **Standortbezug**: Pro Einkaufszentrum könnten nahe gelegene Angebote (zum Beispiel im Süden Esch, Minett UNESCO Biosphere) bevorzugt gezeigt werden. Dafür bräuchte `content.json` eine Region je Angebot.
16. **Saisonwechsel**: Nach dem BNE Networking am 12. Januar 2027 und nach den Awards im Mai 2027 die Hervorhebungen auf das nächste Schuljahr umstellen. Die Stele wechselt die Texte zwar selbst, neue Termine muss aber jemand eintragen.

## Technik

17. **Redaktionsweg festlegen**: GitHub direkt, ein Git-basiertes CMS oder eine Tabelle als Quelle (siehe docs/INHALTE.md). Das Prüfskript als GitHub Action einrichten.
18. **Mehrere Stelen**: Eine gemeinsame Adresse mit `location`-Parameter je Gerät genügt. Für Fernwartung (Neustart, Zustandsmeldung) wäre ein Gerätemanagement des Betriebssystems sinnvoller als eine eigene Lösung.
19. **Statistik**: Die optionalen Zähler liegen nur auf dem Gerät. Wenn die BNE Zahlen über mehrere Standorte auswerten möchte, braucht es einen datensparsamen Sammelpunkt; das ist bewusst nicht Teil des Prototyps.
