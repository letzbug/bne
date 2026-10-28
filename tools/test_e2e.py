#!/usr/bin/env python3
"""
End-to-End-Test der BNE Experience in FR, DE und EN.

Voraussetzungen:
  pip install playwright opencv-python-headless
  playwright install chromium
Im Projektordner einen Server starten:  python3 -m http.server 8765
Dann:                                   python3 tools/test_e2e.py [--base http://localhost:8765/]

Prüft: alle Erlebnisse in allen drei Sprachen, Sprachwechsel mitten im Quiz,
Textüberläufe auf jedem Bildschirm, jeden QR-Code in jeder Sprache (Dekodierung),
Rückkehr zum Start nach Inaktivität (Französisch, leerer Faden),
kein Neustart während aktiver Nutzung. Bildschirmfotos: test-output/
"""
import sys, os, json, argparse
from playwright.sync_api import sync_playwright

ap = argparse.ArgumentParser()
ap.add_argument('--base', default='http://localhost:8765/')
ap.add_argument('--lang', choices=['fr', 'de', 'en'], help='nur eine Sprache testen')
ap.add_argument('--only', choices=['flows', 'qr', 'v2'], help='nur Abläufe, nur QR/Inaktivität oder nur Faden/Design-Tests')
ap.add_argument('--design', choices=['corporate', 'dark'], help='Designvariante für die Abläufe')
args = ap.parse_args()
BASE = args.base.rstrip('/') + '/index.html?sw=0' + ('&design=' + args.design if args.design else '')
TAG = (args.design + '-') if args.design else ''
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'test-output'); os.makedirs(OUT, exist_ok=True)
problems = []

AUDIT_JS = """() => {
  const st = document.getElementById('stage').getBoundingClientRect();
  const sc = st.width/1080; const out=[];
  document.querySelectorAll('#stage *').forEach(el => {
    if (!el.offsetParent && getComputedStyle(el).position!=='fixed') return;
    const cs=getComputedStyle(el); if (cs.visibility==='hidden' || cs.opacity==='0') return;
    const txt=[...el.childNodes].some(n=>n.nodeType===3 && n.textContent.trim());
    if (!txt) return;
    const r=el.getBoundingClientRect();
    const x0=(r.left-st.left)/sc, x1=(r.right-st.left)/sc;
    if (x0 < -1 || x1 > 1081) out.push(['offstage', el.className, el.textContent.slice(0,40), Math.round(x0), Math.round(x1)]);
    if (!el.classList.contains('sr-only') && (cs.overflow==='hidden' || el.classList.contains('fit')) && (el.scrollHeight > el.clientHeight+3 || el.scrollWidth > el.clientWidth+3))
      out.push(['clipped', el.className, el.textContent.slice(0,50), el.scrollWidth+'x'+el.scrollHeight, el.clientWidth+'x'+el.clientHeight]);
  });
  return out;
}"""

def run_language(p, lang):
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 540, 'height': 960})
    errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' and 'ERR_NAME' not in m.text and 'ERR_INTERNET' not in m.text else None)
    def shot(name):
        pg.wait_for_timeout(300)
        pg.screenshot(path=os.path.join(OUT, f'{TAG}{lang}-{name}.png'))
        for x in pg.evaluate(AUDIT_JS): problems.append(f'{lang} {name}: Text {x[0]} {x[2]!r}')
    pg.goto(BASE); pg.wait_for_timeout(1500)
    pg.evaluate(f"BNE.setLang('{lang}')"); pg.wait_for_timeout(600); shot('attract')
    for n in ['hub', 'objects']:
        pg.evaluate(f"BNE.go('{n}')"); pg.wait_for_timeout(1200); shot(n)
    # Alle vier Gegenstände: Fäden ziehen, entscheiden, Angebot
    for oid in ['tshirt', 'phone', 'choco', 'ride']:
        pg.evaluate(f"BNE.go('object',{{id:'{oid}'}})"); pg.wait_for_timeout(1200)
        knots = pg.locator('.scr-object .knot')
        bb = knots.nth(0).bounding_box()          # einmal wirklich ziehen
        pg.mouse.move(bb['x'] + bb['width'] / 2, bb['y'] + bb['height'] / 2); pg.mouse.down()
        for i in range(10): pg.mouse.move(bb['x'] + bb['width'] / 2, bb['y'] + bb['height'] / 2 + 14 * i)
        pg.mouse.up(); pg.wait_for_timeout(700)
        for k in range(1, knots.count()): knots.nth(k).click(); pg.wait_for_timeout(600)
        shot(f'{oid}-threads')
        pg.locator('.scr-object button.btn-primary:visible').first.click(); pg.wait_for_timeout(1200); shot(f'{oid}-decide')
        pg.locator('.scr-object .choice:visible').nth(1).click(); pg.wait_for_timeout(1800); shot(f'{oid}-offer')
    # Quiz mit Sprachwechsel
    pg.evaluate("BNE.go('quiz')"); pg.wait_for_timeout(1000)
    pg.locator('.scr-quiz button.btn-primary').first.click(); pg.wait_for_timeout(1200); shot('quiz-q1')
    pg.locator('.scr-quiz .qz-choices button').nth(0).click(); pg.wait_for_timeout(1200); shot('quiz-answer')
    other = {'fr': 'de', 'de': 'en', 'en': 'fr'}[lang]
    before = pg.evaluate("JSON.stringify([BNE.state.quiz.i, BNE.state.quiz.phase])")
    pg.evaluate(f"BNE.setLang('{other}')"); pg.wait_for_timeout(600); shot(f'quiz-switched-{other}')
    after = pg.evaluate("JSON.stringify([BNE.state.quiz.i, BNE.state.quiz.phase])")
    if before != after: problems.append(f'{lang}: Sprachwechsel im Quiz hat den Fortschritt verändert ({before} -> {after})')
    pg.evaluate(f"BNE.setLang('{lang}')"); pg.wait_for_timeout(300)
    for k in range(2):
        pg.locator('.scr-quiz .qz-next:visible, .scr-quiz button.btn-primary:visible').first.click(); pg.wait_for_timeout(1000)
        pg.locator('.scr-quiz .qz-choices button').nth(2).click(); pg.wait_for_timeout(1000)
    pg.locator('.scr-quiz .qz-next:visible, .scr-quiz button.btn-primary:visible').first.click(); pg.wait_for_timeout(1300); shot('quiz-done')
    # Was ist BNE?
    pg.evaluate("BNE.go('bne')"); pg.wait_for_timeout(900)
    for n in pg.locator('.scr-bne .bn-node').all():
        try: n.click(); pg.wait_for_timeout(250)
        except Exception: pass
    pg.wait_for_timeout(900); shot('bne-1')
    pg.locator('.scr-bne button.btn-primary:visible').last.click(); pg.wait_for_timeout(1000)
    pg.locator('.scr-bne .bn-strand').nth(5).click(); pg.wait_for_timeout(600); shot('bne-2')
    pg.locator('.scr-bne button.btn-primary:visible').last.click(); pg.wait_for_timeout(1200); shot('bne-3')
    # BNE in deiner Nähe: jede Zielgruppe, jedes Etikett
    for a in range(4):
        pg.evaluate("BNE.go('local')"); pg.wait_for_timeout(800)
        if pg.locator('.scr-local .lc-options .choice').count() == 0:
            pg.locator('.scr-local .lc-nav button').first.click(); pg.wait_for_timeout(600)
        pg.locator('.scr-local .lc-options .choice').nth(a).click(); pg.wait_for_timeout(1400); shot(f'local-{a}')
        for i in range(pg.locator('.scr-local .lc-prog').count()):
            pg.locator('.scr-local .lc-prog').nth(i).click(); pg.wait_for_timeout(1100); shot(f'local-{a}-tag{i}')
            pg.locator('.sheet .sheet-actions button').first.click(); pg.wait_for_timeout(500)
    pg.evaluate("BNE.go('take')"); pg.wait_for_timeout(1400); shot('take')
    missing = pg.evaluate("BNE.issues()")
    if missing: problems.append(f'{lang}: fehlende Übersetzungen {missing}')
    for e in errs: problems.append(f'{lang}: JavaScript-Fehler {e}')
    b.close()

def run_qr_and_idle(p):
    import cv2, numpy as np
    content = json.load(open(os.path.join(ROOT, 'content', 'content.json')))
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 900, 'height': 900})
    pg.goto(BASE); pg.wait_for_timeout(1000)
    n = bad = 0
    for k, u in content['urls'].items():
        if k.startswith('_'): continue
        for l in ['fr', 'de', 'en']:
            svg = pg.evaluate("([u]) => QR.toSVG(u,{ecl:'M',margin:4})", [u[l]])
            pg.set_content(f"<body style='margin:0;background:#fff'><div style='width:480px'>{svg}</div></body>")
            img = cv2.imdecode(np.frombuffer(pg.locator('svg').screenshot(), np.uint8), cv2.IMREAD_COLOR)
            val = cv2.QRCodeDetector().detectAndDecode(img)[0]
            if val != u[l]: val = cv2.QRCodeDetectorAruco().detectAndDecode(img)[0]
            n += 1
            if val != u[l]: bad += 1; problems.append(f'QR {k}/{l} nicht lesbar')
    print(f'QR-Codes: {n - bad} von {n} korrekt gelesen')
    b.close()
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 540, 'height': 960})
    pg.goto(BASE + '&idle=4&warn=3'); pg.wait_for_timeout(1000)
    pg.evaluate("BNE.go('quiz'); BNE.setLang('en')")
    for i in range(5): pg.wait_for_timeout(2000); pg.mouse.click(270, 200)
    if pg.evaluate("BNE.state.screen") != 'quiz': problems.append('Neustart während aktiver Nutzung')
    pg.wait_for_timeout(9500)
    st = pg.evaluate("[BNE.state.screen, BNE.state.lang, BNE.state.discoveries.length]")
    if st != ['attract', 'fr', 0]: problems.append(f'Rückkehr zum Start fehlerhaft: {st}')
    print('Inaktivität: Rückkehr zum Start, Französisch, leerer Faden' if st == ['attract', 'fr', 0] else f'Inaktivität: {st}')
    b.close()

def run_v2(p):
    """Faden greifen, Designumschalter mit Neuladen, Prototyp-Hinweis, neue Vorführung."""
    plain = args.base.rstrip('/') + '/index.html?sw=0'
    b = p.chromium.launch(); ctx = b.new_context(viewport={'width': 540, 'height': 960}); pg = ctx.new_page()
    errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto(plain + '&kiosk=1'); pg.wait_for_timeout(2600)
    # einen Punkt mitten auf dem Faden suchen und ihn 330 Bühnenpixel weit ziehen
    pt = pg.evaluate("""() => { const f = BNE.fil(); let best = null;
        for (let i = 0; i < f.n; i++) { const x = f.cur[i*2], y = f.cur[i*2+1];
          if (x > 200 && x < 880 && y > 420 && y < 1300) { best = [x, y]; break; } } return best; }""")
    if not pt: problems.append('Faden im Startbild nicht gefunden')
    else:
        sc = 540 / 1080
        pg.mouse.move(pt[0] * sc, pt[1] * sc); pg.mouse.down()
        for i in range(1, 12): pg.mouse.move(pt[0] * sc + 8 * i, pt[1] * sc + 14 * i); pg.wait_for_timeout(30)
        grabbed = pg.evaluate('BNE.fil().grabbed || BNE.state.screen === "hub"')
        if not grabbed: problems.append('Faden ließ sich nicht greifen')
        pg.screenshot(path=os.path.join(OUT, 'v2-thread-grab.png'))
        pg.mouse.up(); pg.wait_for_timeout(1200)
        if pg.evaluate('BNE.state.screen') != 'hub': problems.append('Ziehen am Faden hat das Erlebnis nicht gestartet')
        print('Faden greifen und ziehen: startet das Erlebnis' if pg.evaluate('BNE.state.screen') == 'hub' else 'Faden: FEHLER')
    # Antippen als Alternative
    pg.evaluate("BNE.go('attract')"); pg.wait_for_timeout(900); pg.mouse.click(60, 820); pg.wait_for_timeout(900)
    if pg.evaluate('BNE.state.screen') != 'hub': problems.append('Antippen startet nicht')
    # Designumschalter im Wartungsmenü, bleibt nach dem Neuladen erhalten
    for target, label in [('dark', 'Original Dark'), ('corporate', 'BNE Corporate')]:
        pg.evaluate('BNE.openAdmin()'); pg.wait_for_timeout(400)
        pg.locator('#admin button', has_text=label).first.click(); pg.wait_for_timeout(400)
        pg.reload(); pg.wait_for_timeout(1500)
        got = pg.evaluate('document.documentElement.dataset.design')
        if got != target: problems.append(f'Design nach Neuladen {got}, erwartet {target}')
    print('Designumschalter: Wahl bleibt nach dem Neuladen erhalten')
    # Prototyp-Hinweis ab- und wieder anschalten
    pg.evaluate('BNE.openAdmin()'); pg.wait_for_timeout(300)
    pg.locator('#admin button', has_text='Prototype').first.click(); pg.wait_for_timeout(300)
    pg.reload(); pg.wait_for_timeout(1200)
    if 'is-off' not in (pg.get_attribute('#badge', 'class') or ''): problems.append('Prototyp-Hinweis lässt sich nicht ausblenden')
    pg.evaluate('BNE.openAdmin()'); pg.wait_for_timeout(300)
    pg.locator('#admin button', has_text='Prototype').first.click(); pg.wait_for_timeout(300)
    pg.reload(); pg.wait_for_timeout(1200)
    # Neue Vorführung: Faden leer, Start, Französisch
    pg.evaluate("BNE.setLang('de'); BNE.go('object',{id:'tshirt'})"); pg.wait_for_timeout(1000)
    pg.locator('.scr-object .knot').first.click(); pg.wait_for_timeout(1500)
    pg.evaluate('BNE.openAdmin()'); pg.wait_for_timeout(300)
    pg.locator('#admin button.btn-primary').first.click(); pg.wait_for_timeout(900)
    st = pg.evaluate('[BNE.state.screen, BNE.state.lang, BNE.state.discoveries.length]')
    if st != ['attract', 'fr', 0]: problems.append(f'Neue Vorführung setzt nicht zurück: {st}')
    print('Neue Vorführung: Start, Französisch, leerer Faden' if st == ['attract', 'fr', 0] else f'Neue Vorführung: {st}')
    for e in errs: problems.append('JavaScript-Fehler ' + e)
    b.close()

with sync_playwright() as p:
    if args.only == 'v2':
        run_v2(p)
    elif args.only != 'qr':
        for lang in ([args.lang] if args.lang else ['fr', 'de', 'en']):
            run_language(p, lang); print(f'{lang}: alle Erlebnisse durchgespielt', flush=True)
    if args.only is None:
        run_v2(p)
    if args.only in (None, 'qr'):
        run_qr_and_idle(p)

if problems:
    print(f'\nPROBLEME ({len(problems)}):'); [print('  ✗ ' + x) for x in problems]; sys.exit(1)
print('\n✓ Alles bestanden. Bildschirmfotos in test-output/')
