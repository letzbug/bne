# Tire le fil: Konzept

BNE Experience für eine mobile Touch-Stele in Einkaufszentren in Luxemburg. Arbeitsstand Oktober 2026, Prototyp zur Präsentation.

---

## 1. Analyse von bne.lu

Untersucht am 28. Oktober 2026: Startseite, BNE 2027, BNE Networking, BNE Training, BNE Awards, BNE Supply, BNE Youth (Angebotsliste), BNE Adultes (Angebotsliste), „Éducation au développement durable“, Groupes de travail sowie vier einzelne Angebotsseiten (siehe Abschnitt 8).

### Was die BNE sagt

Der Leitsatz der Website lautet **„Deviens acteur pour un futur plus durable“**. Die Seite gliedert sich in „Tous concernés“, „Agir ensemble“ und „Offres & Acteurs“. Die pädagogische Grundlage ist ausdrücklich formuliert:

- EDD ist mehr als Wissensvermittlung: ein Hebel für eine gerechtere, nachhaltigere Welt, gestützt auf Ziel 4.7 der Agenda 2030.
- Drei Dynamiken: **Discerner & comprendre** (systemisches Denken, Zusammenhänge erkennen), **Réfléchir** (kritisch denken, Position beziehen), **Agir** (Kreativität, Kooperation, Ideen in Handlungen umsetzen).
- Lernen in allen Formen: formal (Schule), non-formal (Maisons Relais, Jugendhäuser, Vereine) und informell (Alltag). Lebenslang.
- Der europäische Kompetenzrahmen **GreenComp** mit vier Bereichen: Werte verkörpern, Komplexität verstehen, nachhaltige Zukünfte entwerfen, handeln.

### Die fünf Projekte des Schuljahrs 2026–2027

| Projekt | Kern | Wichtige Daten |
|---|---|---|
| BNE Networking (früher Foire BNE) | über 70 interaktive Stände von NGOs, Verwaltungen, Bildungseinrichtungen; **offen für alle, ohne Anmeldung** | 12. Januar 2027, Forum Geesseknäppchen, Stände 11–15 Uhr, Austausch 15–18 Uhr; von IFEN als Fortbildung anerkannt |
| BNE Awards 2027 | Wettbewerb für 6- bis 25-Jährige, Thema ODD 12 (verantwortungsvoller Konsum und Produktion); Teams („ActionTeams“) mit Tutor aus Schule, Maison Relais, Jugendhaus oder Verein | Anmeldung bis 11. November 2026 (verlängert), Abgabe bis 24. April 2027, Preisverleihung 19. und 20. Mai 2027 |
| BNE Supply | Förderung für Projekte von und für junge Menschen: bis 25 000 € Infrastruktur/Material, bis 2 500 € Veranstaltungen; Schulen vorrangig | Anträge bis 11. November 2026 |
| BNE Training | Fortbildungen (Seminare, Hospitationen, online, IFEN-Katalog), ganzjährig | – |
| BNE Youth | Workshops, Besuche, Rallyes, Escape Games, Ausstellungen für Schulen, Maisons Relais, Jugendhäuser | ganzjährig, landesweit |

Dazu kommen **BNE Adultes** (für Privatpersonen, Vereine, Unternehmen), eine große Akteursliste und Arbeitsgruppen (u. a. Réseau de la plateforme BNE, GT Greenweeks).

### Was das für eine Stele im Einkaufszentrum bedeutet

Drei Befunde haben das Konzept geprägt:

1. **Das Jahresthema passt perfekt zum Ort.** Die BNE Awards 2027 stehen unter ODD 12, verantwortungsvoller Konsum. Ein Einkaufszentrum ist der Ort des Konsums schlechthin. Die Stele muss das Thema nicht hineintragen, es ist schon da.
2. **Die meisten Angebote richten sich an Gruppen**, nicht an Einzelpersonen: BNE Youth bucht man als Schule oder Maison Relais. Ehrlich kommuniziert heißt das: Eltern und Kinder werden zu Botschaftern („Schlag es deiner Schule vor“). Direkt für Passanten zugänglich sind vor allem BNE Networking (ohne Anmeldung), Angebote mit Zielgruppe „Grand public / En famille“ wie die Fresque de la Mobilité, und BNE Adultes.
3. **Die Angebotsdatenbank enthält Workshops, die genau die Alltagsgegenstände behandeln**, die man im Einkaufszentrum in der Hand hat: „D’où vient mon T-shirt ?“ und „Chocotastique !“ (Fairtrade Lëtzebuerg), „Minerais et intelligence artificielle“ (Fondation Partage), „Fresque de la Mobilité“ (äerdschëff). Daraus entsteht die Brücke vom Erlebnis zum echten Angebot.

### Gestalterische Identität

Das wiederkehrende Gestaltungselement von bne.lu ist ein **Regenbogen-Bogen** (eigene Grafiken in Kopf- und Fußzeile, Dateinamen `rainbow.svg`, `home-head-rainbow.svg`, `footer-rainbow.svg`). Die Bildsprache ist bunt, zugänglich und institutionell; die Seite verwendet die offiziellen Farb-Icons der 17 ODD.

### Was nicht geprüft werden konnte

- **Logo und exakte Markenfarben**: Die Logo-Datei und die Stylesheets ließen sich nicht abrufen. Das Farbsystem des Prototyps ist daher eine eigene, an das Regenbogen-Motiv angelehnte Lösung. Ein Platz für das offizielle Logo ist vorbereitet (`assets/brand/`).
- **Deutsche und englische Fassung**: Die Seite weist selbst darauf hin, dass DE, EN und LU maschinell übersetzt sind und die französische Fassung maßgeblich ist. Inhalte wurden deshalb auf Französisch analysiert; die DE/EN-Links folgen den Sprachumschaltern der jeweiligen Seite.
- Die DE/EN-Adresse der Seite „Agenda 2030 & ODD“ ist nach dem Sprachmuster gebildet und noch nicht geöffnet (in `content.json` markiert).
- Aktuelle Termine der Fresque de la Mobilité (die Seite zeigt einen Termin vom März 2026).

---

## 2. Drei kreative Richtungen

### A · Jardin des possibles

**Leitidee:** Ein lebendiger digitaler Garten, der mit jeder Berührung wächst. Jede Idee lässt eine Pflanze erblühen.
**Stil:** weiche, organische Illustration, Wachstumsanimationen, warme Naturtöne.
**Zentrale Interaktion:** Wählen und pflanzen; der Garten wird dichter.
**Eignung:** sehr zugänglich für Kinder, schöner Blickfang.
**Schwäche:** Wachstum als Belohnung wird schnell zum versteckten Punktesystem („gute Wahl = mehr Blumen“). Wirkt auf Erwachsene allein wie ein Kinderspiel. Kaum Bezug zu den realen BNE-Angeboten.

### B · Fenêtre sur 2050

**Leitidee:** Der Bildschirm ist ein Fenster auf eine Luxemburger Straße in der Zukunft. Berührungen wechseln Elemente zwischen heute und morgen.
**Stil:** illustriertes Panorama, Tag-und-Nacht-Licht, Tiefe durch Ebenen.
**Zentrale Interaktion:** Elemente antippen und verwandeln.
**Eignung:** stark für den GreenComp-Bereich „Zukünfte entwerfen“, beeindruckend aus der Ferne.
**Schwäche:** verführt zu spekulativen Aussagen über die Zukunft („wenn du X tust, sieht 2050 so aus“), die sich nicht belegen lassen. Hoher Illustrationsaufwand, schwer aktuell zu halten.

### C · Tire le fil (gewählt)

**Leitidee:** Alles hat ein Etikett mit einem Preis, die Geschichte dahinter bleibt verborgen. Ein Faden aus 17 Strängen, den Farben der 17 Nachhaltigkeitsziele, macht die Verbindungen sichtbar: Wer an einem Faden zieht, sieht, wohin er führt.
**Stil:** ein leuchtender, geflochtener Faden auf tiefem Petrol; helle Stoffetiketten mit Öse als Informationsträger; klare, große Typografie.
**Zentrale Interaktion:** buchstäblich am Faden ziehen (ziehen oder antippen), Etikett lesen, Perle an den eigenen Faden knüpfen, am Ende den eigenen Faden mitnehmen.
**Eignung für das Einkaufszentrum:** Das Etikett ist die Bildsprache des Ortes selbst. Der Einstieg ist ein Gegenstand, den man gerade in der Hand oder am Körper hat.

### Warum C

- **Pädagogisch genau:** „Discerner & comprendre“, systemisches Denken und das Erkennen von Zusammenhängen, ist der erste Baustein der EDD laut bne.lu. Der Faden ist dieser Gedanke als Geste.
- **Nicht moralisierend:** Ein Faden führt irgendwohin; es gibt kein Richtig oder Falsch, keine Punkte, keine CO₂-Rechnung. Die Entscheidungsfrage („Was könnte aus diesem T-Shirt werden?“) hat nur gute Antworten.
- **Für Kinder und Erwachsene:** Kinder ziehen an Fäden und entdecken Bilder. Erwachsene erkennen Lieferketten, Arbeitsbedingungen und Ressourcenfragen. Niemand fühlt sich im falschen Programm.
- **Brücke zu echten Angeboten:** Jeder Gegenstand endet bei einem realen Workshop aus der BNE-Datenbank.
- **Marke:** Der 17-farbige Faden greift das Regenbogen-Motiv von bne.lu auf und macht die ODD spürbar, ohne eine Plakatwand aus 17 Kacheln zu bauen. Erst im Kapitel „Was ist BNE?“ erfährt man: Die 17 Farben sind die 17 Ziele.
- **Erweiterbar:** Ein neuer Gegenstand ist ein neuer Eintrag in zwei JSON-Dateien.

---

## 3. Experience-Architektur

```
 ANZIEHUNG (Loop)                 AUSWAHL                     ERLEBNISSE                       MITNEHMEN
 Faden zeichnet einen   ─tippen─▶ „Quel fil veux-tu  ─▶  Das versteckte Etikett       ─┐
 Gegenstand, große Frage          tirer ?“                Die 30-Sekunden-Challenge     ├─▶ „Emporte ton fil“
 (FR groß, DE/EN klein)           4 Knoten am Faden       Was ist BNE?                  │    QR-Codes genau
                                                          BNE in deiner Nähe           ─┘    der eigenen Entdeckungen
        ▲                                                                                     │
        └──────────── 60 s ohne Berührung (QR-Bildschirm 120 s) ─ Rückfrage 10 s ─ Neustart ◀┘
                      Neustart: Französisch, leerer Faden, nichts gespeichert
```

**Anziehung:** Der Faden webt nacheinander T-Shirt, Smartphone, Schokolade und Fahrrad. Darunter die Frage zum Gegenstand, groß auf Französisch, klein auf Deutsch und Englisch, damit jede Person im Vorbeigehen ihre Sprache erkennt. Die Aufforderung „Touche l’écran“ wechselt durch alle drei Sprachen. Eine Berührung irgendwo startet.

**Auswahl:** Der Faden läuft durch vier große Knoten. Jeder Knoten ist ein Kapitel. Kein Menü, keine Liste: Man wählt, an welchem Faden man zieht.

**Das versteckte Etikett** (Kern, 1–3 Minuten): Vier Gegenstände hängen als Etiketten an einer Leine. Ein Gegenstand öffnet sich, der Faden legt eine Schleife darum, vier Fäden führen zu vier Knoten (zum Beispiel beim T-Shirt: das Feld, die Hände, die Reise, danach). Ziehen oder antippen, ein Etikett schwingt herein: ein Satz, ein Nachhaltigkeitsziel. Nach zwei Fäden kommt „Et après ?“: Was könnte aus dem Gegenstand werden? Drei gute Antworten, jede mit einer kurzen Einsicht. Zum Schluss ein echtes BNE-Angebot mit QR-Code.

**Die 30-Sekunden-Challenge** (für Familien): drei Fragen aus sechs, gezogen aus fünf Themengruppen, damit zwei Fragen nie dasselbe Thema haben. Der Faden umschlingt die Uhr. Die Zeit läuft nur, während eine Frage offen ist; beim Lesen der Auflösung steht sie. Ist die Zeit um, geht es ohne Uhr weiter: „Die Zeit ist um, die Neugier nicht.“ Rückmeldung ohne Urteil: „Bien vu !“ oder „Surprenant, non ?“, immer mit Erklärung und Quelle.

**Was ist BNE?** (eine Minute, drei Schritte): Planet, Menschen und Wirtschaft per Berührung mit „Toi“ verknüpfen; die 17 Farben des Fadens als die 17 Ziele entdecken; Comprendre, Réfléchir, Agir als Kern der EDD, mit der Auflösung des Kürzels „Bildung fir nohalteg Entwécklung“.

**BNE in deiner Nähe:** „Aujourd’hui, tu es plutôt…“: en famille, jeune (6–25), dans l’éducation, par curiosité. Je drei passende Programme hängen als Etiketten an einer Wäscheleine, mit Terminen, die sich selbst aktualisieren.

**Mitnehmen:** bis zu vier QR-Codes, genau zu dem, was man entdeckt hat. Ohne Entdeckung zwei gute Startpunkte. Hinweis: „Rien n’est enregistré.“

**Übergänge:** Der Faden ist das verbindende Element. Er verformt sich zwischen den Bildschirmen weich in die neue Form (Welle, Knotenreihe, Schleife, Wäscheleine, Horizont), statt hart zu wechseln. Jede Berührung beantwortet er mit einer Reaktion.

**Der persönliche Faden im Dock** ist die besondere Idee des Projekts: Jede Entdeckung wird als farbige Perle angeknüpft, und genau dieser Faden wird am Ende mitgenommen. Er verbindet die fünf Erlebniswelten zu einer Geschichte und macht die Mitnahme persönlich, ohne dass irgendetwas über die Person gespeichert wird.

---

## 4. Visuelles System

| Rolle | Wert |
|---|---|
| Hintergrund „Sûre“ (tiefes Petrol, Fluss und Wald) | `#0E2C31`, Tiefe `#08191C` |
| Flächen „Moss“ | `#17393E`, `#1F4A50` |
| Text „Linen“ | `#F2F4EC` |
| Sekundärtext „Lichen“ | `#A9C5BF` |
| Etiketten | Linen mit Text in `#10282C` |
| Faden | die 17 offiziellen ODD-Farben, für den dunklen Grund leicht aufgehellt |
| Fokus/Hinweis | `#FFE7A3` |

**Typografie:** Bricolage Grotesque für Titel (eigenwillig, warm, technisch), Atkinson Hyperlegible Next für alle Texte, eine Schrift, die für Menschen mit Sehschwäche entwickelt wurde. Mindestschriftgröße 28 px auf der 1080-px-Bühne, das sind rund 16 mm auf dem 50-Zoll-Bildschirm. Fließtext 36–40 px (rund 21–23 mm), Fragen 66–88 px: aus zwei Metern und mehr lesbar.

**Formen:** Kreise sind Knoten (berührbar). Etiketten mit abgeschrägten Ecken und Öse tragen Information. Kapselförmige Knöpfe führen Aktionen aus. Jede Form hat eine Bedeutung.

**Zonen auf dem Hochformat:** oben (0–30 %) Titel und Fragen für die Fernwirkung; Mitte und unten (30–93 %) alle Bedienelemente; ganz unten das Dock mit Startknopf, persönlichem Faden und Sprachwahl FR | DE | EN, immer erreichbar. Bei einer Unterkante des Bildschirms auf 70–80 cm Höhe liegen alle Bedienelemente zwischen etwa 75 und 122 cm, also in Reichweite von Kindern und von Menschen im Rollstuhl (siehe docs/KIOSK.md).

**Bewegung:** ein einziges großes bewegtes Element, der Faden. Alles andere reagiert nur auf Berührung (Etikett schwingt herein, Perle springt an den Faden). Kein Blinken. Reduzierte Animationen über die Systemeinstellung, `config.json` oder das Wartungsmenü. Die Qualität passt sich der Hardware automatisch an.

**Physische Stele:** Der Faden kann aus dem Bildschirm heraus weitergeführt werden, etwa als geflochtenes, farbiges Seil oder als hinterleuchteter Streifen, der sich um die Stele wickelt und unten in einem großen Knoten endet. Die Form eines hängenden Etiketts mit Öse ist eine naheliegende Silhouette für die Stele selbst.

---

## 5. Drei Besuchertypen

**Der neugierige Passant (20 Sekunden):** Er sieht aus der Ferne einen leuchtenden Faden, der ein T-Shirt zeichnet, und liest „Combien de mains ont touché ton t-shirt ?“. Selbst ohne Berührung bleibt eine Frage hängen. Mit einer Berührung zieht er einen Faden und liest einen Satz.

**Die Familie (2–3 Minuten):** Das Kind zieht an den Fäden, die Eltern lesen vor, man spricht über die Frage „Was könnte aus dem T-Shirt werden?“. Oder: die 30-Sekunden-Challenge gemeinsam, mit Überraschungen wie dem kostenlosen öffentlichen Verkehr. Ergebnis: ein Gesprächsanlass und ein Workshop, den man der Schule vorschlagen kann.

**Die interessierte Person:** Lehrkraft, Erzieherin oder engagierter Erwachsener wählt „Dans l’éducation“, findet BNE Training, Supply und Networking mit aktuellen Fristen und scannt die Codes.

---

## 6. Datenschutz und Wirkung

Keine Kamera, kein Mikrofon, keine Gesichtserkennung, keine Anmeldung, keine Namen, keine Cookies. Der persönliche Faden lebt nur im Arbeitsspeicher und verschwindet beim Neustart. Die QR-Codes führen direkt zu bne.lu, ohne Weiterleitung über Dritte.

Optional (standardmäßig aus): anonyme Zähler nur auf dem Gerät, zum Beispiel begonnene Sitzungen, abgeschlossene Erlebnisse, gewählte Gegenstände, ohne Zeitstempel einzelner Besuche. Sie decken die sinnvollen Erfolgskriterien ab: Interesse (Sitzungen), Vertiefung (abgeschlossene Erlebnisse), Themen (Auswahl). QR-Aufrufe lassen sich nur auf der Seite von bne.lu messen; dafür können Kampagnenparameter (`utm_source`, `utm_medium`, `utm_campaign` = Standort) an die Links angehängt werden. Beides erst nach Absprache mit der BNE und auf Grundlage ihres Datenschutzhinweises einschalten.

---

## 7. Qualitätskontrolle

| Frage | Einschätzung |
|---|---|
| Bleibt jemand stehen? | Wahrscheinlich: bewegter Faden, eine große Frage über einen Gegenstand, den man selbst trägt. Muss vor Ort getestet werden. |
| Versteht man es ohne Vorwissen in Sekunden? | Ja: eine Frage, eine Geste („Tire un fil“), große Knoten. |
| Für Erwachsene interessant? | Ja: Lieferketten, Arbeitsbedingungen, Rohstoffe, Verkehr; dazu Fristen und Förderungen für Fachleute. |
| Hochwertig statt gewöhnliche Website? | Kein Menü, keine Kacheln; eigenes Motiv durchgängig von Anziehung bis QR. |
| Jede Interaktion sinnvoll? | Jeder sichtbare Knopf hat eine Funktion; das wird im End-to-End-Test geprüft. |
| Inhalte belegt? | Programme und Termine von bne.lu (28.10.2026), Fakten mit Quellen (Abschnitt 8). Fachliche Freigabe durch die BNE steht aus. |
| Lesbar aus zwei Metern? | Fragen 66–88 px (38–50 mm), Text mindestens 28 px (16 mm). |
| Leicht zu aktualisieren? | Texte, Links, Termine und Standort in JSON-Dateien; Prüfskript meldet Fehler. |
| Dreisprachig gleichwertig? | 322 Texte je Sprache, automatisch auf Vollständigkeit, Platzhalter und Überlauf geprüft. |

---

## 8. Inhalte und Quellen

**Angebote (bne.lu, geprüft am 28.10.2026):**

| Gegenstand | Angebot | Träger | Zielgruppe | Sprachen |
|---|---|---|---|---|
| T-Shirt | D’où vient mon T-shirt ? | Fairtrade Lëtzebuerg | Zyklen 3–4 | DE, FR |
| Smartphone | Minerais et intelligence artificielle | Fondation Partage Luxembourg | 2e, 1re (ab 15) | EN, FR, LU |
| Schokolade | Chocotastique ! Le voyage d’une cabosse | Fairtrade Lëtzebuerg | Zyklen 3–4 | DE, FR |
| Weg hierher | Fresque de la Mobilité, Redange | äerdschëff asbl | Familien, Grand public, 13–25 | FR |

Hinweis: Der Titel auf bne.lu lautet „Minerais et Intelligence Artificelle“ (Tippfehler auf der Website); die Stele zeigt die korrigierte Schreibweise.

**Fakten in Quiz und Fäden:**

| Aussage | Grundlage |
|---|---|
| Bus, Bahn und Tram in Luxemburg in der 2. Klasse kostenlos seit 1. März 2020; erstes Land mit landesweit kostenlosem öffentlichem Verkehr | Regierung Luxemburg; Berichterstattung 2026 (u. a. LISER-Studie zur Bilanz nach sechs Jahren) |
| 17 Nachhaltigkeitsziele, 2015 von den 193 UN-Mitgliedstaaten beschlossen, Horizont 2030 | Vereinte Nationen, Agenda 2030 |
| Rund 60 % der verschwendeten Lebensmittel entfallen auf Haushalte | UNEP, Food Waste Index Report 2024 |
| Rund 70 % der weltweiten Süßwasserentnahme für die Landwirtschaft | FAO, AQUASTAT |
| Über 75 % der wichtigsten Nahrungspflanzen profitieren zumindest teilweise von tierischer Bestäubung | IPBES, Bestäuber-Bericht 2016 |
| Verkehr gehört in Europa zu den größten Quellen von Treibhausgasen | Europäische Umweltagentur |
| Großer Teil des ökologischen Fußabdrucks eines Smartphones entsteht bei der Herstellung | Lebenszyklusanalysen (u. a. ADEME, Herstellerberichte) |
| Kakao wird größtenteils von Kleinbauernfamilien angebaut; nur ein kleiner Teil des Tafelpreises kommt bei ihnen an | Fairtrade, Kakaobarometer; Inhalt des Fairtrade-Workshops „Chocotastique !“ |
| Baumwolle braucht viel Wasser; Textilien durchlaufen oft mehrere Länder; Arbeitsbedingungen nicht immer fair | Inhalt des Fairtrade-Workshops „D’où vient mon T-shirt ?“; allgemeiner Forschungsstand |

Alle Aussagen sind bewusst qualitativ oder mit gerundeten, gut belegten Zahlen formuliert. Vor dem Einsatz sollte die BNE-Koordination jede Aussage fachlich freigeben (siehe docs/OFFENE-PUNKTE.md).

---

## 9. Version 2: Creative Evolution

Grundlage war die Rückmeldung nach dem ersten Test: Konzept beibehalten, Corporate Identity näher an bne.lu, der Faden als eigentliches Erlebnis, mehr Wirkung auf dem Startbild, weniger Text auf den Angebotskarten. Alle Funktionen der Version 1 sind erhalten (Erlebniswelten, Geschichten, Perlen, QR-Codes, Dreisprachigkeit, Inhaltsdateien, Kiosk, Inaktivität, GitHub Pages, Einzeldatei).

### Corporate Identity: was verifiziert ist

| Element | Quelle | Status |
|---|---|---|
| Logo „bne.lu – Bildung fir Nohalteg Entwécklung“ | `bne-logo.svg`, von der Projektseite bereitgestellt | verifiziert, unverändert eingesetzt |
| Schriftfarbe `#161615` | aus dem Logo | verifiziert |
| 17 Farben der beiden Logo-Bögen (`#8e0933`, `#ffb300`, `#14b0db`, `#df2821`, `#b50021`, `#4c8f26`, `#da9426`, `#db092c`, `#e75020`, `#d00055`, `#f5861a`, `#b5771f`, `#3a6c33`, `#0086cc`, `#60a422`, `#00578f`, `#093958`) | aus dem Logo, in Leserichtung | verifiziert |
| Formsprache: segmentierte Farbbögen, Kreis, runde Kleinbuchstaben | aus dem Logo; Regenbogen-Grafiken in Kopf- und Fußzeile von bne.lu (Dateinamen) | verifiziert |
| Hausschrift der Website | Stylesheet nicht abrufbar | **nicht verifiziert**; Ersatz Lexend, austauschbar |
| Hintergrundfarben, Grautöne, Schatten der Corporate-Variante | eigene Ableitung | **nicht offiziell**, als Tokens oben in `css/app.css` |
| Negativfassung des Logos (helle Schrift) für Original Dark | automatisch umgefärbt | **nicht freigegeben**, mit der BNE-Kommunikation abstimmen |

Kampagnenvisuals und Bildsprache der Website ließen sich mit den verfügbaren Werkzeugen nur über Seitentexte und Dateinamen erschließen, nicht als Bilder. Es wurden keine Farbwerte erfunden und keine Logos nachgezeichnet.

### Zwei Varianten

**BNE Corporate** (Standard): warmes Papierweiß, Schrift in Logo-Schwarz, der Faden in den 17 Logo-Farben als farbiges Garn mit weichem Schatten, sodass er räumlich über dem Papier zu liegen scheint. Auf dem Startbild dreht sich langsam ein großer Ring aus den 17 Logo-Segmenten; der Faden formt die Gegenstände in seiner Mitte, sodass das Bild wie eine lebendige Fassung des Logos wirkt. Knöpfe und Startpunkt tragen denselben segmentierten Ring. Titel in Lexend, Text in Atkinson Hyperlegible Next.

**Original Dark**: die Gestaltung der Version 1 (tiefes Petrol, leuchtender Faden in den ODD-Farben, Bricolage Grotesque), mit eingebettetem Logo in heller Schrift.

Der Umschalter sitzt im Wartungsmenü und stellt alles um: Farben, Schriften, Faden-Darstellung, Logo, Formen, Schatten. Die Wahl wird auf dem Gerät gespeichert.

### Der lebendige Faden

- **Ruhezustand:** Der Faden fließt frei über das Bild, sammelt sich dann zu einem Gegenstand (T-Shirt, Smartphone, Fahrrad, Pflanze), hält die Form einige Sekunden, atmet dabei leicht und löst sich wieder. Unter jeder Form erscheint eine einzige große Frage, nur in der gewählten Sprache. Weil die Form jedes Mal aus einer anderen Lage des Fadens entsteht, wirkt keine Wiederholung gleich.
- **Berührung:** Wer den Faden anfasst, greift ihn tatsächlich. Der berührte Abschnitt folgt dem Finger, die Fasern ziehen sich unter Spannung zusammen, der Zopf dreht sich schneller. Beim Loslassen schwingt er federnd zurück. Auf dem Startbild verwandelt sich die Aufforderung während des Ziehens in „Tire… puis lâche.“; Loslassen oder weites Ziehen startet das Erlebnis. Antippen irgendwo funktioniert immer genauso.
- **Geschichten:** Der Faden zeichnet den gewählten Gegenstand selbst, deckungsgleich über einer feinen Linienzeichnung, damit auch detailreiche Formen wie Fahrrad oder Schokolade klar lesbar bleiben. Aus ihm führen die vier Fäden zu den Knoten. Bei Entscheidung und Angebot legt er sich als Schlinge um die kleine, klare Zeichnung. Beim Etikettwechsel und bei jeder Entscheidung läuft ein Lichtimpuls durch den Faden.
- **Navigation:** Bei jedem Bildschirmwechsel gleitet der Faden in seine neue Form, ein Lichtimpuls läuft voraus.
- **Perlen:** Jede Entdeckung fliegt als Perle aus dem Inhalt in den persönlichen Faden im Dock und wird dort angeknüpft; ein Impuls läuft zurück durch den großen Faden.
- **Leistung:** Canvas, keine Videos. Die Qualität passt sich der Hardware an (Punktzahl, Auflösung, Leuchteffekt). Bei reduzierter Bewegung bleiben Formen und Reaktionen erhalten, aber ohne Nachschwingen, Partikel und Impulse.

### Angebotskarten

Jede Karte zeigt nur noch: den Namen des realen Angebots, eine Zeile (für wen, von wem), einen großen QR-Code und eine klare Aufforderung („Scanne et découvre l’atelier“). Die dominante Kernaussage steht direkt darüber als Einsicht aus der eigenen Entscheidung. Die Programmkarten unter „BNE in deiner Nähe“ zeigen Kernaussage, eine kurze Erklärung, den aktuellen Termin und den QR-Code. Alle Details liegen auf bne.lu.

### Präsentationsmodus

Die Anwendung öffnet direkt im animierten Startbild. Für eine neue Vorführung im Wartungsmenü „Nouvelle démonstration“ wählen. Der Hinweis „Prototyp“ lässt sich dort ausblenden; nichts in der Anwendung stellt sie als offiziell freigegeben dar.
