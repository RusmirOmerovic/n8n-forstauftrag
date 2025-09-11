import json, re

p='workflow.json'
with open(p,'r',encoding='utf-8') as f:
    data=json.load(f)

changed=False
for node in data.get('nodes',[]):
    params=node.get('parameters') or {}
    code=params.get('jsCode')
    if isinstance(code,str) and 'Header/Footer (Chromium)' in code:
        # 1) ensure headerTemplate decl is let
        code2 = re.sub(r"const headerTemplate = `.*?`;\n","let headerTemplate;\n", code, flags=re.S)

        # 2) inject header assignment before const html
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
        before = code2
        code2 = code2.replace('const html = `<!doctype html>`', header_assign + 'const html = `<!doctype html>`')
        if before == code2:
            print('WARN: did not inject header before const html for node', node.get('id'))

        # 3) remove body logos block
        code2 = re.sub(r"\n\s*<!-- Logos -->\s*<div class=\\\"logos\\\">.*?</div>\s*\n","\n", code2, flags=re.S)

        if code2 != code:
            params['jsCode']=code2
            node['parameters']=params
            changed=True

if changed:
    with open(p,'w',encoding='utf-8') as f:
        json.dump(data,f,ensure_ascii=False,indent=2)
    print('updated')
else:
    print('nochange')
