import json, re
from pathlib import Path

p=Path('workflow.json')
data=json.loads(p.read_text(encoding='utf-8'))
changed=False

for node in data.get('nodes', []):
    params=node.get('parameters') or {}
    code=params.get('jsCode')
    if not isinstance(code, str):
        continue

    original=code

    code=code.replace(
        "// Sichere Daten + HTML für Gotenberg (self-contained)",
        "// Forstauftrag PDF-Generator (Gotenberg/Chromium)\n// 1) Liest n8n-Itemdaten (Form + Zusatzdaten)\n// 2) Erzeugt Header/Footer (Chromium-Seitenränder) und kompaktes HTML\n// 3) Gotenberg rendert PDF inkl. Header/Footer auf jeder Seite"
    )

    code=re.sub(r"// Firmenangaben[\s\S]*?};\n", "", code)
    code=re.sub(r"// Logo \(DataURL bevorzugt\)[\s\S]*?logoDataUrl[\s\S]*?;\n", "", code)
    code=code.replace("// Helpers", "// Helpers (HTML-Encode + kleine UI-Bausteine)")
    code=re.sub(r"\nconst badge = [\s\S]*?;\nconst badges = [\s\S]*?;", "\n// badge/badges entfernt – derzeit ungenutzt\n", code)
    code=re.sub(r"\n\s*\.logos\{[\s\S]*?\}\n\s*\.logos img\{[\s\S]*?\}\n", "\n  /* Body-Logos entfernt – Logos sind im Header-Template (Seitenrand) enthalten */\n\n", code)
    code=code.replace("headerTemplate = `", "// Header (Chromium): 3 Logos + Meta (Ryzeup/BG/Auftrag)\nheaderTemplate = `")
    code=code.replace("const footerTemplate = `", "// Footer (Chromium): Rechtliches + Seitenzahlen\nconst footerTemplate = `")
    code=code.replace("@page { size: A4; margin:", "/* Platz für Header (oben) und Footer (unten) im Seitenrand lassen */\n  @page { size: A4; margin:")

    if code != original:
        params['jsCode']=code
        node['parameters']=params
        changed=True

if changed:
    p.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding='utf-8')
    print('updated')
else:
    print('nochange')

