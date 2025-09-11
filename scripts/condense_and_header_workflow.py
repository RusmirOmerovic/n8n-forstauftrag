import json, re

p='workflow.json'
with open(p,'r',encoding='utf-8') as f:
    data=json.load(f)

changed=False

header_assign = '''headerTemplate = `
  <style>
    *{box-sizing:border-box} body{margin:0;font-family:Arial,Helvetica,sans-serif}
    .h-wrap{background:#B8E6F1; padding:10px 24px; display:flex; align-items:center; justify-content:space-between; font-size:11px}
    .h-logos{display:flex; align-items:center; gap:12px}
    .h-logos img{width:auto; max-height:22px; object-fit:contain}
    .h-title{font-size:14px;font-weight:700}
    .h-meta{font-size:11px;opacity:.85}
  </style>
  <div class=\"h-wrap\">
    <div class=\"h-logos\">
      <img src=\"${LOGO_RYZEUP}\" alt=\"Ryzeup\" />
      <img src=\"${LOGO_BG}\" alt=\"BG\" />
      <img src=\"${LOGO_AUFTRAG}\" alt=\"Auftrag\" />
    </div>
    <div>
      <div class=\"h-title\">Arbeitsauftrag Forstwirtschaft</div>
      <div class=\"h-meta\">Einsatzort: ${esc(meta.einsatzort || '—')} • Datum: ${esc(meta.datum || '—')} • Erstellt: ${esc(now)}</div>
    </div>
  </div>
`;
'''

for node in data.get('nodes',[]):
    params=node.get('parameters') or {}
    code=params.get('jsCode')
    if isinstance(code,str) and '<style>' in code:
        original=code
        # Ensure headerTemplate is declared as let
        code=re.sub(r"const headerTemplate = `.*?`;\n","let headerTemplate;\n", code, flags=re.S)
        # Inject header assignment before html template start
        code=code.replace('const html = `<!doctype html>', header_assign + 'const html = `<!doctype html>')
        # Remove body logos block (more tolerant)
        code=re.sub(r"<!-- Logos -->[\s\S]*?</div>\s*","", code, flags=re.S)
        # Condense: reduce base font size
        code=re.sub(r"font:\s*15pt/1\.55","font: 11pt/1.55", code)
        # Condense: reduce page padding
        code=re.sub(r"padding:\s*16mm;","padding: 10px;", code)
        # Condense: reduce card paddings and weather font size
        code=re.sub(r"(\.card \.card-b\{\s*padding:)\s*6mm 7mm;","\\1 4mm 5mm;", code)
        code=re.sub(r"(\.wval\{\s*font-size:)\s*16pt;","\\1 14pt;", code)
        # Condense: reduce header title size and card margin
        code=re.sub(r"(\.header h1\{[\s\S]*?font-size:)\s*\d+pt;","\\1 18pt;", code)
        code=re.sub(r"(\.card\{[\s\S]*?margin:)\s*\d+mm 0;","\\1 6mm 0;", code)
        # Optional: shrink logo heights if any remain in CSS
        code=re.sub(r"max-height:\s*20mm;","max-height: 12mm;", code)
        if code!=original:
            params['jsCode']=code
            node['parameters']=params
            changed=True

if changed:
    with open(p,'w',encoding='utf-8') as f:
        json.dump(data,f,ensure_ascii=False,indent=2)
    print('updated')
else:
    print('nochange')
